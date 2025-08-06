import { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Thermometer, Box, Wifi, WifiOff, AlertCircle, Bell, BellOff, AlertTriangle, Loader2, ChevronRight, History, Info } from 'lucide-react';
import { useStore, StoreData, TempSensor } from '../stores/store';
import { SparklineChart } from './SparklineChart';

type TrendData = Record<string, { x: string; y: number }[]>;

const getFillColor = (status: 'ok' | 'low' | 'empty') => ({
  'ok': 'bg-green-100 text-green-800',
  'low': 'bg-yellow-100 text-yellow-800',
  'empty': 'bg-red-100 text-red-800',
})[status] || 'bg-gray-100 text-gray-800';

const getTempUi = (status: 'normal' | 'warning' | 'critical') => ({
  'normal': { color: 'bg-green-500', textColor: 'text-gray-800', chartColor: '#10B981' },
  'warning': { color: 'bg-yellow-500', textColor: 'text-yellow-600', chartColor: '#F59E0B' },
  'critical': { color: 'bg-red-500', textColor: 'text-red-600', chartColor: '#EF4444' },
})[status] || { color: 'bg-gray-500', textColor: 'text-gray-600', chartColor: '#6B7280' };

interface StoreCardProps {
  store: StoreData;
  isSelected: boolean;
  onToggle: () => void;
  onHeaderClick: () => void;
  onSensorClick: (sensor: TempSensor) => void;
  onViewHistoryClick: () => void;
}

const MachineStatusIndicator = ({ name, status }: { name: string, status: 'online' | 'offline' }) => {
  const isOnline = status === 'online';
  return (
    <div className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span>{name}</span>
    </div>
  );
};

export function StoreCard({ store, isSelected, onToggle, onHeaderClick, onSensorClick, onViewHistoryClick }: StoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const { alerts, notificationSubscriptions, toggleNotificationSubscription } = useStore();
  
  const alertsForStore = alerts.filter(a => a.storeId === store.id && !a.read);
  const isSubscribed = notificationSubscriptions.has(store.id);

  const stockRegions = store.stockRegions || [];
  const tempSensors = store.tempSensors || [];
  
  const sortedStockRegions = [...stockRegions].sort((a, b) => {
    const [colA, rowA] = a.id.split('-');
    const [colB, rowB] = b.id.split('-');
    if (rowA !== rowB) return parseInt(rowA) - parseInt(rowB);
    return colA.localeCompare(colB);
  });
  
  const activeIssuesCount = tempSensors.filter(s => s.status !== 'normal').length +
                            stockRegions.filter(r => r.status !== 'ok').length;

  const isStoreOnline = store.stockStatus === 'online' || store.tempStatus === 'online';
  const isPolling = isSelected && isStoreOnline && !store.lastUpdate;

  useEffect(() => {
    if (expanded && !trends && !isLoadingTrends) {
      setIsLoadingTrends(true);
      fetch(`/api/temperature-trends?tempPartId=${store.tempPartId}&hours=6`)
        .then(res => res.json())
        .then(data => setTrends(data))
        .catch(err => console.error("Failed to fetch trends:", err))
        .finally(() => setIsLoadingTrends(false));
    }
  }, [expanded, trends, isLoadingTrends, store.tempPartId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center space-x-2 mb-2 cursor-pointer" onClick={onHeaderClick}>
              <h3 className="text-lg font-bold text-gray-800 hover:text-blue-600">{store.name}</h3>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <MachineStatusIndicator name="Stock" status={store.stockStatus} />
              <MachineStatusIndicator name="Temp" status={store.tempStatus} />
            </div>
            <p className="text-sm text-gray-500 flex items-center"><MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />{store.address}</p>
            {alertsForStore.length > 0 && (
              <div className="flex items-center text-red-600 text-sm font-semibold mt-2"><AlertCircle className="w-4 h-4 mr-1.5" />{alertsForStore.length} new alert{alertsForStore.length > 1 ? 's' : ''}</div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={(e) => { e.stopPropagation(); toggleNotificationSubscription(store.id); }} className={`p-2 rounded-lg transition-colors ${isSubscribed ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`} aria-label={isSubscribed ? 'Unsubscribe' : 'Subscribe'}>
              {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={isSelected} onChange={onToggle} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className={`mt-4 border rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between transition-colors duration-300 ${isSelected ? 'bg-gray-50/80 border-gray-200' : 'bg-gray-100 border-transparent'}`}>
          {!isSelected ? <p className="text-center text-sm text-gray-400 w-full">Enable monitoring to see live data</p> : 
           isPolling ? <div className="flex items-center justify-center w-full text-sm text-gray-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching live data...</div> :
           !isStoreOnline ? <div className="flex items-center justify-center w-full text-sm text-gray-500"><WifiOff className="w-4 h-4 mr-2" />All machines are offline</div> : (
            <div className="flex sm:flex-row flex-col sm:items-center w-full justify-between gap-3 sm:gap-4 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-1.5"><Box className="w-4 h-4" /><span>{stockRegions.length > 0 ? `${stockRegions.length} Regions` : '-'}</span></div>
                <div className="flex items-center space-x-1.5"><Thermometer className="w-4 h-4" /><span>{tempSensors.length > 0 ? `${tempSensors.length} Sensors` : '-'}</span></div>
              </div>
              <div className={`flex items-center space-x-1.5 font-semibold px-3 py-1 rounded-full w-full sm:w-auto justify-center ${activeIssuesCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {activeIssuesCount > 0 ? <AlertTriangle className="w-4 h-4" /> : '✅'}
                <span>{activeIssuesCount} Issue{activeIssuesCount !== 1 && 's'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isSelected && isStoreOnline && (
        <div className="border-t border-gray-200">
          <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <span className="font-medium">View Details</span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
          
          {expanded && (
            <div className="px-5 pb-5 bg-gray-50/70 border-t border-gray-200 animate-in fade-in-0 duration-300 divide-y divide-gray-200">
              {/* --- Stock Regions Section --- */}
              <div className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Stock Regions</h4>
                  <button onClick={onViewHistoryClick} className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <History className="w-4 h-4" />
                    <span>VIEW HISTORY</span>
                  </button>
                </div>
                {stockRegions.length > 0 ? (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {sortedStockRegions.map((region) => (
                      <div key={region.id} className={`text-center p-2 rounded-lg transition-transform hover:scale-105 ${getFillColor(region.status)}`}>
                        <div className="font-bold">{region.id}</div>
                        <div className="text-xs">{region.fillLevel}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-center p-3 text-sm text-gray-500 bg-gray-100 rounded-lg">
                    <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                    No live stock data available.
                  </div>
                )}
              </div>
              {/* --- Temperature Sensors Section --- */}
              <div className="py-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Temperature Sensors</h4>
                {tempSensors.length > 0 ? (
                  <div className="space-y-2">
                    {tempSensors.map((sensor) => {
                      const uiProps = getTempUi(sensor.status);
                      const trendData = trends?.[sensor.id] || [];
                      return (
                        <button key={sensor.id} onClick={() => onSensorClick(sensor)} className="w-full flex items-center justify-between text-sm p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-400 group transition-colors text-left">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-medium text-gray-800 truncate">{sensor.name}</p>
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">{sensor.id}</span>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {isLoadingTrends ? <div className="w-[60px] h-[35px] bg-gray-200 rounded animate-pulse" /> : trends ? (
                              <div className="opacity-70">
                                <SparklineChart data={trendData} color={uiProps.chartColor} />
                              </div>
                            ) : <div className="w-[60px]" />}
                            <span className={`font-bold w-16 text-right ${uiProps.textColor}`}>{sensor.temperature.toFixed(1)}°C</span>
                            <div className={`w-2.5 h-2.5 rounded-full ${uiProps.color}`} />
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                   <div className="flex items-center justify-center text-center p-3 text-sm text-gray-500 bg-gray-100 rounded-lg">
                    <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                    No live temperature data available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
