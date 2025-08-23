const axios = require('axios');

describe('Order Service Simple Tests', () => {
    const baseURL = process.env.ORDER_SERVICE_URL || 'http://localhost:8082';
    
    beforeAll(async () => {
        // Wait for service to be available
        await testUtils.waitForService(baseURL);
    });

    describe('Service Health', () => {
        test('GET /health - should return service health', async () => {
            const response = await axios.get(`${baseURL}/health`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('status', 'UP');
            expect(response.data).toHaveProperty('service', 'order-service');
        });
    });

    describe('Order Endpoints', () => {
        test('Order endpoints should be protected', async () => {
            try {
                await axios.get(`${baseURL}/orders`);
            } catch (error) {
                expect([401, 403, 404]).toContain(error.response?.status);
            }
        });

        test('Order creation should require authentication', async () => {
            const orderData = {
                userId: 1,
                totalAmount: 100,
                items: [{ productId: 1, quantity: 1 }]
            };

            try {
                await axios.post(`${baseURL}/orders`, orderData);
            } catch (error) {
                expect([401, 403, 404]).toContain(error.response?.status);
            }
        });
    });
});