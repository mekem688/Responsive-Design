const CACHE = 'study-planner-v2';
const STATIC = [
  '/',
  '/css/main.css',
  '/css/components.css',
  '/css/views.css',
  '/css/modals.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/state.js',
  '/js/auth.js',
  '/js/tasks.js',
  '/js/subtasks.js',
  '/js/timer.js',
  '/js/sounds.js',
  '/js/badges.js',
  '/js/goals.js',
  '/js/dashboard.js',
  '/js/agenda.js',
  '/js/stats.js',
  '/js/app.js',
  '/icons/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('supabase.co') || url.includes('fonts.g')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(c => c || new Response(JSON.stringify({error:'offline'}),
          {status:503, headers:{'Content-Type':'application/json'}}))
      )
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});
