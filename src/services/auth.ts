import { IS_AUTH_ENABLED } from '../config/auth';

// PKCE helper functions
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

// Custom event to notify the app of auth changes
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
    
    // This needs to run on initialization to handle the OAuth redirect
    this.handleOAuthCallback();
  }

  private loadStoredState(): void {
    this.accessToken = localStorage.getItem('viam_access_token');
    const expiry = localStorage.getItem('viam_token_expiry');
    const userStr = localStorage.getItem('viam_user_info');
    
    this.tokenExpiry = expiry ? parseInt(expiry, 10) : null;
    this.userInfo = userStr ? JSON.parse(userStr) : null;
  }

  private async storeSession(tokenData: TokenResponse): Promise<void> {
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

    localStorage.setItem('viam_access_token', this.accessToken);
    localStorage.setItem('viam_token_expiry', this.tokenExpiry.toString());

    // Immediately fetch the real user info
    await this.fetchUserInfo();
  }

  private clearSession(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    
    localStorage.removeItem('viam_access_token');
    localStorage.removeItem('viam_token_expiry');
    localStorage.removeItem('viam_user_info');
  }
  
  private async fetchUserInfo(): Promise<void> {
    if (!this.accessToken) {
      console.error('Cannot fetch user info without an access token.');
      return;
    }
    try {
      const response = await fetch('https://auth.viam.com/oauth2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo: UserInfo = await response.json();
      this.userInfo = userInfo;
      localStorage.setItem('viam_user_info', JSON.stringify(this.userInfo));
      console.log('[Auth] User info fetched and stored:', userInfo);
    } catch (error) {
      console.error('❌ Error fetching user info:', error);
      // If user info fails, it might mean the token is bad, so log out.
      this.logout();
    }
  }

  private async handleOAuthCallback(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      this.isProcessingCallback = true;
      window.dispatchEvent(authChangeEvent); // Notify app we are loading

      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('code_verifier');
      
      // Clean URL immediately for better UX
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (state === storedState && codeVerifier) {
        try {
          console.log('🔄 Processing OAuth callback...');
          await this.exchangeCodeForToken(code, codeVerifier);
          console.log('✅ Successfully authenticated with Viam');
        } catch (error) {
          console.error('❌ Token exchange failed:', error);
          this.clearSession(); // Ensure we are logged out on failure
        }
      } else {
        console.error('❌ Invalid OAuth state or missing code verifier');
      }
      
      this.isProcessingCallback = false;
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('code_verifier');
      window.dispatchEvent(authChangeEvent); // Notify app that processing is done
    }
  }

  public async login(): Promise<void> {
    if (!IS_AUTH_ENABLED) {
      console.log('🔓 Auth disabled - skipping login');
      return;
    }

    if (!this.clientId) {
      throw new Error('Viam OAuth not configured. Missing VITE_VIAM_OAUTH_CLIENT_ID');
    }

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
    // Request 'openid' and 'email' scopes to get user info
    authUrl.searchParams.set('scope', 'offline_access openid email profile');
    authUrl.search_params.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    console.log('🚀 Redirecting to Viam OAuth login...');
    window.location.href = authUrl.toString();
  }

  public async logout(): Promise<void> {
    console.log('🚪 Logging out...');
    this.clearSession();
    window.dispatchEvent(authChangeEvent);
    // Optional: Could redirect to Viam's logout endpoint for full single-sign-out
    // window.location.href = `https://auth.viam.com/oauth2/logout?client_id=${this.clientId}`;
    // For now, a local logout is sufficient.
    window.location.href = window.location.origin;
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<void> {
    const response = await fetch('/api/oauth-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri: this.redirectUri,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${response.status} ${errorData.error}`);
    }
    
    const tokenData: TokenResponse = await response.json();
    await this.storeSession(tokenData);
  }

  public async getAccessToken(): Promise<string | null> {
    if (!IS_AUTH_ENABLED) {
      return 'mock-token';
    }

    if (this.isTokenExpired()) {
        console.log('🔄 Token expired or missing. User is logged out.');
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
    // Check if token is expired (with a 60-second buffer)
    return !this.tokenExpiry || Date.now() > (this.tokenExpiry - 60000);
  }

  public getUserInfo(): UserInfo | null {
    return this.userInfo;
  }
}

export const auth = new ViamAuthService();
