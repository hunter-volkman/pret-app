<!-- src/lib/components/StockFillBar.svelte -->
<script lang="ts">
  let { data, sensorName } = $props<{
    data: any;
    sensorName: string;
  }>();
  
  // Extract percentage from various possible field names
  function getPercentage(): number {
    if (!data) return 0;
    
    // Try common field names
    const possibleFields = ['fill_level', 'percentage', 'level', 'value'];
    for (const field of possibleFields) {
      if (data[field] !== undefined) {
        const value = Number(data[field]);
        // Assume 0-100 range, adjust if needed
        return Math.min(100, Math.max(0, value));
      }
    }
    
    return 0;
  }
  
  const percentage = getPercentage();
  
  // Color based on level
  const barColor = percentage < 30 ? 'bg-red-500' : 
                   percentage < 70 ? 'bg-yellow-500' : 
                   'bg-green-500';
</script>

{#if sensorName.includes('langer_fill')}
  <div class="mt-2 pt-2 border-t border-gray-100">
    <div class="flex justify-between text-xs text-gray-600 mb-1">
      <span>Stock Level</span>
      <span>{percentage.toFixed(0)}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div 
        class="h-2 rounded-full transition-all {barColor}"
        style="width: {percentage}%"
      ></div>
    </div>
  </div>
{/if}