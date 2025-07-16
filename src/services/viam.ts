import * as VIAM from '@viamrobotics/sdk';
import { DEV_VIAM_CREDENTIALS } from '../config/dev-credentials';

const USE_DEV_CREDS = import.meta.env.DEV && DEV_VIAM_CREDENTIALS.apiKeyId !== 'PASTE_YOUR_API_KEY_ID_HERE';

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

  private getCookieCredentials(machineId: string) {
    try {
      const cookie = document.cookie.split(';').find(row => row.trim().startsWith(machineId));
      if (cookie) {
        const data = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        return { apiKey: data.key, apiKeyId: data.id, hostname: data.hostname };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async connect(machineId: string): Promise<VIAM.RobotClient | null> {
    if (!machineId) {
      console.error("[ViamService] Connect called with undefined machineId.");
      return null;
    }
    if (this.clients.has(machineId)) {
      return this.clients.get(machineId)!;
    }

    if (USE_DEV_CREDS) {
      const host = this.getMachineAddress(machineId);
      if (!host) {
        console.error(`[ViamService] ❌ Could not find a known address for machine ID: ${machineId}`);
        return null;
      }
      console.log(`[ViamService] Using local dev API Key to connect to host: ${host}`);

      try {
        const client = await VIAM.createRobotClient({
          host,
          credentials: {
            type: 'api-key',
            payload: DEV_VIAM_CREDENTIALS.apiKey,
            authEntity: DEV_VIAM_CREDENTIALS.apiKeyId,
          },
          signalingAddress: 'https://app.viam.com:443',
        });
        console.log(`[ViamService] ✅ Successfully connected to ${host} via API Key.`);
        this.clients.set(machineId, client);
        return client;
      } catch (error) {
        console.error(`[ViamService] ❌ API Key connection failed for ${host}.`);
        console.error('[ViamService] Full error object:', error);
        return null;
      }
    }

    console.log('[ViamService] Attempting to connect via Viam App cookies.');
    const creds = this.getCookieCredentials(machineId);
    if (!creds) { return null; }
    try {
      const client = await VIAM.createRobotClient({
        host: creds.hostname,
        credentials: { type: 'api-key', payload: creds.apiKey, authEntity: creds.apiKeyId },
        signalingAddress: 'https://app.viam.com:443',
      });
      this.clients.set(machineId, client);
      return client;
    } catch (error) {
      console.error(`[ViamService] ❌ Cookie-based connection failed for ${machineId}:`, error);
      return null;
    }
  }

  async getStockReadings(machineId: string) {
    const client = await this.connect(machineId);
    if (!client) return [];
    try {
      const sensor = new VIAM.SensorClient(client, 'langer_fill');
      const readings = await sensor.getReadings();
      return Object.entries(readings)
        .filter(([key]) => !key.endsWith('_raw') && key !== 'is_occluded_by_person')
        .map(([id, value]) => ({
          id,
          name: id,
          fillLevel: Math.max(0, Math.min(100, Math.round(Number(value) || 0))),
          status: Number(value) < 20 ? 'empty' : Number(value) < 40 ? 'low' : 'ok',
        }));
    } catch (error) {
      console.error(`Stock readings failed for ${machineId}:`, error);
      return [];
    }
  }
  
  async getTemperatureReadings(machineId: string) {
    const client = await this.connect(machineId);
    if (!client) return [];
    try {
      const resources = await client.resourceNames();
      const gateway = resources.find(r => r && r.api && r.api.endsWith(':sensor') && r.model && !r.model.includes('stock-fill'));
      if (!gateway) {
        console.error("Could not find a temperature sensor component on machine " + machineId);
        return [];
      }
      console.log(`[ViamService] Found temperature sensor "${gateway.name}" on ${machineId}`);
      const sensor = new VIAM.SensorClient(client, gateway.name);
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
      console.error(`Temperature readings failed for ${machineId}:`, error);
      return [];
    }
  }
  
  async getCameraImage(machineId: string, overlay = false): Promise<string | null> {
    const client = await this.connect(machineId);
    if (!client) return null;
    try {
      const cameraName = overlay ? 'langer_fill_view' : 'camera';
      const camera = new VIAM.CameraClient(client, cameraName);
      const image = await camera.getImage();
      return URL.createObjectURL(new Blob([image], { type: 'image/jpeg' }));
    } catch (error) {
      console.error(`Camera failed for ${machineId}:`, error);
      return null;
    }
  }
  
  private getSensorName(id: string): string {
    const names: Record<string, string> = {
      'a700000000000000': 'Main Fridge', 'a800000000000000': 'Back Fridge', 'a900000000000000': 'Freezer',
    };
    return names[id] || id;
  }
  
  private getTempStatus(temp: number, id: string): 'normal' | 'warning' | 'critical' {
    const name = this.getSensorName(id).toLowerCase();
    if (name.includes('freezer')) { return temp > -5 || temp < -20 ? 'critical' : 'normal'; }
    if (name.includes('fridge')) { return temp > 8 || temp < 0 ? 'warning' : 'normal'; }
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
