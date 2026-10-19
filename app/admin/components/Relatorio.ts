export type Resumo = {
  pedidos: number;
  faturamento: number;
  ticketMedio: number;
  cancelados: number;
  clientes: number;
  descontos: number;
};

export type DadosRelatorio = {
  periodo: { de: string; ate: string; dias: number };
  resumo: Resumo;
  anterior: Resumo;
  porDia: { dia: string; pedidos: number; faturamento: number }[];
  porHora: number[];
  porPagamento: { nome: string; valor: number }[];
  porTipo: { nome: string; pedidos: number }[];
  produtos: { nome: string; quantidade: number; receita: number }[];
  salao?: { contas: number; faturamento: number; taxaServico: number; porPagamento: { nome: string; valor: number }[] };
};

export const reais = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "+12%" / "−5%" / "" comparado ao período anterior. */
export function variacao(atual: number, anterior: number) {
  if (!anterior) return atual > 0 ? { texto: "novo", positiva: true } : null;
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  return { texto: `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${Math.abs(pct)}%`, positiva: pct >= 0 };
}

export const diaCurto = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};
