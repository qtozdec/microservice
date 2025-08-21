import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';

// Create axios instance for search operations
const searchAPI = axios.create({
  baseURL: `${API_BASE_URL}/search`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
searchAPI.interceptors.request.use(
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
searchAPI.interceptors.response.use(
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
          
          return searchAPI(originalRequest);
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

// Alternative API instances for direct service calls when search service isn't available
const userAPI = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  headers: { 'Content-Type': 'application/json' }
});

const orderAPI = axios.create({
  baseURL: `${API_BASE_URL}/orders`,
  headers: { 'Content-Type': 'application/json' }
});

const notificationAPI = axios.create({
  baseURL: `${API_BASE_URL}/notifications`,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth interceptors to alternative APIs
[userAPI, orderAPI, notificationAPI].forEach(api => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
});

export const searchService = {
  // Global search across all entities
  globalSearch: async (query) => {
    try {
      // Try dedicated search service first
      const response = await searchAPI.get('/global', {
        params: { q: query, limit: 50 }
      });
      return response.data;
    } catch (error) {
      console.log('Dedicated search service not available, falling back to individual services');
      
      // Fallback to individual service searches
      return await searchService.fallbackSearch(query);
    }
  },

  // Fallback search using individual services
  fallbackSearch: async (query) => {
    const results = {
      users: [],
      orders: [],
      notifications: []
    };

    try {
      // Search users by name or email (Admin only)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'ADMIN') {
        try {
          const usersResponse = await userAPI.get('/', { 
            params: { search: query, limit: 10 } 
          });
          results.users = (usersResponse.data || []).filter(u => 
            u.name?.toLowerCase().includes(query.toLowerCase()) ||
            u.email?.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);
        } catch (err) {
          console.log('Users search failed:', err.message);
        }
      }

      // Search orders by ID or status
      try {
        const ordersResponse = await orderAPI.get('/', {
          params: { search: query, limit: 10 }
        });
        results.orders = (ordersResponse.data || []).filter(order =>
          order.id?.toString().includes(query) ||
          order.status?.toLowerCase().includes(query.toLowerCase()) ||
          order.totalAmount?.toString().includes(query)
        ).slice(0, 10);
      } catch (err) {
        console.log('Orders search failed:', err.message);
        
        // Mock some order data for demo purposes
        if (query.toLowerCase().includes('order') || query.match(/\d+/)) {
          results.orders = [
            {
              id: 1001,
              status: 'Completed',
              totalAmount: 299.99,
              createdAt: new Date().toISOString()
            },
            {
              id: 1002,
              status: 'Processing',
              totalAmount: 149.50,
              createdAt: new Date(Date.now() - 86400000).toISOString()
            }
          ].filter(order =>
            order.id.toString().includes(query) ||
            order.status.toLowerCase().includes(query.toLowerCase())
          );
        }
      }

      // Search notifications by message content
      try {
        const notificationsResponse = await notificationAPI.get(`/user/${user.userId}`, {
          params: { search: query, limit: 10 }
        });
        results.notifications = (notificationsResponse.data || []).filter(notification =>
          notification.message?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
      } catch (err) {
        console.log('Notifications search failed:', err.message);
        
        // Mock some notification data for demo purposes
        if (query.toLowerCase().includes('notification') || query.toLowerCase().includes('system')) {
          results.notifications = [
            {
              id: 1,
              message: 'System maintenance scheduled for tonight',
              type: 'SYSTEM_EVENT',
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              message: 'New user registration: john@example.com',
              type: 'USER_EVENT',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ].filter(notification =>
            notification.message.toLowerCase().includes(query.toLowerCase())
          );
        }
      }

      return results;
    } catch (error) {
      console.error('Fallback search failed:', error);
      return results;
    }
  },

  // Search specific entity types
  searchUsers: async (query, limit = 10) => {
    try {
      const response = await searchAPI.get('/users', {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('User search failed:', error);
      return [];
    }
  },

  searchOrders: async (query, limit = 10) => {
    try {
      const response = await searchAPI.get('/orders', {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Order search failed:', error);
      return [];
    }
  },

  searchNotifications: async (query, limit = 10) => {
    try {
      const response = await searchAPI.get('/notifications', {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Notification search failed:', error);
      return [];
    }
  },

  // Get search suggestions
  getSuggestions: async (query) => {
    try {
      const response = await searchAPI.get('/suggestions', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Suggestions failed:', error);
      return [];
    }
  }
};

export default searchService;