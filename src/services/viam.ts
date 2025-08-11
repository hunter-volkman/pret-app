import * as VIAM from '@viamrobotics/sdk';
import { StockRegion, TempSensor } from '../stores/store';
import { auth } from './auth';
import { getSensorConfig } from '../config/sensors';

// The data structure for a single point in our temperature chart
export interface TemperatureDataPoint {
  x: Date;
  y: number;
}

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

  async connect(machineId: string): Promise<VIAM.RobotClient | null> {
    if (this.clients.has(machineId)) {
      return this.clients.get(machineId)!;
    }

    if (this.connectingPromises.has(machineId)) {
      return this.connectingPromises.get(machineId)!;
    }

    const host = this.getMachineAddress(machineId);
    if (!host) {
      console.error(`[ViamService] ❌ No address for machine ID: ${machineId}`);
      return null;
    }

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
      } catch (error: any) {
        if (error?.message?.includes('timed out')) {
          // This is an expected error for offline machines, so we log it gently.
          console.log(`[ViamService] ⚪️ Connection timed out for ${host}. Machine is likely offline.`);
        } else {
          console.error(`[ViamService] ❌ Unexpected error connecting to ${host}:`, error);
        }
        return null;
      } finally {
        this.connectingPromises.delete(machineId);
      }
    })();

    this.connectingPromises.set(machineId, connectPromise);
    return connectPromise;
  }
  
  async pingMachine(machineId: string): Promise<'online' | 'offline'> {
    const client = await this.connect(machineId);
    if (!client) {
      return 'offline';
    }
    try {
      // Use getMachineStatus as a more direct and lightweight health check.
      await client.getMachineStatus();
      return 'online';
    } catch (error) {
      const host = this.getMachineAddress(machineId);
      console.log(`[ViamService] ⚪️ Ping failed for ${host}. Cleaning up stale connection.`);
      this.disconnect(machineId);
      return 'offline';
    }
  }

  async getStockReadings(machineId: string): Promise<StockRegion[]> {
    const client = await this.connect(machineId);
    if (!client) throw new Error('Viam client is not connected');
    try {
      const resources = await client.resourceNames();
      const hasStockSensor = resources.some(r => r.name === 'langer_fill');
      
      if (!hasStockSensor) return [];

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
      this.disconnect(machineId);
      throw error; // Re-throw the error
    }
  }
  
  async getTemperatureReadings(machineId: string): Promise<TempSensor[]> {
    const client = await this.connect(machineId);
    if (!client) throw new Error('Viam client is not connected');
    try {
      const resources = await client.resourceNames();
      const hasTempSensor = resources.some(r => r.name === 'gateway');

      if (!hasTempSensor) return [];

      const sensor = new VIAM.SensorClient(client, 'gateway');
      const readings = await sensor.getReadings();
      return Object.entries(readings).map(([id, data]: [string, any]) => {
        const config = getSensorConfig(machineId, id);
        const temperature = data.TempC_SHT || data.TempC_DS || 0;
        return {
          id,
          name: config?.displayName || id,
          temperature: temperature,
          humidity: data.Hum_SHT,
          battery: data.BatV,
          status: this.getTempStatus(temperature, id, machineId),
        }
      });
    } catch (error) {
      console.error(`[ViamService] ❌ Temperature readings failed for ${machineId}:`, error);
      this.disconnect(machineId);
      throw error; // Re-throw the error
    }
  }

  /**
   * Fetches the last 24 hours of temperature data via our secure API endpoint.
   */
  async getTemperatureHistory(tempPartId: string, sensorId: string): Promise<TemperatureDataPoint[]> {
    try {
      const response = await fetch(`/api/temperature-history?tempPartId=${tempPartId}&sensorId=${sensorId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch history');
      }
      const data = await response.json();
      // Convert ISO date strings back to Date objects for the chart
      return data.map((d: { x: string; y: number }) => ({ ...d, x: new Date(d.x) }));
    } catch (error) {
      console.error(`[ViamService] ❌ Temp history failed for ${tempPartId} | ${sensorId}:`, error);
      throw error; // Re-throw to be caught by the UI
    }
  }
  
  async getCameraImage(machineId: string, overlay = false): Promise<string | null> {
    const client = await this.connect(machineId);
    if (!client) return null;
    try {
      const resources = await client.resourceNames();
      const cameraName = overlay ? 'langer_fill_view' : 'camera';
      const hasCamera = resources.some(r => r.name === cameraName);

      if (!hasCamera) return null;
      
      const camera = new VIAM.CameraClient(client, cameraName);
      const image = await camera.getImage();
      return URL.createObjectURL(new Blob([image], { type: 'image/jpeg' }));
    } catch (error) {
      console.error(`[ViamService] ❌ Camera failed for ${machineId}:`, error);
      this.disconnect(machineId);
      return null;
    }
  }
  
  public getTempStatus(temp: number, id: string, machineId: string): 'normal' | 'warning' | 'critical' {
    const config = getSensorConfig(machineId, id);
    if (!config || !config.thresholds) {
      // Fallback for unconfigured sensors like ambient
      return 'normal';
    }

    const { critical, warning } = config.thresholds;
    
    // `critical` is always the upper bound, `warning` is the lower bound.
    if (temp > critical) return 'critical';
    if (temp < warning) return 'warning';
    
    return 'normal';
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
