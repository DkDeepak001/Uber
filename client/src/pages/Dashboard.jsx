import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/api';
import MessageBox from '../components/MessageBox';
import './Dashboard.css';

const Dashboard = () => {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd get userId from auth context
    const userId = localStorage.getItem('userId');
    if (userId && userType === 'user') {
      fetchUserBookings(userId);
    }
  }, []);

  const fetchUserBookings = async (userId) => {
    try {
      const response = await bookingService.getUserBookings(userId);
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1>Uber</h1>
        <div className="nav-actions">
          <button onClick={() => navigate('/book')} className="book-btn">
            Book a Ride
          </button>
          <button onClick={() => navigate('/reviews')} className="reviews-btn">
            All Reviews
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h2>My Rides</h2>
        
        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings yet. Book your first ride!</p>
            <button onClick={() => navigate('/book')} className="primary-btn">
              Book Now
            </button>
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
                <button 
                  onClick={() => navigate(`/booking/${booking.id}`)}
                  className="view-btn"
                >
                  View Details
                </button>
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

export default Dashboard;

