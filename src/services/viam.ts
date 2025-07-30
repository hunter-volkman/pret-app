import * as VIAM from '@viamrobotics/sdk';
import { StockRegion, TempSensor } from '../stores/store';
import { auth } from './auth';

/**
 * ViamService provides methods to interact with Viam's robotics platform.
 * It handles connecting to robots, fetching stock and temperature readings,
 * and managing camera streams.
 */
class ViamService {
  // Cache for active, resolved robot clients.
  private clients = new Map<string, VIAM.RobotClient>();
  // Cache for in-flight connection promises to prevent race conditions.
  private connectingPromises = new Map<string, Promise<VIAM.RobotClient | null>>();

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

  // This is now the primary method for getting a client. It creates and caches connections.
  async connect(machineId: string): Promise<VIAM.RobotClient | null> {
    // Return cached client if it exists
    if (this.clients.has(machineId)) {
      return this.clients.get(machineId)!;
    }

    // If a connection is already in progress, wait for it to complete
    if (this.connectingPromises.has(machineId)) {
      return this.connectingPromises.get(machineId)!;
    }

    const host = this.getMachineAddress(machineId);
    if (!host) {
      console.error(`[ViamService] ❌ No address for machine ID: ${machineId}`);
      return null;
    }

    // Create a new connection promise and store it
    const connectPromise = (async () => {
      try {
        const accessToken = await auth.getAccessToken();
        if (!accessToken || accessToken === 'mock-token') {
          return null;
        }

        const client = await VIAM.createRobotClient({
          host,
          credentials: { type: 'access-token', payload: accessToken },
          signalingAddress: 'https://app.viam.com:443',
        });

        console.log(`[ViamService] ✅ New connection established to ${host}`);
        this.clients.set(machineId, client);
        return client;
      } catch (error) {
        // Expected for offline machines, so we don't log an error.
        return null;
      } finally {
        // Once the connection attempt is complete, remove the promise from the cache.
        this.connectingPromises.delete(machineId);
      }
    })();

    this.connectingPromises.set(machineId, connectPromise);
    return connectPromise;
  }

  /**
   * Performs a lightweight check to see if a machine is responsive.
   * It uses the main connection cache and will self-heal by removing stale connections.
   */
  async pingMachine(machineId: string): Promise<'online' | 'offline'> {
    const client = await this.connect(machineId);
    if (!client) {
      return 'offline';
    }
    try {
      // A very lightweight operation to confirm the connection is active.
      await client.resourceNames();
      return 'online';
    } catch (error) {
      // If the ping fails, the connection is stale.
      const host = this.getMachineAddress(machineId);
      console.log(`[ViamService] ⚪️ Ping failed for ${host}. Cleaning up stale connection.`);
      this.disconnect(machineId); // Self-heal by removing the dead client.
      return 'offline';
    }
  }

  async getStockReadings(machineId: string): Promise<StockRegion[]> {
    const client = await this.connect(machineId);
    if (!client) return [];
    try {
      const resources = await client.resourceNames();
      const hasStockSensor = resources.some(r => r.name === 'langer_fill');
      
      if (!hasStockSensor) {
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
      this.disconnect(machineId); // Disconnect on error to force a fresh connection next time.
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
      this.disconnect(machineId); // Disconnect on error to force a fresh connection next time.
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
        return null;
      }
      
      const camera = new VIAM.CameraClient(client, cameraName);
      const image = await camera.getImage();
      return URL.createObjectURL(new Blob([image], { type: 'image/jpeg' }));
    } catch (error) {
      console.error(`[ViamService] ❌ Camera failed for ${machineId}:`, error);
      this.disconnect(machineId); // Disconnect on error to force a fresh connection next time.
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
      const host = this.getMachineAddress(machineId);
      client.disconnect();
      this.clients.delete(machineId);
      console.log(`[ViamService] Disconnected from ${host}`);
    }
  }
}

export const viam = new ViamService();