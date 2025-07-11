/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

// Install event - cache assets
self.addEventListener('install', (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(deleteOldCaches());
});

// Fetch event - serve from cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    // Serve build files from cache
    if (ASSETS.includes(url.pathname)) {
      return cache.match(url.pathname);
    }

    // Try cache first, then network
    try {
      const response = await fetch(event.request);
      
      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }
      
      return response;
    } catch {
      return cache.match(event.request);
    }
  }

  event.respondWith(respond());
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text());
  
  let notificationData = {
    title: 'Pret Alert',
    body: 'New alert received',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'pret-alert',
    data: {}
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        tag: `alert-${pushData.type || 'general'}-${pushData.storeId || 'unknown'}`,
        data: {
          alertId: pushData.alertId,
          storeId: pushData.storeId,
          url: pushData.url || `/?alert=${pushData.alertId}`
        }
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if open
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin)) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(urlToOpen);
      })
  );
});
