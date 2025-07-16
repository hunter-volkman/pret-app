import { create } from 'zustand'
import { STORES, IS_DEMO } from '../config/stores'

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

interface Alert {
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
}

interface StoreData {
  id: string
  name: string
  address: string
  status: 'online' | 'offline'
  stockRegions: StockRegion[]
  tempSensors: TempSensor[]
  lastUpdate?: Date
  // ✅ FIX: Add machine IDs to the state interface
  stockMachineId: string
  tempMachineId: string
}

interface AppState {
  stores: StoreData[]
  alerts: Alert[]
  currentView: 'stores' | 'alerts' | 'camera'
  currentStore: StoreData | null
  selectedStores: Set<string>
  
  // Actions
  setStores: (stores: StoreData[]) => void
  updateStore: (id: string, data: Partial<Omit<StoreData, 'id'>>) => void
  setCurrentView: (view: 'stores' | 'alerts' | 'camera') => void
  setCurrentStore: (store: StoreData | null) => void
  toggleStoreSelection: (id: string) => void
  addAlert: (alert: Alert) => void
  markAlertRead: (id: string) => void
}

export const useStore = create<AppState>((set, get) => ({
  stores: STORES.map(store => ({
    id: store.id,
    name: store.name,
    address: store.address,
    status: 'offline',
    stockRegions: [],
    tempSensors: [],
    // ✅ FIX: Initialize state with the machine IDs from config
    stockMachineId: store.stockMachineId,
    tempMachineId: store.tempMachineId
  })),
  alerts: [],
  currentView: 'stores',
  currentStore: null,
  selectedStores: new Set(),
  
  setStores: (stores) => set({ stores }),
  
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
    alerts: [alert, ...state.alerts.slice(0, 49)]
  })),
  
  markAlertRead: (id) => set(state => ({
    alerts: state.alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    )
  }))
}))

export const unreadCount = () => useStore.getState().alerts.filter(a => !a.read).length
