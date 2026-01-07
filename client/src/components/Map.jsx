import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './Map.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect, enabled }) {
  useMapEvents({
    click: (e) => {
      if (enabled && onLocationSelect) {
        onLocationSelect({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });
  return null;
}

const Map = ({ 
  pickupLocation, 
  dropoffLocation, 
  nearbyDrivers = [],
  onLocationSelect, 
  height = '400px',
  clickEnabled = true 
}) => {
  const defaultCenter = [40.7128, -74.0060]; // New York default
  const center = pickupLocation 
    ? [pickupLocation.latitude, pickupLocation.longitude]
    : defaultCenter;

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        center={center}
        zoom={pickupLocation ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler 
          onLocationSelect={onLocationSelect} 
          enabled={clickEnabled}
        />

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            position={[pickupLocation.latitude, pickupLocation.longitude]}
            icon={pickupIcon}
          >
            <Popup>
              <strong>Pickup Location</strong><br />
              {pickupLocation.latitude.toFixed(6)}, {pickupLocation.longitude.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* Dropoff Location Marker */}
        {dropoffLocation && (
          <Marker
            position={[dropoffLocation.latitude, dropoffLocation.longitude]}
            icon={dropoffIcon}
          >
            <Popup>
              <strong>Dropoff Location</strong><br />
              {dropoffLocation.latitude.toFixed(6)}, {dropoffLocation.longitude.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* Nearby Drivers Markers */}
        {nearbyDrivers.map((driver) => (
          <Marker
            key={driver.driverId}
            position={[driver.latitude, driver.longitude]}
            icon={driverIcon}
          >
            <Popup>
              <strong>Driver {driver.driverId}</strong><br />
              Available nearby
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {clickEnabled && (
        <div className="map-instructions">
          {!pickupLocation 
            ? 'Click on the map to select pickup location'
            : !dropoffLocation 
            ? 'Click on the map to select dropoff location'
            : 'Both locations selected'}
        </div>
      )}
    </div>
  );
};

export default Map;
