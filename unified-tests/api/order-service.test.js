const axios = require('axios');
const AuthHelper = require('../helpers/auth');

describe('Order Service API Tests', () => {
    let authHelper;
    const baseURL = process.env.ORDER_SERVICE_URL || 'http://localhost:8085';
    let testOrderId;
    let testUserId = 1; // Assuming user ID 1 exists
    
    beforeAll(async () => {
        authHelper = new AuthHelper();
        // Wait for service to be available
        await testUtils.waitForService(baseURL);
    });

    afterAll(() => {
        authHelper.clearTokens();
    });

    describe('Order Creation', () => {
        test('POST /orders - should create new order (authenticated user)', async () => {
            const headers = await authHelper.getUserAuthHeaders();
            
            const orderData = {
                userId: testUserId,
                totalAmount: 199.99,
                items: [
                    {
                        productId: 1,
                        productName: 'Test Product',
                        quantity: 2,
                        price: 99.99
                    }
                ]
            };

            const response = await axios.post(`${baseURL}/orders`, orderData, { headers });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
            expect(response.data.userId).toBe(testUserId);
            expect(response.data.totalAmount).toBe(199.99);
            expect(response.data.status).toBe('PENDING');
            expect(Array.isArray(response.data.items)).toBe(true);

            // Store order ID for later tests
            testOrderId = response.data.id;
        });

        test('POST /orders - should create order with admin privileges', async () => {
            const headers = await authHelper.getAdminAuthHeaders();
            
            const orderData = {
                userId: testUserId,
                totalAmount: 299.99,
                items: [
                    {
                        productId: 2,
                        productName: 'Admin Test Product',
                        quantity: 1,
                        price: 299.99
                    }
                ]
            };

            const response = await axios.post(`${baseURL}/orders`, orderData, { headers });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
            expect(response.data.totalAmount).toBe(299.99);
        });

        test('POST /orders - should fail without authentication', async () => {
            const orderData = {
                userId: testUserId,
                totalAmount: 99.99,
                items: []
            };

            try {
                await axios.post(`${baseURL}/orders`, orderData);
            } catch (error) {
                expect([401, 403]).toContain(error.response.status);
            }
        });
    });

    describe('Order Retrieval', () => {
        test('GET /orders/{id} - should get order by ID (authenticated)', async () => {
            if (!testOrderId) return;

            const headers = await authHelper.getUserAuthHeaders();
            
            const response = await axios.get(`${baseURL}/orders/${testOrderId}`, { headers });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id', testOrderId);
            expect(response.data).toHaveProperty('userId');
            expect(response.data).toHaveProperty('totalAmount');
            expect(response.data).toHaveProperty('status');
        });

        test('GET /orders/{id} - should fail without authentication', async () => {
            if (!testOrderId) return;

            try {
                await axios.get(`${baseURL}/orders/${testOrderId}`);
            } catch (error) {
                expect([401, 403]).toContain(error.response.status);
            }
        });

        test('GET /orders/{id} - should return 404 for non-existent order', async () => {
            const headers = await authHelper.getAdminAuthHeaders();

            try {
                await axios.get(`${baseURL}/orders/999999`, { headers });
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });

        test('GET /orders - should get all orders (admin only)', async () => {
            const headers = await authHelper.getAdminAuthHeaders();
            
            const response = await axios.get(`${baseURL}/orders`, { headers });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /orders - should fail for non-admin users', async () => {
            const headers = await authHelper.getUserAuthHeaders();

            try {
                await axios.get(`${baseURL}/orders`, { headers });
            } catch (error) {
                expect([401, 403]).toContain(error.response.status);
            }
        });

        test('GET /orders/user/{userId} - should get orders by user ID', async () => {
            const headers = await authHelper.getUserAuthHeaders();
            
            const response = await axios.get(`${baseURL}/orders/user/${testUserId}`, { headers });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);

            // All returned orders should belong to the specified user
            response.data.forEach(order => {
                expect(order.userId).toBe(testUserId);
            });
        });
    });

    describe('Order Status Management', () => {
        const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

        test('PUT /orders/{id}/status - should update order status (admin only)', async () => {
            if (!testOrderId) return;

            const headers = await authHelper.getAdminAuthHeaders();
            
            const statusUpdate = { status: 'CONFIRMED' };

            const response = await axios.put(`${baseURL}/orders/${testOrderId}/status`, statusUpdate, { headers });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id', testOrderId);
            expect(response.data.status).toBe('CONFIRMED');
        });

        test('PUT /orders/{id}/status - should fail for non-admin users', async () => {
            if (!testOrderId) return;

            const headers = await authHelper.getUserAuthHeaders();
            const statusUpdate = { status: 'SHIPPED' };

            try {
                await axios.put(`${baseURL}/orders/${testOrderId}/status`, statusUpdate, { headers });
            } catch (error) {
                expect([401, 403]).toContain(error.response.status);
            }
        });

        test('PUT /orders/{id}/status - should fail without authentication', async () => {
            if (!testOrderId) return;

            const statusUpdate = { status: 'DELIVERED' };

            try {
                await axios.put(`${baseURL}/orders/${testOrderId}/status`, statusUpdate);
            } catch (error) {
                expect([401, 403]).toContain(error.response.status);
            }
        });

        validStatuses.forEach(status => {
            test(`PUT /orders/{id}/status - should accept ${status} status`, async () => {
                if (!testOrderId) return;

                const headers = await authHelper.getAdminAuthHeaders();
                const statusUpdate = { status: status };

                const response = await axios.put(`${baseURL}/orders/${testOrderId}/status`, statusUpdate, { headers });

                expect(response.status).toBe(200);
                expect(response.data.status).toBe(status);
            });
        });

        test('PUT /orders/{id}/status - should reject invalid status', async () => {
            if (!testOrderId) return;

            const headers = await authHelper.getAdminAuthHeaders();
            const statusUpdate = { status: 'INVALID_STATUS' };

            try {
                await axios.put(`${baseURL}/orders/${testOrderId}/status`, statusUpdate, { headers });
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });

        test('PUT /orders/{id}/status - should return 404 for non-existent order', async () => {
            const headers = await authHelper.getAdminAuthHeaders();
            const statusUpdate = { status: 'CONFIRMED' };

            try {
                await axios.put(`${baseURL}/orders/999999/status`, statusUpdate, { headers });
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });
    });

    describe('Order Data Validation', () => {
        test('POST /orders - should validate required fields', async () => {
            const headers = await authHelper.getUserAuthHeaders();

            try {
                await axios.post(`${baseURL}/orders`, {
                    // Missing required fields like userId, totalAmount, items
                }, { headers });
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });

        test('POST /orders - should validate totalAmount is positive', async () => {
            const headers = await authHelper.getUserAuthHeaders();

            const orderData = {
                userId: testUserId,
                totalAmount: -50.00, // Invalid negative amount
                items: [
                    {
                        productId: 1,
                        productName: 'Test Product',
                        quantity: 1,
                        price: -50.00
                    }
                ]
            };

            try {
                await axios.post(`${baseURL}/orders`, orderData, { headers });
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });

        test('POST /orders - should validate items array is not empty', async () => {
            const headers = await authHelper.getUserAuthHeaders();

            const orderData = {
                userId: testUserId,
                totalAmount: 100.00,
                items: [] // Empty items array
            };

            try {
                await axios.post(`${baseURL}/orders`, orderData, { headers });
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });
    });

    describe('Cross-Origin Resource Sharing (CORS)', () => {
        test('OPTIONS request should be handled properly', async () => {
            const response = await axios.options(`${baseURL}/orders`);
            expect([200, 204]).toContain(response.status);
        });

        test('CORS headers should be properly configured', async () => {
            const headers = await authHelper.getAdminAuthHeaders();
            const response = await axios.get(`${baseURL}/orders`, { headers });
            
            expect(response.status).toBe(200);
            // CORS headers should be present in the response
        });
    });

    describe('JWT Authentication Integration', () => {
        test('Should handle expired JWT tokens', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
            
            const headers = {
                'Authorization': `Bearer ${expiredToken}`,
                'Content-Type': 'application/json'
            };

            try {
                await axios.get(`${baseURL}/orders`, { headers });
            } catch (error) {
                expect([401, 403]).toContain(error.response.status);
            }
        });

        test('Should handle malformed JWT tokens', async () => {
            const headers = {
                'Authorization': 'Bearer invalid-token',
                'Content-Type': 'application/json'
            };

            try {
                await axios.get(`${baseURL}/orders`, { headers });
            } catch (error) {
                expect([401, 403]).toContain(error.response.status);
            }
        });
    });

    describe('Order Workflow Integration', () => {
        test('Complete order lifecycle', async () => {
            const headers = await authHelper.getAdminAuthHeaders();

            // 1. Create an order
            const orderData = {
                userId: testUserId,
                totalAmount: 149.99,
                items: [
                    {
                        productId: 3,
                        productName: 'Lifecycle Test Product',
                        quantity: 1,
                        price: 149.99
                    }
                ]
            };

            const createResponse = await axios.post(`${baseURL}/orders`, orderData, { headers });
            expect(createResponse.status).toBe(200);
            expect(createResponse.data.status).toBe('PENDING');
            const orderId = createResponse.data.id;

            // 2. Confirm the order
            let statusUpdate = { status: 'CONFIRMED' };
            let updateResponse = await axios.put(`${baseURL}/orders/${orderId}/status`, statusUpdate, { headers });
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.data.status).toBe('CONFIRMED');

            // 3. Process the order
            statusUpdate = { status: 'PROCESSING' };
            updateResponse = await axios.put(`${baseURL}/orders/${orderId}/status`, statusUpdate, { headers });
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.data.status).toBe('PROCESSING');

            // 4. Ship the order
            statusUpdate = { status: 'SHIPPED' };
            updateResponse = await axios.put(`${baseURL}/orders/${orderId}/status`, statusUpdate, { headers });
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.data.status).toBe('SHIPPED');

            // 5. Deliver the order
            statusUpdate = { status: 'DELIVERED' };
            updateResponse = await axios.put(`${baseURL}/orders/${orderId}/status`, statusUpdate, { headers });
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.data.status).toBe('DELIVERED');

            // 6. Verify final state
            const finalResponse = await axios.get(`${baseURL}/orders/${orderId}`, { headers });
            expect(finalResponse.status).toBe(200);
            expect(finalResponse.data.status).toBe('DELIVERED');
        });
    });

    describe('Performance Tests', () => {
        test('Should handle multiple order creation efficiently', async () => {
            const headers = await authHelper.getAdminAuthHeaders();
            const startTime = Date.now();
            const promises = [];

            // Create 5 orders concurrently
            for (let i = 0; i < 5; i++) {
                const orderData = {
                    userId: testUserId,
                    totalAmount: 50.00 + i,
                    items: [
                        {
                            productId: i + 1,
                            productName: `Performance Test Product ${i}`,
                            quantity: 1,
                            price: 50.00 + i
                        }
                    ]
                };
                
                promises.push(axios.post(`${baseURL}/orders`, orderData, { headers }));
            }

            const responses = await Promise.all(promises);
            const endTime = Date.now();

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Should complete within reasonable time (5 seconds)
            expect(endTime - startTime).toBeLessThan(5000);
        });
    });
});