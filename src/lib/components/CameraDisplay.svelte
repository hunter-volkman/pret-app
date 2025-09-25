<!-- src/lib/components/CameraDisplay.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { CameraClient } from '@viamrobotics/sdk';
  import type { RobotClient } from '@viamrobotics/sdk';
  
  let { robot, cameraName }: { robot: RobotClient; cameraName: string } = $props();
  
  let imageUrl = $state('');
  let loading = $state(true);
  let error = $state('');
  let interval: NodeJS.Timeout;
  
  async function getSnapshot() {
    try {
      console.log(`Getting snapshot for camera: ${cameraName}`);
      const camera = new CameraClient(robot, cameraName);
      const image = await camera.getImage();
      
      // Convert to base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(image)));
      imageUrl = `data:image/jpeg;base64,${base64}`;
      error = '';
    } catch (err: any) {
      console.error(`Camera error:`, err);
      error = 'Camera unavailable';
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    getSnapshot();
    // Refresh
    interval = setInterval(getSnapshot, 1000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div class="rounded-lg border border-gray-200 overflow-hidden">
  <div class="bg-gray-50 px-4 py-2 border-b">
    <h3 class="text-sm font-medium text-gray-900">{cameraName}</h3>
  </div>
  
  <div class="aspect-video bg-gray-900 relative">
    {#if loading && !imageUrl}
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    {:else if error}
      <div class="absolute inset-0 flex items-center justify-center text-gray-400">
        <p class="text-sm">{error}</p>
      </div>
    {:else if imageUrl}
      <img src={imageUrl} alt="Camera view" class="w-full h-full object-contain" />
    {/if}
  </div>
</div>