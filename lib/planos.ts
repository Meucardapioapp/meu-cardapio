/**
 * Plano do MeuCardapioApp: pacote único, mensal, tudo incluído.
 * (O plano anual foi retirado em 16/10/2026.)
 * Usado no servidor (cobrança) e no navegador (telas de preço).
 */
export const PLANOS = {
  mensal: {
    id: "mensal",
    nome: "Plano Mensal",
    preco: 79.9,
    intervalo: "month" as const,
    dias: 30,
    descricao: "Cobrado todo mês",
  },
} as const;

export type PlanoId = keyof typeof PLANOS;

export const DIAS_TESTE_GRATIS = 15;

/** A partir de quantos dias para vencer aparece a contagem regressiva. */
export const DIAS_AVISO_VENCIMENTO = 5;

/** Dias de tolerância depois do vencimento antes de pausar os pedidos. */
export const DIAS_TOLERANCIA = 3;

export const TAXA_PIX_ONLINE_TEXTO = "1% apenas sobre Pix recebido online";

export function formatarReais(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export type StatusAssinatura =
  | "trial"
  | "ativa"
  | "inadimplente"
  | "cancelada"
  | "expirada";

export type EstadoAssinatura = {
  status: StatusAssinatura;
  /** true = cardápio no ar e painel liberado; false = tudo travado até pagar. */
  ativo: boolean;
  plano: PlanoId | null;
  metodo: "cartao" | "pix" | null;
  acessoAte: string;
  diasRestantes: number;
  cartaoFinal: string | null;
  cartaoBandeira: string | null;
};
