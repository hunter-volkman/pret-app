import { ViamClient, createViamClient } from '@viamrobotics/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Re-use Viam client logic from the other API endpoint
let viamClient: ViamClient | null = null;
async function getViamClient(): Promise<ViamClient> {
if (viamClient) return viamClient;
const apiKeyId = process.env.VIAM_API_KEY_ID;
const apiKey = process.env.VIAM_API_KEY;
if (!apiKeyId || !apiKey) throw new Error('Viam API credentials are not configured.');
viamClient = await createViamClient({
serviceHost: 'https://app.viam.com',
credentials: {
    type: 'api-key',
    authEntity: apiKeyId,
    payload: apiKey
},
});
return viamClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
if (req.method !== 'GET') {
return res.status(405).json({ error: 'Method Not Allowed' });
}

const { tempPartId, hours = '6' } = req.query;

if (typeof tempPartId !== 'string') {
return res.status(400).json({ error: 'Missing tempPartId.' });
}

try {
const client = await getViamClient();
const dataClient = client.dataClient;

const endTime = new Date();
const startTime = new Date(endTime.getTime() - Number(hours) * 60 * 60 * 1000);

const rawData = await dataClient.exportTabularData(
  tempPartId, 'gateway', 'rdk:component:sensor', 'Readings', startTime, endTime
);

const trends: Record<string, { x: string; y: number }[]> = {};

(rawData as any[]).forEach((entry) => {
  const readings = entry.payload?.['readings'];
  if (readings && typeof readings === 'object' && !Array.isArray(readings)) {
    for (const sensorId in readings) {
      const sensorReading = readings[sensorId];
      const temp = sensorReading.TempC_SHT ?? sensorReading.TempC_DS;
      if (typeof temp === 'number' && entry.timeCaptured) {
        if (!trends[sensorId]) {
          trends[sensorId] = [];
        }
        trends[sensorId].push({
          x: entry.timeCaptured.toISOString(),
          y: parseFloat(temp.toFixed(2)),
        });
      }
    }
  }
});

// Sort each sensor's data by time
for(const sensorId in trends) {
    trends[sensorId].sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
}

res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
return res.status(200).json(trends);
} catch (error: any) {
console.error('[API Temperature Trends Error]', error);
return res.status(500).json({ error: 'Failed to fetch sensor trends.', details: error.message });
}
}
