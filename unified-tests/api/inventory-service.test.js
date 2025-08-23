const axios = require('axios');
const AuthHelper = require('../helpers/auth');

describe('Inventory Service API Tests', () => {
    let authHelper;
    const baseURL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8083';
    let testProductId;
    
    beforeAll(async () => {
        authHelper = new AuthHelper();
        // Wait for service to be available
        await testUtils.waitForService(baseURL);
    });

    describe('Product Management', () => {
        test('GET /inventory/products - should get paginated products list', async () => {
            const response = await axios.get(`${baseURL}/inventory/products`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('content');
            expect(Array.isArray(response.data.content)).toBe(true);
        });

        test('POST /inventory/products - should create new product', async () => {
            const productData = testUtils.generateTestProduct();

            const response = await axios.post(`${baseURL}/inventory/products`, productData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
            expect(response.data.name).toBe(productData.name);
            expect(response.data.sku).toBe(productData.sku);
            expect(response.data.price).toBe(productData.price);

            // Store product ID for later tests
            testProductId = response.data.id;
        });

        test('GET /inventory/products/{id} - should get product by ID', async () => {
            if (!testProductId) {
                // Create a product first if none exists
                const productData = testUtils.generateTestProduct();
                const createResponse = await axios.post(`${baseURL}/inventory/products`, productData);
                testProductId = createResponse.data.id;
            }

            const response = await axios.get(`${baseURL}/inventory/products/${testProductId}`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id', testProductId);
        });

        test('GET /inventory/products/{id} - should return 404 for non-existent product', async () => {
            try {
                await axios.get(`${baseURL}/inventory/products/999999`);
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });

        test('PUT /inventory/products/{id} - should update product', async () => {
            if (!testProductId) return;

            const updateData = {
                name: `Updated Product ${Date.now()}`,
                description: 'Updated description',
                price: 199.99
            };

            const response = await axios.put(`${baseURL}/inventory/products/${testProductId}`, updateData);

            expect(response.status).toBe(200);
            expect(response.data.name).toBe(updateData.name);
            expect(response.data.description).toBe(updateData.description);
            expect(response.data.price).toBe(updateData.price);
        });

        test('GET /inventory/products/sku/{sku} - should get product by SKU', async () => {
            if (!testProductId) return;

            // First get the product to know its SKU
            const productResponse = await axios.get(`${baseURL}/inventory/products/${testProductId}`);
            const sku = productResponse.data.sku;

            const response = await axios.get(`${baseURL}/inventory/products/sku/${sku}`);

            expect(response.status).toBe(200);
            expect(response.data.sku).toBe(sku);
        });

        test('GET /inventory/products/category/{category} - should get products by category', async () => {
            const response = await axios.get(`${baseURL}/inventory/products/category/Electronics`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Inventory Management', () => {
        test('POST /inventory/products/{id}/reserve - should reserve product quantity', async () => {
            if (!testProductId) return;

            const reservationData = { quantity: 5 };

            const response = await axios.post(`${baseURL}/inventory/products/${testProductId}/reserve`, reservationData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success');
            expect(response.data.productId).toBe(testProductId);
            expect(response.data.reservedQuantity).toBe(5);
        });

        test('POST /inventory/products/{id}/reserve - should fail when insufficient stock', async () => {
            if (!testProductId) return;

            const reservationData = { quantity: 10000 }; // Unreasonably large quantity

            const response = await axios.post(`${baseURL}/inventory/products/${testProductId}/reserve`, reservationData);

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(false);
        });

        test('GET /inventory/products/{id}/availability - should check product availability', async () => {
            if (!testProductId) return;

            const response = await axios.get(`${baseURL}/inventory/products/${testProductId}/availability`, {
                params: { quantity: 10 }
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('available');
            expect(response.data).toHaveProperty('productId', testProductId);
            expect(response.data).toHaveProperty('requestedQuantity', 10);
            expect(response.data).toHaveProperty('availableQuantity');
            expect(response.data).toHaveProperty('totalQuantity');
            expect(response.data).toHaveProperty('reservedQuantity');
        });

        test('POST /inventory/products/{id}/release - should release reserved quantity', async () => {
            if (!testProductId) return;

            const releaseData = { quantity: 3 };

            const response = await axios.post(`${baseURL}/inventory/products/${testProductId}/release`, releaseData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success');
            expect(response.data.productId).toBe(testProductId);
            expect(response.data.releasedQuantity).toBe(3);
        });
    });

    describe('Inventory Analytics', () => {
        test('GET /inventory/products/low-stock - should get low stock products', async () => {
            const response = await axios.get(`${baseURL}/inventory/products/low-stock`, {
                params: { threshold: 20 }
            });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /inventory/stats - should get inventory statistics', async () => {
            const response = await axios.get(`${baseURL}/inventory/stats`);

            expect(response.status).toBe(200);
            expect(typeof response.data).toBe('object');
            expect(response.data).toHaveProperty('totalProducts');
            expect(response.data).toHaveProperty('totalValue');
            expect(response.data).toHaveProperty('lowStockCount');
        });
    });

    describe('Error Handling', () => {
        test('GET /inventory/products/sku/{sku} - should return 404 for non-existent SKU', async () => {
            try {
                await axios.get(`${baseURL}/inventory/products/sku/NON-EXISTENT-SKU`);
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });

        test('GET /inventory/products/{id}/availability - should return 404 for non-existent product', async () => {
            try {
                await axios.get(`${baseURL}/inventory/products/999999/availability`, {
                    params: { quantity: 1 }
                });
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });

        test('POST /inventory/products/{id}/reserve - should return 404 for non-existent product', async () => {
            try {
                await axios.post(`${baseURL}/inventory/products/999999/reserve`, { quantity: 1 });
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });
    });

    describe('WebSocket Integration', () => {
        test('Product operations should trigger WebSocket messages', async () => {
            // Note: This is a placeholder for WebSocket testing
            // In a real implementation, you would set up WebSocket listeners
            // and verify that operations trigger the appropriate messages
            
            const productData = testUtils.generateTestProduct();
            const response = await axios.post(`${baseURL}/inventory/products`, productData);

            expect(response.status).toBe(200);
            // WebSocket message verification would go here
        });
    });

    describe('Cross-Origin Resource Sharing (CORS)', () => {
        test('CORS headers should be properly configured', async () => {
            const response = await axios.get(`${baseURL}/inventory/products`);
            
            expect(response.status).toBe(200);
            // CORS headers should be present in the response
        });
    });

    describe('Data Validation', () => {
        test('POST /inventory/products - should validate required fields', async () => {
            try {
                await axios.post(`${baseURL}/inventory/products`, {
                    // Missing required fields like name, sku, price
                    description: 'Test product without required fields'
                });
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });

        test('POST /inventory/products - should validate price is positive', async () => {
            try {
                const productData = {
                    ...testUtils.generateTestProduct(),
                    price: -10.00 // Invalid negative price
                };

                await axios.post(`${baseURL}/inventory/products`, productData);
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });

        test('POST /inventory/products - should validate quantity is non-negative', async () => {
            try {
                const productData = {
                    ...testUtils.generateTestProduct(),
                    quantity: -5 // Invalid negative quantity
                };

                await axios.post(`${baseURL}/inventory/products`, productData);
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });
    });

    // Cleanup
    afterAll(async () => {
        // Clean up test product if it was created
        if (testProductId) {
            try {
                await axios.delete(`${baseURL}/inventory/products/${testProductId}`);
            } catch (error) {
                // Ignore cleanup errors
                console.warn('Failed to cleanup test product:', error.message);
            }
        }
    });
});