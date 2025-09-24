import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, codeVerifier, redirectUri } = request.body;
  const clientId = process.env.VITE_VIAM_OAUTH_CLIENT_ID;
  const clientSecret = process.env.VIAM_OAUTH_CLIENT_SECRET;

  if (!code || !codeVerifier || !redirectUri) {
    return response.status(400).json({ error: 'Missing required parameters.' });
  }

  if (!clientId || !clientSecret) {
    console.error('[API OAuth] Server not configured with OAuth credentials.');
    return response.status(500).json({ error: 'Authentication service not configured.' });
  }

  const tokenUrl = 'https://auth.viam.com/oauth2/token';

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('code_verifier', codeVerifier);

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('[API OAuth] Token exchange failed:', tokenData);
      return response.status(tokenResponse.status).json({
        error: tokenData.error_description || 'Failed to exchange code for token.',
      });
    }

    response.setHeader('Cache-Control', 'no-store');
    // Pass the id_token through to the client
    return response.status(200).json(tokenData);

  } catch (error) {
    console.error('[API OAuth Error]', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
