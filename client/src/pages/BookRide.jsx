import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService, locationService } from '../services/api';
import { socketService } from '../services/socket';
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
  
  // Ride request state
  const [rideRequestId, setRideRequestId] = useState(null);
  const [rideStatus, setRideStatus] = useState(null); // 'SEARCHING', 'DRIVER_FOUND', 'CONFIRMED', 'TIMEOUT'
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmedDriver, setConfirmedDriver] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const subscriptionRef = useRef(null);

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

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        socketService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
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
    setRideStatus('SEARCHING');
    setStatusMessage('Searching for nearby drivers...');
    setConfirmedDriver(null);
    setConfirmedBooking(null);

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

      // Use new ride-request endpoint
      const response = await bookingService.requestRide(bookingData);
      
      if (response.data && response.data.requestId) {
        const requestId = response.data.requestId;
        setRideRequestId(requestId);
        
        // Subscribe to WebSocket for status updates
        subscribeToRideStatus(requestId);
        
        // Poll for status updates as backup
        pollRideStatus(requestId);
      } else {
        setError('Failed to initiate ride request');
        setRideStatus(null);
      }
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to create ride request');
      setRideStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRideStatus = (requestId) => {
    // Ensure socket is connected
    socketService.connect(
      () => {
        console.log('WebSocket connected for ride status');
        const topic = `/topic/user/${requestId}/ride-status`;
        const subscription = socketService.subscribe(topic, (message) => {
          console.log('Received ride status update:', message);
          
          // Handle structured messages - check type first
          if (message.type === 'BOOKING_CONFIRMED' || message.type === 'DRIVER_ACCEPTED') {
            console.log('Processing structured confirmation message:', message);
            setRideStatus('CONFIRMED');
            setStatusMessage(message.content || 'Ride confirmed!');
            
            // If bookingId is provided, fetch booking details immediately
            if (message.bookingId) {
              console.log('Fetching booking details for bookingId:', message.bookingId);
              fetchBookingDetails(message.bookingId);
            } else if (message.requestId) {
              console.log('Fetching confirmed booking for requestId:', message.requestId);
              fetchConfirmedBooking(message.requestId);
            }
            return;
          }
          
          // Check status field if present (might be in structured message without type)
          if (message.status === 'CONFIRMED') {
            console.log('Processing status CONFIRMED message:', message);
            setRideStatus('CONFIRMED');
            setStatusMessage(message.content || 'Ride confirmed!');
            if (message.bookingId) {
              console.log('Fetching booking details for bookingId:', message.bookingId);
              fetchBookingDetails(message.bookingId);
            } else if (message.requestId) {
              fetchConfirmedBooking(message.requestId);
            }
            return;
          }
          
          // Handle simple string messages
          if (message.content) {
            const content = typeof message.content === 'string' ? message.content : message.content.toString();
            setStatusMessage(content);
            
            if (content.includes('Found') && content.includes('drivers')) {
              setRideStatus('DRIVER_FOUND');
            } else if (content.includes('confirmed') || content.includes('accepted') || 
                       content.includes('Driver') || content.includes('Booking ID')) {
              setRideStatus('CONFIRMED');
              // Extract bookingId from message if present
              const bookingIdMatch = content.match(/Booking ID:?\s*(\d+)/i);
              if (bookingIdMatch) {
                fetchBookingDetails(parseInt(bookingIdMatch[1]));
              } else {
                fetchConfirmedBooking(requestId);
              }
            } else if (content.includes('timeout') || content.includes('No nearby')) {
              setRideStatus('TIMEOUT');
            }
          }
        });
        subscriptionRef.current = topic; // Store topic for cleanup
        console.log(`Subscribed to ${topic}`);
      },
      (error) => {
        console.error('WebSocket connection error:', error);
      }
    );
  };

  const pollRideStatus = async (requestId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await bookingService.getRideRequestStatus(requestId);
        if (response.data) {
          const status = response.data.status;
          setRideStatus(status);
          setStatusMessage(response.data.message || '');
          
          if (status === 'CONFIRMED' && response.data.bookingId) {
            clearInterval(pollInterval);
            // Fetch booking details
            fetchBookingDetails(response.data.bookingId);
          } else if (status === 'TIMEOUT') {
            clearInterval(pollInterval);
          }
          
          // Update nearby drivers if available
          if (response.data.nearbyDrivers) {
            const drivers = response.data.nearbyDrivers.map(d => ({
              driverId: d.driverId,
              latitude: d.latitude,
              longitude: d.longitude,
            }));
            setNearbyDrivers(drivers);
          }
        }
      } catch (error) {
        console.error('Error polling ride status:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 60 seconds
    setTimeout(() => clearInterval(pollInterval), 60000);
  };

  const fetchConfirmedBooking = async (requestId) => {
    try {
      const response = await bookingService.getRideRequestStatus(requestId);
      if (response.data && response.data.bookingId) {
        fetchBookingDetails(response.data.bookingId);
      }
    } catch (error) {
      console.error('Error fetching confirmed booking:', error);
    }
  };

  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await bookingService.getBookingDetails(bookingId);
      if (response.data) {
        setConfirmedBooking(response.data);
        // Extract driver location if available
        if (response.data.driver) {
          // Try to get driver location from booking or fetch separately
          let driverLocation = null;
          if (response.data.driver.location) {
            driverLocation = {
              latitude: response.data.driver.location.latitude,
              longitude: response.data.driver.location.longitude,
            };
          } else if (response.data.driverId) {
            // Fetch driver location from location service
            try {
              const locResponse = await locationService.getDriverLocation(response.data.driverId);
              if (locResponse.data) {
                driverLocation = {
                  latitude: locResponse.data.latitude,
                  longitude: locResponse.data.longitude,
                };
              }
            } catch (e) {
              console.error('Error fetching driver location:', e);
            }
          }
          
          setConfirmedDriver({
            driverId: response.data.driver.id || response.data.driverId,
            name: response.data.driver.name || `Driver ${response.data.driver.id || response.data.driverId}`,
            latitude: driverLocation?.latitude || pickupLocation?.latitude,
            longitude: driverLocation?.longitude || pickupLocation?.longitude,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
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
        <div className="map-section" style={{ position: 'relative' }}>
          <Map
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            nearbyDrivers={confirmedDriver ? [confirmedDriver] : nearbyDrivers}
            onLocationSelect={!pickupLocation ? handlePickupSelect : handleDropoffSelect}
            height="500px"
            clickEnabled={!rideStatus || rideStatus === 'TIMEOUT'}
          />
          
          {/* Ride Status Overlay */}
          {rideStatus && (
            <div className={`ride-status-overlay ${rideStatus.toLowerCase()}`}>
              <div className="status-content">
                {rideStatus === 'SEARCHING' && (
                  <>
                    <span className="spinner"></span>
                    <h3>Searching for cabs...</h3>
                  </>
                )}
                {rideStatus === 'DRIVER_FOUND' && (
                  <>
                    <span className="status-icon">✓</span>
                    <h3>Drivers Found!</h3>
                    <p>Waiting for driver to accept...</p>
                  </>
                )}
                {rideStatus === 'CONFIRMED' && (
                  <>
                    <span className="status-icon">✓</span>
                    <h3>Ride Confirmed!</h3>
                    {confirmedDriver && (
                      <p>Driver {confirmedDriver.name || confirmedDriver.driverId} is on the way</p>
                    )}
                  </>
                )}
                {rideStatus === 'TIMEOUT' && (
                  <>
                    <span className="status-icon">✗</span>
                    <h3>Request Timed Out</h3>
                    <p>No driver accepted. Please try again.</p>
                  </>
                )}
                {statusMessage && <p className="status-message">{statusMessage}</p>}
              </div>
            </div>
          )}

          {searchingDrivers && !rideStatus && (
            <div className="searching-drivers">
              <span className="spinner"></span>
              Searching for nearby drivers...
            </div>
          )}
          
          {nearbyDrivers.length > 0 && !rideStatus && (
            <div className="nearby-drivers">
              <h3>✓ Found {nearbyDrivers.length} nearby driver{nearbyDrivers.length > 1 ? 's' : ''}</h3>
              <p>Drivers are shown on the map with green markers</p>
            </div>
          )}
          
          {pickupLocation && nearbyDrivers.length === 0 && !searchingDrivers && !rideStatus && (
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

            <button type="submit" className="submit-btn" disabled={loading || rideStatus === 'SEARCHING' || rideStatus === 'DRIVER_FOUND'}>
              {loading ? 'Booking...' : rideStatus ? 'Request Sent' : 'Book Ride'}
            </button>
            
            {rideStatus === 'CONFIRMED' && confirmedBooking && (
              <button 
                type="button"
                onClick={() => navigate(`/booking/${confirmedBooking.id}`)}
                className="submit-btn"
                style={{ marginTop: '10px', background: '#28a745' }}
              >
                View Booking Details
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookRide;

