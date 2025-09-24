<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initViam, loadMachines } from '$lib/stores/machines';
  
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      await initViam();
      await loadMachines();
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="min-h-screen grid place-items-center">
    <p>Loading...</p>
  </div>
{:else if error}
  <div class="min-h-screen grid place-items-center">
    <p class="text-red-600">{error}</p>
  </div>
{:else}
  <slot />
{/if}