import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore, StoreData } from '../stores/store';

// Custom icon logic for map markers
const createMarkerIcon = (status: 'ok' | 'alert' | 'offline') => {
  const color = status === 'alert' ? '#EF4444' : status === 'ok' ? '#22C55E' : '#6B7280';
  const html = `
    <div style="
      background-color: white;
      border-radius: 50%;
      padding: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    ">
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
      "></div>
    </div>`;
  return L.divIcon({
    html: html,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const icons = {
  ok: createMarkerIcon('ok'),
  alert: createMarkerIcon('alert'),
  offline: createMarkerIcon('offline'),
};

export function MapView() {
  const { stores, alerts, setCurrentStore, setCurrentView } = useStore();
  const alertStoreIds = new Set(alerts.filter(a => !a.read).map(a => a.storeId));

  const getStoreMarkerStatus = (store: StoreData) => {
    if (store.status === 'offline') return 'offline';
    if (alertStoreIds.has(store.id)) return 'alert';
    return 'ok';
  };

  const handleViewDetails = (store: StoreData) => {
    setCurrentStore(store);
    setCurrentView('camera');
  };

  // Set a sensible default view if stores are available
  const mapCenter: L.LatLngExpression = stores.length > 0 
    ? [stores[0].coords.lat, stores[0].coords.lng] 
    : [40.7128, -74.0060]; // Default to NYC
  const mapZoom = stores.length > 0 ? 10 : 4;

  return (
    <div className="p-0 md:p-6 h-[calc(100vh-148px)] md:h-[calc(100vh-160px)]">
      <div className="h-full w-full rounded-lg overflow-hidden shadow-md">
        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
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
                  <div className="p-1 space-y-2 w-[200px]">
                    <h4 className="font-bold text-base text-gray-800">{store.name}</h4>
                    <p className="text-sm text-gray-600">{store.address}</p>
                    <button 
                      onClick={() => handleViewDetails(store)}
                      className="w-full bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
