import { viam } from './viam'
import { useStore, Alert } from '../stores/store'
import { STORES, IS_DEMO } from '../config/stores'

class MonitorService {
  private intervals = new Map<string, NodeJS.Timeout>()
  private isRunning = false

  start(selectedStores: Set<string>) {
    this.stop()
    this.isRunning = true
    
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

  stop() {
    this.isRunning = false
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
  }

  private async pollStore(store: any) {
    if (!this.isRunning) return;

    try {
      if (IS_DEMO) {
        // Demo data logic remains the same
      } else {
        await this.updateWithRealData(store);
      }
    } catch (error) {
      console.error(`Polling failed for ${store.name}:`, error)
      useStore.getState().updateStore(store.id, { status: 'offline' })
    }
  }

  private async updateWithRealData(store: any) {
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
  
  private async checkAlerts(store: any, stockRegions: any[], tempSensors: any[]) {
    const { alerts, addAlert } = useStore.getState();
    const recentAlertCutoff = Date.now() - (5 * 60 * 1000); // 5 minutes

    // Stock alerts
    const lowStock = stockRegions.filter(r => r.status === 'empty' || r.status === 'low');
    if (lowStock.length > 2) {
      const hasRecentStockAlert = alerts.some(a => 
        a.storeId === store.id && a.type === 'stock' && a.timestamp.getTime() > recentAlertCutoff
      );
      
      if (!hasRecentStockAlert) {
        console.log(`[Monitor] Generating stock alert for ${store.name}. Fetching snapshots...`);
        
        // ✅ CHANGE: Fetch both raw and CV images concurrently for performance.
        const [imageUrl, cvImageUrl] = await Promise.all([
          viam.getCameraImage(store.stockMachineId, false), // Raw feed
          viam.getCameraImage(store.stockMachineId, true)   // CV overlay
        ]);

        addAlert({
          id: `stock-${store.id}-${Date.now()}`,
          storeId: store.id,
          storeName: store.name,
          type: 'stock',
          title: 'Low Stock Alert',
          message: `${lowStock.length} regions need immediate restocking`,
          timestamp: new Date(),
          severity: lowStock.some(r => r.status === 'empty') ? 'high' : 'medium',
          read: false,
          regions: lowStock.map(r => r.id),
          // ✅ CHANGE: Store both image URLs in the alert object.
          imageUrl: imageUrl || undefined,
          cvImageUrl: cvImageUrl || undefined
        });
      }
    }

    // Temperature alerts
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
          message: criticalIssues.length > 0 
            ? `Critical temperature issue in ${criticalIssues[0].name}` 
            : `Temperature warning in ${tempIssues[0].name}`,
          timestamp: new Date(),
          severity: criticalIssues.length > 0 ? 'high' : 'medium',
          read: false,
          sensors: tempIssues.map(t => t.id)
        });
      }
    }
  }
}

export const monitor = new MonitorService()