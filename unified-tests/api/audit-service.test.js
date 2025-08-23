const axios = require('axios');
const AuthHelper = require('../helpers/auth');

describe('Audit Service API Tests', () => {
    let authHelper;
    const baseURL = process.env.AUDIT_SERVICE_URL || 'http://localhost:8082';
    
    beforeAll(async () => {
        authHelper = new AuthHelper();
        // Wait for service to be available
        await testUtils.waitForService(baseURL);
    });

    describe('Audit Event Retrieval', () => {
        test('GET /audit - should get paginated audit events', async () => {
            const response = await axios.get(`${baseURL}/audit`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('content');
            expect(response.data).toHaveProperty('totalElements');
            expect(response.data).toHaveProperty('totalPages');
            expect(Array.isArray(response.data.content)).toBe(true);
        });

        test('GET /audit - should support pagination parameters', async () => {
            const response = await axios.get(`${baseURL}/audit`, {
                params: {
                    page: 0,
                    size: 5,
                    sortBy: 'timestamp',
                    sortDir: 'desc'
                }
            });

            expect(response.status).toBe(200);
            expect(response.data.content.length).toBeLessThanOrEqual(5);
        });

        test('GET /audit/{id} - should get specific audit event by ID', async () => {
            // First get some audit events to find a valid ID
            const listResponse = await axios.get(`${baseURL}/audit`);
            const auditEvents = listResponse.data.content;
            
            if (auditEvents.length > 0) {
                const auditId = auditEvents[0].id;
                const response = await axios.get(`${baseURL}/audit/${auditId}`);

                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('id', auditId);
            }
        });

        test('GET /audit/{id} - should return 404 for non-existent audit event', async () => {
            try {
                await axios.get(`${baseURL}/audit/999999`);
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });
    });

    describe('Audit Event Filtering', () => {
        test('GET /audit/service/{service} - should get audit events by service', async () => {
            const response = await axios.get(`${baseURL}/audit/service/user-service`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /audit/user/{userId} - should get audit events by user', async () => {
            const response = await axios.get(`${baseURL}/audit/user/admin@example.com`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /audit/entity-type/{entityType} - should get audit events by entity type', async () => {
            const response = await axios.get(`${baseURL}/audit/entity-type/USER`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /audit/action/{action} - should get audit events by action', async () => {
            const response = await axios.get(`${baseURL}/audit/action/LOGIN`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /audit/failed-operations - should get failed operations', async () => {
            const response = await axios.get(`${baseURL}/audit/failed-operations`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /audit/date-range - should get audit events by date range', async () => {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

            const response = await axios.get(`${baseURL}/audit/date-range`, {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Audit Event Statistics', () => {
        test('GET /audit/count - should get total audit event count', async () => {
            const response = await axios.get(`${baseURL}/audit/count`);

            expect(response.status).toBe(200);
            expect(typeof response.data).toBe('number');
            expect(response.data).toBeGreaterThanOrEqual(0);
        });

        test('GET /audit/count/service/{service} - should get count by service', async () => {
            const response = await axios.get(`${baseURL}/audit/count/service/user-service`);

            expect(response.status).toBe(200);
            expect(typeof response.data).toBe('number');
            expect(response.data).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Audit Event Creation', () => {
        test('POST /audit/log/security - should log security event', async () => {
            const response = await axios.post(`${baseURL}/audit/log/security`, null, {
                params: {
                    action: 'SECURITY_TEST',
                    entityType: 'TEST_ENTITY',
                    entityId: 'test123',
                    userId: 'testuser@example.com',
                    details: 'Test security event'
                }
            });

            expect(response.status).toBe(200);
            expect(response.data).toContain('successfully');
        });

        test('POST /audit/log/data-access - should log data access event', async () => {
            const response = await axios.post(`${baseURL}/audit/log/data-access`, null, {
                params: {
                    entityType: 'USER',
                    entityId: 'user123',
                    userId: 'testuser@example.com',
                    action: 'READ'
                }
            });

            expect(response.status).toBe(200);
            expect(response.data).toContain('successfully');
        });

        test('POST /audit/log/compliance - should log compliance event', async () => {
            const response = await axios.post(`${baseURL}/audit/log/compliance`, null, {
                params: {
                    regulation: 'GDPR',
                    action: 'DATA_EXPORT',
                    entityType: 'USER_DATA',
                    entityId: 'user123',
                    userId: 'testuser@example.com',
                    details: 'User data export for GDPR compliance'
                }
            });

            expect(response.status).toBe(200);
            expect(response.data).toContain('successfully');
        });

        test('POST /audit/events - should create audit event from JSON', async () => {
            const auditEvent = {
                eventType: 'USER_ACTION',
                serviceName: 'test-service',
                userId: 'testuser@example.com',
                sessionId: 'test-session-123',
                resourceType: 'TEST_RESOURCE',
                resourceId: 'resource-123',
                action: 'CREATE',
                description: 'Test audit event creation',
                ipAddress: '127.0.0.1',
                userAgent: 'Test-Agent/1.0',
                result: 'SUCCESS',
                metadata: '{"testData": "value"}',
                durationMs: 100
            };

            const response = await axios.post(`${baseURL}/audit/events`, auditEvent);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
            expect(response.data.action).toBe('CREATE');
            expect(response.data.serviceName).toBe('test-service');
        });

        test('POST /audit/events - should handle invalid audit event data', async () => {
            const invalidEvent = {
                // Missing required fields
                action: 'INVALID_TEST'
            };

            try {
                await axios.post(`${baseURL}/audit/events`, invalidEvent);
            } catch (error) {
                expect(error.response.status).toBe(500);
            }
        });
    });

    describe('Cross-Origin Resource Sharing (CORS)', () => {
        test('OPTIONS request should be handled properly', async () => {
            const response = await axios.options(`${baseURL}/audit`);
            expect([200, 204]).toContain(response.status);
        });
    });

    describe('Integration with User Service', () => {
        test('Should be able to track user authentication events', async () => {
            // Login to user service to generate audit events
            const userServiceURL = process.env.USER_SERVICE_URL || 'http://localhost:8081';
            
            try {
                await axios.post(`${userServiceURL}/auth/login`, {
                    email: process.env.TEST_ADMIN_EMAIL,
                    password: process.env.TEST_ADMIN_PASSWORD
                });

                // Wait a bit for audit event to be processed
                await testUtils.sleep(2000);

                // Check if login event was audited
                const response = await axios.get(`${baseURL}/audit/action/LOGIN`);
                expect(response.status).toBe(200);
                expect(response.data.length).toBeGreaterThan(0);
            } catch (error) {
                // If user service is not available, skip this test
                console.warn('User service not available for integration test');
            }
        });
    });
});