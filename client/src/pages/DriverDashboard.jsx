import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService, locationService } from '../services/api';
import { socketService } from '../services/socket';
import RideRequestModal from '../components/RideRequestModal';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <h1 className="text-2xl font-bold text-black">Uber Driver</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/driver/location')}
            className="text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Update Location
          </button>
          <button
            onClick={() => navigate('/driver/reviews')}
            className="text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Reviews
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-gray-700 hover:text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Rides</h3>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <p className={`text-3xl font-bold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Connection</h3>
            <p className={`text-3xl font-bold ${
              socketStatus === 'connected' ? 'text-green-600' : 
              socketStatus === 'connecting' ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {socketStatus === 'connected' ? 'Connected' : 
               socketStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Go Online</h3>
              <p className="text-sm text-gray-500">
                {isAvailable ? 'You are available to receive ride requests' : 'Turn on to start receiving ride requests'}
              </p>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isAvailable ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAvailable ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Rides</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-600">No bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/driver/booking/${booking.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Ride #{booking.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.bookingStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      booking.bookingStatus === 'ON_THE_WAY' ? 'bg-blue-100 text-blue-700' :
                      booking.bookingStatus === 'CONFIRMED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">${booking.price?.toFixed(2) || '0.00'}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(booking.pickupTime).toLocaleDateString()} at {new Date(booking.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button className="text-black hover:text-gray-700">
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
