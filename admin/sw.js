// 管理者パネルは ap-admin へ引っこした。前の Service Worker が残っている端末では、これに入れかわって
// キャッシュを消し、自分を外してから、画面を読み直す（→ 引っこし先へ案内するページが出る）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('routine-bank-admin-')).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const list = await self.clients.matchAll({ type: 'window' });
    list.forEach((c) => c.navigate(c.url));
  })());
});
