import React, { useState } from 'react'
import { AlertTriangle, Clock, CheckCircle, Filter } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const AlertsView = () => {
  const { alerts, markAlertRead, markAllAlertsRead } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all')
  
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read
    if (filter === 'high') return alert.severity === 'high'
    return true
  })
  
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
    )
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alerts</h2>
          <p className="text-gray-600">{filteredAlerts.length} alerts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Alerts</option>
              <option value="unread">Unread</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          
          <button
            onClick={markAllAlertsRead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Mark All Read
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const getSeverityColor = () => {
            switch (alert.severity) {
              case 'high': return 'border-red-200 bg-red-50'
              case 'medium': return 'border-yellow-200 bg-yellow-50'
              case 'low': return 'border-blue-200 bg-blue-50'
              default: return 'border-gray-200 bg-gray-50'
            }
          }
          
          const getSeverityIconColor = () => {
            switch (alert.severity) {
              case 'high': return 'text-red-500'
              case 'medium': return 'text-yellow-500'
              case 'low': return 'text-blue-500'
              default: return 'text-gray-500'
            }
          }
          
          return (
            <div
              key={alert.id}
              className={`rounded-lg border-2 p-4 ${getSeverityColor()} ${
                !alert.read ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-1 ${getSeverityIconColor()}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    {!alert.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="font-medium">{alert.storeName}</span>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {!alert.read && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                  
                  {alert.shelves && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {alert.shelves.map(shelf => (
                        <span
                          key={shelf}
                          className="px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded-full"
                        >
                          {shelf}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AlertsView
