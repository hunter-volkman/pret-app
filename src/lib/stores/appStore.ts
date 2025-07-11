import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getViamCredentials, saveViamCredentials } from '$lib/services/viamAuth';
import type { StoreLocation } from '$lib/types';

// Store configurations - these will be filtered based on actual machine access
const ALL_STORE_CONFIGS: StoreLocation[] = [
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

// Stores
export const selectedStores = writable<Set<string>>(new Set());
export const stores = writable<StoreLocation[]>([]);
export const selectedStoreData = writable<StoreLocation[]>([]);

export const viamCredentials = writable<{
  apiKeyId: string;
  apiKey: string;
  hostname: string;
  machineId: string;
  isConfigured: boolean;
}>({
  apiKeyId: '',
  apiKey: '',
  hostname: '',
  machineId: '',
  isConfigured: false
});

// Actions
export const storeActions = {
  configureViam: (apiKeyId: string, apiKey: string, hostname?: string) => {
    viamCredentials.set({
      apiKeyId,
      apiKey,
      hostname: hostname || '',
      machineId: '',
      isConfigured: true
    });
    
    if (browser) {
      saveViamCredentials(apiKeyId, apiKey, hostname);
    }
  },
  
  initializeFromCookies: () => {
    if (browser) {
      const credentials = getViamCredentials();
      viamCredentials.set(credentials);
      
      // Filter stores based on available machine
      if (credentials.machineId) {
        const availableStore = ALL_STORE_CONFIGS.find(store => 
          store.partId === credentials.machineId
        );
        if (availableStore) {
          stores.set([availableStore]);
          selectedStores.set(new Set([availableStore.id]));
          selectedStoreData.set([availableStore]);
        }
      } else {
        // Local development - show all stores
        stores.set(ALL_STORE_CONFIGS);
        selectedStores.set(new Set(['store-5th-ave']));
        selectedStoreData.set(ALL_STORE_CONFIGS);
      }
    }
  }
};