/** R$ 1.234,56 (padrão brasileiro, com vírgula). */
export function reais(valor: number | string | null | undefined) {
  const n = Number(valor || 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** 1.234,56 (sem o "R$"). */
export function numeroBR(valor: number | string | null | undefined) {
  const n = Number(valor || 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Texto sem acento e em minúsculas, para busca. */
export function semAcento(texto: unknown) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Menor preço possível de um produto: preço base + opção mais barata de cada
 * grupo obrigatório. Usado para "A partir de R$ X" (ex.: pizza por tamanho).
 */
export function precoAPartirDe(produto: any) {
  const base = Number(produto?.preco || 0);
  let extra = 0;
  for (const g of produto?.gruposObrigatorios ?? []) {
    const minimo = Math.max(Number(g?.minimo || 0), 0);
    if (!minimo) continue;
    const precos = (g?.grupo_obrigatorio_opcoes ?? [])
      .map((o: any) => Number(o?.preco || 0))
      .filter((p: number) => Number.isFinite(p))
      .sort((a: number, b: number) => a - b);
    if (!precos.length) continue;
    const regra = String(g?.regra_preco || "soma");
    if (regra === "maior" || regra === "media") extra += precos[0];
    else extra += precos.slice(0, minimo).reduce((t: number, p: number) => t + p, 0);
  }
  return {
    valor: base + extra,
    // "A partir de" quando o preço final depende de escolhas com preços diferentes.
    variavel: (produto?.gruposObrigatorios ?? []).some((g: any) => {
      const precos = new Set((g?.grupo_obrigatorio_opcoes ?? []).map((o: any) => Number(o?.preco || 0)));
      return Number(g?.minimo || 0) > 0 && precos.size > 1;
    }),
  };
}
