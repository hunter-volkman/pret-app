import type { DialConf } from '@viamrobotics/sdk';
import type { StoreLocation } from '$lib/types';

// Store configurations with Viam part IDs
export const STORE_CONFIGS: StoreLocation[] = [
  {
    id: 'store-5th-ave',
    name: '5th Avenue',
    address: '389 5th Ave, New York, NY 10016',
    coords: { lat: 40.7516, lng: -73.9755 },
    partId: 'a7c5717d-f48e-4ac8-b179-7c7aa73571de',
    status: 'offline',
    region: 'Manhattan',
    capabilities: { hasCamera: true, hasCVCamera: true, sensorCount: 9 },
  },
  {
    id: 'store-union-sq',
    name: 'Union Square', 
    address: '31 E 14th St, New York, NY 10003',
    coords: { lat: 40.7359, lng: -73.9911 },
    partId: 'demo-machine-union-sq',
    status: 'offline',
    region: 'Manhattan',
    capabilities: { hasCamera: true, hasCVCamera: true, sensorCount: 11 },
  },
  {
    id: 'store-times-sq',
    name: 'Times Square',
    address: '1500 Broadway, New York, NY 10036', 
    coords: { lat: 40.7589, lng: -73.9851 },
    partId: 'demo-machine-times-sq',
    status: 'offline',
    region: 'Manhattan',
    capabilities: { hasCamera: false, hasCVCamera: false, sensorCount: 0 },
  },
];

/**
 * Create Viam dial configurations for selected stores
 */
export function createDialConfigs(
  apiKeyId: string,
  apiKey: string,
  selectedStoreIds: string[]
): Record<string, DialConf> {
  const configs: Record<string, DialConf> = {};
  
  STORE_CONFIGS
    .filter(store => selectedStoreIds.includes(store.id))
    .forEach(store => {
      configs[store.partId] = {
        host: `${store.partId}.viam.cloud`,
        credentials: {
          type: 'api-key',
          authEntity: apiKeyId,
          payload: apiKey,
        },
        signalingAddress: 'https://app.viam.com:443',
        disableSessions: false,
      };
    });
    
  return configs;
}

/**
 * Get store by part ID
 */
export function getStoreByPartId(partId: string): StoreLocation | undefined {
  return STORE_CONFIGS.find(store => store.partId === partId);
}

/**
 * Get part ID by store ID
 */
export function getPartIdByStoreId(storeId: string): string | undefined {
  return STORE_CONFIGS.find(store => store.id === storeId)?.partId;
}
