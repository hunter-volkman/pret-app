/**
 * Manages the PWA's push notification subscriptions.
 * This service handles service worker registration, VAPID key retrieval,
 * and communication with our future push server.
 */

// This will be the public key from our Vercel serverless function.
// For now, we'll leave it as a placeholder.
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_FROM_SERVER';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class PushService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initializes the service worker and prepares for push subscriptions.
   */
  public async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported.');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PushService] Service Worker registered successfully.');
    } catch (error) {
      console.error('[PushService] Service Worker registration failed:', error);
    }
  }

  /**
   * Subscribes the user to push notifications.
   * @returns The PushSubscription object on success, or null on failure.
   */
  public async subscribe(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.error('[PushService] Service worker not registered.');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      console.log('[PushService] User is subscribed:', subscription);
      
      // TODO: Send the subscription object to our backend API endpoint
      // await fetch('/api/subscribe', {
      //   method: 'POST',
      //   body: JSON.stringify(subscription),
      //   headers: { 'Content-Type': 'application/json' },
      // });

      return subscription;
    } catch (error) {
      console.error('[PushService] Failed to subscribe the user:', error);
      return null;
    }
  }

  /**
   * Unsubscribes the user from push notifications.
   */
  public async unsubscribe(): Promise<void> {
    const subscription = await this.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PushService] User unsubscribed.');
      
      // TODO: Notify our backend that the subscription should be removed
      // await fetch('/api/unsubscribe', {
      //   method: 'POST',
      //   body: JSON.stringify({ endpoint: subscription.endpoint }),
      //   headers: { 'Content-Type': 'application/json' },
      // });
    }
  }

  /**
   * Checks if the user is currently subscribed.
   */
  public async getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) return null;
    return this.serviceWorkerRegistration.pushManager.getSubscription();
  }
}

export const pushService = new PushService();
