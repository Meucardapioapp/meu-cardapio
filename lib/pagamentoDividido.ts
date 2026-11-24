// Regras do pagamento dividido (mais de uma forma no mesmo pedido).
// Módulo PURO (sem imports) — usado no cliente (checkout) e no servidor.

export type MetodoPag = "pix" | "pix_chave" | "card_delivery" | "cash";

export const METODOS_PAG: MetodoPag[] = ["pix", "pix_chave", "card_delivery", "cash"];

export const LABEL_PAGAMENTO: Record<MetodoPag, string> = {
  pix: "Pix online",
  pix_chave: "Pix na chave",
  card_delivery: "Cartão na entrega",
  cash: "Dinheiro",
};

export type ParcelaPagamento = { metodo: MetodoPag; valor: number };

const cent = (v: number) => Math.round(v * 100);
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Limpa e soma parcelas repetidas; descarta valores <= 0 e métodos inválidos. */
export function normalizarPagamentos(raw: unknown): ParcelaPagamento[] {
  if (!Array.isArray(raw)) return [];
  const out: ParcelaPagamento[] = [];
  for (const p of raw as any[]) {
    const metodo = String(p?.metodo) as MetodoPag;
    if (!METODOS_PAG.includes(metodo)) continue;
    const valor = r2(Number(p?.valor));
    if (!(valor > 0)) continue;
    const existente = out.find((x) => x.metodo === metodo);
    if (existente) existente.valor = r2(existente.valor + valor);
    else out.push({ metodo, valor });
  }
  return out;
}

export function somaPagamentos(ps: ParcelaPagamento[]): number {
  return r2(ps.reduce((s, p) => s + p.valor, 0));
}

export function valorDaParte(ps: ParcelaPagamento[], metodo: MetodoPag): number {
  return r2(ps.filter((p) => p.metodo === metodo).reduce((s, p) => s + p.valor, 0));
}

/** Soma da parte cobrada ONLINE (Pix Pagar.me). 0 se não houver. */
export function valorOnline(ps: ParcelaPagamento[]): number {
  return valorDaParte(ps, "pix");
}

/** Método "principal" para compatibilidade com o fluxo atual (prioridade). */
export function metodoPrimario(ps: ParcelaPagamento[]): MetodoPag {
  for (const m of METODOS_PAG) if (ps.some((p) => p.metodo === m)) return m;
  return "cash";
}

/** Divisão válida: pelo menos 2 parcelas e soma = total (tolerância de 1 centavo). */
export function divisaoValida(ps: ParcelaPagamento[], total: number): boolean {
  return ps.length >= 2 && Math.abs(cent(somaPagamentos(ps)) - cent(total)) <= 1;
}
