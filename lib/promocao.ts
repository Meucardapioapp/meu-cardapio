import type { Agora } from "@/lib/horario";

/**
 * Promoção por dia e horário (ex.: "terça da pizza", "happy hour 18h–20h").
 * Campos do produto: promo_preco, promo_dias (0=dom … 6=sáb; vazio = todo dia),
 * promo_inicio e promo_fim (vazio = o dia todo; aceita passar da meia-noite).
 */
const NOMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function minutos(hora: unknown) {
  const [h, m] = String(hora ?? "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
}

export function promocaoAtiva(produto: Record<string, any>, agora: Agora) {
  const preco = Number(produto?.promo_preco);
  if (!Number.isFinite(preco) || preco <= 0) return false;
  if (preco >= Number(produto.preco)) return false;

  const dias: number[] = Array.isArray(produto.promo_dias) ? produto.promo_dias.map(Number) : [];
  const inicio = minutos(produto.promo_inicio);
  const fim = minutos(produto.promo_fim);

  const dentroDoHorario = (m: number) =>
    inicio == null || fim == null ? true : fim > inicio ? m >= inicio && m <= fim : m >= inicio || m <= fim;

  if (dias.length === 0) return dentroDoHorario(agora.minutos);

  // Hoje está na lista, ou ontem começou e passa da meia-noite.
  if (dias.includes(agora.dia) && dentroDoHorario(agora.minutos)) {
    if (inicio == null || fim == null || fim > inicio || agora.minutos >= inicio) return true;
  }
  const ontem = (agora.dia + 6) % 7;
  if (inicio != null && fim != null && fim < inicio && dias.includes(ontem) && agora.minutos <= fim) return true;

  return false;
}

/** Texto curto para o selo da promoção no cardápio. */
export function rotuloPromocao(produto: Record<string, any>) {
  const dias: number[] = Array.isArray(produto.promo_dias) ? produto.promo_dias.map(Number).sort() : [];
  const hora = (h: unknown) => String(h ?? "").slice(0, 5);
  const parteDia =
    dias.length === 0 || dias.length === 7 ? "" : dias.length === 1 ? `de ${NOMES[dias[0]]}` : "do dia";
  const parteHora = produto.promo_inicio && produto.promo_fim ? `até ${hora(produto.promo_fim)}` : "";
  return ["Promoção", parteDia, parteHora].filter(Boolean).join(" ");
}

/** Preço que vale agora (com promoção, se ativa). */
export function precoAgora(produto: Record<string, any>, agora: Agora) {
  return promocaoAtiva(produto, agora) ? Number(produto.promo_preco) : Number(produto.preco);
}
