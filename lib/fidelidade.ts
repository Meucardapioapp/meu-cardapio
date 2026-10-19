/** Tipos e textos do programa de fidelidade (servidor e navegador). */

export type ProgramaFidelidade = {
  ativo: boolean;
  pedidosNecessarios: number;
  tipoPremio: "dinheiro" | "produto";
  valorDesconto: number;
  premioDescricao: string;
  /** Ex.: "R$ 10,00 de desconto" ou "1 pizza doce". */
  textoPremio: string;
};

export type FidelidadeCliente = {
  selos: number;
  premioDisponivel: boolean;
};

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function textoDoPremio(p: Pick<ProgramaFidelidade, "tipoPremio" | "valorDesconto" | "premioDescricao">) {
  if (p.tipoPremio === "produto") return p.premioDescricao || "um brinde";
  return `${reais(p.valorDesconto)} de desconto`;
}

/** Cupom: tira espaços e deixa em maiúsculas. */
export function normalizarCodigoCupom(codigo: unknown) {
  return String(codigo ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 30);
}

export function calcularDescontoCupom(
  cupom: { tipo: "percentual" | "valor"; valor: number },
  subtotal: number
) {
  const bruto =
    cupom.tipo === "percentual"
      ? (subtotal * Math.min(Number(cupom.valor), 100)) / 100
      : Number(cupom.valor);

  return Math.round(Math.min(Math.max(bruto, 0), subtotal) * 100) / 100;
}
