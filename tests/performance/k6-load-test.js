import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');
export const requestCounter = new Counter('requests_total');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate must be below 5%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

// Base URLs
const BASE_URL = 'http://microservices-staging.local';
const WS_URL = 'ws://microservices-staging.local';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

let authToken = '';

export function setup() {
  // Login to get auth token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: testUsers[0].email,
    password: testUsers[0].password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginResponse.status === 200) {
    const data = loginResponse.json();
    return { token: data.token };
  }
  return {};
}

export default function(data) {
  const token = data.token || '';
  
  group('Authentication Tests', function() {
    testLogin();
    testTokenValidation(token);
  });
  
  group('User Service Tests', function() {
    testUserProfile(token);
    testUsersList(token);
  });
  
  group('Order Service Tests', function() {
    testCreateOrder(token);
    testGetOrders(token);
  });
  
  group('Inventory Service Tests', function() {
    testGetProducts();
    testProductAvailability();
  });
  
  group('Notification Service Tests', function() {
    testGetNotifications(token);
  });
  
  group('WebSocket Tests', function() {
    testWebSocketConnection();
  });
  
  sleep(1);
}

function testLogin() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
}

function testTokenValidation(token) {
  if (!token) return;
  
  const response = http.get(`${BASE_URL}/api/auth/validate`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
  });
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'token validation status is 200': (r) => r.status === 200,
    'token validation response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
}

function testUserProfile(token) {
  if (!token) return;
  
  const response = http.get(`${BASE_URL}/api/users/profile`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
  });
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'user profile status is 200': (r) => r.status === 200,
    'user profile has data': (r) => r.json('email') !== undefined,
    'user profile response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
}

function testUsersList(token) {
  if (!token) return;
  
  const response = http.get(`${BASE_URL}/api/users?page=0&size=10`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
  });
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'users list status is 200': (r) => r.status === 200,
    'users list has content': (r) => r.json('content') !== undefined,
    'users list response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!success);
}

function testCreateOrder(token) {
  if (!token) return;
  
  const orderData = {
    items: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 }
    ],
    shippingAddress: {
      street: "123 Test St",
      city: "Test City",
      country: "Test Country"
    }
  };
  
  const response = http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderData), {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
  });
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'create order status is 200 or 201': (r) => [200, 201].includes(r.status),
    'create order has id': (r) => r.json('id') !== undefined,
    'create order response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
}

function testGetOrders(token) {
  if (!token) return;
  
  const response = http.get(`${BASE_URL}/api/orders?page=0&size=10`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
  });
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'get orders status is 200': (r) => r.status === 200,
    'get orders response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
}

function testGetProducts() {
  const response = http.get(`${BASE_URL}/api/inventory/products?page=0&size=20`);
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'get products status is 200': (r) => r.status === 200,
    'get products has content': (r) => r.json('content') !== undefined,
    'get products response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
}

function testProductAvailability() {
  const productId = Math.floor(Math.random() * 10) + 1;
  const quantity = Math.floor(Math.random() * 5) + 1;
  
  const response = http.get(`${BASE_URL}/api/inventory/products/${productId}/availability?quantity=${quantity}`);
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'product availability status is 200': (r) => r.status === 200,
    'product availability has data': (r) => r.json('available') !== undefined,
    'product availability response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!success);
}

function testGetNotifications(token) {
  if (!token) return;
  
  const response = http.get(`${BASE_URL}/api/notifications?page=0&size=10`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
  });
  
  requestCounter.add(1);
  responseTime.add(response.timings.duration);
  
  const success = check(response, {
    'get notifications status is 200': (r) => r.status === 200,
    'get notifications response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!success);
}

function testWebSocketConnection() {
  const url = `${WS_URL}/ws`;
  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', function open() {
      console.log('WebSocket connection established');
      socket.send(JSON.stringify({ type: 'SUBSCRIBE', topic: '/topic/inventory' }));
    });

    socket.on('message', function (message) {
      console.log('WebSocket message received:', message);
    });

    socket.on('close', function close() {
      console.log('WebSocket connection closed');
    });

    socket.setTimeout(function () {
      console.log('WebSocket timeout');
      socket.close();
    }, 5000);
  });
  
  check(response, {
    'websocket connection successful': (r) => r && r.url !== undefined,
  });
}

export function teardown(data) {
  console.log('Load test completed');
}