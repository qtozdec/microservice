import axios from 'axios';

const API_BASE_URL = 'http://localhost';

const userServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}:8081/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const orderServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}:8082/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const notificationServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}:8083/api`,
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
  getUsers: () => userServiceAPI.get('/users'),
  createUser: (user) => userServiceAPI.post('/users', user),
  getUserById: (id) => userServiceAPI.get(`/users/${id}`),
  updateUser: (id, user) => userServiceAPI.put(`/users/${id}`, user),
  deleteUser: (id) => userServiceAPI.delete(`/users/${id}`),
};

export const orderService = {
  getOrders: () => orderServiceAPI.get('/orders'),
  createOrder: (order) => orderServiceAPI.post('/orders', order),
  getOrderById: (id) => orderServiceAPI.get(`/orders/${id}`),
  getOrdersByUserId: (userId) => orderServiceAPI.get(`/orders/user/${userId}`),
  updateOrderStatus: (id, status) => orderServiceAPI.put(`/orders/${id}/status`, status),
};

export const notificationService = {
  getNotificationsByUserId: (userId) => notificationServiceAPI.get(`/notifications/user/${userId}`),
  getUnreadNotificationsByUserId: (userId) => notificationServiceAPI.get(`/notifications/user/${userId}/unread`),
  markAsRead: (id) => notificationServiceAPI.put(`/notifications/${id}/read`),
  createNotification: (notification) => notificationServiceAPI.post('/notifications', notification),
};

export const authService = {
  login: (credentials) => userServiceAPI.post('/auth/login', credentials),
  register: (userData) => userServiceAPI.post('/auth/register', userData),
};

export { setAuthToken };