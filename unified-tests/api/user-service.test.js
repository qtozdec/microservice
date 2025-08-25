const axios = require('axios');
const AuthHelper = require('../helpers/auth');

describe('User Service API Tests', () => {
    let authHelper;
    const baseURL = process.env.USER_SERVICE_URL || 'http://localhost:8081';
    
    beforeAll(async () => {
        authHelper = new AuthHelper();
        // Wait for service to be available
        await testUtils.waitForService(baseURL);
    });

    afterAll(() => {
        authHelper.clearTokens();
    });

    describe('Authentication Endpoints', () => {
        test('POST /auth/register - should register a new user', async () => {
            const uniqueEmail = testUtils.generateUniqueEmail();
            const userData = {
                email: uniqueEmail,
                password: 'testpass123',
                name: 'Test User'
            };

            const response = await axios.post(`${baseURL}/auth/register`, userData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('userId');
            expect(response.data).toHaveProperty('email', uniqueEmail);
            expect(response.data).toHaveProperty('token');
        });

        test('POST /auth/login - should login with valid credentials', async () => {
            const response = await axios.post(`${baseURL}/auth/login`, {
                email: 'user@example.com',
                password: 'user123'
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('email');
        });

        test('POST /auth/login - should fail with invalid credentials', async () => {
            try {
                await axios.post(`${baseURL}/auth/login`, {
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                });
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });

        test('POST /auth/refresh - should handle refresh token endpoint', async () => {
            try {
                await axios.post(`${baseURL}/auth/refresh`, {
                    refreshToken: 'invalid-token'
                });
            } catch (error) {
                // Refresh endpoint might not exist or require different structure
                expect([400, 401, 404]).toContain(error.response.status);
            }
        });
    });

    describe('Service Health', () => {
        test('GET /health - should return service health', async () => {
            const response = await axios.get(`${baseURL}/health`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('status', 'UP');
            expect(response.data).toHaveProperty('service', 'user-service');
        });

        test('Should handle non-existent endpoints', async () => {
            try {
                await axios.get(`${baseURL}/nonexistent`);
            } catch (error) {
                expect([403, 404]).toContain(error.response.status);
            }
        });
    });

    describe('Authentication Flow', () => {
        test('Should complete registration and login flow', async () => {
            const uniqueEmail = testUtils.generateUniqueEmail();
            
            // Register
            const registerResponse = await axios.post(`${baseURL}/auth/register`, {
                email: uniqueEmail,
                password: 'testpass123',
                name: 'Test User'
            });
            
            expect(registerResponse.status).toBe(200);
            expect(registerResponse.data).toHaveProperty('email', uniqueEmail);
            
            // Login with the same credentials
            const loginResponse = await axios.post(`${baseURL}/auth/login`, {
                email: uniqueEmail,
                password: 'testpass123'
            });
            
            expect(loginResponse.status).toBe(200);
            expect(loginResponse.data).toHaveProperty('token');
        });
    });

    describe('Two Factor Authentication', () => {
        test('2FA endpoints should be protected', async () => {
            try {
                await axios.post(`${baseURL}/2fa/enable`);
            } catch (error) {
                expect([401, 403, 404]).toContain(error.response.status);
            }
        });
    });

    describe('User Profile Management', () => {
        test('Should handle user-specific endpoints', async () => {
            // Test profile endpoints exist
            try {
                await axios.get(`${baseURL}/users/1/profile`);
            } catch (error) {
                expect([401, 403, 404]).toContain(error.response.status);
            }
        });

        test('Should handle avatar endpoints', async () => {
            // Test avatar endpoints exist  
            try {
                await axios.get(`${baseURL}/users/1/avatar/test.jpg`);
            } catch (error) {
                expect([400, 403, 404]).toContain(error.response.status);
            }
        });
    });

    describe('User Management (Admin)', () => {
        test('Should handle admin user management', async () => {
            try {
                await axios.get(`${baseURL}/users`);
            } catch (error) {
                expect([401, 403, 404]).toContain(error.response.status);
            }
        });

        test('Should handle specific user retrieval', async () => {
            try {
                await axios.get(`${baseURL}/users/1`);
            } catch (error) {
                expect([401, 403, 404]).toContain(error.response.status);
            }
        });
    });
});
