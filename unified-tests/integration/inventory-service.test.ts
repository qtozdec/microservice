import axios from 'axios';

const config = (global as any).testConfig;

describe('Inventory Service Integration Tests', () => {
  let testProductId: string;
  let authToken: string;

  beforeAll(async () => {
    // Health check
    const healthResponse = await axios.get(`${config.endpoints.inventoryService}/health`);
    expect(healthResponse.status).toBe(200);

    // Get auth token
    const loginResponse = await axios.post(`${config.endpoints.userService}/auth/login`, {
      email: config.testUser.email,
      password: config.testUser.password
    });
    authToken = loginResponse.data.token;

    // Token will be passed individually in each request
  });

  describe('Product Management', () => {
    test('should create a new product', async () => {
      const productData = {
        name: `Test Product ${Date.now()}`,
        description: 'This is a test product for integration testing',
        category: 'Electronics',
        price: 99.99,
        quantity: 100,
        sku: `TEST-${Date.now()}`
      };

      const response = await axios.post(`${config.endpoints.inventoryService}/products`, productData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(productData.name);
      expect(response.data.price).toBe(productData.price);
      expect(response.data.quantity).toBe(productData.quantity);
      
      testProductId = response.data.id;
    });

    test('should get all products', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/products`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    test('should get product by id', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testProductId);
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('price');
      expect(response.data).toHaveProperty('quantity');
    });

    test('should update product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        price: 129.99,
        quantity: 150
      };

      const response = await axios.put(`${config.endpoints.inventoryService}/products/${testProductId}`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.price).toBe(updateData.price);
      expect(response.data.quantity).toBe(updateData.quantity);
    });

    test('should get products by category', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/products/category/Electronics`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.every((product: any) => product.category === 'Electronics')).toBe(true);
    });

    test('should get low stock products', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/products/low-stock?threshold=50`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Stock Management', () => {
    let testSku: string;

    beforeEach(async () => {
      // Create a product with known SKU for stock testing
      const productData = {
        name: `Stock Test Product ${Date.now()}`,
        description: 'Product for testing stock operations',
        category: 'Test',
        price: 50.00,
        quantity: 100,
        sku: `STOCK-TEST-${Date.now()}`
      };

      const response = await axios.post(`${config.endpoints.inventoryService}/products`, productData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      testSku = response.data.sku;
    });

    test('should reserve stock', async () => {
      const response = await axios.post(`${config.endpoints.inventoryService}/stock/reserve`, {
        sku: testSku,
        quantity: 10
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.quantity).toBe(90); // 100 - 10
    });

    test('should restore stock', async () => {
      // First reserve some stock
      await axios.post(`${config.endpoints.inventoryService}/stock/reserve`, {
        sku: testSku,
        quantity: 20
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      // Then restore it
      const response = await axios.post(`${config.endpoints.inventoryService}/stock/restore`, {
        sku: testSku,
        quantity: 10
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.quantity).toBe(90); // 100 - 20 + 10
    });

    test('should fail to reserve more stock than available', async () => {
      try {
        await axios.post(`${config.endpoints.inventoryService}/stock/reserve`, {
          sku: testSku,
          quantity: 200 // More than available
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Insufficient stock');
      }
    });
  });

  describe('Product Search and Filtering', () => {
    test('should search products by name', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/products/search?name=Test`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.every((product: any) => 
        product.name.toLowerCase().includes('test')
      )).toBe(true);
    });

    test('should get in-stock products', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/products/in-stock`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.every((product: any) => product.quantity > 0)).toBe(true);
    });

    test('should get out-of-stock products', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/products/out-of-stock`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.every((product: any) => product.quantity === 0)).toBe(true);
    });
  });

  describe('Health Checks', () => {
    test('should return healthy status', async () => {
      const response = await axios.get(`${config.endpoints.inventoryService}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('UP');
      expect(response.data.service).toBe('inventory-service');
    });
  });

  afterAll(async () => {
    // Cleanup: delete test product
    if (testProductId) {
      try {
        await axios.delete(`${config.endpoints.inventoryService}/products/${testProductId}`);
      } catch (error) {
        console.warn('Failed to cleanup test product:', error);
      }
    }
  });
});