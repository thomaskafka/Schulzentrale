/* Offline-Betrieb am iPad: App-Dateien zwischenspeichern (Daten liegen ohnehin im Browser-Speicher).
   Zuerst aus dem Netz (damit Updates sofort ankommen), ohne Netz aus dem Zwischenspeicher. */
const CACHE = 'schulzentrale-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.includes('/api/')) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && (u.origin === location.origin || /cdnjs|jsdelivr|fonts\./.test(u.host))) { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
