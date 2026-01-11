import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DriverBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingService.getBookingDetails(id);
      setBooking(response.data);
    } catch (error) {
      setError('Failed to fetch booking');
      console.error('Failed to fetch booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Booking not found</p>
          <button
            onClick={() => navigate('/driver/dashboard')}
            className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Ride #{booking.id}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              booking.bookingStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              booking.bookingStatus === 'ON_THE_WAY' ? 'bg-blue-100 text-blue-700' :
              booking.bookingStatus === 'CONFIRMED' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {booking.bookingStatus}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Fare</span>
              <span className="text-xl font-bold text-gray-900">${booking.price?.toFixed(2) || '0.00'}</span>
            </div>
            
            <div className="py-3 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 block mb-1">PICKUP TIME</span>
              <span className="text-sm text-gray-900">
                {new Date(booking.pickupTime).toLocaleString()}
              </span>
            </div>
            
            <div className="py-3">
              <span className="text-xs font-medium text-gray-500 block mb-1">DROPOFF TIME</span>
              <span className="text-sm text-gray-900">
                {new Date(booking.dropoffTime).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverBookingDetails;
