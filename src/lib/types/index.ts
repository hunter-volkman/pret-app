export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  coords: { lat: number; lng: number };
  partId: string; // Viam part ID
  status: 'online' | 'offline' | 'connecting' | 'error';
  region: string;
  capabilities: {
    hasCamera: boolean;
    hasCVCamera: boolean;
    sensorCount: number;
  };
}

export interface TemperatureSensor {
  id: string;
  name: string;
  region: string;
  temperature: number;
  threshold: number;
  status: 'normal' | 'warning' | 'alert';
  lastReading: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  battery?: number;
  humidity?: number;
}

export interface Alert {
  id: string;
  storeId: string;
  storeName: string;
  type: 'temperature' | 'inventory' | 'equipment' | 'connectivity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  acknowledged: boolean;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface StockFillReading {
  regionId: string;
  fillPercentage: number;
  confidence: number;
  isOccludedByPerson: boolean;
  lastUpdated: string;
}

export type ViewType = 'overview' | 'stores' | 'cameras' | 'temperatures' | 'alerts';

export interface AppState {
  selectedStores: Set<string>;
  currentView: ViewType;
  notifications: {
    enabled: boolean;
    permission: NotificationPermission;
    subscriptions: string[];
  };
}
