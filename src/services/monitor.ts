import { viam } from './viam'
import { useStore, Alert, StockRegion, TempSensor } from '../stores/store'
import { STORES, Store } from '../config/stores'

class MonitorService {
  private intervals = new Map<string, { stock?: NodeJS.Timeout; temp?: NodeJS.Timeout }>();

  public start(selectedStores: Set<string>): void {
    this.stop();
    for (const storeId of selectedStores) {
      const store = STORES.find(s => s.id === storeId);
      if (!store) {
        console.error(`Monitor start failed: Could not find store with id ${storeId}`);
        continue;
      }
      
      const pollStock = () => this.pollStock(store);
      const pollTemp = () => this.pollTemp(store);

      pollStock(); // Initial poll
      pollTemp();

      this.intervals.set(storeId, {
        stock: setInterval(pollStock, 30000),
        temp: setInterval(pollTemp, 30000),
      });
    }
  }

  public stop(): void {
    this.intervals.forEach(timers => {
      if (timers.stock) clearInterval(timers.stock);
      if (timers.temp) clearInterval(timers.temp);
    });
    this.intervals.clear();
  }

  private async pollStock(store: Store): Promise<void> {
    try {
      const currentStoreState = useStore.getState().stores.find(s => s.id === store.id);
      if (currentStoreState?.stockStatus === 'offline') return;

      const stockRegions = await viam.getStockReadings(store.stockMachineId);
      useStore.getState().updateStore(store.id, {
        stockRegions,
        stockStatus: 'online',
      });
      this.checkStockAlerts(store, stockRegions);
    } catch (error: any) {
      if (error?.message?.includes('timed out')) {
        console.log(`[Monitor] ⚪️ Stock poll timed out for ${store.name}.`);
      } else {
        console.error(`[Monitor] ❌ Stock poll failed for ${store.name}:`, error.message);
      }
      useStore.getState().updateStore(store.id, { stockStatus: 'offline' });
    }
  }

  private async pollTemp(store: Store): Promise<void> {
    try {
      const currentStoreState = useStore.getState().stores.find(s => s.id === store.id);
      if (currentStoreState?.tempStatus === 'offline') return;
        
      const tempSensors = await viam.getTemperatureReadings(store.tempMachineId);
      useStore.getState().updateStore(store.id, {
        tempSensors,
        tempStatus: 'online',
      });
      this.checkTempAlerts(store, tempSensors);
    } catch (error: any) {
      if (error?.message?.includes('timed out')) {
        console.log(`[Monitor] ⚪️ Temp poll timed out for ${store.name}.`);
      } else {
        console.error(`[Monitor] ❌ Temp poll failed for ${store.name}:`, error.message);
      }
      useStore.getState().updateStore(store.id, { tempStatus: 'offline' });
    }
  }
  
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

  private async checkStockAlerts(store: Store, stockRegions: StockRegion[]): Promise<void> {
    const { alerts, addAlert } = useStore.getState();
    const recentAlertCutoff = Date.now() - (5 * 60 * 1000); // 5 minutes ago

    const lowStock = stockRegions.filter(r => r.status === 'empty' || r.status === 'low');
    if (lowStock.length > 2) {
      const hasRecentStockAlert = alerts.some(a => 
        a.storeId === store.id && a.type === 'stock' && a.timestamp.getTime() > recentAlertCutoff
      );
      
      if (!hasRecentStockAlert) {
        const [imageUrl, cvImageUrl] = await Promise.all([
          viam.getCameraImage(store.stockMachineId, false).catch(() => undefined),
          viam.getCameraImage(store.stockMachineId, true).catch(() => undefined)
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
        this.triggerPushNotification(newAlert);
      }
    }
  }

  private async checkTempAlerts(store: Store, tempSensors: TempSensor[]): Promise<void> {
    const { alerts, addAlert } = useStore.getState();
    const recentAlertCutoff = Date.now() - (5 * 60 * 1000);

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
        this.triggerPushNotification(newAlert);
      }
    }
  }
}

export const monitor = new MonitorService();