import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewService } from '../services/api';
import './ReviewDetails.css';

const ReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviewDetails();
  }, [id]);

  const fetchReviewDetails = async () => {
    try {
      const response = await reviewService.getReviewById(id);
      setReview(response.data);
      setReviewData({
        rating: response.data.rating,
        comment: response.data.comment,
      });
    } catch (error) {
      setError('Failed to fetch review');
      console.error('Failed to fetch review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    try {
      await reviewService.updateReview(id, reviewData);
      setShowUpdateForm(false);
      fetchReviewDetails();
      setError('');
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to update review');
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    try {
      await reviewService.deleteReview(id);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to delete review');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!review) {
    return <div className="error">Review not found</div>;
  }

  return (
    <div className="review-details-container">
      <div className="review-details-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <h1>Review Details</h1>
      </div>

      <div className="review-details-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="review-info-card">
          <div className="review-header-actions">
            <h2>Review #{review.id}</h2>
            <div className="action-buttons">
              <button 
                onClick={() => setShowUpdateForm(true)}
                className="update-btn"
              >
                Update
              </button>
              <button 
                onClick={handleDeleteReview}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>

          {!showUpdateForm ? (
            <>
              <div className="info-section">
                <div className="info-item">
                  <span className="label">Booking ID:</span>
                  <span className="value">{review.bookingId}</span>
                </div>
                
                <div className="info-item">
                  <span className="label">Driver ID:</span>
                  <span className="value">{review.driverId}</span>
                </div>
                
                <div className="info-item">
                  <span className="label">Rating:</span>
                  <span className="value">
                    <div className="review-rating">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="label">Comment:</span>
                  <span className="value">{review.comment}</span>
                </div>
                
                <div className="info-item">
                  <span className="label">Created At:</span>
                  <span className="value">
                    {new Date(review.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdateReview} className="update-form">
              <h3>Update Review</h3>
              <div className="form-group">
                <label>Rating</label>
                <select
                  value={reviewData.rating}
                  onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                  required
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  required
                  rows="4"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Update Review</button>
                <button 
                  type="button" 
                  onClick={() => setShowUpdateForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetails;

