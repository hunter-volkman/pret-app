import { create } from 'zustand'
import { STORES } from '../config/stores'
import { Store as StoreConfig } from '../config/stores'

// Reusable interfaces for data shapes
interface StockRegion {
  id: string
  name: string
  fillLevel: number
  status: 'ok' | 'low' | 'empty'
}

interface TempSensor {
  id: string
  name: string
  temperature: number
  humidity?: number
  battery?: number
  status: 'normal' | 'warning' | 'critical'
}

export interface Alert {
  id: string
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

// ✅ CHANGE: The main data type for a store in our app state.
// It extends the base configuration, inheriting id, name, address, coords, and machine IDs.
export interface StoreData extends StoreConfig {
  status: 'online' | 'offline'
  stockRegions: StockRegion[]
  tempSensors: TempSensor[]
  lastUpdate?: Date
}

// ✅ CHANGE: Add 'map' as a possible view for navigation.
type View = 'stores' | 'map' | 'alerts' | 'camera';

// The complete shape of our application's state
interface AppState {
  stores: StoreData[]
  alerts: Alert[]
  currentView: View
  currentStore: StoreData | null
  selectedStores: Set<string>
  
  // Actions to modify the state
  updateStore: (id: string, data: Partial<Omit<StoreData, 'id'>>) => void
  setCurrentView: (view: View) => void
  setCurrentStore: (store: StoreData | null) => void
  toggleStoreSelection: (id: string) => void
  addAlert: (alert: Alert) => void
  markAlertRead: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  // ✅ CHANGE: Initialize the stores state using the spread operator.
  // This is more robust and automatically includes all properties from STORES config.
  stores: STORES.map(store => ({
    ...store, // Copies id, name, address, coords, stockMachineId, tempMachineId
    status: 'offline', // Adds the initial dynamic state
    stockRegions: [],
    tempSensors: [],
  })),
  alerts: [],
  currentView: 'stores',
  currentStore: null,
  selectedStores: new Set(),
  
  updateStore: (id, data) => set(state => ({
    stores: state.stores.map(store => 
      store.id === id ? { ...store, ...data, lastUpdate: new Date() } : store
    )
  })),
  
  setCurrentView: (view) => set({ currentView: view }),
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
    // Keep the alerts list from growing indefinitely, cap at 50
    alerts: [alert, ...state.alerts.slice(0, 49)]
  })),
  
  markAlertRead: (id) => set(state => ({
    alerts: state.alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    )
  }))
}))

// A selector to compute the number of unread alerts
export const unreadCount = () => useStore.getState().alerts.filter(a => !a.read).length
