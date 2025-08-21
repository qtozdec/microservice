import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';

// Create axios instance for profile operations
const profileAPI = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
profileAPI.interceptors.request.use(
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
profileAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });
          
          const { token: newToken } = response.data;
          localStorage.setItem('token', newToken);
          
          return profileAPI(originalRequest);
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

export const profileService = {
  // Upload avatar
  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await profileAPI.post(`/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    const response = await profileAPI.put(`/${userId}/profile`, profileData);
    return response.data;
  },

  // Get user profile
  getProfile: async (userId) => {
    const response = await profileAPI.get(`/${userId}`);
    return response.data;
  },

  // Get avatar URL
  getAvatarUrl: (userId, filename) => {
    return `${API_BASE_URL}/users/${userId}/avatar/${filename}`;
  }
};

export default profileService;