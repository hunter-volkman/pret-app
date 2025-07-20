// This flag allows us to completely disable FusionAuth during development
// for a faster workflow when building UI or other features.
// Set VITE_AUTH_ENABLED=false in your .env.local file to bypass login.
export const IS_AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== 'false';
