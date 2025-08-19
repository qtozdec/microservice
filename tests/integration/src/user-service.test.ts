import axios from 'axios';

const config = (global as any).testConfig;

describe('User Service Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Health check
    const healthResponse = await axios.get(`${config.endpoints.userService}/health`);
    expect(healthResponse.status).toBe(200);
    expect(healthResponse.data.status).toBe('UP');
  });

  describe('Authentication', () => {
    test('should register a new user', async () => {
      const registerData = {
        email: `test-${Date.now()}@example.com`,
        password: config.testUser.password,
        firstName: config.testUser.firstName,
        lastName: config.testUser.lastName
      };

      const response = await axios.post(`${config.endpoints.userService}/auth/register`, registerData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(registerData.email);
      
      authToken = response.data.token;
      testUserId = response.data.user.id;
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: config.testUser.username,
        password: config.testUser.password
      };

      const response = await axios.post(`${config.endpoints.userService}/auth/login`, loginData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
    });

    test('should fail login with invalid credentials', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      try {
        await axios.post(`${config.endpoints.userService}/auth/login`, loginData);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('User Management', () => {
    test('should get user profile with valid token', async () => {
      const response = await axios.get(`${config.endpoints.userService}/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('email');
    });

    test('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await axios.put(`${config.endpoints.userService}/profile`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.firstName).toBe(updateData.firstName);
      expect(response.data.lastName).toBe(updateData.lastName);
    });

    test('should fail to access protected routes without token', async () => {
      try {
        await axios.get(`${config.endpoints.userService}/profile`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Health Checks', () => {
    test('should return healthy status', async () => {
      const response = await axios.get(`${config.endpoints.userService}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('UP');
      expect(response.data.service).toBe('user-service');
      expect(response.data).toHaveProperty('checks');
    });

    test('should return liveness status', async () => {
      const response = await axios.get(`${config.endpoints.userService}/health/liveness`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('UP');
      expect(response.data.service).toBe('user-service');
    });

    test('should return readiness status', async () => {
      const response = await axios.get(`${config.endpoints.userService}/health/readiness`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('UP');
      expect(response.data.service).toBe('user-service');
    });
  });
});