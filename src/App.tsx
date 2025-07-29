import { useEffect, useState } from 'react';
import { useStore } from './stores/store';
import { monitor } from './services/monitor';
import { push } from './services/push';
import { auth, UserInfo } from './services/auth';
import { IS_DEMO } from './config/stores';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Loader2, Shield } from 'lucide-react';
import { StoresView } from './views/StoresView';
import { MapView } from './views/MapView';
import { AlertsView } from './views/AlertsView';
import { CameraView } from './views/CameraView';

function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="flex flex-col min-h-dvh bg-gray-50 text-gray-800 p-8 justify-between">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <img src="/login.png" alt="Pret A Manger Logo" className="w-56 sm:w-64 mb-6" />
        <p className="text-gray-500 text-lg mb-10">
          Real-time Fleet Operations Dashboard
        </p>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full max-w-sm bg-pret-maroon text-white font-semibold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Shield className="w-5 h-5" />
          )}
          <span className="text-lg">
            {isLoading ? 'Connecting...' : 'Login'}
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-xs flex-shrink-0">
        <img src="/powered-by-viam.png" alt="Powered by Viam" className="h-4 w-auto mx-auto mb-2 opacity-50" />
        <p>By using this app, you agree to our Privacy Policy.</p>
        <p className="mt-1">Version 1.0.0</p>
      </div>
    </div>
  );
}

function MainAppContent() {
  const { currentView, selectedStores, stores, toggleStoreSelection } = useStore();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(auth.getUserInfo());

  // Update user info when auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setUserInfo(auth.getUserInfo());
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

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
    await auth.logout();
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      <Header userInfo={userInfo} onLogout={handleLogout} />
      
      <main className="flex-1 overflow-y-auto">
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
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    authenticated: auth.isAuthenticated(),
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthStatus({
        loading: auth.isAuthenticating(),
        authenticated: auth.isAuthenticated(),
      });
    };

    // Listen for our custom auth event
    window.addEventListener('authChange', handleAuthChange);

    // Initial check
    handleAuthChange();

    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  if (authStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="flex items-center space-x-3 text-gray-700">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-medium">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  return authStatus.authenticated ? <MainAppContent /> : <LoginScreen />;
}

export default App;