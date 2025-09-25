<!-- src/lib/components/SensorDisplay.svelte -->
<script lang="ts">
  import { type RobotClient, SensorClient } from '@viamrobotics/sdk';
  import { onMount, onDestroy } from 'svelte';
  import StockFillBar from './StockFillBar.svelte';
  
  let { robot, sensorName } = $props<{ robot: RobotClient; sensorName: string }>();
  let sensorData = $state<any>(null);
  let loading = $state(true);
  let error = $state('');
  let interval: NodeJS.Timeout | null = null;
  let mounted = true;
  
  async function fetchSensorData() {
    if (!mounted) return;
    
    try {
      const sensor = new SensorClient(robot, sensorName);
      const readings = await sensor.getReadings();

      if (!mounted) return;
      
      sensorData = readings;
      error = '';
    } catch (err: any) {
      error = err.message || 'Failed to read sensor';
      console.error(`Sensor error for ${sensorName}:`, err.message);
    } finally {
      if (mounted) loading = false;
    }
  }
  
  onMount(() => {
    fetchSensorData();
    // Refresh every 10 seconds
    interval = setInterval(fetchSensorData, 10000);
  });
  
  onDestroy(() => {
    mounted = false;
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
  });
</script>

<div class="rounded-lg border border-gray-200 p-4">
  <h4 class="font-medium text-gray-700 mb-2">{sensorName}</h4>
  
  {#if loading && !sensorData}
    <p class="text-sm text-gray-500">Loading...</p>
  {:else if error}
    <p class="text-sm text-red-600">{error}</p>
  {:else if sensorData}
    <div class="space-y-1">
      {#each Object.entries(sensorData) as [key, value]}
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">{key}:</span>
          <span class="font-mono">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
        </div>
      {/each}
    </div>
    <!-- Stock fill bar: langer_fill sensor -->
    <StockFillBar data={sensorData} sensorName={sensorName} />
  {/if}
</div>