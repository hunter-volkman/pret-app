export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  coords: { lat: number; lng: number };
  partId: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
  region: string;
  capabilities: {
    hasCamera: boolean;
    hasCVCamera: boolean;
    sensorCount: number;
  };
}
