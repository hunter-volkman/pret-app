import * as VIAM from '@viamrobotics/sdk';
import { StockRegion, TempSensor } from '../stores/store';
import { auth } from './auth';

/**
 * ViamService provides methods to interact with Viam's robotics platform.
 * It handles connecting to robots, fetching stock and temperature readings,
 * and managing camera streams.
 */

class ViamService {
  private clients = new Map<string, VIAM.RobotClient>();

  private getMachineAddress(machineId: string): string | null {
    const addressMap: Record<string, string> = {
      'a7c5717d-f48e-4ac8-b179-7c7aa73571de': 'inventorymonitorer-main.70yfjlr1vp.viam.cloud',
      '948e0595-d307-425f-bd55-108e52046c2b': 'temperatures-main.70yfjlr1vp.viam.cloud',
      '467ae11d-077b-4a55-ad59-49c5a0fd7d1a': 'inventorymonitorer-main.z2dxkk8fk2.viam.cloud',
      '27971efd-baaa-4cb5-b5d0-2b5468daf0b4': 'temperatures-main.z2dxkk8fk2.viam.cloud',
      '55fc689f-bb6d-4654-ba0e-273335bc7a42': 'stockmonitor-main.nuee6e0yiy.viam.cloud',
      '4330c1e3-6a68-487c-8288-ce0124772bce': 'temperatures-main.nuee6e0yiy.viam.cloud',
      '1ceaf6ee-c926-4297-8fb6-3e702ed8e2eb': 'stockmonitor-main.rpo84u6781.viam.cloud',
      'fc6778ff-e3a0-4295-a52d-d92580fc2e81': 'temperatures-main.rpo84u6781.viam.cloud',
      '164a39ed-5a74-4786-9e71-c2f719fc3b22': 'stockmonitor-main.x9lduz4xp2.viam.cloud',
      'c65f15f3-21a9-46ef-9090-cd18c07178b5': 'temperatures-main.x9lduz4xp2.viam.cloud',
      'fc4be03e-3e05-4cef-8e4c-3b68ffbd627a': 'stockmonitor-main.22we5oy6m8.viam.cloud',
      'de7e0050-24b3-442e-919a-a580a5e91213': 'temperatures-main.22we5oy6m8.viam.cloud',
    };
    return addressMap[machineId] || null;
  }

  async connect(machineId: string): Promise<VIAM.RobotClient | null> {
    if (!machineId) {
      console.error("[ViamService] Connect called with undefined machineId.");
      return null;
    }
    
    if (this.clients.has(machineId)) {
      return this.clients.get(machineId)!;
    }

    const host = this.getMachineAddress(machineId);
    if (!host) {
      console.error(`[ViamService] ❌ Could not find address for machine ID: ${machineId}`);
      return null;
    }

    // Priority 1: Try OAuth token
    try {
      const accessToken = await auth.getAccessToken();
      if (accessToken && accessToken !== 'mock-token') {
        const client = await VIAM.createRobotClient({
          host,
          credentials: {
            type: 'access-token',
            payload: accessToken,
          },
          signalingAddress: 'https://app.viam.com:443',
        });
        console.log(`[ViamService] ✅ Connected via OAuth token to ${host}`);
        this.clients.set(machineId, client);
        return client;
      }
    } catch (error: any) {
      if (error?.message?.includes('timed out')) {
        console.log(`[ViamService] ⚪️ Connection timed out for ${host}. Machine is likely offline.`);
      } else {
        console.error(`[ViamService] ❌ OAuth connection failed for ${host}:`, error);
      }
    }

    // Priority 2: Fallback to dev credentials in development
    if (import.meta.env.DEV) {
      try {
        const { DEV_VIAM_CREDENTIALS } = await import('../config/dev-credentials');

        if (DEV_VIAM_CREDENTIALS && DEV_VIAM_CREDENTIALS.apiKeyId) {
          const client = await VIAM.createRobotClient({
            host,
            credentials: {
              type: 'api-key',
              payload: DEV_VIAM_CREDENTIALS.apiKey,
              authEntity: DEV_VIAM_CREDENTIALS.apiKeyId,
            },
            signalingAddress: 'https://app.viam.com:443',
          });
          console.log(`[ViamService] ✅ Connected via dev API key to ${host}`);
          this.clients.set(machineId, client);
          return client;
        }
      } catch (error) {
        console.error(`[ViamService] ❌ Dev credentials not used or failed:`, error);
      }
    }

    // If all connection methods fail, log this once.
    console.error(`[ViamService] ❌ No valid authentication method succeeded for ${host}.`);
    return null;
  }

  async checkMachineStatus(machineId: string): Promise<'online' | 'offline'> {
    const client = await this.connect(machineId);
    if (client) {
      this.disconnect(machineId);
      return 'online';
    }
    return 'offline';
  }

  async getStockReadings(machineId: string): Promise<StockRegion[]> {
    const client = await this.connect(machineId);
    if (!client) return [];
    try {
      const resources = await client.resourceNames();
      const hasStockSensor = resources.some(r => r.name === 'langer_fill');
      
      if (!hasStockSensor) {
        console.log(`[ViamService] ℹ️ No 'langer_fill' sensor found on ${machineId}. Skipping stock readings.`);
        return [];
      }

      const sensor = new VIAM.SensorClient(client, 'langer_fill');
      const readings = await sensor.getReadings();
      return Object.entries(readings)
        .filter(([key]) => !key.endsWith('_raw') && key !== 'is_occluded_by_person')
        .map(([id, value]) => {
          const status: StockRegion['status'] = Number(value) < 20 ? 'empty' : Number(value) < 40 ? 'low' : 'ok';
          return {
            id,
            name: id,
            fillLevel: Math.max(0, Math.min(100, Math.round(Number(value) || 0))),
            status,
          }
        });
    } catch (error) {
      console.error(`[ViamService] ❌ Stock readings failed for ${machineId}:`, error);
      return [];
    }
  }
  
  async getTemperatureReadings(machineId: string): Promise<TempSensor[]> {
    const client = await this.connect(machineId);
    if (!client) return [];
    try {
      const resources = await client.resourceNames();
      const hasTempSensor = resources.some(r => r.name === 'gateway');

      if (!hasTempSensor) {
        console.log(`[ViamService] ℹ️ No 'gateway' sensor found on ${machineId}. Skipping temperature readings.`);
        return [];
      }

      const sensor = new VIAM.SensorClient(client, 'gateway');
      const readings = await sensor.getReadings();
      return Object.entries(readings).map(([id, data]: [string, any]) => ({
        id,
        name: this.getSensorName(id),
        temperature: data.TempC_SHT || data.TempC_DS || 0,
        humidity: data.Hum_SHT,
        battery: data.BatV,
        status: this.getTempStatus(data.TempC_SHT || data.TempC_DS || 0, id),
      }));
    } catch (error) {
      console.error(`[ViamService] ❌ Temperature readings failed for ${machineId}:`, error);
      return [];
    }
  }
  
  async getCameraImage(machineId: string, overlay = false): Promise<string | null> {
    const client = await this.connect(machineId);
    if (!client) return null;
    try {
      const resources = await client.resourceNames();
      const cameraName = overlay ? 'langer_fill_view' : 'camera';
      const hasCamera = resources.some(r => r.name === cameraName);

      if (!hasCamera) {
        console.log(`[ViamService] ℹ️ No '${cameraName}' camera found on ${machineId}.`);
        return null;
      }
      
      const camera = new VIAM.CameraClient(client, cameraName);
      const image = await camera.getImage();
      return URL.createObjectURL(new Blob([image], { type: 'image/jpeg' }));
    } catch (error) {
      console.error(`[ViamService] ❌ Camera failed for ${machineId}:`, error);
      return null;
    }
  }
  
  private getSensorName(id: string): string {
    const names: Record<string, string> = {
      'a700000000000000': 'Main Fridge', 
      'a800000000000000': 'Back Fridge', 
      'a900000000000000': 'Freezer',
    };
    return names[id] || id;
  }
  
  private getTempStatus(temp: number, id: string): 'normal' | 'warning' | 'critical' {
    const name = this.getSensorName(id).toLowerCase();
    if (name.includes('freezer')) { 
      return temp > -5 || temp < -20 ? 'critical' : 'normal'; 
    }
    if (name.includes('fridge')) { 
      return temp > 8 || temp < 0 ? 'warning' : 'normal'; 
    }
    return temp > 25 || temp < 15 ? 'warning' : 'normal';
  }

  disconnect(machineId: string) {
    const client = this.clients.get(machineId);
    if (client) {
      client.disconnect();
      this.clients.delete(machineId);
    }
  }
}

export const viam = new ViamService();