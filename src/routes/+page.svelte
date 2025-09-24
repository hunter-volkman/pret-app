<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { machines } from '$lib/stores/machines';
  import MachineCard from '$lib/components/MachineCard.svelte';
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white shadow-sm">
    <div class="mx-auto max-w-7xl px-4 py-4">
      <h1 class="text-2xl font-bold">Pret App</h1>
    </div>
  </header>
  
  <main class="mx-auto max-w-7xl p-8">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each $machines as machine}
        <MachineCard {machine} />
      {/each}
    </div>
  </main>
</div>