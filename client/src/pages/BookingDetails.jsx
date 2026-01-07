import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService, reviewService } from '../services/api';
import './BookingDetails.css';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showUpdateReviewForm, setShowUpdateReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [updateBookingData, setUpdateBookingData] = useState({});
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

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      await bookingService.updateBooking(id, updateBookingData);
      setShowUpdateForm(false);
      fetchBookingDetails();
      setError('');
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to update booking');
    }
  };

  const handleDeleteBooking = async () => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }
    try {
      await bookingService.deleteBooking(id);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to delete booking');
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    try {
      await reviewService.updateReview(review.id, {
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      setShowUpdateReviewForm(false);
      fetchReview();
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
      await reviewService.deleteReview(review.id);
      setReview(null);
      setError('');
    } catch (error) {
      setError(error.response?.data?.errorMessage || 'Failed to delete review');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!booking) {
    return <div className="error">Booking not found</div>;
  }

  return (
    <div className="booking-details-container">
      <div className="booking-details-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>Booking Details</h1>
      </div>

      <div className="booking-details-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="booking-info-card">
          <div className="booking-header-actions">
            <h2>Booking #{booking.id}</h2>
            <div className="action-buttons">
              <button 
                onClick={() => {
                  setUpdateBookingData({
                    bookingStatus: booking.bookingStatus,
                    pickupTime: booking.pickupTime,
                    dropoffTime: booking.dropoffTime,
                    price: booking.price,
                    driverId: booking.driverId,
                  });
                  setShowUpdateForm(true);
                }}
                className="update-btn"
              >
                Update
              </button>
              <button 
                onClick={handleDeleteBooking}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div className="info-section">
            <div className="info-item">
              <span className="label">Status:</span>
              <span className={`value status ${booking.bookingStatus?.toLowerCase()}`}>
                {booking.bookingStatus}
              </span>
            </div>
            
            <div className="info-item">
              <span className="label">Price:</span>
              <span className="value">${booking.price}</span>
            </div>
            
            <div className="info-item">
              <span className="label">Pickup Time:</span>
              <span className="value">
                {new Date(booking.pickupTime).toLocaleString()}
              </span>
            </div>
            
            <div className="info-item">
              <span className="label">Dropoff Time:</span>
              <span className="value">
                {new Date(booking.dropoffTime).toLocaleString()}
              </span>
            </div>
          </div>

          {showUpdateForm && (
            <form onSubmit={handleUpdateBooking} className="update-form">
              <h3>Update Booking</h3>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={updateBookingData.bookingStatus || booking.bookingStatus}
                  onChange={(e) => setUpdateBookingData({ ...updateBookingData, bookingStatus: e.target.value })}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateBookingData.price || booking.price}
                  onChange={(e) => setUpdateBookingData({ ...updateBookingData, price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Update</button>
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

          {booking.bookingStatus === 'COMPLETED' && !review && !showReviewForm && (
            <button 
              onClick={() => setShowReviewForm(true)}
              className="review-btn"
            >
              Write a Review
            </button>
          )}

          {showReviewForm && (
            <form onSubmit={handleReviewSubmit} className="review-form">
              <h3>Write a Review</h3>
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
                <button type="submit" className="submit-btn">Submit Review</button>
                <button 
                  type="button" 
                  onClick={() => setShowReviewForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {review && !showUpdateReviewForm && (
            <div className="review-card">
              <div className="review-header">
                <h3>Your Review</h3>
                <div className="review-actions">
                  <button 
                    onClick={() => {
                      setReviewData({ rating: review.rating, comment: review.comment });
                      setShowUpdateReviewForm(true);
                    }}
                    className="update-btn-small"
                  >
                    Update
                  </button>
                  <button 
                    onClick={handleDeleteReview}
                    className="delete-btn-small"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="review-rating">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          )}

          {showUpdateReviewForm && (
            <form onSubmit={handleUpdateReview} className="review-form">
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
                  onClick={() => setShowUpdateReviewForm(false)}
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

export default BookingDetails;

