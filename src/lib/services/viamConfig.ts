import type { StoreLocation } from '../types'

// Store configurations with Viam machine IDs (not partId)
export const STORE_CONFIGS: StoreLocation[] = [
  {
    id: 'store-5th-ave',
    name: '5th Avenue',
    address: '389 5th Ave, New York, NY 10016',
    coords: { lat: 40.7516, lng: -73.9755 },
    machineId: 'a7c5717d-f48e-4ac8-b179-7c7aa73571de',
    status: 'offline',
    capabilities: { hasCamera: true, hasCVCamera: true, sensorCount: 9 },
  },
  {
    id: 'store-union-sq',
    name: 'Union Square', 
    address: '31 E 14th St, New York, NY 10003',
    coords: { lat: 40.7359, lng: -73.9911 },
    machineId: 'demo-machine-union-sq',
    status: 'offline',
    capabilities: { hasCamera: true, hasCVCamera: true, sensorCount: 11 },
  },
  {
    id: 'store-times-sq',
    name: 'Times Square',
    address: '1500 Broadway, New York, NY 10036', 
    coords: { lat: 40.7589, lng: -73.9851 },
    machineId: 'demo-machine-times-sq',
    status: 'offline',
    capabilities: { hasCamera: false, hasCVCamera: false, sensorCount: 0 },
  },
];
