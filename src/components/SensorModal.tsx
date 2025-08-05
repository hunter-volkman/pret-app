import { useEffect, useState } from 'react';
import { X, Thermometer, Loader2, AlertTriangle, Battery, Droplets } from 'lucide-react';
import { StoreData, TempSensor } from '../stores/store';
import { viam, TemperatureDataPoint } from '../services/viam';
import { TemperatureChart } from './TemperatureChart';
import { getSensorConfig } from '../config/sensors';

interface SensorModalProps {
  store: StoreData;
  sensor: TempSensor;
  onClose: () => void;
}

export function SensorModal({ store, sensor, onClose }: SensorModalProps) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [chartData, setChartData] = useState<TemperatureDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStatus('loading');
        const data = await viam.getTemperatureHistory(store.tempPartId, sensor.id);
        setChartData(data);
        setStatus(data.length > 0 ? 'success' : 'error');
      } catch (error) {
        console.error("Failed to fetch sensor history:", error);
        setStatus('error');
      }
    };
    fetchData();
  }, [store.tempPartId, sensor.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };
  
  const sensorConfig = getSensorConfig(store.tempMachineId, sensor.id);
  const complianceBands = sensorConfig?.bands || [];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{sensor.name}</h3>
              <p className="text-sm text-gray-500">{store.name} | 24-Hour History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        <main className="flex-1 p-6 overflow-hidden min-h-0">
          {status === 'loading' && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <span className="text-lg">Loading Chart Data...</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center h-full text-red-600 bg-red-50 rounded-lg">
              <AlertTriangle className="w-10 h-10 mb-3" />
              <h4 className="font-bold text-lg">Could Not Load Data</h4>
              <p className="text-sm">No historical data found or an error occurred.</p>
            </div>
          )}
          {status === 'success' && (
            <div className="h-full w-full">
              <TemperatureChart 
                data={chartData} 
                complianceBands={complianceBands} 
              />
            </div>
          )}
        </main>
        
        <footer className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-x-3 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <Thermometer className="w-4 h-4" />
                <span>Latest: <strong className="text-gray-900">{sensor.temperature.toFixed(1)}°C</strong></span>
              </div>
              {sensor.humidity && (
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <Droplets className="w-4 h-4" />
                  <span>Humidity: <strong className="text-gray-900">{sensor.humidity.toFixed(1)}%</strong></span>
                </div>
              )}
              {sensor.battery && (
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <Battery className="w-4 h-4" />
                  <span>Battery: <strong className="text-gray-900">{sensor.battery.toFixed(2)}V</strong></span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
