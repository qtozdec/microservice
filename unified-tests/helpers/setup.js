const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

const axios = require('axios');

// Global test configuration
jest.setTimeout(30000);

// Global axios configuration
axios.defaults.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 10000;

// Add request/response interceptors for debugging
if (process.env.NODE_ENV === 'debug') {
    axios.interceptors.request.use(request => {
        console.log('Starting Request:', request.method?.toUpperCase(), request.url);
        return request;
    });

    axios.interceptors.response.use(
        response => {
            console.log('Response:', response.status, response.config.url);
            return response;
        },
        error => {
            console.log('Error Response:', error.response?.status, error.config?.url);
            return Promise.reject(error);
        }
    );
}

// Global test utilities
global.testUtils = {
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    waitForService: async (url, maxRetries = 10) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await axios.get(`${url}/actuator/health`);
                return true;
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error(`Service at ${url} is not available after ${maxRetries} retries`);
                }
                await global.testUtils.sleep(2000);
            }
        }
    },

    generateUniqueEmail: () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        return `test.${timestamp}.${random}@example.com`;
    },

    generateTestProduct: () => ({
        name: `Test Product ${Date.now()}`,
        sku: `TEST-${Date.now()}`,
        description: 'Test product description',
        price: 99.99,
        quantity: 100,
        category: 'Electronics',
        brand: 'TestBrand'
    })
};

// Cleanup function for tests
global.afterAll(() => {
    // Clean up any resources if needed
    console.log('Test cleanup completed');
});