import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const LOCATION_API_URL = 'http://localhost:8001/api/v1';
const BOOKING_API_URL = 'http://localhost:8002/api/v1';
const REVIEW_API_URL = 'http://localhost:8003/api/v1';

// Create axios instances
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const locationApi = axios.create({
  baseURL: LOCATION_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const bookingApi = axios.create({
  baseURL: BOOKING_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const reviewApi = axios.create({
  baseURL: REVIEW_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
const setAuthToken = (token) => {
  const tokenToUse = token || localStorage.getItem('token');
  if (tokenToUse) {
    authApi.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
    locationApi.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
    bookingApi.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
    reviewApi.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
  } else {
    delete authApi.defaults.headers.common['Authorization'];
    delete locationApi.defaults.headers.common['Authorization'];
    delete bookingApi.defaults.headers.common['Authorization'];
    delete reviewApi.defaults.headers.common['Authorization'];
  }
};

// Initialize token on load
setAuthToken();

// Auth Service
export const authService = {
  userSignup: (data) => authApi.post('/auth/signup', data),
  userSignin: (data) => authApi.post('/auth/signin', data),
  driverSignup: (data) => authApi.post('/driver/auth/signup', data),
  driverSignin: (data) => authApi.post('/driver/auth/signin', data),
  getCurrentUser: () => authApi.get('/auth/me'),
};

// Location Service
export const locationService = {
  updateDriverLocation: (data) => locationApi.post('/location/update', data),
  searchNearbyDrivers: (latitude, longitude) => 
    locationApi.get('/location/search', { params: { latitude, longitude } }),
  getDriverLocation: (driverId) => locationApi.get(`/location/driver/${driverId}`),
  deleteDriverLocation: (driverId) => locationApi.delete(`/location/driver/${driverId}`),
};

// Booking Service
export const bookingService = {
  createBooking: (data) => bookingApi.post('/booking/', data),
  requestRide: (data) => bookingApi.post('/booking/ride-request', data),
  getRideRequestStatus: (requestId) => bookingApi.get(`/booking/ride-request/${requestId}`),
  getBookingById: (bookingId) => bookingApi.get(`/booking/${bookingId}`),
  getBookingDetails: (bookingId) => bookingApi.get(`/booking/${bookingId}/details`),
  getUserBookings: (userId) => bookingApi.get(`/booking/user/${userId}`),
  getDriverBookings: (driverId) => bookingApi.get(`/booking/driver/${driverId}`),
  updateBooking: (bookingId, data) => bookingApi.put(`/booking/${bookingId}`, data),
  deleteBooking: (bookingId) => bookingApi.delete(`/booking/${bookingId}`),
};

// Review Service
export const reviewService = {
  createReview: (data) => reviewApi.post('/review/', data),
  getReviewById: (reviewId) => reviewApi.get(`/review/${reviewId}`),
  getReviewByBookingId: (bookingId) => reviewApi.get(`/review/booking/${bookingId}`),
  getAllReviewsByBookingId: (bookingId) => reviewApi.get(`/review/booking/${bookingId}/all`),
  getAllReviews: () => reviewApi.get('/review/'),
  getDriverReviews: (driverId) => reviewApi.get(`/review/driver/${driverId}`),
  updateReview: (reviewId, data) => reviewApi.put(`/review/${reviewId}`, data),
  deleteReview: (reviewId) => reviewApi.delete(`/review/${reviewId}`),
};

export { setAuthToken };

