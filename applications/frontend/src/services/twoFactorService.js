import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';

// Create axios instance for 2FA operations
const twoFactorAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/auth/2fa`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
twoFactorAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
twoFactorAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken: refreshToken
          });
          
          const { token: newToken } = response.data;
          localStorage.setItem('token', newToken);
          
          return twoFactorAPI(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const twoFactorService = {
  // Setup 2FA - generates QR code and secret
  setup: async (userId) => {
    const response = await twoFactorAPI.post(`/setup`, { userId });
    return response.data;
  },

  // Verify 2FA code and enable 2FA
  verify: async (userId, code) => {
    const response = await twoFactorAPI.post(`/verify`, { userId, code });
    return response.data;
  },

  // Disable 2FA
  disable: async (userId) => {
    const response = await twoFactorAPI.post(`/disable`, { userId });
    return response.data;
  },

  // Verify 2FA code during login
  verifyLogin: async (userId, code) => {
    const response = await twoFactorAPI.post(`/verify-login`, { userId, code });
    return response.data;
  },

  // Verify backup code during login
  verifyBackupCode: async (userId, backupCode) => {
    const response = await twoFactorAPI.post(`/verify-backup`, { userId, backupCode });
    return response.data;
  },

  // Get backup codes
  getBackupCodes: async (userId) => {
    const response = await twoFactorAPI.get(`/backup-codes/${userId}`);
    return response.data;
  },

  // Regenerate backup codes
  regenerateBackupCodes: async (userId) => {
    const response = await twoFactorAPI.post(`/regenerate-backup-codes`, { userId });
    return response.data;
  },

  // Check if user has 2FA enabled
  getStatus: async (userId) => {
    const response = await twoFactorAPI.get(`/status/${userId}`);
    return response.data;
  }
};

export default twoFactorService;