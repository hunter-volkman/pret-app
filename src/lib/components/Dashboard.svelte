<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { stores, selectedStores, selectedStoreData } from '$lib/stores/appStore';
  import { STORE_CONFIGS } from '$lib/services/viamConfig';
  import { 
    Activity, 
    Thermometer, 
    Camera, 
    Wifi, 
    AlertTriangle, 
    CheckCircle, 
    Clock,
    MapPin,
    Zap,
    TrendingUp,
    RefreshCw
  } from 'lucide-svelte';
  
  // Real-time data simulation
  let currentTime = new Date();
  let timeInterval: NodeJS.Timeout;
  
  // Mock real-time data
  let storeMetrics = STORE_CONFIGS.map(store => ({
    ...store,
    status: Math.random() > 0.3 ? 'online' : 'offline',
    fillPercentage: Math.floor(Math.random() * 40) + 60,
    temperature: 3.2 + Math.random() * 2,
    lastUpdate: new Date(Date.now() - Math.random() * 300000),
    alertCount: Math.floor(Math.random() * 3),
    dailyTransactions: Math.floor(Math.random() * 500) + 200
  }));
  
  $: onlineStores = storeMetrics.filter(store => store.status === 'online').length;
  $: totalAlerts = storeMetrics.reduce((sum, store) => sum + store.alertCount, 0);
  $: avgFillLevel = Math.round(storeMetrics.reduce((sum, store) => sum + store.fillPercentage, 0) / storeMetrics.length);
  
  let selectedStoreId = storeMetrics[0]?.id || '';
  $: selectedStore = storeMetrics.find(s => s.id === selectedStoreId);
  
  function updateTime() {
    currentTime = new Date();
    storeMetrics = storeMetrics.map(store => ({
      ...store,
      fillPercentage: Math.max(10, store.fillPercentage + (Math.random() - 0.5) * 5),
      temperature: Math.max(1, Math.min(8, store.temperature + (Math.random() - 0.5) * 0.5)),
      lastUpdate: Math.random() > 0.8 ? new Date() : store.lastUpdate
    }));
  }
  
  onMount(() => {
    timeInterval = setInterval(updateTime, 2000);
  });
  
  onDestroy(() => {
    if (timeInterval) clearInterval(timeInterval);
  });
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'connecting': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  }
  
  function getStatusBg(status: string) {
    switch (status) {
      case 'online': return 'bg-green-500/20 border-green-500/30';
      case 'offline': return 'bg-red-500/20 border-red-500/30';
      case 'connecting': return 'bg-yellow-500/20 border-yellow-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  }
  
  function formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  function getTimeSince(date: Date) {
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
  <header class="border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-xl font-bold">
            P
          </div>
          <div>
            <h1 class="text-xl font-bold text-white">Pret Monitor</h1>
            <p class="text-sm text-slate-400">Real-time Operations Intelligence</p>
          </div>
        </div>
        
        <div class="flex items-center gap-6">
          <div class="text-right">
            <div class="text-lg font-mono font-bold text-white">{formatTime(currentTime)}</div>
            <div class="text-xs text-slate-400">Live Data</div>
          </div>
          
          <div class="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-sm text-green-400 font-medium">System Online</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="p-6 space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm font-medium">Stores Online</p>
            <p class="text-2xl font-bold text-white mt-1">{onlineStores}/{storeMetrics.length}</p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Activity class="w-6 h-6 text-green-400" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-1 text-xs">
          <TrendingUp class="w-3 h-3 text-green-400" />
          <span class="text-green-400">98.2% uptime</span>
        </div>
      </div>

      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm font-medium">Active Alerts</p>
            <p class="text-2xl font-bold text-white mt-1">{totalAlerts}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-1 text-xs">
          <Clock class="w-3 h-3 text-slate-400" />
          <span class="text-slate-400">2 resolved today</span>
        </div>
      </div>

      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm font-medium">Avg Fill Level</p>
            <p class="text-2xl font-bold text-white mt-1">{avgFillLevel}%</p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Zap class="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-1 text-xs">
          <TrendingUp class="w-3 h-3 text-blue-400" />
          <span class="text-blue-400">+5% vs yesterday</span>
        </div>
      </div>

      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm font-medium">Temp Range</p>
            <p class="text-2xl font-bold text-white mt-1">2-6°C</p>
          </div>
          <div class="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Thermometer class="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-1 text-xs">
          <CheckCircle class="w-3 h-3 text-green-400" />
          <span class="text-green-400">All in range</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <div class="bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
          <div class="p-6 border-b border-slate-800">
            <h2 class="text-lg font-semibold text-white">Store Locations</h2>
            <p class="text-sm text-slate-400">Select a store to view details</p>
          </div>
          
          <div class="p-4 space-y-2 max-h-96 overflow-y-auto">
            {#each storeMetrics as store}
              <button 
                on:click={() => selectedStoreId = store.id}
                class="w-full text-left p-4 rounded-lg border transition-all duration-200 {selectedStoreId === store.id 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-slate-900/30 border-slate-800 hover:bg-slate-800/50'}"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-white">{store.name}</h3>
                  <span class="text-xs px-2 py-1 rounded-full {getStatusBg(store.status)} {getStatusColor(store.status)}">
                    {store.status}
                  </span>
                </div>
                
                <div class="flex items-center gap-1 text-xs text-slate-400 mb-2">
                  <MapPin class="w-3 h-3" />
                  {store.region}
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span class="text-slate-400">Fill:</span>
                    <span class="text-white font-medium ml-1">{Math.round(store.fillPercentage)}%</span>
                  </div>
                  <div>
                    <span class="text-slate-400">Temp:</span>
                    <span class="text-white font-medium ml-1">{store.temperature.toFixed(1)}°C</span>
                  </div>
                </div>
                
                <div class="text-xs text-slate-500 mt-2">
                  Last update: {getTimeSince(store.lastUpdate)}
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="lg:col-span-2">
        {#if selectedStore}
          <div class="space-y-6">
            <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-xl font-bold text-white">{selectedStore.name}</h2>
                  <p class="text-slate-400">{selectedStore.address}</p>
                </div>
                <button class="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                  <RefreshCw class="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div class="text-2xl font-bold text-white">{Math.round(selectedStore.fillPercentage)}%</div>
                  <div class="text-xs text-slate-400">Fill Level</div>
                </div>
                <div class="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div class="text-2xl font-bold text-white">{selectedStore.temperature.toFixed(1)}°C</div>
                  <div class="text-xs text-slate-400">Temperature</div>
                </div>
                <div class="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div class="text-2xl font-bold text-white">{selectedStore.capabilities.sensorCount}</div>
                  <div class="text-xs text-slate-400">Sensors</div>
                </div>
                <div class="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div class="text-2xl font-bold text-white">{selectedStore.dailyTransactions}</div>
                  <div class="text-xs text-slate-400">Daily Orders</div>
                </div>
              </div>
            </div>

            <div class="bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
              <div class="p-6 border-b border-slate-800">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-white">Live Camera Feed</h3>
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span class="text-sm text-green-400">Live</span>
                  </div>
                </div>
              </div>
              
              <div class="p-6">
                <div class="aspect-video bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800"></div>
                  <div class="relative z-10 text-center">
                    <Camera class="w-12 h-12 text-slate-500 mx-auto mb-2" />
                    <p class="text-slate-400">Camera feed would display here</p>
                    <p class="text-xs text-slate-500 mt-1">CV analysis: {Math.round(selectedStore.fillPercentage)}% fill detected</p>
                  </div>
                  
                  <div class="absolute top-4 left-4 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
                    A-1: {Math.round(selectedStore.fillPercentage)}%
                  </div>
                  <div class="absolute top-4 right-4 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
                    No person detected
                  </div>
                </div>
                
                <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div class="text-center p-2 bg-slate-800/50 rounded">
                    <div class="text-white font-medium">A-1</div>
                    <div class="text-slate-400">{Math.round(selectedStore.fillPercentage)}%</div>
                  </div>
                  <div class="text-center p-2 bg-slate-800/50 rounded">
                    <div class="text-white font-medium">B-1</div>
                    <div class="text-slate-400">{Math.round(selectedStore.fillPercentage - 10)}%</div>
                  </div>
                  <div class="text-center p-2 bg-slate-800/50 rounded">
                    <div class="text-white font-medium">C-1</div>
                    <div class="text-slate-400">{Math.round(selectedStore.fillPercentage + 5)}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
              <div class="p-6 border-b border-slate-800">
                <h3 class="text-lg font-semibold text-white">Temperature Monitoring</h3>
                <p class="text-sm text-slate-400">LoRaWAN sensor network</p>
              </div>
              
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each Array(selectedStore.capabilities.sensorCount) as _, i}
                    <div class="p-4 bg-slate-800/50 rounded-lg">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-white">Sensor {i + 1}</span>
                        <span class="text-xs px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400">
                          Online
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Thermometer class="w-4 h-4 text-cyan-400" />
                        <span class="text-lg font-bold text-white">
                          {(selectedStore.temperature + (Math.random() - 0.5) * 0.5).toFixed(1)}°C
                        </span>
                      </div>
                      <div class="text-xs text-slate-400 mt-1">
                        {i % 2 === 0 ? 'Refrigerator' : 'Display case'} • Updated {Math.floor(Math.random() * 5) + 1}m ago
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
