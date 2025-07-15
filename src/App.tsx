import React, { useEffect } from 'react'
import { useAppStore } from './lib/stores/appStore'
import { pushNotificationService } from './lib/services/pushNotificationService'
import { STORE_CONFIGS } from './lib/services/viamConfig'
import Header from './lib/components/Header'
import StoresView from './lib/components/StoresView'
import AlertsView from './lib/components/AlertsView'
import CameraView from './lib/components/CameraView'
import Navigation from './lib/components/Navigation'

function App() {
  const { 
    currentView, 
    setStores, 
    selectedStores, 
    toggleStoreSelection,
    addAlert
  } = useAppStore()

  useEffect(() => {
    // Initialize push notifications
    pushNotificationService.initialize().then(success => {
      if (success) {
        console.log('Push notifications ready')
      }
    })

    // Initialize stores with mock data
    const mockStores = STORE_CONFIGS.map(store => ({
      ...store,
      status: Math.random() > 0.7 ? 'offline' : 'online' as const,
      fillPercentage: Math.floor(Math.random() * 40) + 60,
      temperature: 2 + Math.random() * 4,
      lastUpdate: new Date(Date.now() - Math.random() * 600000),
      alertCount: Math.floor(Math.random() * 3),
      dailyTransactions: Math.floor(Math.random() * 500) + 200
    }))
    
    setStores(mockStores)

    // Add some mock alerts
    const mockAlerts = [
      {
        id: '1',
        storeId: 'store-5th-ave',
        storeName: '5th Avenue',
        type: 'empty_shelf' as const,
        title: 'Low Stock Alert',
        message: 'Sandwich section needs restocking',
        timestamp: new Date(Date.now() - 300000),
        read: false,
        severity: 'high' as const
      },
      {
        id: '2',
        storeId: 'store-times-sq',
        storeName: 'Times Square',
        type: 'temperature' as const,
        title: 'Temperature Warning',
        message: 'Refrigerator temperature above normal',
        timestamp: new Date(Date.now() - 900000),
        read: false,
        severity: 'medium' as const
      }
    ]
    
    mockAlerts.forEach(alert => addAlert(alert))

    // Load saved store selections
    try {
      const saved = localStorage.getItem('pret-selected-stores')
      if (saved) {
        const storeIds = JSON.parse(saved)
        storeIds.forEach((id: string) => toggleStoreSelection(id))
      } else {
        // Select first two stores by default
        mockStores.slice(0, 2).forEach(store => toggleStoreSelection(store.id))
      }
    } catch (error) {
      console.warn('Failed to load saved store selections:', error)
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Simulate random stock level changes
      const selectedStoreIds = Array.from(selectedStores)
      if (selectedStoreIds.length > 0) {
        const randomStoreId = selectedStoreIds[Math.floor(Math.random() * selectedStoreIds.length)]
        const randomLevel = Math.floor(Math.random() * 100)
        
        if (randomLevel < 20) {
          pushNotificationService.sendStockAlert(
            mockStores.find(s => s.id === randomStoreId)?.name || 'Store',
            'Sandwiches',
            randomLevel
          )
        }
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-20">
        {currentView === 'stores' && <StoresView />}
        {currentView === 'alerts' && <AlertsView />}
        {currentView === 'camera' && <CameraView />}
      </main>
      
      <Navigation />
    </div>
  )
}

export default App
