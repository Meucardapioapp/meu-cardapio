/**
 * Carrinho do cliente, guardado só no aparelho (localStorage).
 * Fica salvo por 24 horas: o cliente pode fechar o navegador, responder
 * um WhatsApp e voltar sem perder o que escolheu.
 */
const VALIDADE_MS = 24 * 60 * 60 * 1000;

const chave = (slug: string) => `cart-${slug}`;
const chaveData = (slug: string) => `cart-${slug}-em`;

export function lerCarrinho(slug: string): any[] {
  try {
    const em = Number(localStorage.getItem(chaveData(slug)) || 0);
    if (em && Date.now() - em > VALIDADE_MS) {
      localStorage.removeItem(chave(slug));
      localStorage.removeItem(chaveData(slug));
      return [];
    }
    const lista = JSON.parse(localStorage.getItem(chave(slug)) || "[]");
    return Array.isArray(lista) ? lista.filter((i) => i && Number(i.quantity) > 0) : [];
  } catch {
    return [];
  }
}

export function salvarCarrinho(slug: string, itens: any[]) {
  try {
    if (!itens.length) {
      localStorage.removeItem(chave(slug));
      localStorage.removeItem(chaveData(slug));
      return;
    }
    localStorage.setItem(chave(slug), JSON.stringify(itens));
    localStorage.setItem(chaveData(slug), String(Date.now()));
  } catch {}
}

export function limparCarrinho(slug: string) {
  salvarCarrinho(slug, []);
}

/** Preço de uma unidade do item (base + adicionais + opções). */
export function precoUnitario(item: any) {
  const base = Number(item?.precoBase ?? item?.preco ?? 0);
  const adicionais = (item?.adicionaisSelecionados ?? []).reduce(
    (t: number, a: any) => t + Number(a?.preco || 0) * Math.max(Number(a?.quantidade || 1), 1),
    0
  );
  const opcoes = (item?.obrigatoriosSelecionados ?? []).reduce((t: number, o: any) => t + Number(o?.preco || 0), 0);
  return base + adicionais + opcoes;
}

export function totalCarrinho(itens: any[]) {
  return itens.reduce((t, i) => t + precoUnitario(i) * Number(i.quantity || 0), 0);
}

export function quantidadeCarrinho(itens: any[]) {
  return itens.reduce((t, i) => t + Number(i.quantity || 0), 0);
}

/**
 * Confere o carrinho salvo com o cardápio atual: tira o que saiu do cardápio
 * e atualiza o preço base (promoção que acabou, preço que mudou).
 */
export function conferirComCardapio(itens: any[], produtos: any[]) {
  // Cardápio veio vazio (erro de rede): não mexe no carrinho.
  if (!Array.isArray(produtos) || produtos.length === 0) return itens;
  const porId = new Map(produtos.map((p) => [String(p.id), p]));
  return itens
    .filter((i) => porId.has(String(i.id)))
    .map((i) => {
      const p = porId.get(String(i.id));
      const atualizado = { ...i, precoBase: Number(p.preco), imagem: p.imagem, nome: p.nome };
      return { ...atualizado, preco: precoUnitario(atualizado) };
    });
}
