import axios from 'axios';

// Use environment variables for API base URLs
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

const userServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/users`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const orderServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/orders`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const notificationServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/notifications`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const setAuthToken = (token) => {
  if (token) {
    userServiceAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    orderServiceAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    notificationServiceAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete userServiceAPI.defaults.headers.common['Authorization'];
    delete orderServiceAPI.defaults.headers.common['Authorization'];
    delete notificationServiceAPI.defaults.headers.common['Authorization'];
  }
};

const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

export const userService = {
  getUsers: () => userServiceAPI.get(''),
  createUser: (user) => userServiceAPI.post('', user),
  getUserById: (id) => userServiceAPI.get(`/${id}`),
  updateUser: (id, user) => userServiceAPI.put(`/${id}`, user),
  deleteUser: (id) => userServiceAPI.delete(`/${id}`),
};

export const orderService = {
  getOrders: () => orderServiceAPI.get(''),
  createOrder: (order) => orderServiceAPI.post('', order),
  getOrderById: (id) => orderServiceAPI.get(`/${id}`),
  getOrdersByUserId: (userId) => orderServiceAPI.get(`/user/${userId}`),
  updateOrderStatus: (id, status) => orderServiceAPI.put(`/${id}/status`, status),
};

export const notificationService = {
  getNotificationsByUserId: (userId) => notificationServiceAPI.get(`/user/${userId}`),
  getUnreadNotificationsByUserId: (userId) => notificationServiceAPI.get(`/user/${userId}/unread`),
  markAsRead: (id) => notificationServiceAPI.put(`/${id}/read`),
  createNotification: (notification) => notificationServiceAPI.post('', notification),
};

export const authService = {
  login: (credentials) => userServiceAPI.post('/auth/login', credentials),
  register: (userData) => userServiceAPI.post('/auth/register', userData),
};

export { setAuthToken };