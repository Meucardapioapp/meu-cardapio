/**
 * Adicional repetido (ex.: 3x Nutella) fica guardado como 3 itens iguais na
 * lista do pedido: assim todas as contas de preço continuam iguais. Para
 * mostrar ao cliente, ao dono e na comanda, juntamos os iguais.
 */
export type AdicionalAgrupado = { id?: string; nome: string; preco: number; qtd: number };

export function agruparAdicionais(lista: { id?: unknown; nome?: unknown; preco?: unknown }[] | null | undefined) {
  const mapa = new Map<string, AdicionalAgrupado>();
  for (const a of lista ?? []) {
    const nome = String(a?.nome ?? "").trim();
    if (!nome) continue;
    const preco = Number(a?.preco || 0);
    const chave = `${a?.id ?? ""}|${nome}|${preco}`;
    const atual = mapa.get(chave);
    if (atual) atual.qtd++;
    else mapa.set(chave, { id: a?.id != null ? String(a.id) : undefined, nome, preco, qtd: 1 });
  }
  return [...mapa.values()];
}

/** "2x Nutella, Morango" */
export function textoAdicionais(lista: { id?: unknown; nome?: unknown; preco?: unknown }[] | null | undefined) {
  return agruparAdicionais(lista)
    .map((a) => (a.qtd > 1 ? `${a.qtd}x ${a.nome}` : a.nome))
    .join(", ");
}

/** Máximo de vezes que o cliente pode repetir o mesmo adicional num item. */
export const MAX_REPETICOES_ADICIONAL = 10;

/** "Uva · 2x Nutella" (escolhas obrigatórias, juntando as repetidas). */
export function textoEscolhas(lista: { id?: unknown; nome?: unknown; preco?: unknown }[] | null | undefined, separador = " · ") {
  return agruparAdicionais(lista)
    .map((a) => (a.qtd > 1 ? `${a.qtd}x ${a.nome}` : a.nome))
    .join(separador);
}

/**
 * Adicional (fora das escolhas): o cliente pode pedir mais de uma vez
 * (ex.: 3x Nutella)? Só os cobrados — grátis repetido seria brinde sem limite.
 */
export function podeRepetir(preco: unknown) {
  return Number(preco) > 0;
}

/**
 * Escolha que aceita mais de uma opção e soma os preços (ex.: "Complementos,
 * até 5"): o cliente pode pedir a mesma opção mais de uma vez (3x bolacha no
 * mesmo açaí). Cada vez conta no limite do grupo e o preço soma no item, não
 * no pedido inteiro. Meio a meio (pela mais cara / média) não repete.
 */
export function grupoPermiteRepetir(grupo: { maximo?: unknown; regra_preco?: unknown } | null | undefined) {
  if (!grupo) return false;
  const maximo = Number(grupo.maximo ?? 999);
  const regra = String(grupo.regra_preco ?? "soma");
  return maximo > 1 && (regra === "soma" || regra === "" || regra === "null");
}
