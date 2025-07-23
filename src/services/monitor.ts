import { viam } from './viam'
import { useStore } from '../stores/store'
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
      await this.updateWithRealData(store);
    } catch (error) {
      console.error(`Polling failed for ${store.name}:`, error)
      useStore.getState().updateStore(store.id, { status: 'offline' })
    }
  }

  private async updateWithRealData(store: Store): Promise<void> {
    const [stockRegions, tempSensors] = await Promise.all([
      viam.getStockReadings(store.stockMachineId),
      viam.getTemperatureReadings(store.tempMachineId)
    ]);
    
    useStore.getState().updateStore(store.id, {
      status: 'online',
      stockRegions,
      tempSensors
    });
    
    this.checkAlerts(store, stockRegions, tempSensors);
  }
  
  private async checkAlerts(store: Store, stockRegions: any[], tempSensors: any[]): Promise<void> {
    const { alerts, addAlert } = useStore.getState();
    const recentAlertCutoff = Date.now() - (5 * 60 * 1000);

    const lowStock = stockRegions.filter(r => r.status === 'empty' || r.status === 'low');
    if (lowStock.length > 2) {
      const hasRecentStockAlert = alerts.some(a => 
        a.storeId === store.id && a.type === 'stock' && a.timestamp.getTime() > recentAlertCutoff
      );
      
      if (!hasRecentStockAlert) {
        const [imageUrl, cvImageUrl] = await Promise.all([
          viam.getCameraImage(store.stockMachineId, false),
          viam.getCameraImage(store.stockMachineId, true)
        ]);

        addAlert({
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
        });
      }
    }

    const tempIssues = tempSensors.filter(t => t.status !== 'normal');
    if (tempIssues.length > 0) {
      const hasRecentTempAlert = alerts.some(a => 
        a.storeId === store.id && a.type === 'temperature' && a.timestamp.getTime() > recentAlertCutoff
      );
      
      if (!hasRecentTempAlert) {
        const criticalIssues = tempIssues.filter(t => t.status === 'critical');
        addAlert({
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
        });
      }
    }
  }
}

export const monitor = new MonitorService();
