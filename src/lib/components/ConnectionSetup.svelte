<script lang="ts">
  import { storeActions } from '$lib/stores/appStore';
  import { Wifi, AlertCircle } from 'lucide-svelte';

  let apiKeyId = '';
  let apiKey = '';
  let isConnecting = false;
  let error = '';

  async function handleConnect() {
    if (!apiKeyId || !apiKey) {
      error = 'Please enter your API credentials';
      return;
    }

    isConnecting = true;
    error = '';

    try {
      storeActions.configureViam(apiKeyId, apiKey);
      console.log('Viam configured successfully!');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Connection failed';
    } finally {
      isConnecting = false;
    }
  }
</script>

<div class="min-h-screen bg-dark-900 flex items-center justify-center p-4">
  <div class="bg-dark-800 rounded-xl border border-dark-700 p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-400 rounded-xl flex items-center justify-center text-2xl mb-4 mx-auto">
        🥪
      </div>
      <h1 class="text-2xl font-bold text-dark-50 mb-2">Pret Monitor</h1>
      <p class="text-dark-400">Connect to your Viam machines</p>
    </div>

    <form on:submit|preventDefault={handleConnect} class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-dark-300 mb-2">API Key ID</label>
        <input
          type="text"
          bind:value={apiKeyId}
          class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-dark-50 placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="your-api-key-id"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-dark-300 mb-2">API Key</label>
        <input
          type="password"
          bind:value={apiKey}
          class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-dark-50 placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="your-api-key"
          required
        />
      </div>

      {#if error}
        <div class="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      {/if}

      <button
        type="submit"
        disabled={isConnecting}
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
      >
        {#if isConnecting}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Connecting...
        {:else}
          <Wifi size={16} />
          Connect to Viam
        {/if}
      </button>
    </form>

    <div class="mt-6 p-4 bg-dark-750 rounded-lg">
      <p class="text-xs text-dark-400 mb-2 font-medium">Quick Setup:</p>
      <ol class="text-xs text-dark-500 space-y-1">
        <li>1. Get your API credentials from app.viam.com</li>
        <li>2. Navigate to your organization settings</li>
        <li>3. Create an API key with machine access</li>
        <li>4. Enter credentials above to connect</li>
      </ol>
    </div>
  </div>
</div>
