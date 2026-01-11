import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService, locationService } from '../services/api';
import { socketService } from '../services/socket';
import MessageBox from '../components/MessageBox';
import RideRequestModal from '../components/RideRequestModal';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [rideRequest, setRideRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Get driver ID from localStorage
    const driverId = localStorage.getItem('driverId') || '1';
    console.log('DriverDashboard mounted, driverId:', driverId);
    
    fetchDriverBookings(driverId);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
        },
        (error) => console.error('Error getting location:', error)
      );
    }

    // Connect to WebSocket and subscribe to ride requests - ensure this happens immediately
    // Use a small delay to ensure component is fully mounted
    const connectTimer = setTimeout(() => {
      console.log('Initiating WebSocket connection for driver:', driverId);
      setupWebSocketSubscription(driverId);
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(connectTimer);
      if (subscriptionRef.current) {
        const cleanupDriverId = localStorage.getItem('driverId') || '1';
        const topic = `/topic/driver/${cleanupDriverId}/ride-requests`;
        socketService.unsubscribe(topic);
        subscriptionRef.current = null;
      }
      // Disconnect socket on unmount
      socketService.disconnect();
    };
  }, []);

  const setupWebSocketSubscription = (driverId) => {
    console.log('Setting up WebSocket subscription for driver:', driverId);
    
    // Check if already connected
    if (socketService.isConnected && socketService.client && socketService.client.active) {
      console.log('Socket already connected and active, subscribing immediately');
      subscribeToDriverTopic(driverId);
      return;
    }

    // Connect first, then subscribe
    setSocketStatus('connecting');
    socketService.connect(
      () => {
        console.log('✅ WebSocket connected for driver', driverId);
        setSocketStatus('connected');
        // Wait for STOMP client to be fully active before subscribing
        const checkAndSubscribe = () => {
          if (socketService.client && socketService.client.active) {
            console.log('STOMP client is active, subscribing now');
            subscribeToDriverTopic(driverId);
          } else {
            console.log('Waiting for STOMP client to become active...');
            setTimeout(checkAndSubscribe, 100);
          }
        };
        setTimeout(checkAndSubscribe, 200);
      },
      (error) => {
        console.error('❌ WebSocket connection error:', error);
        setSocketStatus('error');
        // Retry connection after delay
        setTimeout(() => {
          console.log('Retrying WebSocket connection...');
          setupWebSocketSubscription(driverId);
        }, 3000);
      }
    );
  };

  const subscribeToDriverTopic = (driverId) => {
    if (!socketService.isConnected || !socketService.client) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    const topic = `/topic/driver/${driverId}/ride-requests`;
    console.log(`📡 Subscribing to topic: ${topic}`);
    
    const subscription = socketService.subscribe(topic, (message) => {
      console.log('🎉 Received ride request on topic:', topic, message);
      setRideRequest(message);
    });
    
    if (subscription) {
      subscriptionRef.current = topic; // Store topic for cleanup
      console.log(`✅ Successfully subscribed to ${topic}`);
    } else {
      console.error(`❌ Failed to subscribe to ${topic}`);
    }
  };

  const fetchDriverBookings = async (driverId) => {
    try {
      const response = await bookingService.getDriverBookings(driverId);
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async () => {
    if (!rideRequest || processingRequest) return;

    setProcessingRequest(true);
    const driverId = localStorage.getItem('driverId') || '1';

    try {
      // Send acceptance message via WebSocket
      const response = {
        requestId: rideRequest.requestId,
        bookingId: rideRequest.bookingId,
        driverId: driverId,
        action: 'ACCEPT',
        message: 'Driver accepted the ride'
      };

      // Send to /app/driver/ride-response
      socketService.publish('/app/driver/ride-response', response);
      console.log('Sent acceptance:', response);

      // Close modal and clear request
      setRideRequest(null);
      setProcessingRequest(false);
      
      // Refresh bookings after a short delay
      setTimeout(() => {
        fetchDriverBookings(driverId);
      }, 2000);
    } catch (error) {
      console.error('Error accepting ride:', error);
      setProcessingRequest(false);
    }
  };

  const handleRejectRide = async () => {
    if (!rideRequest || processingRequest) return;

    setProcessingRequest(true);
    const driverId = localStorage.getItem('driverId') || '1';

    try {
      // Send rejection message via WebSocket
      const response = {
        requestId: rideRequest.requestId,
        bookingId: rideRequest.bookingId,
        driverId: driverId,
        action: 'REJECT',
        message: 'Driver rejected the ride'
      };

      // Send to /app/driver/ride-response
      socketService.publish('/app/driver/ride-response', response);
      console.log('Sent rejection:', response);

      // Close modal and clear request
      setRideRequest(null);
      setProcessingRequest(false);
    } catch (error) {
      console.error('Error rejecting ride:', error);
      setProcessingRequest(false);
    }
  };

  const handleCloseModal = () => {
    setRideRequest(null);
  };

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    
    if (newStatus && currentLocation) {
      // Update driver location in location service
      const driverId = localStorage.getItem('driverId') || '1';
      try {
        await locationService.updateDriverLocation({
          driverId: driverId.toString(),
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="driver-dashboard-container">
      <nav className="driver-dashboard-nav">
        <h1>Uber Driver</h1>
          <div className="nav-actions">
          <button 
            onClick={() => navigate('/driver/location')}
            className="location-btn"
          >
            Update Location
          </button>
          <button 
            onClick={() => navigate('/driver/reviews')}
            className="reviews-btn"
          >
            My Reviews
          </button>
          <div className="availability-toggle">
            <span>Available</span>
            <button
              className={`toggle-btn ${isAvailable ? 'active' : ''}`}
              onClick={handleToggleAvailability}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="driver-dashboard-content">
        <div className="stats-section">
          <div className="stat-card">
            <h3>Total Rides</h3>
            <p className="stat-value">{bookings.length}</p>
          </div>
          <div className="stat-card">
            <h3>Status</h3>
            <p className={`stat-value ${isAvailable ? 'available' : 'unavailable'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </p>
          </div>
          <div className="stat-card">
            <h3>WebSocket</h3>
            <p className={`stat-value ${socketStatus === 'connected' ? 'available' : 'unavailable'}`}>
              {socketStatus === 'connected' ? 'Connected' : socketStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </p>
          </div>
        </div>

        <h2>My Rides</h2>
        
        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings yet.</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <span className="booking-id">#{booking.id}</span>
                  <span className={`status ${booking.bookingStatus?.toLowerCase()}`}>
                    {booking.bookingStatus}
                  </span>
                </div>
                <div className="booking-details">
                  <p><strong>Price:</strong> ${booking.price}</p>
                  <p><strong>Pickup Time:</strong> {new Date(booking.pickupTime).toLocaleString()}</p>
                </div>
                <div className="booking-actions">
                  <button 
                    onClick={() => navigate(`/driver/booking/${booking.id}`)}
                    className="view-btn"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Socket Test Message Box */}
      <MessageBox />

      {/* Ride Request Modal */}
      {rideRequest && (
        <RideRequestModal
          rideRequest={rideRequest}
          onAccept={handleAcceptRide}
          onReject={handleRejectRide}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DriverDashboard;

