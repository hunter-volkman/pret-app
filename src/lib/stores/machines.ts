import { writable, get } from 'svelte/store';
import { createViamClient, createRobotClient, type ViamClient, type RobotClient } from '@viamrobotics/sdk';

export const viamClient = writable<ViamClient | null>(null);
export const locations = writable<any[]>([]);
export const machines = writable<any[]>([]);
export const accessToken = writable<string>('');

const PRET_ORG_ID = 'cc36ba4b-8053-441e-84fa-136270d34584';
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function initViam() {
  let token = '';
  
  // Parse userToken cookie from Viam authentication
  const userToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('userToken='));
  
  if (userToken) {
    const decoded = decodeURIComponent(userToken.split('=')[1]);
    token = JSON.parse(decoded).access_token;
  }
  
  // Fallback to environment variable for local development
  if (!token && import.meta.env.VITE_VIAM_ACCESS_TOKEN) {
    token = import.meta.env.VITE_VIAM_ACCESS_TOKEN;
  }
  
  if (!token) throw new Error('No access token');
  
  accessToken.set(token);
  
  const client = await createViamClient({
    serviceHost: 'https://app.viam.com',
    credentials: { type: 'access-token', payload: token }
  });
  
  viamClient.set(client);
  return client;
}

export async function loadMachines() {
  const client = get(viamClient);
  if (!client) throw new Error('Not initialized');
  
  const locationSummaries = await client.appClient.listMachineSummaries(PRET_ORG_ID, []);
  
  console.log(`Found ${locationSummaries.length} Pret locations`);
  
  const allMachines: any[] = [];
  
  locationSummaries.forEach((location: any) => {
    console.log(`📍 ${location.locationName} (${location.machineSummaries.length} machines)`);
    
    location.machineSummaries.forEach((machine: any) => {
      const enrichedMachine = {
        ...machine,
        locationName: location.locationName,
        locationId: location.locationId
      };
      allMachines.push(enrichedMachine);
      console.log(`   └─ ${machine.machineName}`);
    });
  });
  
  console.log(`Total machines: ${allMachines.length}`);
  
  locations.set(locationSummaries);
  machines.set(allMachines);
  
  return { locations: locationSummaries, machines: allMachines };
}

export async function checkMachineStatus(machineId: string): Promise<boolean> {
  const allMachines = get(machines);
  const machine = allMachines.find(m => m.machineId === machineId);
  
  if (!machine || !machine.partSummaries || machine.partSummaries.length === 0) {
    return false;
  }
  
  const now = Date.now();
  const fiveMinutesAgo = now - ONLINE_THRESHOLD_MS;
  
  return machine.partSummaries.some((part: any) => {
    if (!part.lastOnline?.seconds) return false;
    
    const lastOnlineMs = Number(part.lastOnline.seconds) * 1000;
    return lastOnlineMs > fiveMinutesAgo;
  });
}

export async function connectToMachine(machineId: string, locationId: string, machineName: string): Promise<RobotClient> {
  const token = get(accessToken);
  const host = `${machineName.toLowerCase().replace(/\s+/g, '-')}-main.${locationId}.viam.cloud`;
  
  console.log(`🔌 Connecting to: ${host}`);
  
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Connection timeout')), 10000)
  );
  
  const connection = createRobotClient({
    host,
    credentials: { 
      type: 'access-token', 
      payload: token 
    },
    signalingAddress: 'https://app.viam.com:443'
  });
  
  const robot = await Promise.race([connection, timeout]) as RobotClient;
  console.log(`✅ Connected to: ${machineName}`);
  
  return robot;
}