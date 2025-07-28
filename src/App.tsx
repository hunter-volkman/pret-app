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
    <div className="h-dvh flex flex-col bg-gray-50">
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pret Monitor</h2>
          <p className="text-gray-600">Finalizing Authentication...</p>
        </div>
      </div>
    );
  }

  return authStatus.authenticated ? <MainAppContent /> : <LoginScreen />;
}

export default App;