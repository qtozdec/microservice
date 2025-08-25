import axios from 'axios';
import { userService, orderService, notificationService } from './api.js';

// Use relative paths for API calls to work with ingress (same as api.js)
const API_BASE_URL = '';

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
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Now using api.js services instead of separate axios instances

export const searchService = {
  // Global search across all entities
  globalSearch: async (query) => {
    try {
      // Try dedicated search service first
      const response = await searchAPI.get('/global', {
        params: { q: query, limit: 50 }
      });
      
      // Check if response is HTML (indicates ingress fallback to frontend)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Search service returned HTML instead of JSON');
      }
      
      return response.data;
    } catch (error) {
      
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
          const usersResponse = await userService.getUsers();
          results.users = (usersResponse.data || []).filter(u => 
            u.name?.toLowerCase().includes(query.toLowerCase()) ||
            u.email?.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);
        } catch (err) {
          // Users search failed
        }
      }

      // Search orders by ID or status
      try {
        const ordersResponse = await orderService.getOrders();
        results.orders = (ordersResponse.data || []).filter(order =>
          order.id?.toString().includes(query) ||
          order.status?.toLowerCase().includes(query.toLowerCase()) ||
          order.price?.toString().includes(query)
        ).slice(0, 10);
      } catch (err) {
        
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
        const notificationsResponse = await notificationService.getNotificationsByUserId(user.userId);
        results.notifications = (notificationsResponse.data || []).filter(notification =>
          notification.message?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
      } catch (err) {
        
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
      return [];
    }
  }
};

export default searchService;