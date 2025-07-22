import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORES } from '../config/stores'
import { Store as StoreConfig } from '../config/stores'
import { push } from '../services/push'

// Data shape for a computer vision stock detection region
interface StockRegion {
  id: string
  name: string
  fillLevel: number
  status: 'ok' | 'low' | 'empty'
}

// Data shape for an IoT temperature sensor reading
interface TempSensor {
  id: string
  name: string
  temperature: number
  humidity?: number
  battery?: number
  status: 'normal' | 'warning' | 'critical'
}

// Data shape for a system-generated alert
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
  sensors?: string[]
  imageUrl?: string
  cvImageUrl?: string
}

// The main data type for a store in our app state.
export interface StoreData extends StoreConfig {
  status: 'online' | 'offline'
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
  /** A set of store IDs the user is subscribed to for push notifications. */
  notificationSubscriptions: Set<string>

  // Actions
  updateStore: (id: string, data: Partial<Omit<StoreData, 'id'>>) => void
  setCurrentView: (view: View) => void
  setCurrentStore: (store: StoreData | null) => void
  toggleStoreSelection: (id: string) => void
  addAlert: (alert: Alert) => void
  markAlertRead: (id: string) => void
  setAlertFilter: (storeId: string | null) => void
  /** Toggles a user's push notification subscription for a specific store. */
  toggleNotificationSubscription: (storeId: string) => Promise<void>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      stores: STORES.map(store => ({
        ...store,
        status: 'offline',
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
        if (state.currentView === 'alerts' && view !== 'alerts') {
          return { currentView: view, alertFilterStoreId: null };
        }
        return { currentView: view };
      }),

      setCurrentStore: (store) => set({ currentStore: store }),
      
      toggleStoreSelection: (id) => set(state => {
        const newSelected = new Set(state.selectedStores);
        newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
        return { selectedStores: newSelected };
      }),
      
      addAlert: (alert) => set(state => ({
        alerts: [alert, ...state.alerts.slice(0, 49)]
      })),
      
      markAlertRead: (id) => set(state => ({
        alerts: state.alerts.map(alert => 
          alert.id === id ? { ...alert, read: true } : alert
        )
      })),

      setAlertFilter: (storeId) => set({ alertFilterStoreId: storeId, currentView: 'alerts' }),

      toggleNotificationSubscription: async (storeId) => {
        const isSubscribed = get().notificationSubscriptions.has(storeId);
        const newSubscriptions = new Set(get().notificationSubscriptions);

        if (isSubscribed) {
          await push.unsubscribe(storeId);
          newSubscriptions.delete(storeId);
          console.log('UI: Unsubscribed from', storeId);
        } else {
          const subscription = await push.subscribe(storeId);
          if (subscription) { // Only update UI if subscription was successful
            newSubscriptions.add(storeId);
            console.log('UI: Subscribed to', storeId);
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
        reviver: (key, value) => {
          if (key === 'notificationSubscriptions' && Array.isArray(value)) {
            return new Set(value);
          }
          if (typeof value === 'object' && value !== null && value._type === 'Set') {
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
