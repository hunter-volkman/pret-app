<script lang="ts">
  import { onMount } from 'svelte';
  import { viamCredentials, storeActions } from '$lib/stores/appStore';
  import Dashboard from '$lib/components/Dashboard.svelte';

  let mounted = false;

  onMount(() => {
    // Initialize credentials from Viam cookies or localStorage
    storeActions.initializeFromCookies();
    mounted = true;
  });
</script>

<svelte:head>
  <title>Pret Monitor - Real-time Operations Intelligence</title>
  <meta name="description" content="Real-time inventory monitoring for Pret A Manger" />
</svelte:head>

{#if mounted}
  {#if $viamCredentials.isConfigured}
    <Dashboard />
  {:else}
    <!-- Fallback for local development when no Viam cookies -->
    <div class="min-h-screen flex items-center justify-center" style="background-color: #0f172a;">
      <div class="text-center p-8 max-w-md">
        <div class="text-4xl mb-4">🥪</div>
        <div class="text-xl font-bold mb-2" style="color: #e2e8f0;">Pret Monitor</div>
        <div class="text-sm mb-4" style="color: #94a3b8;">
          This app requires Viam authentication. 
          <br />
          Please access via Viam Apps or set up local development cookies.
        </div>
        <div class="text-xs" style="color: #64748b;">
          For local development: Use the cookie setup script from Viam Camera Viewer
        </div>
      </div>
    </div>
  {/if}
{:else}
  <!-- Loading state -->
  <div class="min-h-screen flex items-center justify-center" style="background-color: #0f172a;">
    <div class="text-center">
      <div class="text-4xl mb-4">🥪</div>
      <div class="font-semibold" style="color: #e2e8f0;">Loading Pret Monitor...</div>
    </div>
  </div>
{/if}
