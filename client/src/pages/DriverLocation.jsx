import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { locationService } from '../services/api';
import Map from '../components/Map';

const DriverLocation = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default location
          setCurrentLocation({ latitude: 40.7128, longitude: -74.0060 });
        }
      );
    }
  }, []);

  const handleLocationUpdate = async () => {
    if (!currentLocation) {
      alert('Please select a location on the map');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const driverId = localStorage.getItem('driverId') || '1';
      await locationService.updateDriverLocation({
        driverId: driverId.toString(),
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (location) => {
    setCurrentLocation(location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/driver/dashboard')}
            className="text-gray-700 hover:text-black"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-black">Uber Driver</h1>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="text-gray-700 hover:text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Sign out
        </button>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Update Your Location</h2>
          <p className="text-gray-600 mb-6">
            Click on the map to set your location, then click "Update Location" to make yourself available for ride requests.
          </p>

          {currentLocation && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Selected Location</p>
              <p className="text-sm font-mono text-gray-900">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}

          <button
            onClick={handleLocationUpdate}
            disabled={loading || !currentLocation}
            className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Location'}
          </button>

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">Location updated successfully!</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: '500px' }}>
          <Map
            pickupLocation={currentLocation}
            dropoffLocation={null}
            nearbyDrivers={[]}
            onLocationSelect={handleMapClick}
            height="100%"
            clickEnabled={true}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverLocation;
