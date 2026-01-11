import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService, locationService, reviewService } from '../services/api';
import { socketService } from '../services/socket';
import Map from '../components/Map';

const BookRide = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
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
  const [rideStatus, setRideStatus] = useState(null); // 'SEARCHING', 'DRIVER_FOUND', 'CONFIRMED', 'COMPLETED', 'TIMEOUT'
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmedDriver, setConfirmedDriver] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const subscriptionRef = useRef(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [endingRide, setEndingRide] = useState(false);
  const [ratingData, setRatingData] = useState({ rating: 5, comment: '' });
  const [submittingRating, setSubmittingRating] = useState(false);
  const pollIntervalRef = useRef(null);

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
          // Set as pickup location if not already set
          if (!pickupLocation) {
            setPickupLocation(location);
            searchNearbyDrivers(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Only set default if geolocation fails - but don't set as pickupLocation
          // This way map will show default but user can still select their location
          const defaultLocation = { latitude: 40.7128, longitude: -74.0060 };
          setUserLocation(defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Fallback if geolocation is not supported
      const defaultLocation = { latitude: 40.7128, longitude: -74.0060 };
      setUserLocation(defaultLocation);
    }

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        socketService.unsubscribe(subscriptionRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const handlePickupSelect = (location) => {
    setPickupLocation(location);
    searchNearbyDrivers(location);
    setShowBookingForm(true);
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
            
            // Stop polling immediately when confirmed
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
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
            
            // Stop polling immediately when confirmed
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
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
              // Stop polling immediately when confirmed
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              
              setRideStatus('CONFIRMED');
              // Extract bookingId from message if present
              const bookingIdMatch = content.match(/Booking ID:?\s*(\d+)/i);
              if (bookingIdMatch) {
                fetchBookingDetails(parseInt(bookingIdMatch[1]));
              } else {
                fetchConfirmedBooking(requestId);
              }
            } else if (content.includes('timeout') || content.includes('No nearby')) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
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
    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const pollInterval = setInterval(async () => {
      // Don't poll if already confirmed - we have bookingId
      if (rideStatus === 'CONFIRMED' && confirmedBooking?.bookingId) {
        clearInterval(pollInterval);
        pollIntervalRef.current = null;
        return;
      }

      try {
        const response = await bookingService.getRideRequestStatus(requestId);
        if (response.data) {
          const status = response.data.status;
          
          // Only update status if not already confirmed (to prevent overwriting confirmed state)
          if (status === 'CONFIRMED' && response.data.bookingId) {
            // Stop polling immediately
            clearInterval(pollInterval);
            pollIntervalRef.current = null;
            
            // Only fetch if we don't already have booking details
            if (!confirmedBooking || confirmedBooking.bookingId !== response.data.bookingId) {
              setRideStatus('CONFIRMED');
              setStatusMessage(response.data.message || 'Ride confirmed!');
              fetchBookingDetails(response.data.bookingId);
            }
          } else if (status === 'TIMEOUT') {
            clearInterval(pollInterval);
            pollIntervalRef.current = null;
            setRideStatus('TIMEOUT');
            setStatusMessage('Request timed out');
          } else if (status !== 'CONFIRMED') {
            // Only update status for non-confirmed states
            setRideStatus(status);
            setStatusMessage(response.data.message || '');
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
        // If we already have confirmed booking, ignore errors (request might be expired)
        if (confirmedBooking?.bookingId) {
          console.log('Polling error ignored - booking already confirmed:', error.message);
          clearInterval(pollInterval);
          pollIntervalRef.current = null;
          return;
        }
        
        // Only log error if we don't have a confirmed booking
        console.error('Error polling ride status:', error);
        
        // If error suggests request not found/expired and we're not confirmed, set timeout
        if (error.response?.status === 404 || error.response?.data?.message?.includes('not found') || 
            error.response?.data?.message?.includes('expired')) {
          // Only set timeout if we're still in searching/found state
          if (rideStatus === 'SEARCHING' || rideStatus === 'DRIVER_FOUND') {
            clearInterval(pollInterval);
            pollIntervalRef.current = null;
            setRideStatus('TIMEOUT');
            setStatusMessage('Ride request not found or expired');
          }
        }
      }
    }, 2000); // Poll every 2 seconds

    pollIntervalRef.current = pollInterval;

    // Cleanup after 60 seconds
    setTimeout(() => {
      if (pollIntervalRef.current === pollInterval) {
        clearInterval(pollInterval);
        pollIntervalRef.current = null;
      }
    }, 60000);
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
        
        // Extract driver information from booking details
        const booking = response.data;
        let driverLocation = null;
        
        // Get driver location
        if (booking.driverLatitude && booking.driverLongitude) {
          driverLocation = {
            latitude: booking.driverLatitude,
            longitude: booking.driverLongitude,
          };
        } else if (booking.driverId) {
          try {
            const locResponse = await locationService.getDriverLocation(booking.driverId);
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
        
        // Set confirmed driver with all details
        setConfirmedDriver({
          driverId: booking.driverId || booking.bookingId,
          name: booking.driverName || `Driver ${booking.driverId || booking.bookingId}`,
          phoneNumber: booking.driverPhoneNumber || 'N/A',
          vehicleRegNumber: booking.driverVehicleRegNumber || 'N/A',
          rating: booking.driverRating || 0,
          latitude: driverLocation?.latitude || pickupLocation?.latitude,
          longitude: driverLocation?.longitude || pickupLocation?.longitude,
        });
        
        // Show confirmation popup for 2 seconds, then auto-dismiss
        setShowConfirmationPopup(true);
        setTimeout(() => {
          setShowConfirmationPopup(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const handleEndRide = async () => {
    if (!confirmedBooking || endingRide) return;
    
    setEndingRide(true);
    try {
      // Format dates for SQL Date (YYYY-MM-DD)
      const now = new Date();
      const dropoffDate = now.toISOString().split('T')[0];
      const pickupDate = confirmedBooking.pickupTime 
        ? new Date(confirmedBooking.pickupTime).toISOString().split('T')[0]
        : dropoffDate;
      
      // Use bookingId from confirmedBooking
      const bookingId = confirmedBooking.bookingId;
      
      if (!bookingId) {
        throw new Error('Booking ID not found');
      }
      
      // Update booking status to COMPLETED
      // Only send essential fields - driver and locations are already set on the booking
      const updateData = {
        bookingStatus: 'COMPLETED',
        dropoffTime: dropoffDate,
      };
      
      // Include pickup time if available
      if (confirmedBooking.pickupTime) {
        updateData.pickupTime = pickupDate;
      }
      
      // Include price if available
      if (confirmedBooking.price != null) {
        updateData.price = confirmedBooking.price;
      }
      
      // Include location coordinates (backend will update existing locations)
      if (confirmedBooking.pickupLatitude && confirmedBooking.pickupLongitude) {
        updateData.pickupLatitude = confirmedBooking.pickupLatitude;
        updateData.pickupLongitude = confirmedBooking.pickupLongitude;
      } else if (pickupLocation?.latitude && pickupLocation?.longitude) {
        updateData.pickupLatitude = pickupLocation.latitude;
        updateData.pickupLongitude = pickupLocation.longitude;
      }
      
      if (confirmedBooking.dropoffLatitude && confirmedBooking.dropoffLongitude) {
        updateData.dropoffLatitude = confirmedBooking.dropoffLatitude;
        updateData.dropoffLongitude = confirmedBooking.dropoffLongitude;
      } else if (dropoffLocation?.latitude && dropoffLocation?.longitude) {
        updateData.dropoffLatitude = dropoffLocation.latitude;
        updateData.dropoffLongitude = dropoffLocation.longitude;
      }
      
      // Don't send driverId - driver is already set on the booking
      
      await bookingService.updateBooking(bookingId, updateData);
      
      // Update local state
      setRideStatus('COMPLETED');
      
      // Show rating form in bottom sheet
      setShowRating(true);
    } catch (error) {
      console.error('Error ending ride:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to end ride: ${error.response?.data?.message || error.message || 'Please try again.'}`);
    } finally {
      setEndingRide(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!confirmedBooking || submittingRating) return;
    
    setSubmittingRating(true);
    try {
      const bookingId = confirmedBooking.bookingId;
      if (!bookingId) {
        throw new Error('Booking ID not found');
      }
      await reviewService.createReview({
        bookingId: bookingId,
        rating: ratingData.rating,
        comment: ratingData.comment || '',
      });
      
      // Reset state for new ride
      setTimeout(() => {
        setRideStatus(null);
        setConfirmedBooking(null);
        setConfirmedDriver(null);
        setShowBookingForm(false);
        setShowRating(false);
        setRatingData({ rating: 5, comment: '' });
        setPickupLocation(null);
        setDropoffLocation(null);
      }, 1000);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-black">Uber</h1>
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Rides
            </button>
            <button
              onClick={() => navigate('/reviews')}
              className="text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Reviews
            </button>
          </div>
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

      {/* Main Map Area */}
      <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
        <Map
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          nearbyDrivers={confirmedDriver ? [confirmedDriver] : nearbyDrivers}
          onLocationSelect={!pickupLocation ? handlePickupSelect : handleDropoffSelect}
          height="100%"
          clickEnabled={!rideStatus || rideStatus === 'TIMEOUT'}
          userLocation={userLocation}
        />

        {/* Confirmation Popup - Auto-dismisses after 2 seconds */}
        {showConfirmationPopup && rideStatus === 'CONFIRMED' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-blue-600 text-white border-2 border-blue-700 rounded-xl px-6 py-4 shadow-xl min-w-[320px] max-w-md animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl font-bold">✓</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">Ride Confirmed!</h3>
                <p className="text-sm text-blue-100">Your driver is on the way</p>
              </div>
            </div>
          </div>
        )}

        {/* Ride Status Overlay - Only show for non-confirmed states */}
        {rideStatus && rideStatus !== 'CONFIRMED' && rideStatus !== 'COMPLETED' && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-40 ${
            rideStatus === 'SEARCHING' ? 'bg-yellow-50 border-yellow-200' :
            rideStatus === 'DRIVER_FOUND' ? 'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'
          } border-2 rounded-xl px-6 py-4 shadow-xl min-w-[320px] max-w-md`}>
            <div className="flex items-center gap-3">
              {rideStatus === 'SEARCHING' && (
                <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              )}
              {rideStatus === 'DRIVER_FOUND' && (
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
              {rideStatus === 'TIMEOUT' && (
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✗</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  {rideStatus === 'SEARCHING' && 'Searching for drivers...'}
                  {rideStatus === 'DRIVER_FOUND' && 'Drivers Found!'}
                  {rideStatus === 'TIMEOUT' && 'Request Timed Out'}
                </h3>
                {statusMessage && (
                  <p className="text-xs text-gray-600">{statusMessage}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Booking Card */}
        <div className="absolute bottom-0 left-0 right-0 z-40">
          <div className="bg-white rounded-t-3xl shadow-2xl max-w-2xl mx-auto">
            {!showBookingForm && !rideStatus ? (
              <div className="p-6 text-center">
                <p className="text-gray-600 mb-4">Where to?</p>
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  Set destination
                </button>
              </div>
            ) : !rideStatus || rideStatus === 'TIMEOUT' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Where to?</h2>
                  {showBookingForm && (
                    <button
                      onClick={() => {
                        setShowBookingForm(false);
                        setPickupLocation(null);
                        setDropoffLocation(null);
                        setRideStatus(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">FROM</label>
                    <input
                      type="text"
                      placeholder="Pickup location"
                      value={pickupLocation ? `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}` : ''}
                      readOnly
                      className="w-full bg-transparent text-gray-900 font-medium focus:outline-none"
                    />
                    {!pickupLocation && (
                      <p className="text-xs text-gray-500 mt-1">Click on map to select</p>
                    )}
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">TO</label>
                    <input
                      type="text"
                      placeholder="Dropoff location"
                      value={dropoffLocation ? `${dropoffLocation.latitude.toFixed(4)}, ${dropoffLocation.longitude.toFixed(4)}` : ''}
                      readOnly
                      className="w-full bg-transparent text-gray-900 font-medium focus:outline-none"
                    />
                    {pickupLocation && !dropoffLocation && (
                      <p className="text-xs text-gray-500 mt-1">Click on map to select</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">WHEN</label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !pickupLocation || !dropoffLocation || !pickupTime}
                    className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Requesting...' : rideStatus ? 'Request Sent' : 'Request ride'}
                  </button>

                  {rideStatus === 'CONFIRMED' && confirmedBooking && (
                    <button
                      type="button"
                      onClick={() => navigate(`/booking/${confirmedBooking.id}`)}
                      className="w-full bg-gray-900 text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors mt-2"
                    >
                      View Booking Details
                    </button>
                  )}
                </form>
              </div>
            ) : (rideStatus === 'CONFIRMED' || rideStatus === 'COMPLETED' || confirmedBooking?.bookingId) && confirmedDriver ? (
              // Driver Details View - Show when ride is confirmed (persist even if polling fails)
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {confirmedDriver.name.charAt(confirmedDriver.name.length - 1)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{confirmedDriver.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < Math.round(confirmedDriver.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({confirmedDriver.rating?.toFixed(1) || '0.0'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-lg">🚗</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Vehicle</p>
                        <p className="text-sm font-medium text-gray-900">{confirmedDriver.vehicleRegNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-lg">📞</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Phone</p>
                        <a 
                          href={`tel:${confirmedDriver.phoneNumber}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {confirmedDriver.phoneNumber}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {!showRating ? (
                  <button
                    onClick={handleEndRide}
                    disabled={endingRide}
                    className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {endingRide ? 'Completing Ride...' : 'Complete Ride'}
                  </button>
                ) : (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate your ride</h3>
                    <form onSubmit={handleRatingSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
                        <div className="flex items-center gap-2 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingData({ ...ratingData, rating: star })}
                              className={`text-4xl transition-transform hover:scale-110 ${
                                star <= ratingData.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-2">{ratingData.rating} out of 5</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add a comment (optional)
                        </label>
                        <textarea
                          value={ratingData.comment}
                          onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                          rows="3"
                          placeholder="Share your experience..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingRating}
                        className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingRating ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="mb-4">
                  {rideStatus === 'SEARCHING' && (
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-700 font-medium">Searching for drivers...</span>
                    </div>
                  )}
                  {rideStatus === 'DRIVER_FOUND' && (
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-gray-700 font-medium">Waiting for driver to accept...</span>
                    </div>
                  )}
                  {statusMessage && (
                    <p className="text-sm text-gray-500">{statusMessage}</p>
                  )}
                </div>
                {rideStatus === 'TIMEOUT' && (
                  <button
                    onClick={() => {
                      setRideStatus(null);
                      setShowBookingForm(true);
                    }}
                    className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default BookRide;
