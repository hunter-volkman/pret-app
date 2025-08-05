import { viam } from './viam';
import { useStore } from '../stores/store';
import { STORES } from '@shared/config';

const CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds
const CONCURRENT_CHECKS = 2; // Check 2 machines at a time
const FAILURE_THRESHOLD = 3; // Mark as offline after 3 consecutive failures

class HealthCheckService {
  private periodicCheckInterval: NodeJS.Timeout | null = null;
  private checkQueue: string[] = [];
  private activeChecks = 0;
  private failureCounts = new Map<string, number>();

  public start(): void {
    console.log('🩺 [HealthService] Starting with smart retries...');
    this.stop(); // Ensure no existing intervals are running

    // Immediately queue checks for all stores on startup
    this.queueAllStoreChecks();

    // Set up periodic checks
    this.periodicCheckInterval = setInterval(() => {
      this.queueAllStoreChecks();
    }, CHECK_INTERVAL_MS);
  }

  public stop(): void {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
      this.failureCounts.clear();
      console.log('🛑 [HealthService] Stopped.');
    }
  }

  public queueImmediateCheckForStores(storeIds: string[]): void {
    console.log(`🩺 [HealthService] Queuing immediate check for ${storeIds.length} store(s).`);
    const machineIds = storeIds.flatMap(id => {
      const store = STORES.find(s => s.id === id);
      return store ? [store.stockMachineId, store.tempMachineId] : [];
    });
    // Add to the front of the queue for priority
    this.checkQueue.unshift(...machineIds);
    this.processQueue();
  }

  private queueAllStoreChecks(): void {
    console.log('🩺 [HealthService] Queuing periodic health check for all stores.');
    const allMachineIds = STORES.flatMap(s => [s.stockMachineId, s.tempMachineId]);
    // Add to the end of the queue
    this.checkQueue.push(...allMachineIds);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.activeChecks < CONCURRENT_CHECKS && this.checkQueue.length > 0) {
      this.activeChecks++;
      const machineId = this.checkQueue.shift()!;
      
      // Fire and forget, let the check run in the background
      this.runCheck(machineId).finally(() => {
        this.activeChecks--;
        // Check if more items can be processed
        this.processQueue();
      });
    }
  }

  private async runCheck(machineId: string): Promise<void> {
    const status = await viam.pingMachine(machineId);
    
    const store = STORES.find(s => s.stockMachineId === machineId || s.tempMachineId === machineId);
    if (!store) return;
    const machineType = store.stockMachineId === machineId ? 'Stock' : 'Temp';
    
    if (status === 'online') {
      this.handleOnline(store.id, machineType, machineId);
    } else {
      this.handleOffline(store.id, machineType, machineId);
    }
  }

  private handleOnline(storeId: string, machineType: 'Stock' | 'Temp', machineId: string) {
    this.failureCounts.set(machineId, 0); // Reset failure count on success
    
    const storeKey = machineType === 'Stock' ? 'stockStatus' : 'tempStatus';
    const currentStatus = useStore.getState().stores.find(s => s.id === storeId)?.[storeKey];

    if (currentStatus !== 'online') {
      useStore.getState().updateStore(storeId, { [storeKey]: 'online' });
      const storeName = STORES.find(s => s.id === storeId)?.name;
      console.log(`✅ [HealthService] ${storeName} ${machineType} status updated to: ONLINE`);
    }
  }
  
  private handleOffline(storeId: string, machineType: 'Stock' | 'Temp', machineId: string) {
    const currentFailures = (this.failureCounts.get(machineId) || 0) + 1;
    this.failureCounts.set(machineId, currentFailures);

    const storeName = STORES.find(s => s.id === storeId)?.name;

    if (currentFailures >= FAILURE_THRESHOLD) {
      // We've hit the threshold, mark as offline
      const storeKey = machineType === 'Stock' ? 'stockStatus' : 'tempStatus';
      const currentStatus = useStore.getState().stores.find(s => s.id === storeId)?.[storeKey];

      if (currentStatus !== 'offline') {
        useStore.getState().updateStore(storeId, { [storeKey]: 'offline' });
        console.log(`❌ [HealthService] ${storeName} ${machineType} marked OFFLINE after ${currentFailures} failed attempts.`);
      }
    } else {
      // It failed, but we're not at the threshold yet. Log it and requeue for a quick retry.
      console.log(`🟡 [HealthService] ${storeName} ${machineType} check failed (${currentFailures}/${FAILURE_THRESHOLD}). Retrying...`);
      // Re-queue for a quick check.
      this.checkQueue.unshift(machineId);
    }
  }
}

export const healthService = new HealthCheckService();
