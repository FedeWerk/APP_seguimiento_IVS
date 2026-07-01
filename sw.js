/* ══════════════════════════════════════════════════════
   SalesRank IVS — Service Worker
   Maneja Web Push real (app cerrada incluida) + caché básica
   ══════════════════════════════════════════════════════ */
const SW_VERSION = 'ivs-v3';
self.addEventListener('install', (event) => {
  // Activar el nuevo SW inmediatamente sin esperar a cerrar pestañas
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  // Tomar control de las páginas abiertas de inmediato
  event.waitUntil(self.clients.claim());
});
/* ── PUSH: llega un mensaje del servidor ── */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'SalesRank IVS', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'SalesRank IVS';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/badge.png',
    tag: data.tag || 'ivs-push',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
/* ── Click en la notificación: abrir / enfocar la app y navegar a la URL del tip ── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, navegarla a la URL del tip y enfocarla
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl)
              .then((navigatedClient) => (navigatedClient || client).focus())
              .catch(() => client.focus());
          }
          return client.focus();
        }
      }
      // Si no hay ninguna abierta, abrir una nueva en la URL del tip
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
