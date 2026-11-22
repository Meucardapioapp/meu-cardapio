/**
 * "Complementos grátis no total" (ex.: açaí 300ml com 3 complementos):
 * o dono diz quantos complementos vêm grátis no produto e quanto custa cada
 * um depois disso. Vale para todos os grupos de escolha somados (Cremes +
 * Frutas + Secos). Só contam as opções que custam R$ 0 — opção com preço
 * próprio (ex.: Nutella + R$ 5) é cobrada normalmente e não gasta o grátis.
 * Produto sem o número preenchido funciona como sempre.
 */
import { normalizarRegra } from "@/lib/precos";

export type RegraGratis = { gratis: number; extra: number };

export function regraGratisDe(produto: any): RegraGratis | null {
  const bruto = produto?.complementos_gratis ?? produto?.complementosGratis;
  if (bruto === null || bruto === undefined || bruto === "") return null;
  const gratis = Math.floor(Number(bruto));
  if (!Number.isFinite(gratis) || gratis < 0) return null;
  const extra = Number(produto?.preco_complemento_extra ?? produto?.precoComplementoExtra ?? 0);
  return { gratis, extra: Number.isFinite(extra) && extra > 0 ? Math.round(extra * 100) / 100 : 0 };
}

/**
 * A opção gasta o grátis? Só se ela custa R$ 0 num grupo que soma e não foi
 * marcada pelo restaurante como "Não quero / não precisa" (ex.: "Não quero
 * creme": o cliente avança sem gastar um complemento).
 */
export function contaNoGratis(precoOriginal: unknown, regraDoGrupo: unknown, naoConta?: unknown) {
  if (naoConta === true) return false;
  return Math.round(Number(precoOriginal || 0) * 100) === 0 && normalizarRegra(regraDoGrupo) === "soma";
}

/**
 * Recebe as escolhas na ordem do cardápio e devolve o preço final de cada
 * uma: as primeiras grátis continuam R$ 0; as que passam do limite custam o
 * valor do extra e saem marcadas como extra (aparece na comanda).
 */
export function aplicarGratis<T extends { preco: number }>(
  linhas: (T & { conta: boolean })[],
  regra: RegraGratis | null
): (T & { extra?: boolean })[] {
  let usados = 0;
  return linhas.map(({ conta, ...resto }) => {
    const linha = resto as unknown as T;
    if (!regra || !conta) return linha;
    usados++;
    return usados > regra.gratis ? { ...linha, preco: regra.extra, extra: true } : linha;
  });
}
