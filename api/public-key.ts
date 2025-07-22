import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  _request: VercelRequest,
  response: VercelResponse,
) {
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    console.error('VAPID public key is not configured in environment variables.');
    return response.status(500).json({ error: 'VAPID public key not configured.' });
  }
  
  return response.status(200).json({ publicKey });
}
