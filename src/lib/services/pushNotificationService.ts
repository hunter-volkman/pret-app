// Simple push notification service for MVP
class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported')
      return false
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js')
      console.log('Service worker registered successfully')

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return false
      }

      console.log('Push notifications initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  async sendTestNotification(title: string, body: string): Promise<void> {
    if (!this.registration) {
      console.warn('Service worker not registered')
      return
    }

    try {
      await this.registration.showNotification(title, {
        body,
        icon: '/static/icon-192.png',
        badge: '/static/icon-192.png',
        vibrate: [100, 50, 100],
        data: { timestamp: Date.now() },
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  async sendStockAlert(storeName: string, item: string, level: number): Promise<void> {
    const title = `${storeName} - Low Stock Alert`
    const body = `${item} is running low (${level}% remaining)`
    await this.sendTestNotification(title, body)
  }

  async sendTemperatureAlert(storeName: string, temperature: number): Promise<void> {
    const title = `${storeName} - Temperature Alert`
    const body = `Temperature is ${temperature.toFixed(1)}°C - outside normal range`
    await this.sendTestNotification(title, body)
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }
}

export const pushNotificationService = new PushNotificationService()
