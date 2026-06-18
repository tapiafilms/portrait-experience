const CACHE = 'portrait-v3'

// Solo cachear assets estáticos (imágenes, video, fuentes) — nunca HTML ni JS
const STATIC_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.ico', '.woff', '.woff2']

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Nunca cachear: HTML, API, otros dominios
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname !== location.hostname ||
    !STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext))
  ) {
    return // deja pasar a la red normal
  }

  // Assets estáticos: cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      })
    })
  )
})
