import React, { useEffect } from 'react';
import { useStore } from './stores/store';
import { monitor } from './services/monitor';
import { push } from './services/push';
import { IS_DEMO, toggleDemo } from './config/stores';
import { IS_AUTH_ENABLED } from './config/auth';
import { useFusionAuth } from '@fusionauth/react-sdk';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Settings, LogIn, Loader2, LogOut } from 'lucide-react';
import { StoresView } from './views/StoresView';
import { MapView } from './views/MapView';
import { AlertsView } from './views/AlertsView';
import { CameraView } from './views/CameraView';

const useMockAuth = () => ({
  isAuthenticated: true,
  isLoading: false,
  logout: () => console.log("Logout clicked in mock mode."),
  login: () => console.log("Login clicked in mock mode."),
});

function LoginScreen() {
  const { login } = useFusionAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900">Pret Monitor</h1>
        <p className="text-lg text-gray-600 mt-2 mb-8">
          Real-time Operations Dashboard. Please sign in to continue.
        </p>
        <button
          onClick={() => login()}
          className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In</span>
        </button>
      </div>
      <footer className="absolute bottom-4 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Pret A Manger. All rights reserved.
      </footer>
    </div>
  );
}

function MainAppContent() {
  const { logout } = IS_AUTH_ENABLED ? useFusionAuth() : useMockAuth();
  const { currentView, selectedStores, stores, toggleStoreSelection } = useStore();
  const [showSettings, setShowSettings] = React.useState(false);

  useEffect(() => {
    // Initialize the push service once when the app loads
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {showSettings && (
        <>
          <div className="fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[220px] space-y-3">
            <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Demo Mode</span>
              <button
                onClick={toggleDemo}
                className={`px-3 py-1 text-xs rounded-full ${IS_DEMO ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {IS_DEMO ? 'ON' : 'OFF'}
              </button>
            </div>
            {IS_AUTH_ENABLED && (
              <>
                <div className="border-t border-gray-200 -mx-4 my-2" />
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center space-x-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
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
  if (!IS_AUTH_ENABLED) {
    return <MainAppContent />;
  }

  const { isAuthenticated, isLoading } = useFusionAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  return <MainAppContent />;
}

export default App;
