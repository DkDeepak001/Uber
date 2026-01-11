import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AllReviews = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    try {
      const response = await reviewService.getAllReviews();
      setReviews(response.data || []);
    } catch (error) {
      setError('Failed to fetch reviews');
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/book')}
            className="text-gray-700 hover:text-black"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-black">Uber</h1>
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Rides
            </button>
            <button
              onClick={() => navigate('/book')}
              className="text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Book Ride
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
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Reviews</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-600">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/review/${review.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.user?.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {review.bookingId && `Booking #${review.bookingId}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllReviews;
