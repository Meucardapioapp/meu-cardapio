/**
 * Cardápio guardado no navegador durante a visita: carrinho, endereço e
 * pagamento abrem na hora com os dados que o cardápio já trouxe, e
 * atualizam por trás (preço, estoque e horário sempre conferidos de novo).
 */
const VALIDADE_MS = 10 * 60 * 1000;
const memoria = new Map<string, { em: number; dados: any }>();
const chave = (slug: string) => `cardapio-${slug}`;

export function guardarCardapio(slug: string, dados: any) {
  if (!slug || !dados) return;
  const item = { em: Date.now(), dados };
  memoria.set(slug, item);
  try {
    sessionStorage.setItem(chave(slug), JSON.stringify(item));
  } catch {
    // cardápio muito grande para o sessionStorage: fica só na memória
  }
}

export function cardapioGuardado(slug: string): any | null {
  let item = memoria.get(slug) ?? null;
  if (!item) {
    try {
      item = JSON.parse(sessionStorage.getItem(chave(slug)) || "null");
    } catch {
      item = null;
    }
  }
  if (!item || Date.now() - Number(item.em) > VALIDADE_MS) return null;
  return item.dados ?? null;
}

/** Busca o cardápio atualizado (e guarda). */
export async function buscarCardapio(slug: string): Promise<any | null> {
  try {
    const r = await fetch(`/api/cardapio/${encodeURIComponent(slug)}`);
    const j = await r.json();
    if (!j?.success) return null;
    guardarCardapio(slug, j.cardapio);
    return j.cardapio;
  } catch {
    return null;
  }
}
