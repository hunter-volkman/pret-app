<!-- src/lib/components/MachineCard.svelte -->
<script lang="ts">
  import { checkMachineStatus } from '$lib/stores/machines';
  
  let { machine } = $props();
  let isOnline = $state(false);
  let statusChecked = $state(false);
  
  $effect(async () => {
    if (machine?.machineId && !statusChecked) {
      statusChecked = true;
      isOnline = await checkMachineStatus(machine.machineId);
    }
  });
</script>

<a 
  href="/machine/{machine.machineId}" 
  class="block rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
>
  <div class="flex justify-between items-start">
    <div>
      <h3 class="font-semibold">{machine.machineName}</h3>
      <p class="text-sm text-gray-500 mt-1">{machine.locationName}</p>
    </div>
    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
      {isOnline ? 'Online' : 'Offline'}
    </span>
  </div>
  <div class="mt-4">
    <span class="text-xs text-gray-400">
      {machine.machineId.slice(0, 8)}...
    </span>
  </div>
</a>