import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Generate VAPID Keys
const vapidKeys = webpush.generateVAPIDKeys();

const envContent = `
# VAPID keys for Web Push Notifications
# The public key is safe to expose to the client application.
# The private key MUST be kept secret and only used on the server.
VITE_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"
`;

const envPath = path.join(process.cwd(), '.env');

fs.writeFileSync(envPath, envContent.trim());

console.log('✅ VAPID keys generated and saved to .env file:');
console.log(`   Public Key: ${vapidKeys.publicKey}`);
console.log('🔒 Keep your private key safe!');
