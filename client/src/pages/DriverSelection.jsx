import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

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
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Select a Driver</h1>
          <p className="text-gray-400">Choose a driver to test the driver flow</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {DRIVERS.map((driver) => (
            <div 
              key={driver.id} 
              className="bg-white rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
              onClick={() => !loading && handleDriverSelect(driver)}
            >
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {driver.name.charAt(driver.name.length - 1)}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                {driver.name}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">{driver.email}</p>
              <button 
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Driver'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverSelection;
