import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { storeId, subscription } = request.body;

  console.log('✅ Received new subscription request:');
  console.log('   Store ID:', storeId);
  console.log('   Subscription Endpoint:', subscription?.endpoint);

  response.status(201).json({
    success: true,
    message: 'Subscription received and logged.',
  });
}
