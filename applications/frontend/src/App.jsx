import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setAuthToken } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Set auth token when user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      setAuthToken(token);
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Microservices
            </h1>
            <p className="text-lg text-gray-600">Management System</p>
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

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;