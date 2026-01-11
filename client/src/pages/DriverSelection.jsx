import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import './DriverSelection.css';

const DRIVERS = [
  {
    id: '1',
    name: 'Driver 1',
    email: 'driver1@uber.com',
    password: 'driver123',
    phone: '+1234567890'
  },
  {
    id: '2',
    name: 'Driver 2',
    email: 'driver2@uber.com',
    password: 'driver123',
    phone: '+1234567891'
  },
  {
    id: '3',
    name: 'Driver 3',
    email: 'driver3@uber.com',
    password: 'driver123',
    phone: '+1234567892'
  }
];

const DriverSelection = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDriverSelect = async (driver) => {
    setLoading(true);
    setError(null);

    try {
      // First, try to sign up (in case driver doesn't exist)
      // If signup fails (user exists), proceed to login
      try {
        await authService.driverSignup({
          name: driver.name,
          email: driver.email,
          password: driver.password,
          phoneNumber: driver.phone
        });
        console.log(`Driver ${driver.name} signed up successfully`);
      } catch (signupError) {
        // Driver might already exist, that's okay
        console.log(`Driver ${driver.name} might already exist, proceeding to login`);
      }

      // Now login
      const loginResult = await login(driver.email, driver.password, 'driver');
      
      if (loginResult.success) {
        // Store driver ID in localStorage
        localStorage.setItem('driverId', driver.id);
        // Navigate to driver dashboard
        navigate('/driver/dashboard');
      } else {
        setError(loginResult.error || 'Login failed');
      }
    } catch (err) {
      console.error('Error selecting driver:', err);
      setError(err.response?.data?.errorMessage || 'Failed to login driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-selection-container">
      <div className="driver-selection-card">
        <h1>Select a Driver</h1>
        <p className="subtitle">Choose a driver to test the driver flow</p>
        
        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="drivers-grid">
          {DRIVERS.map((driver) => (
            <div 
              key={driver.id} 
              className="driver-card"
              onClick={() => !loading && handleDriverSelect(driver)}
            >
              <div className="driver-avatar">
                <span>{driver.name.charAt(driver.name.length - 1)}</span>
              </div>
              <h3>{driver.name}</h3>
              <p className="driver-email">{driver.email}</p>
              <button 
                className="select-driver-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Driver'}
              </button>
            </div>
          ))}
        </div>

        <div className="back-link">
          <button onClick={() => navigate('/login')} className="back-btn">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverSelection;
