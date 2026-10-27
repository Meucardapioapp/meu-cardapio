/**
 * Meta Pixel do próprio MeuCardápioApp (site de vendas e cadastro).
 * O ID vem da Vercel (NEXT_PUBLIC_META_PIXEL_ID). Sem ele, nada é carregado.
 * Só funciona depois que a pessoa aceita os cookies de marketing.
 */
export const PIXEL_PLATAFORMA = String(process.env.NEXT_PUBLIC_META_PIXEL_ID || "")
  .replace(/\D/g, "")
  .slice(0, 20);

/** Envia um evento ao Pixel, se ele estiver carregado (aceitou os cookies). */
export function rastrearPixel(evento: string, dados?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") fbq("track", evento, dados);
}
