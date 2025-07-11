import Cookies from 'js-cookie';

export interface ViamCredentials {
  apiKeyId: string;
  apiKey: string;
  hostname: string;
  machineId: string;
  isConfigured: boolean;
}

/**
 * Get Viam credentials from cookies (for deployed Viam app)
 * or fallback to localStorage (for local development)
 */
export function getViamCredentials(): ViamCredentials {
  try {
    // Try to get machine ID from URL (Viam app pattern: /machine/{machine-id})
    const pathParts = window.location.pathname.split('/');
    const machineId = pathParts[2];
    
    if (machineId) {
      // We're in a Viam app, get credentials from cookies
      const cookieData = Cookies.get(machineId);
      if (cookieData) {
        const { id: apiKeyId, key: apiKey, hostname } = JSON.parse(cookieData);
        return {
          apiKeyId,
          apiKey,
          hostname,
          machineId,
          isConfigured: true
        };
      }
    }
  } catch (error) {
    console.warn('Failed to get Viam credentials from cookies:', error);
  }

  // Fallback to localStorage for local development
  try {
    const stored = localStorage.getItem('viam-credentials');
    if (stored) {
      const credentials = JSON.parse(stored);
      return {
        ...credentials,
        machineId: credentials.machineId || '',
        hostname: credentials.hostname || ''
      };
    }
  } catch (error) {
    console.warn('Failed to load credentials from localStorage:', error);
  }

  return {
    apiKeyId: '',
    apiKey: '',
    hostname: '',
    machineId: '',
    isConfigured: false
  };
}

/**
 * Save credentials to localStorage (for local development only)
 */
export function saveViamCredentials(apiKeyId: string, apiKey: string, hostname?: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('viam-credentials', JSON.stringify({
      apiKeyId,
      apiKey,
      hostname: hostname || '',
      isConfigured: true
    }));
  }
}
