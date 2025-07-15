import React from 'react'
import { MapPin, Thermometer, Activity, AlertCircle } from 'lucide-react'
import type { StoreLocation } from '../types'

interface StoreCardProps {
  store: StoreLocation
  isSelected: boolean
  onToggle: () => void
  onClick: () => void
}

const StoreCard: React.FC<StoreCardProps> = ({ store, isSelected, onToggle, onClick }) => {
  const getStatusColor = () => {
    switch (store.status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'connecting': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (store.status) {
      case 'online': return 'Online'
      case 'offline': return 'Offline'
      case 'connecting': return 'Connecting'
      default: return 'Unknown'
    }
  }

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-sm text-gray-500">{getStatusText()}</span>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            {store.address}
          </div>
          
          {store.alertCount && store.alertCount > 0 && (
            <div className="flex items-center space-x-1 text-red-600 mb-3">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{store.alertCount} alerts</span>
            </div>
          )}
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{Math.round(store.fillPercentage || 0)}%</div>
          <div className="text-xs text-gray-500 flex items-center justify-center">
            <Activity className="w-3 h-3 mr-1" />
            Stock Level
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{store.temperature?.toFixed(1)}°C</div>
          <div className="text-xs text-gray-500 flex items-center justify-center">
            <Thermometer className="w-3 h-3 mr-1" />
            Temperature
          </div>
        </div>
      </div>
      
      {store.lastUpdate && (
        <div className="text-xs text-gray-400 mt-3 text-center">
          Last updated {new Date(store.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

export default StoreCard
