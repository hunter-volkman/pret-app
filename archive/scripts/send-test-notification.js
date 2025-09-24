#!/usr/bin/env node

import fetch from 'node-fetch';

const API_ENDPOINT = 'http://localhost:3000/api/notify';

// --- Configuration ---
// You can change this to any storeId you are subscribed to in the app.
const DEFAULT_STORE_ID = '70yfjlr1vp'; 
const DEFAULT_TITLE = '🚨 Test Alert';
const DEFAULT_MESSAGE = 'This is a test notification from our script!';
// ---------------------

async function sendNotification(storeId, title, message) {
  console.log(`🚀 Sending test notification for store: ${storeId}`);
  
  const payload = {
    storeId,
    title,
    message,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json();

    if (response.ok) {
      console.log('✅ Success! API responded:', responseBody);
    } else {
      console.error(`❌ Error (${response.status}): API responded with:`, responseBody);
    }
  } catch (error) {
    console.error('❌ Failed to connect to the API. Is the dev server running?', error);
  }
}

// Allow command-line arguments to override defaults
const storeId = process.argv[2] || DEFAULT_STORE_ID;
const title = process.argv[3] || DEFAULT_TITLE;
const message = process.argv[4] || DEFAULT_MESSAGE;

sendNotification(storeId, title, message);
