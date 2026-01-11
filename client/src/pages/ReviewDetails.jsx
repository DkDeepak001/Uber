import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userType, logout } = useAuth();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviewDetails();
  }, [id]);

  const fetchReviewDetails = async () => {
    try {
      const response = await reviewService.getReviewById(id);
      setReview(response.data);
    } catch (error) {
      setError('Failed to fetch review');
      console.error('Failed to fetch review:', error);
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

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Review not found</p>
          <button
            onClick={() => navigate(userType === 'driver' ? '/driver/reviews' : '/reviews')}
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
            onClick={() => navigate(userType === 'driver' ? '/driver/reviews' : '/reviews')}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                {review.user?.name || 'Anonymous'}
              </h2>
              {review.bookingId && (
                <p className="text-sm text-gray-500">Booking #{review.bookingId}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {review.comment && (
            <div className="mb-6">
              <p className="text-gray-700 text-lg leading-relaxed">{review.comment}</p>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Reviewed on {new Date(review.createdAt || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetails;
