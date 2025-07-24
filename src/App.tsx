import React, { useEffect } from 'react';
import { useStore } from './stores/store';
import { monitor } from './services/monitor';
import { push } from './services/push';
import { auth } from './services/auth';
import { IS_DEMO, toggleDemo } from './config/stores';
import { IS_AUTH_ENABLED } from './config/auth';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Settings, Loader2, LogOut, User, Shield } from 'lucide-react';
import { StoresView } from './views/StoresView';
import { MapView } from './views/MapView';
import { AlertsView } from './views/AlertsView';
import { CameraView } from './views/CameraView';

function LoginScreen() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await auth.login();
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-white/20">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg">
          <span className="text-white font-black text-2xl">P</span>
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Pret Monitor
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Real-time Fleet Operations Dashboard
        </p>
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center space-x-3 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Shield className="w-6 h-6" />
          )}
          <span className="text-lg">
            {isLoading ? 'Connecting...' : 'Sign In with Viam'}
          </span>
        </button>
        
        {!IS_AUTH_ENABLED && (
          <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl">
            <p className="text-sm text-yellow-800 font-bold">⚡ Development Mode ⚡</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MainAppContent() {
  const { currentView, selectedStores, stores, toggleStoreSelection } = useStore();
  const [showSettings, setShowSettings] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(auth.getUserInfo());

  // Update user info when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      const info = auth.getUserInfo();
      if (JSON.stringify(info) !== JSON.stringify(userInfo)) {
        setUserInfo(info);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [userInfo]);

  useEffect(() => {
    push.initialize();
  }, []);

  useEffect(() => {
    if (IS_DEMO && selectedStores.size === 0 && stores.length > 0) {
      stores.forEach(store => toggleStoreSelection(store.id));
    }
  }, [stores, selectedStores, toggleStoreSelection]);

  useEffect(() => {
    if (selectedStores.size > 0) {
      monitor.start(selectedStores);
    } else {
      monitor.stop();
    }
    return () => monitor.stop();
  }, [selectedStores]);

  const handleLogout = async () => {
    setShowSettings(false);
    await auth.logout();
  };

  const getUserDisplayName = () => {
    if (!userInfo) return 'User';
    return userInfo.given_name || 
           userInfo.email?.split('@')[0] || 
           'User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-3">
        {IS_AUTH_ENABLED && userInfo && (
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2 shadow-lg flex items-center space-x-3 hover:bg-white transition-all duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">
                {getUserDisplayName()}
              </div>
              <div className="text-xs text-gray-500">
                {userInfo.email}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group"
        >
          <Settings className="w-5 h-5 text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
      
      {showSettings && (
        <>
          <div className="fixed top-20 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6 z-50 min-w-[280px] space-y-4 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-sm font-medium text-gray-700">Demo Mode</span>
                  <p className="text-xs text-gray-500">Auto-select all stores</p>
                </div>
                <button
                  onClick={toggleDemo}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    IS_DEMO 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {IS_DEMO ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-sm font-medium text-gray-700">Authentication</span>
                  <p className="text-xs text-gray-500">OAuth security status</p>
                </div>
                <span className={`px-4 py-2 text-xs font-bold rounded-lg ${
                  IS_AUTH_ENABLED 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {IS_AUTH_ENABLED ? 'SECURED' : 'DEV MODE'}
                </span>
              </div>
              
              {IS_AUTH_ENABLED && (
                <>
                  <div className="border-t border-gray-200 my-4" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 p-3 rounded-xl transition-all duration-200 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
            onClick={() => setShowSettings(false)} 
          />
        </>
      )}

      <main className="pb-24">
        {currentView === 'stores' && <StoresView />}
        {currentView === 'map' && <MapView />}
        {currentView === 'alerts' && <AlertsView />}
        {currentView === 'camera' && <CameraView />}
      </main>

      <Navigation />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Simple, clean auth check
    const checkAuth = () => {
      const authenticated = auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    // Check immediately
    checkAuth();
    
    // Then check periodically
    const interval = setInterval(checkAuth, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pret Monitor</h2>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <MainAppContent /> : <LoginScreen />;
}

export default App;
