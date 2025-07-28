import { Home, Bell, Camera, Map } from 'lucide-react'
import { useStore, unreadCount } from '../stores/store'

export function Navigation() {
  const { currentView, setCurrentView } = useStore()
  const alertCount = unreadCount()
  
  return (
    <nav className="bg-white border-t border-gray-200 px-4 py-3 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {[
          { id: 'stores', icon: Home, label: 'Stores' },
          { id: 'map', icon: Map, label: 'Map' },
          { id: 'alerts', icon: Bell, label: 'Alerts', badge: alertCount },
          { id: 'camera', icon: Camera, label: 'Camera' }
        ].map(item => {
          const Icon = item.icon
          const isActive = currentView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors w-20 ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
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