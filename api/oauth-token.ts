import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, codeVerifier, redirectUri } = request.body;
    
    if (!code || !codeVerifier || !redirectUri) {
      return response.status(400).json({ 
        error: 'Missing required parameters: code, codeVerifier, redirectUri' 
      });
    }

    const clientId = process.env.VITE_VIAM_OAUTH_CLIENT_ID;
    
    if (!clientId) {
      console.error('Missing VITE_VIAM_OAUTH_CLIENT_ID in environment');
      return response.status(500).json({ error: 'OAuth configuration missing' });
    }

    console.log('🔄 Exchanging authorization code for tokens...');

    // Exchange code for tokens with Viam's token endpoint
    const tokenResponse = await fetch('https://auth.viam.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Viam token exchange failed:', tokenData);
      return response.status(tokenResponse.status).json({ 
        error: 'Token exchange failed',
        details: tokenData 
      });
    }

    console.log('✅ Token exchange successful');

    return response.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
    });

  } catch (error) {
    console.error('❌ OAuth Token Exchange Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
