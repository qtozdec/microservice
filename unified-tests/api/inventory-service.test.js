const axios = require('axios');

describe('Inventory Service Simple Tests', () => {
    const baseURL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8084';
    const config = global.testConfig;
    
    beforeAll(async () => {
        // Wait for service to be available
        await testUtils.waitForService(baseURL);
    });

    describe('Service Health', () => {
        test('GET /health - should return service health', async () => {
            const response = await axios.get(`${baseURL}/health`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('status', 'UP');
            expect(response.data).toHaveProperty('service');
            // Service should be up and responding
        });
    });

    describe('Basic Connectivity', () => {
        test('Service should be reachable', async () => {
            // Test that service is reachable and returns some response
            try {
                const response = await axios.get(`${baseURL}/products`);
                expect(response.status).toBe(200);
            } catch (error) {
                // If auth is required, we expect 401/403, not connection errors
                expect([401, 403]).toContain(error.response?.status);
            }
        });
    });
});