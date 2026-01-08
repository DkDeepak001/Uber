import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DriverDashboard from './pages/DriverDashboard';
import DriverLocation from './pages/DriverLocation';
import BookRide from './pages/BookRide';
import BookingDetails from './pages/BookingDetails';
import DriverBookingDetails from './pages/DriverBookingDetails';
import AllReviews from './pages/AllReviews';
import DriverReviews from './pages/DriverReviews';
import ReviewDetails from './pages/ReviewDetails';
import './App.css';

const ProtectedRoute = ({ children, requiredType }) => {
  const { userType, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredType && userType !== requiredType) {
    return <Navigate to={requiredType === 'driver' ? '/driver/dashboard' : '/dashboard'} replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredType="user">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/dashboard" 
            element={
              <ProtectedRoute requiredType="driver">
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/location" 
            element={
              <ProtectedRoute requiredType="driver">
                <DriverLocation />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/book" 
            element={
              <ProtectedRoute requiredType="user">
                <BookRide />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/booking/:id" 
            element={
              <ProtectedRoute requiredType="user">
                <BookingDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/booking/:id" 
            element={
              <ProtectedRoute requiredType="driver">
                <DriverBookingDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reviews" 
            element={
              <ProtectedRoute requiredType="user">
                <AllReviews />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/reviews" 
            element={
              <ProtectedRoute requiredType="driver">
                <DriverReviews />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/review/:id" 
            element={
              <ProtectedRoute>
                <ReviewDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
