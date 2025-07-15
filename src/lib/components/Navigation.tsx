import React from 'react'
import { Home, Bell, Camera } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const Navigation = () => {
  const { currentView, setCurrentView, unreadCount } = useAppStore()
  
  const navItems = [
    { id: 'stores' as const, icon: Home, label: 'Stores' },
    { id: 'alerts' as const, icon: Bell, label: 'Alerts', badge: unreadCount },
    { id: 'camera' as const, icon: Camera, label: 'Camera' },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = currentView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default Navigation
