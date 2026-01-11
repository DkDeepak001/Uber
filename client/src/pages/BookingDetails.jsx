import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService, reviewService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
    fetchReview();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingService.getBookingDetails(id);
      setBooking(response.data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReview = async () => {
    try {
      const response = await reviewService.getReviewByBookingId(id);
      setReview(response.data);
    } catch (error) {
      // Review might not exist yet
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewService.createReview({
        bookingId: id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      setShowReviewForm(false);
      fetchReview();
    } catch (error) {
      alert(error.response?.data?.errorMessage || 'Failed to submit review');
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
            onClick={() => navigate('/book')}
            className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Go to Book Ride
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
            onClick={() => navigate('/dashboard')}
            className="text-gray-700 hover:text-black"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-black">Uber</h1>
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

        {/* Review Section */}
        {booking.bookingStatus === 'COMPLETED' && !review && !showReviewForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Write a Review
            </button>
          </div>
        )}

        {showReviewForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  value={reviewData.rating}
                  onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  required
                  rows="4"
                  placeholder="Share your experience..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {review && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Review</h3>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;
