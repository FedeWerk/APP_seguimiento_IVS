/* SalesRank IVS — service worker mínimo (PWA instalable + offline básico) */
const CACHE = 'salesrank-ivs-v1';
const SHELL = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET del mismo origen. Supabase / CDN (otros orígenes) van directo a la red.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Navegaciones: network-first para recibir SIEMPRE el HTML actualizado;
  // si no hay red, servimos el index cacheado (offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Resto de assets propios (íconos, manifest): cache-first.
  event.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
