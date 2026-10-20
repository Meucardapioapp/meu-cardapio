/**
 * Deixa a foto leve antes de enviar (no próprio celular/computador do dono):
 * diminui para no máximo `maxLado` pixels e salva em WebP (ou JPEG no Safari
 * antigo). Uma foto de 4 MB do celular vira ~100–200 KB, e o cardápio abre
 * muito mais rápido no 4G.
 */
export async function comprimirImagem(
  original: Blob,
  { maxLado = 1200, qualidade = 0.8, nome = "foto" }: { maxLado?: number; qualidade?: number; nome?: string } = {}
): Promise<File> {
  const tipoOriginal = original.type || "image/jpeg";
  const devolverOriginal = () =>
    original instanceof File ? original : new File([original], `${nome}.${tipoOriginal.split("/")[1] || "jpg"}`, { type: tipoOriginal });

  // GIF animado e SVG ficam como estão.
  if (/gif|svg/.test(tipoOriginal)) return devolverOriginal();

  let largura = 0;
  let altura = 0;
  let desenhar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  let liberar = () => {};

  try {
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(original, { imageOrientation: "from-image" } as any);
      largura = bmp.width;
      altura = bmp.height;
      desenhar = (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h);
      liberar = () => bmp.close?.();
    } else {
      const url = URL.createObjectURL(original);
      const img = await new Promise<HTMLImageElement>((ok, erro) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = erro;
        i.src = url;
      });
      largura = img.naturalWidth;
      altura = img.naturalHeight;
      desenhar = (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h);
      liberar = () => URL.revokeObjectURL(url);
    }
  } catch {
    return devolverOriginal();
  }

  try {
    const escala = Math.min(1, maxLado / Math.max(largura, altura));
    const w = Math.max(1, Math.round(largura * escala));
    const h = Math.max(1, Math.round(altura * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return devolverOriginal();
    // Fundo branco: PNG com transparência não fica preto no JPEG.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    desenhar(ctx, w, h);

    const gerar = (tipo: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, qualidade));
    let blob = await gerar("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await gerar("image/jpeg");
    if (!blob) return devolverOriginal();

    // Só troca se ficou bem menor.
    if (blob.size >= original.size * 0.9 && escala === 1) return devolverOriginal();
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${nome}.${ext}`, { type: blob.type });
  } finally {
    liberar();
  }
}
