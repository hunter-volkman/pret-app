import { useState } from 'react';
import { Bell, Wifi, WifiOff, Settings, LogOut, User } from 'lucide-react';
import { useStore, unreadCount } from '../stores/store';
import { UserInfo } from '../services/auth';
import { IS_DEMO, toggleDemo } from '../config/stores';
import { IS_AUTH_ENABLED } from '../config/auth';

interface HeaderProps {
  userInfo: UserInfo | null;
  onLogout: () => Promise<void>;
}

export function Header({ userInfo, onLogout }: HeaderProps) {
  const { stores } = useStore();
  const alertCount = unreadCount();
  const [showSettings, setShowSettings] = useState(false);

  const onlineStores = stores.filter(store => store.status === 'online').length;

  const handleLogout = async () => {
    setShowSettings(false);
    await onLogout();
  };

  const getUserDisplayName = () => {
    if (!userInfo) return 'User';
    return userInfo.given_name || userInfo.name?.split(' ')[0] || userInfo.email?.split('@')[0] || 'User';
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left Side: Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pret Monitor</h1>
          <p className="text-xs sm:text-sm text-gray-500">Real-time Operations Dashboard</p>
        </div>
        
        {/* Right Side: All Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Online Stores Count */}
          <div className="hidden md:flex items-center space-x-2">
            {onlineStores > 0 ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {onlineStores}/{stores.length} online
            </span>
          </div>
          
          {/* Alerts Count Badge */}
          {alertCount > 0 && (
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">{alertCount}</span>
            </div>
          )}

          {/* User Info & Settings Button */}
          {IS_AUTH_ENABLED && userInfo && (
             <div className="flex items-center space-x-2">
                <div className="bg-white border border-gray-200 rounded-full p-1 pl-2 flex items-center space-x-2">
                    {userInfo.picture ? (
                       <img src={userInfo.picture} alt="User" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-sm hidden sm:block">
                      <div className="font-semibold text-gray-900 leading-tight">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500 leading-tight">
                        {userInfo.email}
                      </div>
                    </div>
                </div>

                {/* Settings Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors group"
                  >
                    <Settings className="w-5 h-5 text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                  {showSettings && (
                    <>
                      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50 min-w-[280px] space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <h3 className="font-bold text-gray-800 text-base">Settings</h3>
                        
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Demo Mode</span>
                            <p className="text-xs text-gray-500">Auto-select all stores</p>
                          </div>
                          <button
                            onClick={toggleDemo}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 ${
                              IS_DEMO 
                                ? 'bg-blue-500 text-white shadow' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {IS_DEMO ? 'ON' : 'OFF'}
                          </button>
                        </div>
                        
                        <div className="border-t border-gray-200 !my-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSettings(false)} 
                      />
                    </>
                  )}
                </div>
             </div>
          )}
        </div>
      </div>
    </header>
  )
}