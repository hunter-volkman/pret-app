import React from 'react'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const Header = () => {
  const { stores, unreadCount } = useAppStore()
  
  const onlineStores = stores.filter(store => store.status === 'online').length
  const totalStores = stores.length
  
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pret Monitor</h1>
          <p className="text-sm text-gray-500">Real-time Operations Dashboard</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {onlineStores > 0 ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {onlineStores}/{totalStores} online
            </span>
          </div>
          
          {unreadCount > 0 && (
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">{unreadCount}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
