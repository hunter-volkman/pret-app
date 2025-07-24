import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { accessToken } = request.body;
    
    if (!accessToken) {
      return response.status(400).json({ error: 'Access token required' });
    }

    // Try to get user info from Viam
    const userResponse = await fetch('https://auth.viam.com/oauth2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (userResponse.ok) {
      const userInfo = await userResponse.json();
      return response.status(200).json(userInfo);
    } else {
      // Fallback: Use the token to get basic info from Viam API
      const viamResponse = await fetch('https://app.viam.com/api/v1/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (viamResponse.ok) {
        const viamUser = await viamResponse.json();
        return response.status(200).json({
          sub: viamUser.id || 'viam-user',
          email: viamUser.email || 'user@viam.com',
          given_name: viamUser.firstName || viamUser.name?.split(' ')[0] || 'Viam',
          family_name: viamUser.lastName || viamUser.name?.split(' ')[1] || 'User'
        });
      }
    }

    // Final fallback
    return response.status(200).json({
      sub: 'authenticated-user',
      email: 'user@viam.com',
      given_name: 'Authenticated',
      family_name: 'User'
    });

  } catch (error) {
    console.error('Error fetching user info:', error);
    return response.status(500).json({ error: 'Failed to fetch user info' });
  }
}
