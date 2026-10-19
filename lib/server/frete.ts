import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Taxa de entrega: por bairro (tabela bairros_entrega) ou por distância
 * (faixas "até X km = R$ Y", medidas em linha reta do restaurante até o
 * endereço do cliente).
 */

export type FaixaKm = { ate_km: number; valor: number };
export type ModoFrete = "bairro" | "km";

export type ConfigFrete = {
  modo: ModoFrete;
  faixas: FaixaKm[];
  latitude: number | null;
  longitude: number | null;
};

export class ForaDaAreaError extends Error {
  constructor(mensagem = "Infelizmente ainda não entregamos neste endereço.") {
    super(mensagem);
  }
}

export class EnderecoNaoEncontradoError extends Error {
  constructor() {
    super("Não encontramos este endereço no mapa. Confira a rua e o número.");
  }
}

function numero(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizarFaixas(faixas: unknown): FaixaKm[] {
  if (!Array.isArray(faixas)) return [];
  return faixas
    .map((f: any) => ({ ate_km: Number(f?.ate_km), valor: Number(f?.valor) }))
    .filter((f) => Number.isFinite(f.ate_km) && f.ate_km > 0 && f.ate_km <= 100 && Number.isFinite(f.valor) && f.valor >= 0 && f.valor <= 500)
    .sort((a, b) => a.ate_km - b.ate_km)
    .slice(0, 20);
}

export async function getConfigFrete(restauranteId: string): Promise<ConfigFrete> {
  const [{ data: op, error }, { data: rest }] = await Promise.all([
    supabaseAdmin
      .from("restaurante_operacao")
      .select("frete_modo, frete_faixas")
      .eq("restaurante_id", restauranteId)
      .maybeSingle(),
    supabaseAdmin.from("restaurantes").select("latitude, longitude").eq("id", restauranteId).maybeSingle(),
  ]);

  // Sem SQL 09 (coluna ainda não existe) ou sem configuração: por bairro.
  const modo: ModoFrete = !error && op?.frete_modo === "km" ? "km" : "bairro";

  return {
    modo,
    faixas: normalizarFaixas(op?.frete_faixas),
    latitude: numero((rest as any)?.latitude),
    longitude: numero((rest as any)?.longitude),
  };
}

/** Distância em linha reta (km) entre dois pontos. */
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function valorPorDistancia(km: number, faixas: FaixaKm[]) {
  const faixa = faixas.find((f) => km <= f.ate_km + 1e-9);
  if (!faixa) throw new ForaDaAreaError();
  return faixa.valor;
}

// ---------------------------------------------------------------------
// Endereço -> coordenadas (OpenStreetMap / Nominatim, grátis).
// Guardamos o resultado por 24 h para não repetir a busca.
// ---------------------------------------------------------------------

type Ponto = { lat: number; lon: number };
const cacheGeo = new Map<string, { ate: number; ponto: Ponto | null }>();
let ultimaBusca = 0;

export type EnderecoBusca = {
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
};

function limpar(v: unknown, max = 120) {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function buscarNominatim(params: Record<string, string>): Promise<Ponto | null> {
  // Política do Nominatim: no máximo 1 busca por segundo.
  const espera = ultimaBusca + 1100 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaBusca = Date.now();

  const url = new URL(process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);

  const resposta = await fetch(url, {
    headers: { "User-Agent": "MeuCardapioApp/1.0 (+https://meucardapioapp.com)", "Accept-Language": "pt-BR" },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });

  if (!resposta.ok) throw new Error(`Geocoder HTTP ${resposta.status}`);
  const lista = (await resposta.json()) as { lat: string; lon: string }[];
  const primeiro = Array.isArray(lista) ? lista[0] : null;
  if (!primeiro) return null;

  const lat = Number(primeiro.lat), lon = Number(primeiro.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

export async function geocodificar(endereco: EnderecoBusca): Promise<Ponto | null> {
  const rua = limpar(endereco.rua);
  const num = limpar(endereco.numero, 20);
  const bairro = limpar(endereco.bairro);
  const cidade = limpar(endereco.cidade, 80);
  const estado = limpar(endereco.estado, 40);
  const cep = limpar(endereco.cep, 12).replace(/\D/g, "");

  if (!rua && !cep) return null;

  const chave = [rua, num, bairro, cidade, estado, cep].join("|").toLowerCase();
  const guardado = cacheGeo.get(chave);
  if (guardado && guardado.ate > Date.now()) return guardado.ponto;

  const tentativas: Record<string, string>[] = [
    { street: [num, rua].filter(Boolean).join(" "), city: cidade, state: estado, country: "Brasil" },
    { q: [rua && `${rua}${num ? ", " + num : ""}`, bairro, cidade, estado].filter(Boolean).join(", ") },
  ];
  if (cep.length === 8) tentativas.push({ postalcode: `${cep.slice(0, 5)}-${cep.slice(5)}`, country: "Brasil" });

  let ponto: Ponto | null = null;
  for (const t of tentativas) {
    if (!Object.values(t).some(Boolean)) continue;
    ponto = await buscarNominatim(t);
    if (ponto) break;
  }

  cacheGeo.set(chave, { ate: Date.now() + 24 * 3600_000, ponto });
  if (cacheGeo.size > 5000) cacheGeo.delete(cacheGeo.keys().next().value as string);
  return ponto;
}

/** Endereço do restaurante (cidade/UF servem de referência para o endereço do cliente). */
export async function enderecoDoRestaurante(restauranteId: string) {
  const { data } = await supabaseAdmin
    .from("restaurantes")
    .select("*")
    .eq("id", restauranteId)
    .maybeSingle();
  const r = (data ?? {}) as any;
  return {
    rua: r.endereco ?? null,
    numero: r.numero ?? null,
    bairro: r.bairro ?? null,
    cidade: r.cidade ?? null,
    estado: r.estado ?? r.uf ?? null,
    cep: r.cep ?? null,
  };
}

/**
 * Taxa e distância para entregar no endereço do cliente, no modo por km.
 * Lança ForaDaAreaError / EnderecoNaoEncontradoError.
 */
export async function freteKm(restauranteId: string, config: ConfigFrete, endereco: EnderecoBusca) {
  if (config.latitude == null || config.longitude == null || config.faixas.length === 0) {
    throw new ForaDaAreaError("O restaurante ainda não configurou a entrega por distância.");
  }

  const ref = await enderecoDoRestaurante(restauranteId);
  let ponto: Ponto | null = null;
  try {
    ponto = await geocodificar({ ...endereco, cidade: endereco.cidade || ref.cidade, estado: endereco.estado || ref.estado });
  } catch (error) {
    console.error("[frete] geocodificar", error);
    throw new Error("Não foi possível calcular a distância agora. Tente de novo em instantes.");
  }

  if (!ponto) throw new EnderecoNaoEncontradoError();

  const km = Math.round(distanciaKm(config.latitude, config.longitude, ponto.lat, ponto.lon) * 10) / 10;
  return { km, valor: valorPorDistancia(km, config.faixas) };
}
