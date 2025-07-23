import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FusionAuthProvider } from '@fusionauth/react-sdk';
import { IS_AUTH_ENABLED } from './config/auth';
import App from './App';
import './app.css';
import 'leaflet/dist/leaflet.css';

const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!IS_AUTH_ENABLED) {
    return <>{children}</>;
  }

  const clientId = import.meta.env.VITE_VIAM_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new Error("VITE_VIAM_OAUTH_CLIENT_ID is not set in your .env.local file.");
  }

  return (
    <FusionAuthProvider
      serverUrl="https://auth.viam.com"
      clientID={clientId}
      redirectUri={window.location.origin}
    >
      {children}
    </FusionAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProviderWrapper>
        <App />
      </AuthProviderWrapper>
    </BrowserRouter>
  </React.StrictMode>
);
