/* Routine Bank Offline Service Worker（build-pwa.js が自動生成。直接編集しない） */
const CACHE = 'routine-bank-home-7517b31910';
const SHELL = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.startsWith('routine-bank-home-') && true).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 画面はまずネットから取りに行き（更新をすぐ反映）、圏外ならキャッシュを出す。
// 別サイト宛ての通信（GASなど）はキャッシュしない。
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./')))
  );
});
