// src/lib/stores/machines.ts
import { writable, get } from 'svelte/store';
import { createViamClient, createRobotClient, type ViamClient, type RobotClient } from '@viamrobotics/sdk';
import { getCookie } from 'typescript-cookie';

export const viamClient = writable<ViamClient | null>(null);
export const locations = writable<any[]>([]);
export const machines = writable<any[]>([]);
export const accessToken = writable<string>('');

const PRET_ORG_ID = 'cc36ba4b-8053-441e-84fa-136270d34584';

export async function initViam() {
  let token = '';
  
  const userTokenRaw = getCookie('userToken');
  if (userTokenRaw) {
    const startIndex = userTokenRaw.indexOf('{');
    const endIndex = userTokenRaw.indexOf('}');
    const jsonStr = userTokenRaw.slice(startIndex, endIndex + 1);
    const userToken = JSON.parse(jsonStr);
    token = userToken.access_token;
  }
  
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
    console.log(`Location: ${location.locationName}`);
    console.log(`  ID: ${location.locationId}`);
    console.log(`  Machines: ${location.machineSummaries.length}`);
    
    location.machineSummaries.forEach((machine: any) => {
      const enrichedMachine = {
        ...machine,
        locationName: location.locationName,
        locationId: location.locationId
      };
      allMachines.push(enrichedMachine);
      
      console.log(`    - ${machine.machineName} (${machine.machineId})`);
    });
  });
  
  console.log(`Total machines across all locations: ${allMachines.length}`);
  
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
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  return machine.partSummaries.some((part: any) => {
    if (!part.lastOnline?.seconds) return false;
    
    const lastOnlineMs = Number(part.lastOnline.seconds) * 1000;
    return lastOnlineMs > fiveMinutesAgo;
  });
}