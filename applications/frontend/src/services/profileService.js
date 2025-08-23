import axios from 'axios';

// Use relative paths for API calls to work with ingress
const API_BASE_URL = '';

// Create axios instance for profile operations
const profileAPI = axios.create({
  baseURL: `${API_BASE_URL}/users`,
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
          const response = await axios.post(`/auth/refresh`, {
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
    
    const token = localStorage.getItem('token');
    const response = await profileAPI.post(`/${userId}/avatar`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.data;
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    const response = await profileAPI.put(`/${userId}/profile`, profileData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // Get user profile
  getProfile: async (userId) => {
    const response = await profileAPI.get(`/${userId}/profile`);
    return response.data;
  },

  // Get avatar URL
  getAvatarUrl: (userId, filename) => {
    return `/users/${userId}/avatar/${filename}`;
  }
};

export default profileService;