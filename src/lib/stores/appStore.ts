import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { StoreLocation, Alert, TemperatureSensor, AppState } from '$lib/types';
import { STORE_CONFIGS } from '$lib/services/viamConfig';

// Core app state
export const selectedStores = writable<Set<string>>(new Set(['store-5th-ave', 'store-union-sq']));
export const currentView = writable<AppState['currentView']>('overview');
export const stores = writable<StoreLocation[]>(STORE_CONFIGS);
export const alerts = writable<Alert[]>([]);
export const temperatureData = writable<Map<string, TemperatureSensor[]>>(new Map());

// Notification state
export const notifications = writable<AppState['notifications']>({
  enabled: false,
  permission: 'default',
  subscriptions: []
});

// Derived stores for computed values
export const selectedStoreData = derived(
  [stores, selectedStores],
  ([storesData, selected]) => storesData.filter(store => selected.has(store.id))
);

export const onlineStores = derived(
  selectedStoreData,
  ($selectedStoreData) => $selectedStoreData.filter(store => store.status === 'online')
);

export const unreadAlerts = derived(
  alerts,
  ($alerts) => $alerts.filter(alert => !alert.read)
);

export const criticalAlerts = derived(
  unreadAlerts,
  ($unreadAlerts) => $unreadAlerts.filter(alert => alert.severity === 'critical')
);

// Viam credentials
export const viamCredentials = writable<{
  apiKeyId: string;
  apiKey: string;
  isConfigured: boolean;
}>({
  apiKeyId: '',
  apiKey: '',
  isConfigured: false
});

// Store actions
export const storeActions = {
  toggleStoreSelection: (storeId: string) => {
    selectedStores.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(storeId)) {
        newSelected.delete(storeId);
      } else {
        newSelected.add(storeId);
      }
      return newSelected;
    });
  },

  updateStoreStatus: (storeId: string, status: StoreLocation['status']) => {
    stores.update(storesData => 
      storesData.map(store => 
        store.id === storeId ? { ...store, status } : store
      )
    );
  },

  addAlert: (alert: Alert) => {
    alerts.update(alertsData => [alert, ...alertsData.slice(0, 99)]);
    updateNotificationBadge();
  },

  markAlertRead: (alertId: string) => {
    alerts.update(alertsData => 
      alertsData.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
    updateNotificationBadge();
  },

  markAllAlertsRead: () => {
    alerts.update(alertsData => 
      alertsData.map(alert => ({ ...alert, read: true }))
    );
    updateNotificationBadge();
  },

  acknowledgeAlert: (alertId: string) => {
    alerts.update(alertsData => 
      alertsData.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, read: true }
          : alert
      )
    );
    updateNotificationBadge();
  },

  updateTemperatureData: (storeId: string, sensors: TemperatureSensor[]) => {
    temperatureData.update(tempData => {
      const newData = new Map(tempData);
      newData.set(storeId, sensors);
      return newData;
    });
  },

  configureViam: (apiKeyId: string, apiKey: string) => {
    viamCredentials.set({
      apiKeyId,
      apiKey,
      isConfigured: true
    });
    
    // Save to localStorage
    if (browser) {
      localStorage.setItem('viam-credentials', JSON.stringify({
        apiKeyId,
        apiKey,
        isConfigured: true
      }));
    }
  }
};

// Notification actions
export const notificationActions = {
  requestPermission: async (): Promise<boolean> => {
    if (!browser || !('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    notifications.update(state => ({
      ...state,
      permission,
      enabled: permission === 'granted'
    }));
    
    return permission === 'granted';
  },

  enableNotifications: async (): Promise<boolean> => {
    const granted = await notificationActions.requestPermission();
    if (granted) {
      notifications.update(state => ({ ...state, enabled: true }));
    }
    return granted;
  },

  disableNotifications: () => {
    notifications.update(state => ({ ...state, enabled: false }));
  },

  subscribeToStore: (storeId: string) => {
    notifications.update(state => ({
      ...state,
      subscriptions: [...new Set([...state.subscriptions, storeId])]
    }));
  },

  unsubscribeFromStore: (storeId: string) => {
    notifications.update(state => ({
      ...state,
      subscriptions: state.subscriptions.filter(id => id !== storeId)
    }));
  }
};

// Update notification badge
function updateNotificationBadge() {
  if (!browser) return;
  
  const unreadCount = get(unreadAlerts).length;
  
  if ('setAppBadge' in navigator) {
    if (unreadCount > 0) {
      navigator.setAppBadge(unreadCount);
    } else {
      navigator.clearAppBadge();
    }
  }
}

// Initialize from localStorage
if (browser) {
  try {
    const stored = localStorage.getItem('viam-credentials');
    if (stored) {
      const credentials = JSON.parse(stored);
      viamCredentials.set(credentials);
    }

    const storedSelected = localStorage.getItem('selected-stores');
    if (storedSelected) {
      selectedStores.set(new Set(JSON.parse(storedSelected)));
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }

  // Save selected stores to localStorage
  selectedStores.subscribe(selected => {
    localStorage.setItem('selected-stores', JSON.stringify(Array.from(selected)));
  });
}
