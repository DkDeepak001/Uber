import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewService } from '../services/api';
import './DriverReviews.css';

const DriverReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const driverId = localStorage.getItem('driverId') || '1';
    fetchDriverReviews(driverId);
  }, []);

  const fetchDriverReviews = async (driverId) => {
    try {
      const response = await reviewService.getDriverReviews(driverId);
      setReviews(response.data || []);
    } catch (error) {
      setError('Failed to fetch reviews');
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  return (
    <div className="driver-reviews-container">
      <div className="driver-reviews-header">
        <button onClick={() => navigate('/driver/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>My Reviews</h1>
      </div>

      <div className="driver-reviews-content">
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading reviews...</div>
        ) : (
          <>
            <div className="stats-section">
              <div className="stat-card">
                <h3>Total Reviews</h3>
                <p className="stat-value">{reviews.length}</p>
              </div>
              <div className="stat-card">
                <h3>Average Rating</h3>
                <p className="stat-value">{calculateAverageRating()}</p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="empty-state">
                <p>No reviews yet.</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div>
                        <h3>Review #{review.id}</h3>
                        <p className="review-meta">
                          Booking ID: {review.bookingId}
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate(`/review/${review.id}`)}
                        className="view-btn"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="review-rating">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    <p className="review-date">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DriverReviews;

