const STATIC_CACHE = 'tn-static-v2'
const SAVED_CACHE = 'tn-saved-v1'
const KNOWN_CACHES = [STATIC_CACHE, SAVED_CACHE]
const FALLBACK = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([FALLBACK, '/ne', '/en'])
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => !KNOWN_CACHES.includes(key)).map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

/**
 * Offline mode for bookmarked stories:
 * the page posts CACHE_STORY / UNCACHE_STORY when a reader saves or removes
 * a bookmark. Saved story documents are pinned in a dedicated cache so they
 * open with no connection.
 */
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || typeof data !== 'object') return

  if (data.type === 'CACHE_STORY' && typeof data.url === 'string') {
    event.waitUntil(
      caches.open(SAVED_CACHE).then(async (cache) => {
        try {
          const response = await fetch(data.url, { credentials: 'same-origin' })
          if (response.ok) await cache.put(data.url, response)
        } catch {
          // Story will be pinned on the next successful visit instead.
        }
      }),
    )
  }

  if (data.type === 'UNCACHE_STORY' && typeof data.url === 'string') {
    event.waitUntil(caches.open(SAVED_CACHE).then((cache) => cache.delete(data.url)))
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  // Never cache API or CMS traffic.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/cms')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy))
        // Refresh the pinned copy of saved stories opportunistically.
        if (event.request.mode === 'navigate') {
          const savedCopy = response.clone()
          caches.open(SAVED_CACHE).then(async (cache) => {
            const pinned = await cache.match(url.pathname)
            if (pinned) await cache.put(url.pathname, savedCopy)
          })
        }
        return response
      })
      .catch(async () => {
        // Saved stories win: exact pin lookup first, then general cache.
        const pinned = await caches.open(SAVED_CACHE).then((cache) => cache.match(url.pathname))
        if (pinned) return pinned
        const cached = await caches.match(event.request)
        if (cached) return cached
        if (event.request.mode === 'navigate') {
          return caches.match(FALLBACK)
        }
        return new Response('', { status: 504 })
      }),
  )
})
