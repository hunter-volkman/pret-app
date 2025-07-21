import React, { useEffect, useState } from 'react';
import { X, Clock, Thermometer, Camera, Eye, EyeOff } from 'lucide-react';
import { Alert } from '../stores/store';

interface AlertModalProps {
  alert: Alert;
  onClose: () => void;
  onMarkRead: () => void;
}

export function AlertModal({ alert, onClose, onMarkRead }: AlertModalProps) {
  const [showCVOverlay, setShowCVOverlay] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const hasBothImages = alert.imageUrl && alert.cvImageUrl;
  const imageToDisplay = showCVOverlay && hasBothImages ? alert.cvImageUrl : alert.imageUrl;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Alert Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{alert.title}</h4>
              <p className="text-gray-700">{alert.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
              <div><span className="text-gray-600">Store:</span><span className="ml-2 font-medium">{alert.storeName}</span></div>
              <div><span className="text-gray-600">Time:</span><span className="ml-2 font-medium">{alert.timestamp.toLocaleString()}</span></div>
              <div><span className="text-gray-600">Type:</span><span className="ml-2 font-medium capitalize">{alert.type}</span></div>
              <div>
                <span className="text-gray-600">Severity:</span>
                <span className={`ml-2 font-medium capitalize ${alert.severity === 'high' ? 'text-red-600' : alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`}>
                  {alert.severity}
                </span>
              </div>
            </div>

            {alert.type === 'stock' && alert.regions && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Affected Regions</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {alert.regions.map((region: string) => (
                    <span key={region} className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">{region}</span>
                  ))}
                </div>

                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Camera Snapshot</h4>
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                    {imageToDisplay ? (
                      <>
                        <img 
                          src={imageToDisplay}
                          alt={`Camera snapshot: ${showCVOverlay ? 'CV Overlay' : 'Raw'}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                          {showCVOverlay ? 'CV OVERLAY' : 'RAW IMAGE'}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-mono backdrop-blur-sm">
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p>Snapshot not available.</p>
                      </div>
                    )}
                  </div>
                  {hasBothImages && (
                    <button 
                      onClick={() => setShowCVOverlay(!showCVOverlay)}
                      className="mt-3 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      {showCVOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showCVOverlay ? 'View Raw Image' : 'View with Computer Vision'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {alert.type === 'temperature' && alert.sensors && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Affected Sensors</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {alert.sensors.map((sensorId: string) => {
                    // Placeholder data for display
                    const temp = (Math.random() * 10 + 15).toFixed(1);
                    const status = Math.random() > 0.5 ? 'warning' : 'critical';
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
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              {!alert.read && (
                <button
                  onClick={() => { onMarkRead(); onClose(); }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
