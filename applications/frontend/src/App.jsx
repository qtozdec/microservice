import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { setAuthToken } from './services/api';
import webSocketService from './services/websocket';
import GlobalSearch from './components/GlobalSearch';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const [showRegister, setShowRegister] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Set auth token when user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      setAuthToken(token);
    }
  }, [user]);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (user?.userId && isAuthenticated()) {
      webSocketService.connect(user.userId).catch(error => {
        // WebSocket connection failed
      });

      // Request notification permission
      webSocketService.requestNotificationPermission();
    } else if (!isAuthenticated()) {
      // Disconnect WebSocket when user logs out
      if (webSocketService.isConnected()) {
        // Disconnecting WebSocket
        webSocketService.disconnect();
      }
    }

    // Cleanup on unmount
    return () => {
      if (webSocketService.isConnected()) {
        webSocketService.disconnect();
      }
    };
  }, [user?.userId, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
              Microservices
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-200">Management System</p>
          </div>
          
          {showRegister ? (
            <Register onToggleView={() => setShowRegister(false)} />
          ) : (
            <Login onToggleView={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard />
      
      {/* Global Components */}
      <GlobalSearch 
        isOpen={showGlobalSearch} 
        onClose={() => setShowGlobalSearch(false)} 
      />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;