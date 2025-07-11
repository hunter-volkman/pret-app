<script lang="ts">
  import { ViamProvider } from '@viamrobotics/svelte-sdk';
  import { viamCredentials, selectedStores } from '$lib/stores/appStore';
  import { createDialConfigs } from '$lib/services/viamConfig';
  import '../app.css';

  // Reactive dial configs based on credentials and selected stores
  $: dialConfigs = $viamCredentials.isConfigured 
    ? createDialConfigs(
        $viamCredentials.apiKeyId,
        $viamCredentials.apiKey,
        Array.from($selectedStores)
      )
    : {};
</script>

{#if $viamCredentials.isConfigured}
  <ViamProvider {dialConfigs}>
    <slot />
  </ViamProvider>
{:else}
  <slot />
{/if}
