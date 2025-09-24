<!-- src/routes/machine/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { machines, accessToken, checkMachineStatus } from '$lib/stores/machines';
  import { createRobotClient, type RobotClient } from '@viamrobotics/sdk';
  import { get } from 'svelte/store';
  import SensorDisplay from '$lib/components/SensorDisplay.svelte';
  
  let robot: RobotClient | null = null;
  let loading = true;
  let error = '';
  let machineData: any = null;
  let isOnline = false;
  let resources: any[] = [];
  
  onMount(async () => {
    try {
      const allMachines = get(machines);
      machineData = allMachines.find(m => m.machineId === $page.params.id);
      
      if (!machineData) {
        throw new Error('Machine not found');
      }
      
      isOnline = await checkMachineStatus($page.params.id);
      
      if (!isOnline) {
        loading = false;
        return;
      }
      
      const machineName = machineData.machineName.toLowerCase().replace(/\s+/g, '-');
      const host = `${machineName}-main.${machineData.locationId}.viam.cloud`;
      
      console.log('Connecting to:', host);
      
      const token = get(accessToken);
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      const connection = createRobotClient({
        host,
        credentials: { 
          type: 'access-token', 
          payload: token 
        },
        signalingAddress: 'https://app.viam.com:443'
      });
      
      robot = await Promise.race([connection, timeout]) as RobotClient;
      
      console.log('Connected to machine');
      
      // Get available resources
      const resourceNames = await robot.resourceNames();
      resources = resourceNames.filter((r: any) => 
        r.type === 'component' && r.subtype === 'sensor'
      );
      
      console.log('Available sensors:', resources);
      
    } catch (err: any) {
      error = err.message;
      console.error('Connection failed:', err);
    } finally {
      loading = false;
    }
  });
  
  onMount(() => {
    return () => {
      if (robot) {
        robot.disconnect();
      }
    };
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
        
        <!-- Sensors -->
        {#if resources.length > 0}
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-medium mb-4">Sensors</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {#each resources as resource}
                <SensorDisplay {robot} sensorName={resource.name} />
              {/each}
            </div>
          </div>
        {:else}
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-sm text-gray-500">No sensors available</p>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>