import { useState } from 'react';
import { ChevronDown, MapPin, Thermometer, Box, Wifi, WifiOff, AlertCircle, Bell, BellOff, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { useStore, StoreData, TempSensor } from '../stores/store';

// Helper for stock region grid colors
const getFillColor = (status: 'ok' | 'low' | 'empty') => {
  switch (status) {
    case 'ok': return 'bg-green-100 text-green-800';
    case 'low': return 'bg-yellow-100 text-yellow-800';
    case 'empty': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Helpers for sensor status colors
const getTempColor = (status: 'normal' | 'warning' | 'critical') => {
  switch (status) {
    case 'normal': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'critical': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
const getTempTextColor = (status: 'normal' | 'warning' | 'critical') => {
  switch (status) {
    case 'normal': return 'text-gray-800';
    case 'warning': return 'text-yellow-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

interface StoreCardProps {
  store: StoreData;
  isSelected: boolean;
  onToggle: () => void;
  onHeaderClick: () => void;
  onSensorClick: (sensor: TempSensor) => void;
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

export function StoreCard({ store, isSelected, onToggle, onHeaderClick, onSensorClick }: StoreCardProps) {
  const [expanded, setExpanded] = useState(false);
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
            <button 
              onClick={(e) => { e.stopPropagation(); toggleNotificationSubscription(store.id); }}
              className={`p-2 rounded-lg transition-colors ${isSubscribed ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              aria-label={isSubscribed ? 'Unsubscribe from notifications' : 'Subscribe to notifications'}
            >
              {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={isSelected} onChange={onToggle} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className={`mt-4 border rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between transition-colors duration-300 ${isSelected ? 'bg-gray-50/80 border-gray-200' : 'bg-gray-100 border-transparent'}`}>
          {!isSelected ? (
            <p className="text-center text-sm text-gray-400 w-full">Enable monitoring to see live data</p>
          ) : isPolling ? (
            <div className="flex items-center justify-center w-full text-sm text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fetching live data...
            </div>
          ) : !isStoreOnline ? (
            <div className="flex items-center justify-center w-full text-sm text-gray-500">
              <WifiOff className="w-4 h-4 mr-2" />
              All machines are offline
            </div>
          ) : (
            <>
              <div className="flex sm:flex-row flex-col sm:items-center w-full justify-between gap-3 sm:gap-4 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                          <Box className="w-4 h-4" />
                          <span>{stockRegions.length > 0 ? `${stockRegions.length} Regions` : '-'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                          <Thermometer className="w-4 h-4" />
                          <span>{tempSensors.length > 0 ? `${tempSensors.length} Sensors` : '-'}</span>
                      </div>
                  </div>
                  <div className={`flex items-center space-x-1.5 font-semibold px-3 py-1 rounded-full w-full sm:w-auto justify-center ${activeIssuesCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {activeIssuesCount > 0 ? <AlertTriangle className="w-4 h-4" /> : '✅'}
                      <span>{activeIssuesCount} Issue{activeIssuesCount !== 1 && 's'}</span>
                  </div>
              </div>
            </>
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
            <div className="px-5 pb-5 bg-gray-50 border-t border-gray-200 animate-in fade-in-0 duration-300">
              {stockRegions.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Stock Regions</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {sortedStockRegions.map((region) => (
                      <div key={region.id} className={`text-center p-2 rounded-lg ${getFillColor(region.status)}`}>
                        <div className="font-bold">{region.id}</div>
                        <div className="text-xs">{region.fillLevel}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tempSensors.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Temperature Sensors</h4>
                  <div className="space-y-2">
                    {tempSensors.map((sensor) => (
                      <button
                        key={sensor.id}
                        onClick={() => onSensorClick(sensor)}
                        className="w-full flex items-center justify-between text-sm p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-400 group transition-colors text-left"
                      >
                        <span className="font-medium text-gray-700">{sensor.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${getTempTextColor(sensor.status)}`}>{sensor.temperature.toFixed(1)}°C</span>
                          <div className={`w-2.5 h-2.5 rounded-full ${getTempColor(sensor.status)}`} />
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
