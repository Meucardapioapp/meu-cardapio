/**
 * Cardápios de demonstração do próprio MeuCardápioApp (não são clientes).
 * - ficam sempre no ar, sem depender de plano;
 * - mostram um aviso de "demonstração" no topo do cardápio;
 * - não entram nas contas do Painel da plataforma.
 */
export const SLUGS_DEMO = ["fornadapizzaria"];

export function ehDemo(slug: string | null | undefined) {
  return SLUGS_DEMO.includes(String(slug ?? "").trim().toLowerCase());
}
