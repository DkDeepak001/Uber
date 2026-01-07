import { createContext, useContext, useState, useEffect } from 'react';
import { authService, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'user' or 'driver'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    
    if (token) {
      setAuthToken(token);
      setUserType(storedUserType);
      // Optionally fetch user details
    }
    setLoading(false);
  }, []);

  const login = async (email, password, type = 'user') => {
    try {
      const response = type === 'user' 
        ? await authService.userSignin({ email, password })
        : await authService.driverSignin({ email, password });
      
      if (response.data.accesToken) {
        const token = response.data.accesToken;
        localStorage.setItem('token', token);
        localStorage.setItem('userType', type);
        setAuthToken(token);
        setUserType(type);
        setUser({ email, type });
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errorMessage || 'Login failed' 
      };
    }
  };

  const signup = async (data, type = 'user') => {
    try {
      const response = type === 'user'
        ? await authService.userSignup(data)
        : await authService.driverSignup(data);
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: 'Signup failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errorMessage || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    setAuthToken(null);
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, userType, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

