import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewService } from '../services/api';
import './AllReviews.css';

const AllReviews = () => {
  const navigate = useNavigate();
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
    <div className="all-reviews-container">
      <div className="all-reviews-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>All Reviews</h1>
      </div>

      <div className="all-reviews-content">
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
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
                      Booking ID: {review.bookingId} | Driver ID: {review.driverId}
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
      </div>
    </div>
  );
};

export default AllReviews;

