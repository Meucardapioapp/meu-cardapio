/** App do motoboy (instalar na tela inicial do celular). */
export function GET() {
  return Response.json(
    {
      name: "MeuCardápio — Entregas",
      short_name: "Entregas",
      start_url: "/entregador",
      scope: "/entregador",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#6D1F2F",
      icons: [
        { src: "/icone-painel-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icone-painel-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=86400" } }
  );
}
