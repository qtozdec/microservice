import axios from 'axios';

// Set default timeout for all tests
jest.setTimeout(30000);

// Global test configuration
const baseURL = process.env.BASE_URL || 'http://localhost:8080';

// Configure axios defaults
axios.defaults.timeout = 10000;
axios.defaults.baseURL = baseURL;

// Global variables for tests
(global as any).testConfig = {
  baseURL,
  endpoints: {
    userService: process.env.USER_SERVICE_URL || `${baseURL}/api/users`,
    orderService: process.env.ORDER_SERVICE_URL || `${baseURL}/api/orders`,
    inventoryService: process.env.INVENTORY_SERVICE_URL || `${baseURL}/api/inventory`,
    notificationService: process.env.NOTIFICATION_SERVICE_URL || `${baseURL}/api/notifications`,
    auditService: process.env.AUDIT_SERVICE_URL || `${baseURL}/api/audit`
  },
  testUser: {
    username: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User'
  }
};

// Setup and teardown
beforeAll(async () => {
  console.log('Starting integration tests...');
  console.log('Base URL:', baseURL);
});

afterAll(async () => {
  console.log('Integration tests completed');
});