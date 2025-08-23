const axios = require('axios');

describe('Audit Service Simple Tests', () => {
    const baseURL = process.env.AUDIT_SERVICE_URL || 'http://localhost:8085';
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
            try {
                const response = await axios.get(`${baseURL}/audit-events`);
                expect(response.status).toBe(200);
            } catch (error) {
                // If auth is required, we expect 401/403, not connection errors
                expect([401, 403]).toContain(error.response?.status);
            }
        });
    });
});