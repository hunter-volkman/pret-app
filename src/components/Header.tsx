import { useState } from 'react';
import { Wifi, WifiOff, Settings, LogOut, User, Send, Trash2 } from 'lucide-react';
import { useStore } from '../stores/store';
import { UserInfo } from '../services/auth';
import { IS_AUTH_ENABLED } from '../config/auth';

interface HeaderProps {
  userInfo: UserInfo | null;
  onLogout: () => Promise<void>;
}

export function Header({ userInfo, onLogout }: HeaderProps) {
  const { stores, notificationSubscriptions, clearAlerts } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  const onlineStores = stores.filter(store => store.stockStatus === 'online' || store.tempStatus === 'online').length;

  const handleLogout = async () => {
    setShowSettings(false);
    await onLogout();
  };
  
  const handleClearAlerts = () => {
    if (confirm('Are you sure you want to clear all alerts? This cannot be undone.')) {
      clearAlerts();
    }
    setShowSettings(false);
  }

  const handleSendTestNotification = async () => {
    const subscribedStoreId = Array.from(notificationSubscriptions)[0] as string | undefined;
    if (!subscribedStoreId) {
      alert("Please subscribe to a store's notifications to send a test.");
      return;
    }

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: subscribedStoreId,
          title: '🔔 Test Notification',
          message: `This is a test alert for one of your subscribed stores.`
        }),
      });
      if (response.ok) {
        alert("Test notification sent successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to send test notification: ${errorData.error || 'Unknown Error'}`);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('An error occurred while sending the test notification.');
    }
    setShowSettings(false);
  };

  const getUserDisplayName = () => {
    if (!userInfo) return 'User';
    return userInfo.given_name || userInfo.name?.split(' ')[0] || userInfo.email?.split('@')[0] || 'User';
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pret Monitor</h1>
          <p className="text-xs sm:text-sm text-gray-500">Real-time Operations Dashboard</p>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2">
            {onlineStores > 0 ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <span className="text-sm font-medium text-gray-700">
              {onlineStores}/{stores.length}
              <span className="hidden sm:inline"> online</span>
            </span>
          </div>

          {IS_AUTH_ENABLED && userInfo && (
              <div className="flex items-center space-x-2">
                <div className="bg-white border border-gray-200 rounded-full p-1 pl-3 pr-2 flex items-center space-x-3">
                    <div className="text-sm text-right">
                      <div className="font-semibold text-gray-900 leading-tight truncate">{getUserDisplayName()}</div>
                      <div className="text-xs text-gray-500 leading-tight truncate hidden sm:block">{userInfo.email}</div>
                    </div>
                    {userInfo.picture ? (
                        <img src={userInfo.picture} alt="User" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                </div>

                <div className="relative">
                  <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors group">
                    <Settings className="w-5 h-5 text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                  {showSettings && (
                    <>
                      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50 min-w-[280px] space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <h3 className="font-bold text-gray-800 text-base">Settings</h3>
                        
                        <button onClick={handleSendTestNotification} className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-xl transition-colors font-medium">
                          <Send className="w-4 h-4" />
                          <span>Send Test Notification</span>
                        </button>
                        
                        <button onClick={handleClearAlerts} className="w-full flex items-center justify-center space-x-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 p-2 rounded-xl transition-colors font-medium">
                          <Trash2 className="w-4 h-4" />
                          <span>Clear All Alerts</span>
                        </button>

                        <div className="border-t border-gray-200 !my-2" />
                        <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors font-medium">
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
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
