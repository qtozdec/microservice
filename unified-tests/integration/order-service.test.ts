import axios from 'axios';

const config = (global as any).testConfig;

describe('Order Service Integration Tests', () => {
  let authToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    // Get auth token for testing
    const loginResponse = await axios.post(`${config.endpoints.userService}/auth/login`, {
      email: config.testUser.email,
      password: config.testUser.password
    });
    authToken = loginResponse.data.token;

    // Token will be passed individually in each request

    // Health check
    const healthResponse = await axios.get(`${config.endpoints.orderService}/health`);
    expect(healthResponse.status).toBe(200);
  });

  describe('Order Management', () => {
    test('should create a new order', async () => {
      const orderData = {
        items: [
          { productId: 'test-product-1', quantity: 2, price: 29.99 },
          { productId: 'test-product-2', quantity: 1, price: 49.99 }
        ],
        totalAmount: 109.97,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      };

      const response = await axios.post(`${config.endpoints.orderService}`, orderData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('PENDING');
      expect(response.data.totalAmount).toBe(orderData.totalAmount);
      
      testOrderId = response.data.id;
    });

    test('should get order by id', async () => {
      const response = await axios.get(`${config.endpoints.orderService}/${testOrderId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testOrderId);
      expect(response.data).toHaveProperty('items');
      expect(response.data).toHaveProperty('totalAmount');
    });

    test('should get user orders', async () => {
      const response = await axios.get(`${config.endpoints.orderService}/user`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    test('should update order status', async () => {
      const response = await axios.patch(`${config.endpoints.orderService}/${testOrderId}/status`, 
        { status: 'CONFIRMED' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('CONFIRMED');
    });

    test('should cancel order', async () => {
      // Create a new order to cancel
      const orderData = {
        items: [{ productId: 'test-product-3', quantity: 1, price: 19.99 }],
        totalAmount: 19.99,
        shippingAddress: {
          street: '456 Cancel St',
          city: 'Cancel City',
          state: 'CC',
          zipCode: '54321',
          country: 'US'
        }
      };

      const createResponse = await axios.post(`${config.endpoints.orderService}`, orderData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const orderId = createResponse.data.id;

      const cancelResponse = await axios.patch(`${config.endpoints.orderService}/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.data.status).toBe('CANCELLED');
    });
  });

  describe('Order Validation', () => {
    test('should fail to create order without authentication', async () => {
      const orderData = {
        items: [{ productId: 'test-product-1', quantity: 1, price: 29.99 }],
        totalAmount: 29.99
      };

      try {
        await axios.post(`${config.endpoints.orderService}`, orderData);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should fail to create order with invalid data', async () => {
      const invalidOrderData = {
        items: [],  // Empty items
        totalAmount: -100  // Negative amount
      };

      try {
        await axios.post(`${config.endpoints.orderService}`, invalidOrderData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        // Could be 400 (bad request) or 403 (forbidden) depending on validation/auth
        expect([400, 403]).toContain(error.response.status);
      }
    });
  });

  describe('Health Checks', () => {
    test('should return healthy status', async () => {
      const response = await axios.get(`${config.endpoints.orderService}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('UP');
      expect(response.data.service).toBe('order-service');
    });
  });
});