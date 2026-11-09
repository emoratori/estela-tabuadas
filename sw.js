// Service Worker - cache offline. Aumente a versão ao atualizar os arquivos.
const V = 'estela-v2';
const FILES = ['./', './index.html', './styles.css', './app.js', './manifest.json',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];
const TAILWIND = 'https://cdn.tailwindcss.com/3.4.17';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(async c => {
    await c.addAll(FILES);
    try { await c.add(new Request(TAILWIND, { mode: 'no-cors' })); } catch (_) {}
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res && (res.ok || res.type === 'opaque')) {
      const copy = res.clone();
      caches.open(V).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
