import { useState } from 'react';
import { useStore, StoreData, TempSensor } from '../stores/store';
import { StoreCard } from '../components/StoreCard';
import { SensorModal } from '../components/SensorModal';

export function StoresView() {
  const { stores, selectedStores, toggleStoreSelection, setCurrentStore, setCurrentView } = useStore();
  const [modalData, setModalData] = useState<{ store: StoreData, sensor: TempSensor } | null>(null);

  const handleHeaderClick = (store: StoreData) => {
    setCurrentStore(store);
    setCurrentView('camera');
  };

  const handleSensorClick = (store: StoreData, sensor: TempSensor) => {
    setModalData({ store, sensor });
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
            />
          ))}
        </div>
      </div>

      {modalData && (
        <SensorModal 
          store={modalData.store}
          sensor={modalData.sensor}
          onClose={() => setModalData(null)}
        />
      )}
    </>
  );
}