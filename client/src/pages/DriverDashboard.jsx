import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService, locationService } from '../services/api';
import MessageBox from '../components/MessageBox';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Get driver ID from localStorage (in real app, from auth context)
    const driverId = localStorage.getItem('driverId') || '1';
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
  }, []);

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
    </div>
  );
};

export default DriverDashboard;

