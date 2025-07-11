<script lang="ts">
  import { onMount } from 'svelte';
  import { viamCredentials, storeActions } from '$lib/stores/appStore';
  import ConnectionSetup from '$lib/components/ConnectionSetup.svelte';
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
    <ConnectionSetup />
  {/if}
{:else}
  <!-- Loading state -->
  <div class="min-h-screen bg-dark-900 flex items-center justify-center">
    <div class="text-center">
      <div class="text-4xl mb-4">🥪</div>
      <div class="text-dark-200 font-semibold">Loading Pret Monitor...</div>
    </div>
  </div>
{/if}
