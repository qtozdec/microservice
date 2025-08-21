import axios from 'axios';

// Use relative paths for API calls to work with ingress
const API_BASE_URL = '';

const userServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const authServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const orderServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}/orders`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const notificationServiceAPI = axios.create({
  baseURL: `${API_BASE_URL}/notifications`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const setAuthToken = (token) => {
  if (token) {
    userServiceAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    authServiceAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    orderServiceAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    notificationServiceAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete userServiceAPI.defaults.headers.common['Authorization'];
    delete authServiceAPI.defaults.headers.common['Authorization'];
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
  login: (credentials) => authServiceAPI.post('/login', credentials),
  register: (userData) => authServiceAPI.post('/register', userData),
  refresh: (refreshToken) => authServiceAPI.post('/refresh', { refreshToken }),
};

export { setAuthToken };