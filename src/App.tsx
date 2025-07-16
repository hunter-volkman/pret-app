import React, { useEffect } from 'react'
import { useStore } from './stores/store'
import { monitor } from './services/monitor'
import { IS_DEMO, toggleDemo } from './config/stores'

// Components
import { Header } from './components/Header'
import { StoresView } from './components/StoresView'
import { AlertsView } from './components/AlertsView'
import { CameraView } from './components/CameraView'
import { Navigation } from './components/Navigation'
import { Settings } from 'lucide-react'

function App() {
  const { currentView, selectedStores, stores, toggleStoreSelection } = useStore()
  const [showSettings, setShowSettings] = React.useState(false)
  
  // Auto-select all stores in demo mode for immediate data
  useEffect(() => {
    if (IS_DEMO && selectedStores.size === 0 && stores.length > 0) {
      stores.forEach(store => {
        toggleStoreSelection(store.id)
      })
    }
  }, [stores, selectedStores, toggleStoreSelection])
  
  // Start monitoring when stores are selected
  useEffect(() => {
    if (selectedStores.size > 0) {
      monitor.start(selectedStores)
    } else {
      monitor.stop()
    }
    
    return () => monitor.stop()
  }, [selectedStores])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[200px]">
            <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Demo Mode</span>
              <button
                onClick={toggleDemo}
                className={`px-3 py-1 text-xs rounded-full ${
                  IS_DEMO ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {IS_DEMO ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
        </>
      )}

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