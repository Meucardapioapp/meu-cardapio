/**
 * Como cobrar um grupo em que o cliente escolhe mais de uma opção
 * (ex.: pizza meio a meio):
 *  - "soma": soma as opções (padrão)
 *  - "maior": cobra só a opção mais cara (comum em pizzaria)
 *  - "media": cobra a média das opções
 * Devolve o preço de cada opção já ajustado: somando a lista dá o total certo.
 */
export type RegraPreco = "soma" | "maior" | "media";

export function normalizarRegra(valor: unknown): RegraPreco {
  return valor === "maior" || valor === "media" ? valor : "soma";
}

export function precosEfetivos(precos: number[], regra: RegraPreco): number[] {
  const centavos = precos.map((p) => Math.round(Number(p || 0) * 100));
  if (centavos.length <= 1 || regra === "soma") return centavos.map((c) => c / 100);

  if (regra === "maior") {
    const indice = centavos.indexOf(Math.max(...centavos));
    return centavos.map((c, i) => (i === indice ? c / 100 : 0));
  }

  // média: divide o total da média entre as opções sem perder centavos
  const total = Math.round(centavos.reduce((s, c) => s + c, 0) / centavos.length);
  const base = Math.floor(total / centavos.length);
  let sobra = total - base * centavos.length;
  return centavos.map(() => {
    const extra = sobra > 0 ? 1 : 0;
    sobra -= extra;
    return (base + extra) / 100;
  });
}

export const TEXTO_REGRA: Record<RegraPreco, string> = {
  soma: "Soma as opções",
  maior: "Cobra a opção mais cara",
  media: "Cobra a média das opções",
};
