import { ViamClient, createViamClient } from '@viamrobotics/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let viamClient: ViamClient | null = null;

async function getViamClient(): Promise<ViamClient> {
  if (viamClient) {
    return viamClient;
  }
  const apiKeyId = process.env.VIAM_API_KEY_ID;
  const apiKey = process.env.VIAM_API_KEY;

  if (!apiKeyId || !apiKey) {
    throw new Error('Viam API credentials are not configured on the server.');
  }

  viamClient = await createViamClient({
    serviceHost: 'https://app.viam.com:443',
    credentials: {
      type: 'api-key',
      authEntity: apiKeyId,
      payload: apiKey,
    },
  });
  return viamClient;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { tempPartId, sensorId } = request.query;

  if (typeof tempPartId !== 'string' || typeof sensorId !== 'string') {
    return response.status(400).json({ error: 'Missing tempPartId or sensorId.' });
  }

  try {
    const client = await getViamClient();
    const dataClient = client.dataClient;

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    const rawData = await dataClient.exportTabularData(
      tempPartId,
      'gateway',
      'rdk:component:sensor',
      'Readings',
      startTime,
      endTime
    );

    const chartData = rawData
      .map(entry => {
        // ✨ FIX: Add a type guard to ensure payload is an object before accessing its properties.
        if (entry.payload && typeof entry.payload === 'object' && !Array.isArray(entry.payload) && entry.timeCaptured) {
          const readings = entry.payload['readings'];
          if (readings && typeof readings === 'object' && !Array.isArray(readings)) {
            const payloadObject = readings as Record<string, any>;
            const sensorReading = payloadObject[sensorId];

            if (sensorReading) {
              const temp = sensorReading.TempC_SHT ?? sensorReading.TempC_DS;
              if (typeof temp === 'number' && temp < 100) { 
                return { x: entry.timeCaptured.toISOString(), y: temp };
              }
            }
          }
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a!.x).getTime() - new Date(b!.x).getTime());
    
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response.status(200).json(chartData);

  } catch (error: any) {
    console.error('[API Temperature History Error]', error);
    return response.status(500).json({ error: 'Failed to fetch sensor history.', details: error.message });
  }
}