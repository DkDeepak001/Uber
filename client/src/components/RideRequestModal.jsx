import { useState, useEffect } from 'react';

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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">New Ride Request</h2>
          {timeRemaining !== null && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Time remaining</p>
              <p className={`text-xl font-bold ${timeRemaining < 10 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          {rideRequest.message && (
            <p className="bg-blue-50 text-blue-900 p-3 rounded-lg mb-4 text-sm">
              {rideRequest.message}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Fare</span>
              <span className="text-lg font-bold text-gray-900">
                ${rideRequest.price?.toFixed(2) || 'N/A'}
              </span>
            </div>
            
            <div className="py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 block mb-1">PICKUP</span>
              <span className="text-sm text-gray-900 font-mono">
                {rideRequest.pickupLatitude?.toFixed(4)}, {rideRequest.pickupLongitude?.toFixed(4)}
              </span>
            </div>
            
            <div className="py-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">DROPOFF</span>
              <span className="text-sm text-gray-900 font-mono">
                {rideRequest.dropoffLatitude?.toFixed(4)}, {rideRequest.dropoffLongitude?.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onReject}
            disabled={timeRemaining === 0}
          >
            Decline
          </button>
          <button 
            className="flex-1 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onAccept}
            disabled={timeRemaining === 0}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideRequestModal;
