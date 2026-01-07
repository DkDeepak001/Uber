import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/api';
import './DriverBookingDetails.css';

const DriverBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateBookingData, setUpdateBookingData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!booking) {
    return <div className="error">Booking not found</div>;
  }

  return (
    <div className="driver-booking-details-container">
      <div className="driver-booking-details-header">
        <button onClick={() => navigate('/driver/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>Booking Details</h1>
      </div>

      <div className="driver-booking-details-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="booking-info-card">
          <div className="booking-header-actions">
            <h2>Booking #{booking.id}</h2>
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
        </div>
      </div>
    </div>
  );
};

export default DriverBookingDetails;

