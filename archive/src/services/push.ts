/**
 * Manages the PWA's push notification subscriptions.
 */

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
  private vapidPublicKey: string | null = null;

  public async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported.');
      return false;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PushService] Service Worker registered successfully.');
      
      const response = await fetch('/api/public-key');
      const data = await response.json();
      if (!data.publicKey) {
        throw new Error('Failed to fetch VAPID public key.');
      }
      this.vapidPublicKey = data.publicKey;
      console.log('[PushService] Fetched VAPID public key.');
      return true;

    } catch (error) {
      console.error('[PushService] Initialization failed:', error);
      return false;
    }
  }

  public async subscribe(storeId: string): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration || !this.vapidPublicKey) {
      console.error('[PushService] Not initialized. Cannot subscribe.');
      alert('Push notification service is not ready. Please try again.');
      return null;
    }

    try {
      const existingSubscription = await this.getSubscription();
      if (existingSubscription) {
        console.log('[PushService] User is already subscribed.');
        // Still send to backend in case of sync issues
        await this.sendSubscriptionToBackend(storeId, existingSubscription);
        return existingSubscription;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(this.vapidPublicKey),
      });
      
      console.log('[PushService] User subscribed successfully.');
      await this.sendSubscriptionToBackend(storeId, subscription);
      return subscription;
    } catch (error) {
      console.error('[PushService] Failed to subscribe:', error);
      if (Notification.permission === 'denied') {
        alert('Notification permission was denied. Please enable it in your browser settings.');
      } else {
        alert('Failed to subscribe to notifications. Please try again.');
      }
      return null;
    }
  }

  public async unsubscribe(storeId: string): Promise<void> {
    const subscription = await this.getSubscription();
    if (subscription) {
      // We send the request to the backend first.
      // Even if the user cancels the unsubscribe action on the browser,
      // our backend will have removed the subscription.
      await this.removeSubscriptionFromBackend(storeId, subscription);
      await subscription.unsubscribe();
      console.log('[PushService] User unsubscribed successfully.');
    }
  }

  private async sendSubscriptionToBackend(storeId: string, subscription: PushSubscription) {
    await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ storeId, subscription }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async removeSubscriptionFromBackend(storeId: string, subscription: PushSubscription) {
    await fetch('/api/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ storeId, subscription }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  public getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) return Promise.resolve(null);
    return this.serviceWorkerRegistration.pushManager.getSubscription();
  }
}

export const push = new PushService();
