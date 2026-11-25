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

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY || "";

type ViaCep = { logradouro: string; bairro: string; cidade: string; uf: string };

/** CEP -> cidade/UF/rua/bairro oficiais (ViaCEP, cobertura excelente no Brasil). */
async function buscarViaCep(cepDigitos: string): Promise<ViaCep | null> {
  if (cepDigitos.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cepDigitos}/json/`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = (await r.json()) as any;
    if (!d || d.erro) return null;
    return {
      logradouro: limpar(d.logradouro),
      bairro: limpar(d.bairro),
      cidade: limpar(d.localidade, 80),
      uf: limpar(d.uf, 2),
    };
  } catch {
    return null;
  }
}

/** Geocodifica um texto livre pela Geoapify (melhor no Brasil). Null se sem chave/erro. */
async function geocodeGeoapify(texto: string, vies?: Ponto, raioKm?: number): Promise<Ponto | null> {
  if (!GEOAPIFY_KEY || !texto) return null;
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", texto);
  // Trava os resultados num círculo ao redor do restaurante (não cair em outra cidade / outra ponta da avenida).
  if (vies && raioKm) url.searchParams.set("filter", `circle:${vies.lon},${vies.lat},${Math.round(raioKm * 1000)}`);
  else url.searchParams.set("filter", "countrycode:br");
  if (vies) url.searchParams.set("bias", `proximity:${vies.lon},${vies.lat}`);
  url.searchParams.set("lang", "pt");
  url.searchParams.set("limit", "1");
  url.searchParams.set("apiKey", GEOAPIFY_KEY);

  const r = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!r.ok) throw new Error(`Geoapify HTTP ${r.status}`);
  const d = (await r.json()) as any;
  const f = Array.isArray(d?.features) ? d.features[0] : null;
  const lat = Number(f?.properties?.lat);
  const lon = Number(f?.properties?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/** Tenta Geoapify e, se falhar, Nominatim (texto livre), ambos presos ao redor do restaurante. */
async function geocodeTexto(texto: string, vies?: Ponto, raioKm?: number): Promise<Ponto | null> {
  if (!texto) return null;
  try {
    const g = await geocodeGeoapify(texto, vies, raioKm);
    if (g) return g;
  } catch (e) {
    console.error("[frete] geoapify", e);
  }
  try {
    const extra: Record<string, string> = {};
    if (vies && raioKm) {
      const dLat = raioKm / 111;
      const dLon = raioKm / (111 * Math.cos((vies.lat * Math.PI) / 180) || 1);
      // viewbox = esquerda,cima,direita,baixo (lon_min, lat_max, lon_max, lat_min)
      extra.viewbox = `${vies.lon - dLon},${vies.lat + dLat},${vies.lon + dLon},${vies.lat - dLat}`;
      extra.bounded = "1";
    }
    return await buscarNominatim({ q: texto, ...extra });
  } catch (e) {
    console.error("[frete] nominatim", e);
    return null;
  }
}

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

export async function geocodificar(endereco: EnderecoBusca, vies?: Ponto, raioKm?: number): Promise<Ponto | null> {
  let rua = limpar(endereco.rua);
  const num = limpar(endereco.numero, 20);
  let bairro = limpar(endereco.bairro);
  let cidade = limpar(endereco.cidade, 80);
  let estado = limpar(endereco.estado, 40);
  const cepDigitos = limpar(endereco.cep, 12).replace(/\D/g, "");

  // ViaCEP define o endereço oficial do CEP (fonte mais confiável no Brasil).
  // No modo por distância o CEP é obrigatório, então ele manda na localização.
  if (cepDigitos.length === 8) {
    const via = await buscarViaCep(cepDigitos);
    if (via) {
      if (via.cidade) cidade = via.cidade;
      if (via.uf) estado = via.uf;
      if (via.bairro) bairro = via.bairro;
      if (via.logradouro) rua = via.logradouro;
    }
  }

  if (!rua && !bairro && cepDigitos.length !== 8) return null;

  const cepFmt = cepDigitos.length === 8 ? `${cepDigitos.slice(0, 5)}-${cepDigitos.slice(5)}` : "";
  const local = cidade ? `${cidade}${estado ? " - " + estado : ""}` : "";

  // Do mais preciso (rua + nº) ao mais amplo (bairro). O raio ao redor do
  // restaurante já garante a região, então o bairro funciona mesmo sem cidade.
  const bruto: string[] = [];
  if (rua) bruto.push([`${rua}${num ? ", " + num : ""}`, bairro, local, cepFmt].filter(Boolean).join(", "));
  if (rua) bruto.push([rua, bairro, local].filter(Boolean).join(", "));
  if (bairro) bruto.push([bairro, local].filter(Boolean).join(", "));
  if (cepFmt) bruto.push([local, cepFmt].filter(Boolean).join(", ") || cepFmt);
  if (local) bruto.push(local);
  const candidatos = [...new Set(bruto.map((c) => c.trim()).filter(Boolean))];

  const chave = candidatos.join("|").toLowerCase();
  const guardado = cacheGeo.get(chave);
  if (guardado && guardado.ate > Date.now()) return guardado.ponto;

  let ponto: Ponto | null = null;
  for (const texto of candidatos) {
    ponto = await geocodeTexto(texto, vies, raioKm);
    if (ponto) break;
  }
  // Último recurso: CEP puro no Nominatim.
  if (!ponto && cepFmt) {
    try {
      ponto = await buscarNominatim({ postalcode: cepFmt, country: "Brasil" });
    } catch (e) {
      console.error("[frete] nominatim cep", e);
    }
  }

  cacheGeo.set(chave, { ate: Date.now() + 24 * 3600_000, ponto });
  if (cacheGeo.size > 5000) cacheGeo.delete(cacheGeo.keys().next().value as string);
  return ponto;
}

/**
 * Endereço aproximado de um ponto (botão "Usar minha localização").
 * Só rua, número aproximado, bairro e CEP: o cliente confere antes de usar.
 */
export async function enderecoPorPonto(lat: number, lon: number) {
  const espera = ultimaBusca + 1100 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaBusca = Date.now();

  const base = (process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org/search").replace(/\/search\/?$/, "");
  const url = new URL(`${base}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const resposta = await fetch(url, {
    headers: { "User-Agent": "MeuCardapioApp/1.0 (+https://meucardapioapp.com)", "Accept-Language": "pt-BR" },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`Geocoder HTTP ${resposta.status}`);
  const d = (await resposta.json()) as any;
  const a = d?.address ?? {};
  return {
    rua: limpar(a.road || a.pedestrian || a.residential || a.footway || ""),
    numero: limpar(a.house_number || "", 20),
    bairro: limpar(a.suburb || a.neighbourhood || a.quarter || a.city_district || a.village || ""),
    cep: limpar(a.postcode || "", 12),
    cidade: limpar(a.city || a.town || a.municipality || "", 80),
  };
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
  // Raio da busca ao redor do restaurante: a área de entrega + margem (exclui
  // pontos distantes como "mesma rua/bairro" na outra ponta da cidade).
  const maxFaixaKm = config.faixas[config.faixas.length - 1]?.ate_km ?? 15;
  const raioKm = Math.min(Math.max(maxFaixaKm * 1.3 + 3, 12), 80);
  let ponto: Ponto | null = null;
  try {
    ponto = await geocodificar(
      { ...endereco, cidade: endereco.cidade || ref.cidade, estado: endereco.estado || ref.estado },
      { lat: config.latitude, lon: config.longitude },
      raioKm
    );
  } catch (error) {
    console.error("[frete] geocodificar", error);
    throw new Error("Não foi possível calcular a distância agora. Tente de novo em instantes.");
  }

  if (!ponto) throw new EnderecoNaoEncontradoError();

  const km = Math.round(distanciaKm(config.latitude, config.longitude, ponto.lat, ponto.lon) * 10) / 10;

  const faixa = config.faixas.find((f) => km <= f.ate_km + 1e-9);
  if (!faixa) {
    const maxKm = config.faixas[config.faixas.length - 1]?.ate_km ?? 0;
    const e = new ForaDaAreaError(
      `Este endereço ficou a ${String(km).replace(".", ",")} km — a entrega vai até ${String(maxKm).replace(".", ",")} km.`
    );
    (e as any).km = km;
    throw e;
  }
  return { km, valor: faixa.valor };
}
