import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys are not configured in environment variables.');
} else {
  webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidPublicKey,
    vapidPrivateKey
  );
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { storeId, title, message } = request.body;
    if (!storeId || !title || !message) {
      return response.status(400).json({ error: 'Missing storeId, title, or message.' });
    }

    const subscriptionKey = `subscriptions:${storeId}`;
    const subscriptions = await kv.smembers<webpush.PushSubscription[]>(subscriptionKey);

    if (subscriptions.length === 0) {
      console.log(`[API Notify] No subscriptions found for store ${storeId}.`);
      return response.status(200).json({ success: true, message: 'No subscriptions to notify.' });
    }

    console.log(`[API Notify] Found ${subscriptions.length} subscribers for store ${storeId}. Sending notifications...`);

    const notificationPayload = JSON.stringify({ title, message });
    const promises = subscriptions.map(subscription => 
      webpush.sendNotification(subscription, notificationPayload)
        .catch((error: any) => {
          if (error.statusCode === 410) {
            console.log(`[API Notify] Subscription expired for ${subscription.endpoint}. Deleting.`);
            return kv.srem(subscriptionKey, subscription);
          } else {
            console.error(`[API Notify] Failed to send notification to ${subscription.endpoint}:`, error.body);
          }
        })
    );

    await Promise.all(promises);

    console.log('[API Notify] All notifications sent.');
    return response.status(200).json({ success: true });

  } catch (error) {
    console.error('[API Notify Error]', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
