/* Service worker do painel: mostra "Novo pedido" no celular mesmo com o painel fechado. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (evento) => {
  let d = {};
  try {
    d = evento.data ? evento.data.json() : {};
  } catch (e) {
    d = { corpo: evento.data ? evento.data.text() : "" };
  }
  const url = typeof d.url === "string" && d.url.startsWith("/") ? d.url : "/admin/pedidos";
  evento.waitUntil(
    self.registration.showNotification(d.titulo || "MeuCardápio", {
      body: d.corpo || "",
      tag: d.tag || undefined,
      renotify: Boolean(d.tag),
      icon: "/icone-painel-192.png",
      badge: "/icone-painel-192.png",
      vibrate: [300, 150, 300, 150, 300],
      requireInteraction: true,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = new URL((evento.notification.data && evento.notification.data.url) || "/admin/pedidos", self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((abertas) => {
      for (const janela of abertas) {
        if (janela.url.includes("/admin")) {
          janela.navigate(destino).catch(() => {});
          return janela.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
