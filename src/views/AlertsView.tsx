import { useState } from 'react';
import { Clock, CheckCircle, Filter, Eye, Thermometer, Activity, X } from 'lucide-react';
import { useStore, unreadCount } from '../stores/store';
import { AlertModal } from '../components/AlertModal';

type LocalFilter = 'all' | 'unread' | 'stock' | 'temperature';

export function AlertsView() {
  const { alerts, markAlertRead, alertFilterStoreId, setAlertFilter } = useStore();
  const [localFilter, setLocalFilter] = useState<LocalFilter>('all');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  
  const storeNameForFilter = alertFilterStoreId 
    ? useStore.getState().stores.find(s => s.id === alertFilterStoreId)?.name
    : null;

  const filteredAlerts = alerts.filter(alert => {
    if (alertFilterStoreId && alert.storeId !== alertFilterStoreId) {
      return false;
    }
    if (localFilter === 'unread') return !alert.read;
    if (localFilter === 'stock') return alert.type === 'stock';
    if (localFilter === 'temperature') return alert.type === 'temperature';
    return true;
  });

  const selectedAlertData = selectedAlert ? alerts.find(a => a.id === selectedAlert) : null;
  
  const handleMarkAllRead = () => {
    filteredAlerts.forEach(alert => {
      if (!alert.read) {
        markAlertRead(alert.id);
      }
    });
  };
  
  if (alerts.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear</h3>
          <p className="text-gray-600">No alerts detected across all monitored locations</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alerts</h2>
          <p className="text-gray-600">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={localFilter} 
              onChange={(e) => setLocalFilter(e.target.value as LocalFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="unread">Unread ({unreadCount()})</option>
              <option value="stock">Stock</option>
              <option value="temperature">Temperature</option>
            </select>
          </div>
          {unreadCount() > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {alertFilterStoreId && storeNameForFilter && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-2 mb-6 animate-in fade-in-0">
          <span className="font-medium text-sm">Showing alerts for: <strong>{storeNameForFilter}</strong></span>
          <button onClick={() => setAlertFilter(null)} className="p-1 rounded-full hover:bg-blue-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        {filteredAlerts.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p>No alerts match the current filter.</p>
          </div>
        )}
        {filteredAlerts.map(alert => {
          const isHigh = alert.severity === 'high';
          const isMedium = alert.severity === 'medium';

          const accentColor = isHigh ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-blue-500';
          const iconColor = isHigh ? 'text-red-600' : isMedium ? 'text-yellow-600' : 'text-blue-600';
          const bgColor = isHigh ? 'bg-red-50' : isMedium ? 'bg-yellow-50' : 'bg-blue-50';

          return (
            <div
              key={alert.id}
              className={`
                bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden
                flex transition-all duration-300
                ${!alert.read ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-70 hover:opacity-100'}
              `}
            >
              <div className={`w-2 flex-shrink-0 ${accentColor}`}></div>
              <div className="flex-1 p-4">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bgColor} ${iconColor}`}>
                    {alert.type === 'temperature' ? <Thermometer className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{alert.title}</h3>
                      {!alert.read && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse mr-2" title="Unread"></div>}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2 sm:mb-0">
                        <span className="font-medium text-gray-700">{alert.storeName}</span>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedAlert(alert.id)}
                          className="flex items-center space-x-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {selectedAlertData && (
        <AlertModal
          alert={selectedAlertData}
          onClose={() => setSelectedAlert(null)}
          onMarkRead={() => markAlertRead(selectedAlertData.id)}
        />
      )}
    </div>
  );
}
