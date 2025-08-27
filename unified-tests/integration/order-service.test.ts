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
        userId: 1,
        product: 'test-product-1',
        quantity: 2,
        price: 29.99
      };

      const response = await axios.post(`${config.endpoints.orderService}/orders`, orderData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('PENDING');
      expect(response.data.price).toBe(29.99);
      
      testOrderId = response.data.id;
    });

    test('should get order by id', async () => {
      const response = await axios.get(`${config.endpoints.orderService}/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testOrderId);
      expect(response.data).toHaveProperty('product');
      expect(response.data).toHaveProperty('price');
    });

    test('should get user orders', async () => {
      const response = await axios.get(`${config.endpoints.orderService}/orders/user/1`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    test('should update order status', async () => {
      const response = await axios.put(`${config.endpoints.orderService}/orders/${testOrderId}/status`, 
        { status: 'CONFIRMED' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('CONFIRMED');
    });

    test('should cancel order', async () => {
      // Create a new order to cancel
      const orderData = {
        userId: 1,
        product: 'test-product-3',
        quantity: 1,
        price: 19.99
      };

      const createResponse = await axios.post(`${config.endpoints.orderService}/orders`, orderData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const orderId = createResponse.data.id;

      const cancelResponse = await axios.put(`${config.endpoints.orderService}/orders/${orderId}/status`, 
        { status: 'CANCELLED' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.data.status).toBe('CANCELLED');
    });
  });

  describe('Order Validation', () => {
    test('should fail to create order without authentication', async () => {
      const orderData = {
        userId: 1,
        product: 'test-product-1',
        quantity: 1,
        price: 29.99
      };

      try {
        await axios.post(`${config.endpoints.orderService}/orders`, orderData);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });

    test('should fail to create order with invalid data', async () => {
      const invalidOrderData = {
        userId: 1,
        product: '',  // Empty product
        quantity: 0,  // Zero quantity
        price: -100  // Negative price
      };

      // Now validation is implemented, so this should fail with 400
      try {
        await axios.post(`${config.endpoints.orderService}/orders`, invalidOrderData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        throw new Error('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toBe('Validation failed');
        expect(error.response.data.errors).toBeDefined();
        expect(error.response.data.errors.quantity).toContain('positive');
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