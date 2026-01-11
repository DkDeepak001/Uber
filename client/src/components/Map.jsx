import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
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
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create custom div icon for driver with cab emoji
const createDriverIcon = () => {
  return L.divIcon({
    className: 'custom-driver-icon',
    html: '<div style="font-size: 32px; text-align: center; line-height: 1;">🚕</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

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

// Component to update map view when center changes
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1] && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    }
  }, [center, zoom, map]);
  
  return null;
}

// Component to fetch and display route
function RouteDisplay({ pickupLocation, dropoffLocation }) {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const map = useMap();

  useEffect(() => {
    if (!pickupLocation || !dropoffLocation) {
      setRouteCoordinates([]);
      return;
    }

    // Fetch route from OSRM (Open Source Routing Machine) - free, no API key needed
    const fetchRoute = async () => {
      try {
        const startLon = pickupLocation.longitude;
        const startLat = pickupLocation.latitude;
        const endLon = dropoffLocation.longitude;
        const endLat = dropoffLocation.latitude;

        // OSRM API endpoint
        const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // Extract coordinates from GeoJSON
          const coordinates = data.routes[0].geometry.coordinates;
          // Convert [lon, lat] to [lat, lon] for Leaflet
          const leafletCoordinates = coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoordinates(leafletCoordinates);

          // Fit map bounds to show entire route
          if (leafletCoordinates.length > 0) {
            const bounds = L.latLngBounds(leafletCoordinates);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback: draw straight line if routing fails
        setRouteCoordinates([
          [pickupLocation.latitude, pickupLocation.longitude],
          [dropoffLocation.latitude, dropoffLocation.longitude]
        ]);
      }
    };

    fetchRoute();
  }, [pickupLocation, dropoffLocation, map]);

  if (routeCoordinates.length === 0) {
    return null;
  }

  // Route polyline style (similar to Google Maps - blue/purple)
  const routeStyle = {
    color: '#4285F4', // Google Maps blue
    weight: 5,
    opacity: 0.8,
    dashArray: '0'
  };

  return (
    <Polyline
      positions={routeCoordinates}
      pathOptions={routeStyle}
    />
  );
}

const Map = ({ 
  pickupLocation, 
  dropoffLocation, 
  nearbyDrivers = [],
  onLocationSelect, 
  height = '400px',
  clickEnabled = true,
  userLocation = null // User's current location
}) => {
  // Priority: pickupLocation > userLocation > default (New York)
  const defaultCenter = [40.7128, -74.0060]; // New York default (fallback only)
  const center = pickupLocation 
    ? [pickupLocation.latitude, pickupLocation.longitude]
    : userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : defaultCenter;

  // Determine zoom level: closer zoom if we have a specific location
  const zoom = pickupLocation || userLocation ? 13 : 10;

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
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
        
        <MapViewUpdater center={center} zoom={zoom} />

        {/* Route between pickup and dropoff */}
        <RouteDisplay 
          pickupLocation={pickupLocation} 
          dropoffLocation={dropoffLocation} 
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

        {/* Nearby Drivers Markers with Cab Emoji */}
        {nearbyDrivers.map((driver) => (
          <Marker
            key={driver.driverId}
            position={[driver.latitude, driver.longitude]}
            icon={createDriverIcon()}
          >
            <Popup>
              <strong>Driver {driver.name || driver.driverId}</strong><br />
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
