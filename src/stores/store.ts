import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORES, Store as StoreConfig } from '@shared/config';
import { push } from '../services/push'

export interface StockRegion {
  id: string
  name: string
  fillLevel: number
  status: 'ok' | 'low' | 'empty'
}

export interface TempSensor {
  id: string
  name: string
  temperature: number
  humidity?: number
  battery?: number
  status: 'normal' | 'warning' | 'critical'
}

export interface Alert {
  id:string
  storeId: string
  storeName: string
  type: 'stock' | 'temperature'
  title: string
  message: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
  read: boolean
  regions?: string[]
  sensors?: { id: string, value: number }[]
  imageUrl?: string
  cvImageUrl?: string
}

type MachineStatus = 'online' | 'offline';

export interface StoreData extends StoreConfig {
  stockStatus: MachineStatus
  tempStatus: MachineStatus
  stockRegions: StockRegion[]
  tempSensors: TempSensor[]
  lastUpdate?: Date
}

type View = 'stores' | 'map' | 'alerts' | 'camera';

interface AppState {
  stores: StoreData[]
  alerts: Alert[]
  currentView: View
  currentStore: StoreData | null
  selectedStores: Set<string>
  alertFilterStoreId: string | null
  notificationSubscriptions: Set<string>

  // Actions
  updateStore: (id: string, data: Partial<Omit<StoreData, 'id'>>) => void
  setCurrentView: (view: View) => void
  setCurrentStore: (store: StoreData | null) => void
  toggleStoreSelection: (id: string) => void
  addAlert: (alert: Alert) => void
  markAlertRead: (id: string) => void
  clearAlerts: () => void
  setAlertFilter: (storeId: string | null) => void
  toggleNotificationSubscription: (storeId: string) => Promise<void>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      stores: STORES.map((store) => ({
        ...store,
        stockStatus: 'offline',
        tempStatus: 'offline',
        stockRegions: [],
        tempSensors: [],
      })),
      alerts: [],
      currentView: 'stores',
      currentStore: null,
      selectedStores: new Set(),
      alertFilterStoreId: null,
      notificationSubscriptions: new Set(),
      
      updateStore: (id, data) => set(state => ({
        stores: state.stores.map(store => 
          store.id === id ? { ...store, ...data, lastUpdate: new Date() } : store
        )
      })),
      
      setCurrentView: (view) => set((state) => {
        const newState: Partial<AppState> = { currentView: view };
        if (state.currentView === 'camera' && view !== 'camera') {
          newState.currentStore = null;
        }
        if (state.currentView === 'alerts' && view !== 'alerts') {
          newState.alertFilterStoreId = null;
        }
        return newState;
      }),

      setCurrentStore: (store) => set({ currentStore: store }),
      
      toggleStoreSelection: (id) => {
        const newSelected = new Set(get().selectedStores);
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        set({ selectedStores: newSelected });
      },
      
      addAlert: (alert) => set(state => ({
        alerts: [alert, ...state.alerts.slice(0, 49)]
      })),
      
      markAlertRead: (id) => set(state => ({
        alerts: state.alerts.map(alert => 
          alert.id === id ? { ...alert, read: true } : alert
        )
      })),

      clearAlerts: () => set({ alerts: [] }),

      setAlertFilter: (storeId) => set({ alertFilterStoreId: storeId, currentView: 'alerts' }),

      toggleNotificationSubscription: async (storeId) => {
        const isSubscribed = get().notificationSubscriptions.has(storeId);
        const newSubscriptions = new Set(get().notificationSubscriptions);

        if (isSubscribed) {
          await push.unsubscribe(storeId);
          newSubscriptions.delete(storeId);
        } else {
          const subscription = await push.subscribe(storeId);
          if (subscription) {
            newSubscriptions.add(storeId);
          }
        }
        
        set({ notificationSubscriptions: newSubscriptions });
      },
    }),
    {
      name: 'pret-monitor-storage', 
      partialize: (state) => ({ 
        alerts: state.alerts,
        notificationSubscriptions: state.notificationSubscriptions,
       }),
       storage: createJSONStorage(() => localStorage, {
        replacer: (key, value) => {
          if (value instanceof Set) {
            return { _type: 'Set', value: Array.from(value) };
          }
          if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value).toISOString();
          }
          return value;
        },
        reviver: (key, value: any) => {
          if (value && value._type === 'Set') {
            return new Set(value.value);
          }
          if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        }
       }),
    }
  )
);

export const unreadCount = () => useStore.getState().alerts.filter(a => !a.read).length;
