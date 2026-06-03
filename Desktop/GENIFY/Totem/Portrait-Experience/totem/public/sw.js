const CACHE = 'portrait-v1'

// Assets estáticos que se cachean al instalar
const PRECACHE = [
  '/',
  '/totem',
  '/logo-ai-portrait-experience.png',
  '/logo-genofy-transparent.png',
  '/bg-totem.png',
  '/loop.mp4',
  '/favicon.ico',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Las llamadas a API siempre van a la red — nunca cachear
  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
    return e.respondWith(fetch(e.request))
  }

  // Para assets estáticos: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone()
        caches.open(CACHE).then(cache => cache.put(e.request, clone))
      }
      return res
    }))
  )
})
