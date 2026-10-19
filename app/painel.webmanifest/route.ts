/** App do painel (instalar na tela inicial e receber notificações no iPhone). */
export function GET() {
  return Response.json(
    {
      name: "MeuCardápio — Painel",
      short_name: "Pedidos",
      start_url: "/admin/pedidos",
      scope: "/admin/",
      display: "standalone",
      background_color: "#1F1C21",
      theme_color: "#6D1F2F",
      icons: [
        { src: "/icone-painel-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icone-painel-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=86400" } }
  );
}
