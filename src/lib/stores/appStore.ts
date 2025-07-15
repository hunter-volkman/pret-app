import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { StoreLocation, AlertData } from '../types'

interface AppState {
  // Store data
  stores: StoreLocation[]
  selectedStores: Set<string>
  currentStore: StoreLocation | null
  
  // Alerts
  alerts: AlertData[]
  unreadCount: number
  
  // UI state
  currentView: 'stores' | 'alerts' | 'camera'
  isLoading: boolean
  
  // Actions
  setStores: (stores: StoreLocation[]) => void
  updateStore: (storeId: string, updates: Partial<StoreLocation>) => void
  toggleStoreSelection: (storeId: string) => void
  setCurrentStore: (store: StoreLocation | null) => void
  setCurrentView: (view: 'stores' | 'alerts' | 'camera') => void
  addAlert: (alert: AlertData) => void
  markAlertRead: (alertId: string) => void
  markAllAlertsRead: () => void
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    stores: [],
    selectedStores: new Set(),
    currentStore: null,
    alerts: [],
    unreadCount: 0,
    currentView: 'stores',
    isLoading: false,

    // Actions
    setStores: (stores) => set({ stores }),
    
    updateStore: (storeId, updates) => set((state) => ({
      stores: state.stores.map(store => 
        store.id === storeId ? { ...store, ...updates, lastUpdate: new Date() } : store
      )
    })),

    toggleStoreSelection: (storeId) => set((state) => {
      const newSelected = new Set(state.selectedStores)
      if (newSelected.has(storeId)) {
        newSelected.delete(storeId)
      } else {
        newSelected.add(storeId)
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('pret-selected-stores', JSON.stringify([...newSelected]))
      } catch (error) {
        console.warn('Failed to save store selections:', error)
      }
      
      return { selectedStores: newSelected }
    }),

    setCurrentStore: (store) => set({ currentStore: store }),
    setCurrentView: (view) => set({ currentView: view }),

    addAlert: (alert) => set((state) => {
      const newAlerts = [alert, ...state.alerts.slice(0, 49)] // Keep only 50 most recent
      const unreadCount = newAlerts.filter(a => !a.read).length
      return { alerts: newAlerts, unreadCount }
    }),

    markAlertRead: (alertId) => set((state) => {
      const newAlerts = state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
      const unreadCount = newAlerts.filter(a => !a.read).length
      return { alerts: newAlerts, unreadCount }
    }),

    markAllAlertsRead: () => set((state) => {
      const newAlerts = state.alerts.map(alert => ({ ...alert, read: true }))
      return { alerts: newAlerts, unreadCount: 0 }
    }),

    setLoading: (loading) => set({ isLoading: loading })
  }))
)
