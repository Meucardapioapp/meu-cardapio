/** Tipos e textos do salão usados no painel e nos apps da equipe. */

export type Comanda = {
  id: string;
  numero: number;
  mesa: string;
  status: "aberta" | "fechada" | "cancelada";
  pediu_conta: boolean;
  pessoas: number | null;
  cliente_nome: string | null;
  garcom_id: string | null;
  garcom_nome: string | null;
  taxa_servico: boolean;
  taxa_percentual: number;
  subtotal: number;
  taxa_valor: number;
  desconto: number;
  pago_antecipado: number;
  total: number;
  forma_pagamento: string | null;
  pagamentos: { forma: string; valor: number }[];
  troco: number;
  aberta_em: string;
  fechada_em: string | null;
  fechada_por: string | null;
  // resumo (lista de abertas)
  itens_total?: number;
  itens_preparando?: number;
  itens_prontos?: number;
  ultimo_lancamento?: string | null;
};

export type ItemComanda = {
  id: string;
  comanda_id: string;
  lancamento: string;
  produto_id: string | null;
  nome: string;
  detalhes: string[];
  observacao: string | null;
  quantidade: number;
  preco_unit: number;
  setor: string | null;
  status: "novo" | "pronto" | "entregue" | "cancelado";
  origem: string;
  lancado_por: string | null;
  criado_em: string;
  alterado_em: string | null;
  pronto_em: string | null;
  cancelado_por: string | null;
};

export const reais = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const hora = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export const minutosDesde = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));

export const STATUS_ITEM: Record<ItemComanda["status"], { texto: string; classe: string }> = {
  novo: { texto: "Preparando", classe: "bg-amber-100 text-amber-800" },
  pronto: { texto: "Pronto p/ levar", classe: "bg-green-100 text-green-800" },
  entregue: { texto: "Servido", classe: "bg-zinc-100 text-zinc-600" },
  cancelado: { texto: "Cancelado", classe: "bg-red-100 text-red-700 line-through" },
};

/** Rótulo do item: bebida sem preparo aparece como "Sem preparo" em vez de "Pronto". */
export function rotuloItem(i: Pick<ItemComanda, "status" | "setor">) {
  if (!i.setor && i.status === "pronto") return { texto: "Sem preparo", classe: "bg-sky-100 text-sky-800" };
  return STATUS_ITEM[i.status];
}

export const FORMAS = [
  { id: "pix", nome: "Pix", emoji: "⚡" },
  { id: "debito", nome: "Débito", emoji: "💳" },
  { id: "credito", nome: "Crédito", emoji: "💳" },
  { id: "dinheiro", nome: "Dinheiro", emoji: "💵" },
] as const;

export const NOME_FORMA: Record<string, string> = {
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
  dinheiro: "Dinheiro",
  outro: "Outro",
  misto: "Dividido",
  antecipado: "Já pago (QR)",
  pix_online: "Pix online (QR)",
};

/** Agrupa os itens por envio (cada "pedido" do garçom). */
export function porLancamento(itens: ItemComanda[]) {
  const mapa = new Map<string, ItemComanda[]>();
  for (const i of itens) mapa.set(i.lancamento, [...(mapa.get(i.lancamento) ?? []), i]);
  return [...mapa.entries()].map(([lancamento, lista]) => ({
    lancamento,
    criado_em: lista[0].criado_em,
    por: lista[0].lancado_por,
    origem: lista[0].origem,
    itens: lista,
  }));
}
