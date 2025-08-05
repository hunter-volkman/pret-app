import { useState } from 'react';
import { useStore, StoreData, TempSensor } from '../stores/store';
import { StoreCard } from '../components/StoreCard';
import { SensorModal } from '../components/SensorModal';
import { ImageModal } from '../components/ImageModal';

export function StoresView() {
  const { stores, selectedStores, toggleStoreSelection, setCurrentStore, setCurrentView } = useStore();
  const [sensorModalData, setSensorModalData] = useState<{ store: StoreData, sensor: TempSensor } | null>(null);
  const [historyModalStore, setHistoryModalStore] = useState<StoreData | null>(null);

  const handleHeaderClick = (store: StoreData) => {
    setCurrentStore(store);
    setCurrentView('camera');
  };

  const handleSensorClick = (store: StoreData, sensor: TempSensor) => {
    setSensorModalData({ store, sensor });
  };
  
  return (
    <>
      <div className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Locations</h2>
          <p className="text-gray-600">Select a store to monitor its live sensor data</p>
        </div>
        
        <div className="space-y-6">
          {stores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              isSelected={selectedStores.has(store.id)}
              onToggle={() => toggleStoreSelection(store.id)}
              onHeaderClick={() => handleHeaderClick(store)}
              onSensorClick={(sensor) => handleSensorClick(store, sensor)}
              onViewHistoryClick={() => setHistoryModalStore(store)}
            />
          ))}
        </div>
      </div>

      {sensorModalData && (
        <SensorModal 
          store={sensorModalData.store}
          sensor={sensorModalData.sensor}
          onClose={() => setSensorModalData(null)}
        />
      )}

      {historyModalStore && (
        <ImageModal
          store={historyModalStore}
          onClose={() => setHistoryModalStore(null)}
        />
      )}
    </>
  );
}
