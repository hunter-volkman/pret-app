import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createViamClient, ViamClient, DataClient } from '@viamrobotics/sdk';
import { fromZonedTime } from 'date-fns-tz';
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

/**
 * Generates an array of Date objects representing 30-minute intervals
 * for a store's operating hours on a given day.
 */
function generateTimeSlots(store: Store, dateStr: string): Date[] {
    const requestDate = fromZonedTime(dateStr, store.timezone);
    const dayOfWeek = requestDate.getDay();
    const hours = store.openingHours[dayOfWeek];

    if (!hours) return [];

    // Create a window from 30 mins before opening to 30 mins after closing.
    const openTime = fromZonedTime(`${dateStr}T${hours.open}:00`, store.timezone);
    const closeTime = fromZonedTime(`${dateStr}T${hours.close}:00`, store.timezone);

    const startSlot = new Date(openTime.getTime() - 30 * 60 * 1000);
    const endSlot = new Date(closeTime.getTime() + 30 * 60 * 1000);

    const slots: Date[] = [];
    let current = startSlot;
    const now = new Date();

    while (current <= endSlot && current <= now) {
        slots.push(new Date(current.getTime()));
        current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
}

/**
 * Fetches the single closest image for a given 30-minute time slot.
 */
async function fetchImageForSlot(dataClient: DataClient, store: Store, targetTime: Date): Promise<{ timestamp: string; imageUrl: string } | null> {
    // Use a +/- 15 minute window to find the closest image to the slot's center.
    const startTime = new Date(targetTime.getTime() - 15 * 60 * 1000);
    const endTime = new Date(targetTime.getTime() + 15 * 60 * 1000);

    const filter = (dataClient as any).createFilter({
        organizationIds: ['cc36ba4b-8053-441e-84fa-136270d34584'],
        machineIds: [store.stockMachineId],
        componentName: 'camera',
        locationIds: [store.id],
        partId: store.stockPartId,
        startTime,
        endTime,
    });
    
    // Crucially, we only ask for the single best match for this slot.
    const result = await dataClient.binaryDataByFilter(filter, 1, undefined, undefined, true);

    if (!result.data || result.data.length === 0) {
        return null; // No image found in this window.
    }

    const image = result.data[0] as any;
    const imageBinary = image.binary;
    const imageTime = image.metadata?.timeReceived;

    if (!imageBinary || imageBinary.length === 0 || !imageTime) {
        return null;
    }

    return {
        timestamp: imageTime.toDate().toISOString(),
        imageUrl: `data:image/jpeg;base64,${Buffer.from(imageBinary).toString('base64')}`,
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { locationId, date } = req.query;
    if (typeof locationId !== 'string' || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Missing or invalid locationId or date (YYYY-MM-DD).' });
    }

    const store = STORES.find((s: Store) => s.id === locationId);
    if (!store) {
        return res.status(404).json({ error: 'Store not found.' });
    }

    try {
        const client = await getViamClient();
        const dataClient = client.dataClient;

        // 1. Generate all the 30-minute time slots we need to query.
        const timeSlots = generateTimeSlots(store, date);

        if (timeSlots.length === 0) {
            return res.status(200).json([]); // Store closed or not yet open.
        }

        // 2. Create an array of promises to fetch an image for each slot.
        const fetchPromises = timeSlots.map(slot => 
            fetchImageForSlot(dataClient, store, slot)
        );

        // 3. Execute all fetches concurrently for maximum speed.
        const results = await Promise.all(fetchPromises);

        // 4. Filter out any slots where no image was found.
        const foundImages = results.filter((image): image is { timestamp: string; imageUrl: string } => image !== null);

        // 5. Send the curated list to the frontend.
        res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800'); // Cache for 30 mins
        return res.status(200).json(foundImages);

    } catch (error: any) {
        console.error(`[API Stock Images Error] for ${date}:`, error);
        return res.status(500).json({ error: 'Failed to fetch stock images.', details: error.message });
    }
}
