// Simplified service worker, primarily for push notifications.
// Caching is handled by the browser and Vercel's CDN, preventing stale asset issues.

// Install: Skip waiting to activate the new worker immediately.
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate: Ensure the new worker takes control immediately.
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Pret Monitor';
  const options = {
    body: data.message || 'New alert from Pret Monitor',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png', // Badge for Android
    vibrate: [100, 50, 100],
    data: { 
      dateOfArrival: Date.now(),
      url: data.url || '/' 
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Open the app or a specific URL from the push data
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(clients.openWindow(urlToOpen));
});
