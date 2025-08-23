const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Global test configuration
global.testConfig = {
  timeout: 30000,
  maxRetries: 10,
  endpoints: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:8081',
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:8082',
    inventoryService: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8084',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8083',
    auditService: process.env.AUDIT_SERVICE_URL || 'http://localhost:8085'
  },
  testUser: {
    username: 'user@example.com',
    email: 'user@example.com',
    password: 'user123'
  },
  adminUser: {
    username: 'admin@example.com',
    email: 'admin@example.com',
    password: 'admin123'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'microservices_test'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
};

// Global test utilities
global.testUtils = {
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  generateUniqueEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  
  generateUniqueUsername: () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  waitForService: async (url, maxRetries = 10, delay = 2000) => {
    const axios = require('axios');
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await axios.get(`${url}/health`, { timeout: 5000 });
        return true;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Service at ${url} is not available after ${maxRetries} retries`);
        }
        await global.testUtils.sleep(delay);
      }
    }
  },
  
  cleanup: async () => {
    // Cleanup logic for tests
    console.log('Test cleanup completed');
  }
};

// Global setup
beforeAll(async () => {
  jest.setTimeout(global.testConfig.timeout);
});

// Global cleanup
afterAll(async () => {
  await global.testUtils.cleanup();
});