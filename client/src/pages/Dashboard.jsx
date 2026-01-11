import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/api';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-black">Uber</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/book')}
              className="text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Book Ride
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Rides</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-6">No bookings yet. Book your first ride!</p>
            <button
              onClick={() => navigate('/book')}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/booking/${booking.id}`)}
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
  );
};

export default Dashboard;
