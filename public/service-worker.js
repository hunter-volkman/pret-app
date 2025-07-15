// Simple service worker for MVP
const CACHE_NAME = 'pret-monitor-v1'
const urlsToCache = [
  '/',
  '/static/manifest.json',
  '/static/icon-192.png'
]

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  )
})

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New alert from Pret Monitor',
    icon: '/static/icon-192.png',
    badge: '/static/icon-192.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now() },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Pret Monitor', options)
  )
})

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/'))
  }
})
