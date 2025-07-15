import React, { useState, useEffect } from 'react'
import { Camera, RefreshCw, ArrowLeft } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const CameraView = () => {
  const { currentStore, setCurrentStore, setCurrentView } = useAppStore()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const refreshImage = async () => {
    if (!currentStore) return
    
    setLoading(true)
    setError(null)
    
    // Simulate camera loading
    setTimeout(() => {
      setImageUrl(`https://picsum.photos/800/600?random=${Date.now()}`)
      setLoading(false)
    }, 1000)
  }
  
  useEffect(() => {
    if (currentStore) {
      refreshImage()
      const interval = setInterval(refreshImage, 10000)
      return () => clearInterval(interval)
    }
  }, [currentStore])
  
  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Store Selected</h3>
          <p className="text-gray-600">Choose a store to view its camera feed</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('stores')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentStore.name}</h2>
            <p className="text-gray-600">Live Camera Feed</p>
          </div>
        </div>
        
        <button
          onClick={refreshImage}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
              <p>Loading camera feed...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="relative w-full h-full">
            <img 
              src={imageUrl} 
              alt="Live camera feed"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              LIVE
            </div>
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-4" />
              <p>No camera feed available</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {Math.round(currentStore.fillPercentage || 0)}%
          </div>
          <div className="text-sm text-gray-600">Stock Level</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {currentStore.temperature?.toFixed(1)}°C
          </div>
          <div className="text-sm text-gray-600">Temperature</div>
        </div>
      </div>
    </div>
  )
}

export default CameraView
