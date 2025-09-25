<!-- src/lib/components/TemperatureChart.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { viamClient } from '$lib/stores/machines';
  import { get } from 'svelte/store';
  
  Chart.register(...registerables);
  
  let { machineId, sensorName, hours = 6 } = $props<{
    machineId: string;
    sensorName: string;
    hours?: number;
  }>();
  
  let canvas: HTMLCanvasElement = $state();
  let chart: Chart | null = null;
  let loading = $state(true);
  let error = $state('');
  
  async function fetchHistoricalData() {
    try {
      const client = get(viamClient);
      if (!client) throw new Error('Not connected');
      
      const endTime = new Date();
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // Query Viam Data API
      const response = await client.dataClient.tabularDataByFilter({
        partId: machineId,
        componentName: sensorName,
        method: 'Readings',
        startTime,
        endTime,
        limit: 1000
      });
      
      // Process data - response has a data array
      const dataPoints = (response.data || [])
        .map((entry: any) => {
          // Look for temperature in the data object
          const temp = entry.data?.temperature || 
                      entry.data?.temp || 
                      entry.data?.TempC_SHT || 
                      entry.data?.TempC_DS ||
                      0;
          
          return {
            time: new Date(entry.timeReceived || entry.timeCaptured),
            value: typeof temp === 'number' ? temp : parseFloat(temp)
          };
        })
        .filter(p => p.value !== 0 && !isNaN(p.value))
        .sort((a, b) => a.time.getTime() - b.time.getTime());
      
      // Update chart
      if (dataPoints.length > 0) {
        if (chart) {
          chart.data.labels = dataPoints.map(p => p.time.toLocaleTimeString());
          chart.data.datasets[0].data = dataPoints.map(p => p.value);
          chart.update();
        } else {
          createChart(dataPoints);
        }
      } else {
        error = 'No data available for this period';
      }
      
      loading = false;
    } catch (err: any) {
      error = err.message;
      loading = false;
      console.error('Failed to fetch historical data:', err);
    }
  }
  
  function createChart(dataPoints: any[]) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataPoints.map(p => p.time.toLocaleTimeString()),
        datasets: [{
          label: 'Temperature (°C)',
          data: dataPoints.map(p => p.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 6
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: '°C'
            }
          }
        }
      }
    });
  }
  
  onMount(() => {
    fetchHistoricalData();
  });
  
  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<div class="h-48 relative">
  {#if loading}
    <div class="absolute inset-0 flex items-center justify-center">
      <p class="text-sm text-gray-500">Loading history...</p>
    </div>
  {:else if error}
    <div class="absolute inset-0 flex items-center justify-center">
      <p class="text-sm text-red-600">No historical data available</p>
    </div>
  {:else}
    <canvas bind:this={canvas}></canvas>
  {/if}
</div>