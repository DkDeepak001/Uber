import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService, locationService } from '../services/api';
import Map from '../components/Map';
import './BookRide.css';

const BookRide = () => {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user's current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          if (!pickupLocation) {
            setPickupLocation(location);
            searchNearbyDrivers(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a known location if geolocation fails
          const defaultLocation = { latitude: 40.7128, longitude: -74.0060 };
          setUserLocation(defaultLocation);
        }
      );
    }
  }, []);

  const handlePickupSelect = (location) => {
    setPickupLocation(location);
    searchNearbyDrivers(location);
  };

  const handleDropoffSelect = (location) => {
    setDropoffLocation(location);
  };

  const searchNearbyDrivers = async (location) => {
    if (!location) return;
    
    setSearchingDrivers(true);
    try {
      const response = await locationService.searchNearbyDrivers(
        location.latitude,
        location.longitude
      );
      setNearbyDrivers(response.data || []);
    } catch (error) {
      console.error('Failed to search drivers:', error);
    } finally {
      setSearchingDrivers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pickupLocation || !dropoffLocation || !pickupTime) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get user ID from localStorage (in real app, from auth context)
      const userId = localStorage.getItem('userId') || '1';
      
      const bookingData = {
        userId: userId.toString(),
        pickupLatitude: pickupLocation.latitude,
        pickupLongitude: pickupLocation.longitude,
        dropoffLatitude: dropoffLocation.latitude,
        dropoffLongitude: dropoffLocation.longitude,
        pickupTime: new Date(pickupTime).toISOString(),
      };

      const response = await bookingService.createBooking(bookingData);
      
      if (response.data) {
        navigate(`/booking/${response.data.bookingId}`);
      }
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-ride-container">
      <div className="book-ride-header">
        <h1>Book a Ride</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
      </div>

      <div className="book-ride-content">
        <div className="map-section">
          <Map
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            nearbyDrivers={nearbyDrivers}
            onLocationSelect={!pickupLocation ? handlePickupSelect : handleDropoffSelect}
            height="500px"
            clickEnabled={true}
          />
          
          {searchingDrivers && (
            <div className="searching-drivers">
              <span className="spinner"></span>
              Searching for nearby drivers...
            </div>
          )}
          
          {nearbyDrivers.length > 0 && (
            <div className="nearby-drivers">
              <h3>✓ Found {nearbyDrivers.length} nearby driver{nearbyDrivers.length > 1 ? 's' : ''}</h3>
              <p>Drivers are shown on the map with green markers</p>
            </div>
          )}
          
          {pickupLocation && nearbyDrivers.length === 0 && !searchingDrivers && (
            <div className="no-drivers">
              <p>No drivers found nearby. Try selecting a different pickup location.</p>
            </div>
          )}
        </div>

        <div className="booking-form-section">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Pickup Location</label>
              <div className="location-input">
                <input
                  type="text"
                  placeholder="Select on map or enter address"
                  value={pickupLocation ? `${pickupLocation.latitude}, ${pickupLocation.longitude}` : ''}
                  readOnly
                />
                {!pickupLocation && (
                  <span className="hint">Click on map to select</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Dropoff Location</label>
              <div className="location-input">
                <input
                  type="text"
                  placeholder="Select on map or enter address"
                  value={dropoffLocation ? `${dropoffLocation.latitude}, ${dropoffLocation.longitude}` : ''}
                  readOnly
                />
                {pickupLocation && !dropoffLocation && (
                  <span className="hint">Click on map to select</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Pickup Time</label>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Booking...' : 'Book Ride'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookRide;

