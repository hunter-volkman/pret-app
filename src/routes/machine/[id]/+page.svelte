<!-- src/routes/machine/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { machines, checkMachineStatus, connectToMachine } from '$lib/stores/machines';
  import type { RobotClient } from '@viamrobotics/sdk';
  import { get } from 'svelte/store';
  import SensorDisplay from '$lib/components/SensorDisplay.svelte';
  import CameraDisplay from '$lib/components/CameraDisplay.svelte';
  import TemperatureChart from '$lib/components/TemperatureChart.svelte';
  
  let robot: RobotClient | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  let machineData: any = $state(null);
  let isOnline = $state(false);
  let sensors: any[] = $state([]);
  let cameras: any[] = $state([]);
  let mounted = true;
  let expandedSensor: string | null = $state(null);
  
  async function connectAndLoadResources() {
    try {
      // Get machine data
      const allMachines = get(machines);
      machineData = allMachines.find(m => m.machineId === $page.params.id);
      
      if (!machineData) {
        throw new Error('Machine not found');
      }
      
      // Check online status
      isOnline = await checkMachineStatus($page.params.id);
      
      if (!isOnline) {
        loading = false;
        return;
      }
      
      // Connect to machine
      robot = await connectToMachine(
        machineData.machineId,
        machineData.locationId,
        machineData.machineName
      );
      
      if (!mounted) {
        // Component unmounted during connection
        if (robot) robot.disconnect();
        return;
      }
      
      // Get available resources
      const resourceNames = await robot.resourceNames();

      // Filter resources (test)
      const DISPLAY_SENSORS = [
        /^sensor-\d+$/,        // Temperatures
        /^langer_fill/,        // Stock
      ];
      
      sensors = resourceNames.filter((r: any) => 
        r.type === 'component' && r.subtype === 'sensor' && DISPLAY_SENSORS.some(pattern => pattern.test(r.name))
      );
      
      cameras = resourceNames.filter((r: any) => 
        r.type === 'component' && r.subtype === 'camera'
      );
      
      console.log(`📊 Found ${sensors.length} sensors, 📷 ${cameras.length} cameras`);
      
    } catch (err: any) {
      if (!mounted) return;
      error = err.message;
      console.error('Connection failed:', err);
    } finally {
      if (mounted) {
        loading = false;
      }
    }
  }
  
  onMount(() => {
    mounted = true;
    connectAndLoadResources();
    
    // Cleanup function
    return () => {
      mounted = false;
      if (robot) {
        console.log(`🔌 Disconnecting from: ${machineData?.machineName}`);
        robot.disconnect();
        robot = null;
      }
    };
  });
  
  onDestroy(() => {
    mounted = false;
    if (robot) {
      console.log('Cleanup: Disconnecting from machine');
      robot.disconnect();
      robot = null;
    }
  });
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white shadow-sm">
    <div class="mx-auto max-w-7xl px-4 py-4">
      <div class="flex items-center gap-4">
        <a href="/" class="text-gray-500 hover:text-gray-700">
          ← Back
        </a>
        {#if machineData}
          <div>
            <h1 class="text-2xl font-bold">{machineData.machineName}</h1>
            <p class="text-sm text-gray-500">{machineData.locationName}</p>
          </div>
        {/if}
      </div>
    </div>
  </header>
  
  <main class="mx-auto max-w-7xl p-8">
    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p class="mt-2 text-gray-500">Connecting to machine...</p>
      </div>
    {:else if !isOnline}
      <div class="rounded-md bg-yellow-50 p-4">
        <h3 class="text-sm font-medium text-yellow-800">Machine Offline</h3>
        <p class="mt-1 text-sm text-yellow-700">This machine is currently offline</p>
      </div>
    {:else if error}
      <div class="rounded-md bg-red-50 p-4">
        <h3 class="text-sm font-medium text-red-800">Connection Error</h3>
        <p class="mt-1 text-sm text-red-700">{error}</p>
      </div>
    {:else if robot}
      <div class="space-y-6">
        <!-- Status Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-medium">Machine Status</h2>
            <span class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Connected
            </span>
          </div>
          <dl class="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">Machine ID</dt>
              <dd class="text-sm text-gray-900">{machineData.machineId}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Location</dt>
              <dd class="text-sm text-gray-900">{machineData.locationName}</dd>
            </div>
          </dl>
        </div>
        
        <!-- Cameras Section -->
        {#if cameras.length > 0}
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-medium mb-4">Cameras</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              {#each cameras as camera}
                <CameraDisplay {robot} cameraName={camera.name} />
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Sensors Section -->
        {#if sensors.length > 0}
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-medium mb-4">Sensors</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {#each sensors as sensor}
                <div>
                    <SensorDisplay {robot} sensorName={sensor.name} />
                    
                    {#if sensor.name.match(/^sensor-\d+$/)}
                    <button onclick={() => expandedSensor = expandedSensor === sensor.name ? null : sensor.name}
                        class="w-full mt-2 text-xs text-blue-600 hover:text-blue-800 py-1">
                        {expandedSensor === sensor.name ? 'Hide' : 'View'} History
                    </button>
                    
                    {#if expandedSensor === sensor.name}
                        <div class="mt-2">
                        <TemperatureChart machineId={machineData.machineId} sensorName={sensor.name} hours={6} />
                        </div>
                    {/if}
                    {/if}
                </div>
                {/each}
            </div>
          </div>
        {:else if cameras.length === 0}
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-sm text-gray-500">No sensors or cameras available</p>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>