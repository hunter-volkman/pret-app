export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  coords: { lat: number; lng: number };
  machineId: string;
  status: 'online' | 'offline' | 'connecting';
  fillPercentage?: number;
  temperature?: number;
  lastUpdate?: Date;
  alertCount?: number;
  dailyTransactions?: number;
  capabilities: {
    hasCamera: boolean;
    hasCVCamera: boolean;
    sensorCount: number;
  };
}

export interface AlertData {
  id: string;
  storeId: string;
  storeName: string;
  type: 'empty_shelf' | 'temperature' | 'offline';
  title: string;
  message: string;
  timestamp: Date;
  shelves?: string[];
  read: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface ViamCredentials {
  id: string;
  key: string;
  hostname: string;
}
