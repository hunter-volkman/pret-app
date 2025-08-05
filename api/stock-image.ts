import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createViamClient, ViamClient } from '@viamrobotics/sdk';
import { STORES, Store } from './shared/config.js';

let viamClient: ViamClient | null = null;

async function getViamClient(): Promise<ViamClient> {
  if (viamClient) return viamClient;
  const apiKeyId = process.env.VIAM_API_KEY_ID;
  const apiKey = process.env.VIAM_API_KEY;
  if (!apiKeyId || !apiKey) {
    throw new Error('Viam API credentials are not configured on the server.');
  }
  viamClient = await createViamClient({
    serviceHost: 'https://app.viam.com',
    credentials: { type: 'api-key', authEntity: apiKeyId, payload: apiKey },
  });
  return viamClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { locationId, targetTime } = req.query;
  if (typeof locationId !== 'string' || typeof targetTime !== 'string' || !Date.parse(targetTime)) {
    return res.status(400).json({ error: 'Missing or invalid locationId or targetTime.' });
  }
  
  const store = STORES.find((s: Store) => s.id === locationId);
  if (!store) {
    return res.status(404).json({ error: 'Store not found.' });
  }

  try {
    const client = await getViamClient();
    const dataClient = client.dataClient;

    const targetDate = new Date(targetTime);
    // Use a generous window to ensure we find a match
    const startTime = new Date(targetDate.getTime() - 30 * 60 * 1000);
    const endTime = new Date(targetDate.getTime() + 30 * 60 * 1000);

    // Use the official `createFilter` helper to build a bit-perfect filter object.
    const filter = (dataClient as any).createFilter({
      organizationIds: ['cc36ba4b-8053-441e-84fa-136270d34584'],
      machineIds: [store.stockMachineId], 
      componentName: 'camera', // Ensure we use the correct component
      locationIds: [locationId],
      partId: store.stockPartId,
      startTime,
      endTime
    });
    
    const result = await dataClient.binaryDataByFilter(filter, 1, 1, undefined, true);

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: 'No image found for this time slot.' });
    }

    const image = result.data[0] as any;
    // The correct path to the data is record.binary
    const imageBinary = image.binary;
    const imageTime = image.metadata?.timeReceived;

    if (!imageBinary || imageBinary.length === 0 || !imageTime) {
      return res.status(404).json({ error: 'Record found, but binary data payload was missing or empty.' });
    }

    const responsePayload = {
      timestamp: imageTime.toDate().toISOString(),
      imageUrl: `data:image/jpeg;base64,${Buffer.from(imageBinary).toString('base64')}`,
    };

    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).json(responsePayload);

  } catch (error: any) {
    console.error(`[API Stock Image Error] for ${targetTime}:`, error);
    return res.status(500).json({ error: 'Failed to fetch stock image.', details: error.message });
  }
}
