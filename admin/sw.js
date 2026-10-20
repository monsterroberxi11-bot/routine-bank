/* RB 管理者パネル Service Worker（build-pwa.js が自動生成。直接編集しない） */
const CACHE = 'routine-bank-admin-70595eeecb';
const SHELL = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.startsWith('routine-bank-admin-') && true).map((k) => caches.delete(k))))
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

// 通知：サーバーからは中身なしの合図だけが来るので、自分あてのお知らせを取りに行って出す。
// 取れなかったときも何か出す（iPhoneは合図のたびに通知を出さないと、通知を止められてしまう）
const API_URL = "https://script.google.com/macros/s/AKfycbwYVPlYAM3Xel3O8NP3bErPGCtzW9Mua5WtuWhOv6VHIaDDmb_oT354htcyXW-SFjgboQ/exec";
self.addEventListener('push', (e) => {
  const opts = { icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', lang: 'ja' };
  const fallback = () => self.registration.showNotification('RB 管理者パネル', Object.assign({ body: '新しいお知らせがあります', data: { hash: '' } }, opts));
  e.waitUntil(self.registration.pushManager.getSubscription()
    .then((sub) => fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'getPushInbox', args: [{ endpoint: sub.endpoint }] }) }))
    .then((res) => res.json())
    .then((data) => {
      const list = data && data.ok ? data.result : [];
      if (!list.length) return fallback();
      return Promise.all(list.map((n) => self.registration.showNotification(n.title,
        Object.assign({ body: n.body, tag: n.id, data: { hash: n.url || '' } }, opts))));
    })
    .catch(fallback));
});

// タップしたら：開いているアプリがあればそこへ、なければ開く
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.hash) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const scope = new URL(self.registration.scope).pathname;   // ふつう版の画面だけ（/home/・/admin/ の窓はちがうアプリ）
    const win = list.find((c) => { const p = new URL(c.url).pathname; return p === scope || p === scope + 'index.html'; });
    if (win) return win.focus().then((c) => (c || win).postMessage({ type: 'open', hash: hash }));
    return self.clients.openWindow('./' + hash);
  }));
});
