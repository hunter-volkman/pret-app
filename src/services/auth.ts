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
  expires_in: number;
  token_type: string;
}

interface UserInfo {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
}

class ViamAuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private userInfo: UserInfo | null = null;
  private readonly clientId: string;
  private readonly orgId: string;
  private readonly redirectUri: string;
  
  constructor() {
    this.clientId = import.meta.env.VITE_VIAM_OAUTH_CLIENT_ID || '';
    this.orgId = import.meta.env.VITE_VIAM_ORG_ID || '';
    this.redirectUri = window.location.origin;
    
    // Load existing tokens
    this.loadStoredTokens();
    
    // Check for OAuth callback
    this.handleOAuthCallback();
  }

  private loadStoredTokens(): void {
    this.accessToken = localStorage.getItem('viam_access_token');
    this.refreshToken = localStorage.getItem('viam_refresh_token');
    const expiry = localStorage.getItem('viam_token_expiry');
    const userStr = localStorage.getItem('viam_user_info');
    
    this.tokenExpiry = expiry ? parseInt(expiry) : null;
    this.userInfo = userStr ? JSON.parse(userStr) : null;
  }

  private storeTokens(tokenData: TokenResponse): void {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token || null;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

    localStorage.setItem('viam_access_token', this.accessToken);
    if (this.refreshToken) {
      localStorage.setItem('viam_refresh_token', this.refreshToken);
    }
    localStorage.setItem('viam_token_expiry', this.tokenExpiry.toString());
    
    // Create basic user info since we have a valid token
    this.createUserInfo();
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    
    localStorage.removeItem('viam_access_token');
    localStorage.removeItem('viam_refresh_token');
    localStorage.removeItem('viam_token_expiry');
    localStorage.removeItem('viam_user_info');
  }

  private createUserInfo(): void {
    // Since we have a valid token, create basic user info
    // We could expand this later to fetch actual user details
    this.userInfo = {
      sub: 'viam-user',
      email: 'user@viam.com',
      given_name: 'Viam User'
    };
    localStorage.setItem('viam_user_info', JSON.stringify(this.userInfo));
  }

  private async handleOAuthCallback(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('❌ OAuth error:', error);
      return;
    }
    
    if (code && state) {
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('code_verifier');
      
      if (state === storedState && codeVerifier) {
        try {
          console.log('🔄 Processing OAuth callback...');
          await this.exchangeCodeForToken(code, codeVerifier);
          console.log('✅ Successfully authenticated with Viam');
        } catch (error) {
          console.error('❌ Token exchange failed:', error);
        }
        
        // Clean up
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('code_verifier');
        
        // Clean URL without page reload
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.error('❌ Invalid OAuth state or missing code verifier');
      }
    }
  }

  public async login(): Promise<void> {
    if (!IS_AUTH_ENABLED) {
      console.log('🔓 Auth disabled - using mock auth');
      return;
    }

    if (!this.clientId || !this.orgId) {
      throw new Error('Viam OAuth not configured. Missing VITE_VIAM_OAUTH_CLIENT_ID or VITE_VIAM_ORG_ID');
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier(); // Random state for CSRF protection

    // Store PKCE values securely in sessionStorage
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const authUrl = new URL('https://auth.viam.com/oauth2/authorize');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', 'offline_access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    console.log('🚀 Redirecting to Viam OAuth login...');
    window.location.href = authUrl.toString();
  }

  public async logout(): Promise<void> {
    console.log('🚪 Logging out...');
    this.clearTokens();
    
    if (IS_AUTH_ENABLED && this.clientId) {
      const logoutUrl = new URL('https://auth.viam.com/oauth2/logout');
      logoutUrl.searchParams.set('client_id', this.clientId);
      logoutUrl.searchParams.set('returnTo', this.redirectUri);
      window.location.href = logoutUrl.toString();
    }
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<void> {
    // Use our serverless proxy to avoid CORS issues
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
    this.storeTokens(tokenData);
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      // Use the same proxy for refresh tokens
      const response = await fetch('/api/oauth-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grantType: 'refresh_token',
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return false;
      }

      const tokenData: TokenResponse = await response.json();
      this.storeTokens(tokenData);
      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  public async getAccessToken(): Promise<string | null> {
    if (!IS_AUTH_ENABLED) {
      return 'mock-token';
    }

    if (!this.accessToken) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (this.tokenExpiry && Date.now() > (this.tokenExpiry - 300000)) {
      console.log('🔄 Token expired, attempting refresh...');
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        console.log('❌ Token refresh failed, need to re-authenticate');
        this.clearTokens();
        return null;
      }
    }

    return this.accessToken;
  }

  public isAuthenticated(): boolean {
    if (!IS_AUTH_ENABLED) return true;
    return !!this.accessToken;
  }

  public getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  public async isTokenValid(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}

export const auth = new ViamAuthService();
