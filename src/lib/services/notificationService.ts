// Push Notification Service for Pret Monitor
class NotificationService {
  private vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HdANw2XJfyKidAsAzHSPiDmfwfWTUGse4rXGFHVJbpvEuLfzGp6ahKAXdQ'; // Demo key
  private subscription: PushSubscription | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Subscribe to push notifications
      await this.subscribe();
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    }
    return 'denied';
  }

  async subscribe(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription;
        console.log('Using existing push subscription');
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.subscription = subscription;
      console.log('Created new push subscription:', subscription);

      // Send subscription to server (in a real app)
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        const success = await this.subscription.unsubscribe();
        if (success) {
          this.subscription = null;
          console.log('Unsubscribed from push notifications');
        }
        return success;
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  async sendTestNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      // In a real app, this would send to your push server
      // For demo purposes, we'll create a local notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/static/icon-192.png',
          badge: '/static/icon-192.png',
          tag: 'pret-test',
          data,
          actions: [
            {
              action: 'view',
              title: 'View Details'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  async sendAlertNotification(alert: {
    storeId: string;
    storeName: string;
    type: 'empty_shelf' | 'temperature' | 'offline';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }): Promise<void> {
    try {
      const iconMap = {
        empty_shelf: '🛒',
        temperature: '🌡️',
        offline: '📡'
      };

      const title = `${iconMap[alert.type]} ${alert.title}`;
      const body = `${alert.storeName}: ${alert.message}`;

      await this.sendTestNotification(title, body, {
        storeId: alert.storeId,
        type: alert.type,
        severity: alert.severity,
        url: `/?store=${alert.storeId}&view=alerts`
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // In a real app, send this to your backend server
      console.log('Subscription to send to server:', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      });

      // Store locally for demo
      localStorage.setItem('pret-push-subscription', JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      }));
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  getSubscriptionStatus(): {
    isSupported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission;
  } {
    return {
      isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
      isSubscribed: this.subscription !== null,
      permission: 'Notification' in window ? Notification.permission : 'denied'
    };
  }
}

export const notificationService = new NotificationService();