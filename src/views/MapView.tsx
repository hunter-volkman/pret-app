import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore, StoreData } from '../stores/store';
import { Camera, AlertTriangle } from 'lucide-react';

// Animate the pulsing for stores with active alerts
const pulsingIconStyle = `
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  .pulse {
    animation: pulse 2s infinite;
  }
`;

// Custom marker icon that changes color and pulses for alerts
const createMarkerIcon = (status: 'ok' | 'alert' | 'offline') => {
  const color = status === 'alert' ? '#EF4444' : status === 'ok' ? '#22C55E' : '#6B7280';
  const pulseClass = status === 'alert' ? 'pulse' : '';
  const html = `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div class="${pulseClass}" style="
        background-color: ${color};
        border-radius: 50%;
        width: 14px;
        height: 14px;
        border: 3px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      "></div>
    </div>`;
  return L.divIcon({
    html: html,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -20],
  });
};

const icons = {
  ok: createMarkerIcon('ok'),
  alert: createMarkerIcon('alert'),
  offline: createMarkerIcon('offline'),
};

// A component to automatically fit the map to the markers
const AutoFitBounds = ({ bounds }: { bounds: L.LatLngBounds }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
};

// The main MapView component
export function MapView() {
  const { stores, alerts, setCurrentStore, setAlertFilter, setCurrentView } = useStore();
  const alertStoreIds = new Set(alerts.filter(a => !a.read).map(a => a.storeId));

  const getStoreMarkerStatus = (store: StoreData) => {
    if (store.status === 'offline') return 'offline';
    if (alertStoreIds.has(store.id)) return 'alert';
    return 'ok';
  };

  const handleViewCamera = (store: StoreData) => {
    setCurrentStore(store);
    setCurrentView('camera');
  };

  const handleViewAlerts = (storeId: string) => {
    setAlertFilter(storeId);
  };

  const bounds = useMemo(() => {
    if (stores.length === 0) return L.latLngBounds([40.7, -74], [34, -118]);
    const latLngs = stores.map(s => [s.coords.lat, s.coords.lng] as L.LatLngTuple);
    return L.latLngBounds(latLngs);
  }, [stores]);

  return (
    <>
      <style>{pulsingIconStyle}</style>
      {/* This is the definitive fix. We are setting the container height to be the dynamic viewport height (dvh)
        minus the known heights of the header (pt-20 = 5rem) and the nav bar (pb-24 = 6rem).
        This makes the map container perfectly fill the available space without causing overflow.
      */}
      <div className="h-[calc(100dvh-11rem)]">
        <div className="h-full w-full">
          <MapContainer
            center={[39.8283, -98.5795]} // Centered on US
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {stores.map(store => {
              const status = getStoreMarkerStatus(store);
              return (
                <Marker
                  key={store.id}
                  position={[store.coords.lat, store.coords.lng]}
                  icon={icons[status]}
                >
                  <Popup>
                    <div className="p-1 space-y-2 w-[220px]">
                      <h4 className="font-bold text-base text-gray-800">{store.name}</h4>
                      <p className="text-xs text-gray-600 -mt-1">{store.address}</p>
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleViewCamera(store)}
                          className="w-full bg-blue-600 text-white text-sm font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Camera</span>
                        </button>
                        <button
                          onClick={() => handleViewAlerts(store.id)}
                          className="w-full bg-gray-200 text-gray-800 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-gray-300 flex items-center justify-center space-x-2"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Alerts</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            <AutoFitBounds bounds={bounds} />
          </MapContainer>
        </div>
      </div>
    </>
  );
}