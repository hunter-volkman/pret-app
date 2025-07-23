import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { storeId, subscription } = request.body;
    if (!storeId || !subscription || !subscription.endpoint) {
      return response.status(400).json({ error: 'Missing or invalid storeId or subscription.' });
    }

    await kv.sadd(`subscriptions:${storeId}`, subscription);
    console.log(`[API] Subscribed to ${storeId}:`, subscription.endpoint);
    return response.status(201).json({ success: true });

  } catch (error) {
    console.error('[API Subscribe Error]', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
