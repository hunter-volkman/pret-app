import { create } from 'zustand'
import { STORES } from '../config/stores'
import { Store as StoreConfig } from '../config/stores'

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
// Extends the base configuration to include dynamic, real-time data.
export interface StoreData extends StoreConfig {
  status: 'online' | 'offline'
  stockRegions: StockRegion[]
  tempSensors: TempSensor[]
  lastUpdate?: Date
}

type View = 'stores' | 'map' | 'alerts' | 'camera';

// The complete shape of our application's state managed by Zustand
interface AppState {
  stores: StoreData[]
  alerts: Alert[]
  currentView: View
  currentStore: StoreData | null
  selectedStores: Set<string>
  /** A store ID used to filter the alerts view, typically set from the map. */
  alertFilterStoreId: string | null 
  
  // Actions to modify the state
  updateStore: (id: string, data: Partial<Omit<StoreData, 'id'>>) => void
  setCurrentView: (view: View) => void
  setCurrentStore: (store: StoreData | null) => void
  toggleStoreSelection: (id: string) => void
  addAlert: (alert: Alert) => void
  markAlertRead: (id: string) => void
  /** Sets a global filter for the alerts view and navigates to it. */
  setAlertFilter: (storeId: string | null) => void
}

export const useStore = create<AppState>((set) => ({
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
  
  updateStore: (id, data) => set(state => ({
    stores: state.stores.map(store => 
      store.id === id ? { ...store, ...data, lastUpdate: new Date() } : store
    )
  })),
  
  setCurrentView: (view) => set((state) => {
    // When navigating away from the alerts view, automatically clear the store filter
    if (state.currentView === 'alerts' && view !== 'alerts') {
      return { currentView: view, alertFilterStoreId: null };
    }
    return { currentView: view };
  }),

  setCurrentStore: (store) => set({ currentStore: store }),
  
  toggleStoreSelection: (id) => set(state => {
    const newSelected = new Set(state.selectedStores)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    return { selectedStores: newSelected }
  }),
  
  addAlert: (alert) => set(state => ({
    // Prepend new alerts and cap the list at 50 to prevent memory issues
    alerts: [alert, ...state.alerts.slice(0, 49)]
  })),
  
  markAlertRead: (id) => set(state => ({
    alerts: state.alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    )
  })),

  setAlertFilter: (storeId) => set({ alertFilterStoreId: storeId, currentView: 'alerts' }),
}))

// A selector to compute the number of unread alerts for badging
export const unreadCount = () => useStore.getState().alerts.filter(a => !a.read).length
