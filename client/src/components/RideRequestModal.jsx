import { useState, useEffect } from 'react';
import './RideRequestModal.css';

const RideRequestModal = ({ rideRequest, onAccept, onReject, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!rideRequest || !rideRequest.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      // expiresAt might be in seconds (epoch) or milliseconds - handle both
      let expires = rideRequest.expiresAt;
      // If expiresAt is less than a reasonable timestamp (year 2000 in ms), assume it's in seconds
      if (expires < 946684800000) {
        expires = expires * 1000; // Convert seconds to milliseconds
      }
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rideRequest]);

  if (!rideRequest) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ride-request-modal-overlay" onClick={onClose}>
      <div className="ride-request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Ride Request</h2>
          {timeRemaining !== null && (
            <div className="timer">
              <span className="timer-label">Time remaining:</span>
              <span className={`timer-value ${timeRemaining < 10 ? 'urgent' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        <div className="modal-content">
          {rideRequest.message && (
            <p className="request-message">{rideRequest.message}</p>
          )}

          <div className="ride-details">
            <div className="detail-row">
              <span className="detail-label">Price:</span>
              <span className="detail-value">${rideRequest.price?.toFixed(2) || 'N/A'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Pickup:</span>
              <span className="detail-value">
                {rideRequest.pickupLatitude?.toFixed(4)}, {rideRequest.pickupLongitude?.toFixed(4)}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Dropoff:</span>
              <span className="detail-value">
                {rideRequest.dropoffLatitude?.toFixed(4)}, {rideRequest.dropoffLongitude?.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="reject-btn"
            onClick={onReject}
            disabled={timeRemaining === 0}
          >
            Reject
          </button>
          <button 
            className="accept-btn"
            onClick={onAccept}
            disabled={timeRemaining === 0}
          >
            Accept Ride
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideRequestModal;
