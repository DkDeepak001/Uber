import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationService } from '../services/api';
import Map from '../components/Map';
import './DriverLocation.css';

const DriverLocation = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const driverId = localStorage.getItem('driverId') || '1';
    fetchDriverLocation(driverId);
    
    // Get current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          updateDriverLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    }

    // Watch position for real-time updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(location);
        
        if (autoUpdate) {
          updateDriverLocation(location);
        }
      },
      (error) => console.error('Error watching location:', error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [autoUpdate]);

  const updateDriverLocation = async (location) => {
    if (!location) return;
    
    setIsUpdating(true);
    const driverId = localStorage.getItem('driverId') || '1';
    
    try {
      await locationService.updateDriverLocation({
        driverId: driverId.toString(),
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualUpdate = () => {
    if (currentLocation) {
      updateDriverLocation(currentLocation);
    }
  };

  const toggleAutoUpdate = () => {
    setAutoUpdate(!autoUpdate);
  };

  const fetchDriverLocation = async (driverId) => {
    setLoading(true);
    setError('');
    try {
      const response = await locationService.getDriverLocation(driverId);
      if (response.data) {
        setSavedLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
      }
    } catch (error) {
      // Location might not exist yet
      setSavedLocation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!window.confirm('Are you sure you want to delete your saved location?')) {
      return;
    }
    
    const driverId = localStorage.getItem('driverId') || '1';
    setLoading(true);
    setError('');
    try {
      await locationService.deleteDriverLocation(driverId);
      setSavedLocation(null);
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to delete location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-location-container">
      <div className="driver-location-header">
        <button onClick={() => navigate('/driver/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Update Location</h1>
      </div>

      <div className="driver-location-content">
        <div className="map-section">
          {currentLocation ? (
            <Map
              pickupLocation={currentLocation}
              dropoffLocation={null}
              nearbyDrivers={[]}
              onLocationSelect={null}
              height="500px"
              clickEnabled={false}
            />
          ) : (
            <div className="loading-map">Loading your location...</div>
          )}
        </div>

        <div className="location-controls">
          {error && <div className="error-message">{error}</div>}
          
          <div className="location-info">
            <h3>Current Location</h3>
            {currentLocation ? (
              <div className="coordinates">
                <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
              </div>
            ) : (
              <p>Getting your location...</p>
            )}
          </div>

          {savedLocation && (
            <div className="saved-location-info">
              <h3>Saved Location in System</h3>
              <div className="coordinates">
                <p><strong>Latitude:</strong> {savedLocation.latitude.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {savedLocation.longitude.toFixed(6)}</p>
              </div>
              <button 
                onClick={handleDeleteLocation}
                className="delete-location-btn"
                disabled={loading}
              >
                Delete Saved Location
              </button>
            </div>
          )}

          <div className="control-buttons">
            <button
              onClick={handleManualUpdate}
              disabled={!currentLocation || isUpdating}
              className="update-btn"
            >
              {isUpdating ? 'Updating...' : 'Update Location Now'}
            </button>

            <div className="auto-update-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={autoUpdate}
                  onChange={toggleAutoUpdate}
                />
                <span>Auto-update location</span>
              </label>
              <p className="hint">Automatically update location every 30 seconds</p>
            </div>
          </div>

          {isUpdating && (
            <div className="update-status">
              <span className="spinner"></span>
              Updating location in system...
            </div>
          )}

          {autoUpdate && (
            <div className="auto-update-status">
              ✓ Auto-update enabled. Your location will be updated automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverLocation;

