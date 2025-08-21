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
    
    console.log('AuthContext: Checking stored auth data');
    console.log('Stored token:', storedToken ? 'exists' : 'not found');
    console.log('Stored user:', storedUser ? 'exists' : 'not found');
    
    if (storedToken) {
      setToken(storedToken);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('AuthContext: User loaded from storage:', parsedUser.name);
        } catch (error) {
          console.error('AuthContext: Error parsing stored user data:', error);
          localStorage.removeItem('user');
        }
      } else {
        // If we have a token but no user data, try to decode the token
        try {
          const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
          console.log('AuthContext: Token payload:', tokenData);
          
          if (tokenData.sub && tokenData.userId) {
            const userFromToken = {
              email: tokenData.sub,
              userId: tokenData.userId,
              role: tokenData.role || 'USER',
              name: tokenData.name || tokenData.sub
            };
            setUser(userFromToken);
            localStorage.setItem('user', JSON.stringify(userFromToken));
            console.log('AuthContext: User restored from token:', userFromToken);
          }
        } catch (error) {
          console.error('AuthContext: Error decoding token:', error);
          localStorage.removeItem('token');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    console.log('AuthContext: login called with:', { userData, authToken });
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('AuthContext: login completed, user set to:', userData);
  };

  const updateUser = (updatedUserData) => {
    console.log('AuthContext: updating user data:', updatedUserData);
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    console.log('AuthContext: user data updated:', newUser);
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    setAuthToken(null); // Clear auth token from API headers
    console.log('AuthContext: Logout completed, all tokens cleared');
  };

  const isAuthenticated = () => {
    const result = !!token && !!user;
    console.log('AuthContext: isAuthenticated check', { 
      hasToken: !!token, 
      hasUser: !!user, 
      result 
    });
    return result;
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