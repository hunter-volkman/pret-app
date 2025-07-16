import React, { useState, useEffect } from 'react'
import { Camera, RefreshCw, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../stores/store'
import { viam } from '../services/viam'
import { IS_DEMO } from '../config/stores'

export function CameraView() {
  const { currentStore, setCurrentView, stores, setCurrentStore } = useStore()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showCV, setShowCV] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const refreshImage = async () => {
    if (!currentStore) return
    
    // Only show the main loading spinner on the first load
    if (!imageUrl) {
      setLoading(true)
    }
    
    if (IS_DEMO) {
      setTimeout(() => {
        setImageUrl(`https://picsum.photos/800/600?random=${Date.now()}`)
        setLoading(false)
      }, 1000)
    } else {
      const url = await viam.getCameraImage(currentStore.stockMachineId, showCV)
      setImageUrl(url)
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (currentStore) {
      refreshImage()
      // ✅ FIX: Refresh image every second for a near-live feed
      const interval = setInterval(refreshImage, 1000)
      return () => clearInterval(interval)
    }
  }, [currentStore, showCV])
  
  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Store Selected</h3>
          <p className="text-gray-600 mb-6">Choose a store to view its camera feed</p>
          
          <div className="space-y-2 max-w-sm mx-auto">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => {
                  setCurrentStore(store)
                  setCurrentView('camera')
                }}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">{store.name}</div>
                <div className="text-sm text-gray-500">{store.address}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => setCurrentView('stores')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentStore.name}</h2>
            <p className="text-gray-600">Live Camera Feed</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowCV(!showCV)} className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${ showCV ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
            {showCV ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{showCV ? 'CV Overlay' : 'Raw Feed'}</span>
          </button>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
              <p>Loading camera feed...</p>
            </div>
          </div>
        )}
        {!loading && imageUrl && (
           <img src={imageUrl} alt="Live feed" className="w-full h-full object-cover" />
        )}
         {!loading && !imageUrl && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-4" />
              <p>No camera feed available or connection failed.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}