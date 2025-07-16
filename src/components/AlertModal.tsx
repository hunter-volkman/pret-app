import React, { useEffect } from 'react'
import { X, Clock, Thermometer, Activity, Camera } from 'lucide-react'

interface Alert {
  id: string
  storeId: string
  storeName: string
  type: 'stock' | 'temperature'
  title: string
  message: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
  read: boolean
  regions?: string[]
  sensors?: string[]
  imageUrl?: string
}

interface AlertModalProps {
  alert: Alert
  onClose: () => void
  onMarkRead: () => void
}

export function AlertModal({ alert, onClose, onMarkRead }: AlertModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Alert Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Alert Info */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{alert.title}</h4>
              <p className="text-gray-700">{alert.message}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
              <div>
                <span className="text-gray-600">Store:</span>
                <span className="ml-2 font-medium">{alert.storeName}</span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium">{alert.timestamp.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium capitalize">{alert.type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-600">Severity:</span>
                <span className={`ml-2 font-medium capitalize ${
                  alert.severity === 'high' ? 'text-red-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {alert.severity}
                </span>
              </div>
            </div>

            {/* Stock Alert Details */}
            {alert.type === 'stock' && alert.regions && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Affected Regions</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {alert.regions.map((region: string) => (
                    <span
                      key={region}
                      className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full"
                    >
                      {region}
                    </span>
                  ))}
                </div>

                {/* Camera Snapshot */}
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Camera Snapshot</h4>
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                    {alert.imageUrl ? (
                      <>
                        <img 
                          src={alert.imageUrl}
                          alt="Camera snapshot at alert time"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs font-medium">
                          ALERT SNAPSHOT
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs font-medium">
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p>Loading camera snapshot...</p>
                      </div>
                    )}
                  </div>
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    View with computer vision overlay
                  </button>
                </div>
              </div>
            )}

            {/* Temperature Alert Details */}
            {alert.type === 'temperature' && alert.sensors && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Temperature Readings</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {alert.sensors.map((sensorId: string) => {
                    const temp = (Math.random() * 10 + 15).toFixed(1)
                    const status = Math.random() > 0.5 ? 'warning' : 'critical'
                    return (
                      <div key={sensorId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Thermometer className={`w-5 h-5 ${status === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                          <span className="text-gray-700 font-medium">{sensorId}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`font-medium ${status === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {temp}°C
                          </span>
                          <div className={`w-3 h-3 rounded-full ${status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-yellow-800">Recommended Action:</strong>
                      <p className="mt-1">Check refrigeration units and verify door seals. Contact maintenance if temperature persists outside normal range.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              {!alert.read && (
                <button
                  onClick={() => {
                    onMarkRead()
                    onClose()
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}