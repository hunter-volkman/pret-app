import React, { useState } from 'react';
import { ChevronDown, MapPin, Thermometer, Activity, Wifi, WifiOff, AlertCircle, Bell, BellOff } from 'lucide-react';
import { useStore, StoreData } from '../stores/store';

const getFillColor = (status: 'ok' | 'low' | 'empty') => {
  switch (status) {
    case 'ok': return 'bg-green-100 text-green-800';
    case 'low': return 'bg-yellow-100 text-yellow-800';
    case 'empty': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTempColor = (status: 'normal' | 'warning' | 'critical') => {
  switch (status) {
    case 'normal': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

interface StoreCardProps {
  store: StoreData;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}

export function StoreCard({ store, isSelected, onToggle, onClick }: StoreCardProps) {
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
  
  const avgFill = stockRegions.length > 0 ? Math.round(stockRegions.reduce((sum, r) => sum + r.fillLevel, 0) / stockRegions.length) : 0;
  const avgTemp = tempSensors.length > 0 ? (tempSensors.reduce((sum, s) => sum + s.temperature, 0) / tempSensors.length) : 0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <div className="flex items-center space-x-2 mb-1 cursor-pointer" onClick={onClick}>
              <h3 className="text-lg font-bold text-gray-800 hover:text-blue-600">{store.name}</h3>
              <div className={`flex items-center space-x-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${store.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {store.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{store.status}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 flex items-center"><MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />{store.address}</p>
            {alertsForStore.length > 0 && (
              <div className="flex items-center text-red-600 text-sm font-semibold mt-2"><AlertCircle className="w-4 h-4 mr-1.5" />{alertsForStore.length} new alert{alertsForStore.length > 1 ? 's' : ''}</div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNotificationSubscription(store.id);
              }}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50/70 rounded-lg p-3">
            <div className="flex items-center text-gray-500 text-sm mb-1"><Activity className="w-4 h-4 mr-2"/> Stock Level</div>
            <p className="text-3xl font-bold text-gray-800">{avgFill}<span className="text-xl">%</span></p>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-3">
            <div className="flex items-center text-gray-500 text-sm mb-1"><Thermometer className="w-4 h-4 mr-2"/> Temperature</div>
            <p className="text-3xl font-bold text-gray-800">{avgTemp.toFixed(1)}<span className="text-xl">°C</span></p>
          </div>
        </div>
      </div>
      
      {isSelected && (
        <div className="border-t border-gray-200">
          <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <span className="font-medium">View Details ({stockRegions.length} regions, {tempSensors.length} sensors)</span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
          
          {expanded && (
            <div className="px-5 pb-5 bg-gray-50 border-t border-gray-200 animate-in fade-in-0 duration-300">
              {sortedStockRegions.length > 0 && (
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
                      <div key={sensor.id} className="flex items-center justify-between text-sm p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-gray-700 font-medium">{sensor.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${getTempColor(sensor.status)}`}>{sensor.temperature.toFixed(1)}°C</span>
                          <div className={`w-2.5 h-2.5 rounded-full ${getTempColor(sensor.status).replace('text', 'bg')}`} />
                        </div>
                      </div>
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
