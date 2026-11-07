/**
 * Complementos pausados (acabou no estoque): somem do cardápio até o dono
 * ativar de novo. Usado pelo cardápio, pelo salão e pela conferência do pedido.
 */

export const estaPausado = (item: { pausado?: unknown } | null | undefined) => item?.pausado === true;

/** Mesmo nome escrito de jeitos diferentes conta como o mesmo complemento. */
export const chaveComplemento = (nome: unknown) =>
  String(nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/**
 * Tira as opções pausadas de cada escolha obrigatória.
 * Se uma escolha obrigatória ficar sem nenhuma opção, o produto não pode ser
 * pedido (indisponivel = true). Se sobrarem menos opções que o mínimo, o
 * mínimo cai para o que sobrou (ex.: "escolha 3" com só 2 disponíveis).
 */
export function semPausados<G extends { minimo?: unknown; maximo?: unknown }>(
  grupos: G[],
  campoOpcoes: string
): { grupos: G[]; indisponivel: boolean } {
  let indisponivel = false;
  const lista: G[] = [];

  for (const g of grupos) {
    const opcoes = (((g as any)[campoOpcoes] ?? []) as any[]).filter((o) => !estaPausado(o));
    const minimo = Number(g.minimo ?? 0);

    if (!opcoes.length) {
      if (minimo > 0) indisponivel = true;
      continue;
    }

    lista.push({ ...g, [campoOpcoes]: opcoes, minimo: Math.min(minimo, opcoes.length) });
  }

  return { grupos: lista, indisponivel };
}

/** Mínimo de uma escolha levando em conta as opções pausadas. */
export function minimoDisponivel(grupo: { minimo?: unknown }, opcoes: any[]) {
  const ativas = opcoes.filter((o) => !estaPausado(o)).length;
  return Math.min(Number(grupo.minimo ?? 0), ativas);
}
