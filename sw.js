const CACHE_NAME = 'sihyun-clicker-s2-alpha-v2';
const ASSETS = [
  './',
  './index.html',
  './1000000883.jpg',
  './icon-192.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // 파일 하나가 없어도 설치가 실패하지 않도록 하나씩 따로 저장
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((asset) => cache.add(asset)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // 외부 API(Supabase 등) 요청은 가로채지 않고 통과시켜 Failed to fetch 방지
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    // 항상 서버에서 최신본을 확인하고(no-cache), 성공하면 오프라인용 사본도 갱신
    fetch(event.request, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match('./index.html'))
      )
  );
});