import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Checking stored auth data
    
    if (storedToken) {
      setToken(storedToken);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // User loaded from storage
        } catch (error) {
          localStorage.removeItem('user');
        }
      } else {
        // If we have a token but no user data, try to decode the token
        try {
          const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
          // Extracting user data from token
          
          if (tokenData.sub && tokenData.userId) {
            const userFromToken = {
              email: tokenData.sub,
              userId: tokenData.userId,
              role: tokenData.role || 'USER',
              name: tokenData.name || tokenData.sub
            };
            setUser(userFromToken);
            localStorage.setItem('user', JSON.stringify(userFromToken));
            // User restored from token
          }
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    setAuthToken(null); // Clear auth token from API headers
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};