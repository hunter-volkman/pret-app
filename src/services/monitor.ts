import { viam } from './viam'
import { useStore, Alert } from '../stores/store'
import { STORES } from '../config/stores'
import { Store } from '../config/stores'

class MonitorService {
  private intervals = new Map<string, NodeJS.Timeout>()

  public start(selectedStores: Set<string>): void {
    this.stop()
    for (const storeId of selectedStores) {
      const store = STORES.find(s => s.id === storeId)
      if (!store) {
        console.error(`Monitor start failed: Could not find store with id ${storeId}`);
        continue;
      }
      
      const poll = () => this.pollStore(store);
      poll(); // Initial poll
      this.intervals.set(storeId, setInterval(poll, 30000));
    }
  }

  public stop(): void {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
  }

  private async pollStore(store: Store): Promise<void> {
    try {
      // Proactively check the store's status from our reliable health checker.
      // If it's offline, don't even attempt to poll for data.
      const currentStore = useStore.getState().stores.find(s => s.id === store.id);
      if (currentStore?.status === 'offline') {
        // This is a normal condition, so we can comment out the log to keep the console clean.
        // console.log(`[Monitor] Skipping poll for offline store: ${store.name}`);
        return;
      }
      await this.updateWithRealData(store);
    } catch (error: any) {
      // This catch block is now a secondary fallback for unexpected polling errors.
      if (error?.message?.includes('timed out')) {
        console.log(`[Monitor] ⚪️ Polling timed out for ${store.name}, machine may be offline.`);
      } else {
        console.error(`[Monitor] ❌ Polling failed for ${store.name}:`, error)
      }
      useStore.getState().updateStore(store.id, { status: 'offline' })
    }
  }

  private async updateWithRealData(store: Store): Promise<void> {
    const [stockRegions, tempSensors] = await Promise.all([
      viam.getStockReadings(store.stockMachineId),
      viam.getTemperatureReadings(store.tempMachineId)
    ]);
    
    // The health checker is the sole source of truth for online/offline status.
    // This function is now only responsible for updating data readings.
    useStore.getState().updateStore(store.id, {
      stockRegions,
      tempSensors
    });
    
    this.checkAlerts(store, stockRegions, tempSensors);
  }
  
  /**
   * Triggers a push notification by sending the alert details to our backend API.
   * @param alert The alert object to send a notification for.
   */
  private async triggerPushNotification(alert: Alert) {
    try {
      console.log(`[Monitor] Triggering push notification for store: ${alert.storeId}`);
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: alert.storeId,
          title: alert.title,
          message: alert.message,
        }),
      });
    } catch (error) {
      console.error('[Monitor] Failed to send push notification:', error);
    }
  }

  private async checkAlerts(store: Store, stockRegions: any[], tempSensors: any[]): Promise<void> {
    const { alerts, addAlert } = useStore.getState();
    const recentAlertCutoff = Date.now() - (5 * 60 * 1000); // 5 minutes ago

    // Check for stock alerts
    const lowStock = stockRegions.filter(r => r.status === 'empty' || r.status === 'low');
    if (lowStock.length > 2) { // Trigger if more than 2 regions are low/empty
      const hasRecentStockAlert = alerts.some(a => 
        a.storeId === store.id && a.type === 'stock' && a.timestamp.getTime() > recentAlertCutoff
      );
      
      if (!hasRecentStockAlert) {
        const [imageUrl, cvImageUrl] = await Promise.all([
          viam.getCameraImage(store.stockMachineId, false),
          viam.getCameraImage(store.stockMachineId, true)
        ]);

        const newAlert: Alert = {
          id: `stock-${store.id}-${Date.now()}`,
          storeId: store.id,
          storeName: store.name,
          type: 'stock',
          title: 'Low Stock Alert',
          message: `${lowStock.length} regions need immediate restocking at ${store.name}.`,
          timestamp: new Date(),
          severity: lowStock.some(r => r.status === 'empty') ? 'high' : 'medium',
          read: false,
          regions: lowStock.map(r => r.id),
          imageUrl: imageUrl || undefined,
          cvImageUrl: cvImageUrl || undefined
        };
        
        addAlert(newAlert);
        this.triggerPushNotification(newAlert); // 👈 NOTIFICATION SENT
      }
    }

    // Check for temperature alerts
    const tempIssues = tempSensors.filter(t => t.status !== 'normal');
    if (tempIssues.length > 0) {
      const hasRecentTempAlert = alerts.some(a => 
        a.storeId === store.id && a.type === 'temperature' && a.timestamp.getTime() > recentAlertCutoff
      );
      
      if (!hasRecentTempAlert) {
        const criticalIssues = tempIssues.filter(t => t.status === 'critical');
        const newAlert: Alert = {
          id: `temp-${store.id}-${Date.now()}`,
          storeId: store.id,
          storeName: store.name,
          type: 'temperature',
          title: 'Temperature Alert',
          message: `Temperature issue detected in ${tempIssues[0].name} at ${store.name}.`,
          timestamp: new Date(),
          severity: criticalIssues.length > 0 ? 'high' : 'medium',
          read: false,
          sensors: tempIssues.map(t => t.id)
        };

        addAlert(newAlert);
        this.triggerPushNotification(newAlert); // 👈 NOTIFICATION SENT
      }
    }
  }
}

export const monitor = new MonitorService();