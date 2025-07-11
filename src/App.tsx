import React, { useEffect } from 'react'
import { useAppStore } from './lib/stores/appStore'
import { viamService } from './lib/services/viamService'
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
    toggleStoreSelection 
  } = useAppStore()

  useEffect(() => {
    // Initialize stores
    setStores(STORE_CONFIGS.map(store => ({
      ...store,
      status: 'offline' as const,
      fillPercentage: Math.floor(Math.random() * 40) + 60,
      temperature: 3.2 + Math.random() * 2,
      lastUpdate: new Date(Date.now() - Math.random() * 300000),
      alertCount: Math.floor(Math.random() * 3),
      dailyTransactions: Math.floor(Math.random() * 500) + 200
    })))

    // Load saved selections
    try {
      const saved = localStorage.getItem('pret-selected-stores')
      if (saved) {
        const storeIds = JSON.parse(saved)
        storeIds.forEach((id: string) => toggleStoreSelection(id))
      }
    } catch (error) {
      console.warn('Failed to load saved store selections:', error)
    }

    // Cleanup on unmount
    return () => {
      viamService.disconnectAll()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
