import { IS_AUTH_ENABLED } from '../config/auth';

// PKCE helper functions - RESTORED
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Simple JWT decoder
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

const authChangeEvent = new Event('authChange');

class ViamAuthService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private userInfo: UserInfo | null = null;
  private readonly clientId: string;
  private readonly redirectUri: string;
  private isProcessingCallback = false;
  
  constructor() {
    this.clientId = import.meta.env.VITE_VIAM_OAUTH_CLIENT_ID || '';
    this.redirectUri = window.location.origin;
    this.loadStoredState();
    this.handleOAuthCallback();
  }

  private loadStoredState(): void {
    this.accessToken = localStorage.getItem('viam_access_token');
    const expiry = localStorage.getItem('viam_token_expiry');
    const userStr = localStorage.getItem('viam_user_info');
    
    this.tokenExpiry = expiry ? parseInt(expiry, 10) : null;
    this.userInfo = userStr ? JSON.parse(userStr) : null;
  }

  private storeSession(tokenData: TokenResponse): void {
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

    localStorage.setItem('viam_access_token', this.accessToken);
    localStorage.setItem('viam_token_expiry', this.tokenExpiry.toString());

    if (tokenData.id_token) {
      this.setUserInfoFromIdToken(tokenData.id_token);
    }
  }
  
  private setUserInfoFromIdToken(idToken: string): void {
    const decoded = decodeJwt(idToken);
    if (decoded) {
      this.userInfo = {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        picture: decoded.picture,
      };
      localStorage.setItem('viam_user_info', JSON.stringify(this.userInfo));
      console.log('[Auth] User info decoded and stored:', this.userInfo);
    } else {
      console.error('[Auth] Could not decode ID token.');
    }
  }

  private clearSession(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    
    localStorage.removeItem('viam_access_token');
    localStorage.removeItem('viam_token_expiry');
    localStorage.removeItem('viam_user_info');
  }

  private async handleOAuthCallback(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      this.isProcessingCallback = true;
      window.dispatchEvent(authChangeEvent);

      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('code_verifier');
      
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (state === storedState && codeVerifier) {
        try {
          await this.exchangeCodeForToken(code, codeVerifier);
        } catch (error) {
          console.error('❌ Token exchange failed:', error);
          this.clearSession();
        }
      } else {
        console.error('❌ Invalid OAuth state or missing code verifier');
      }
      
      this.isProcessingCallback = false;
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('code_verifier');
      window.dispatchEvent(authChangeEvent);
    }
  }

  public async login(): Promise<void> {
    if (!IS_AUTH_ENABLED) return;

    if (!this.clientId) throw new Error('Viam OAuth not configured.');

    this.clearSession();

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier();

    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const authUrl = new URL('https://auth.viam.com/oauth2/authorize');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', 'offline_access openid');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    window.location.href = authUrl.toString();
  }

  public async logout(): Promise<void> {
    this.clearSession();
    window.dispatchEvent(authChangeEvent);
    window.location.href = window.location.origin;
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<void> {
    const response = await fetch('/api/oauth-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, codeVerifier, redirectUri: this.redirectUri }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${response.status} ${errorData.error}`);
    }
    
    const tokenData: TokenResponse = await response.json();
    this.storeSession(tokenData);
  }

  public async getAccessToken(): Promise<string | null> {
    if (!IS_AUTH_ENABLED) return 'mock-token';
    if (this.isTokenExpired()) {
        this.clearSession();
        window.dispatchEvent(authChangeEvent);
        return null;
    }
    return this.accessToken;
  }

  public isAuthenticated(): boolean {
    if (!IS_AUTH_ENABLED) return true;
    return !this.isTokenExpired() && !!this.accessToken;
  }

  public isAuthenticating(): boolean {
      return this.isProcessingCallback;
  }

  private isTokenExpired(): boolean {
    return !this.tokenExpiry || Date.now() > (this.tokenExpiry - 60000);
  }

  public getUserInfo(): UserInfo | null {
    return this.userInfo;
  }
}

export const auth = new ViamAuthService();
