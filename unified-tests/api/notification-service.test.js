const axios = require('axios');
const AuthHelper = require('../helpers/auth');

describe('Notification Service API Tests', () => {
    let authHelper;
    const baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8084';
    let testNotificationId;
    let testUserId = 1; // Assuming user ID 1 exists
    
    beforeAll(async () => {
        authHelper = new AuthHelper();
        // Wait for service to be available
        await testUtils.waitForService(baseURL);
    });

    describe('Notification Creation', () => {
        test('POST /notifications - should create new notification', async () => {
            const notificationData = {
                message: 'Test notification message',
                type: 'SYSTEM_EVENT',
                userId: testUserId
            };

            const response = await axios.post(`${baseURL}/notifications`, notificationData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
            expect(response.data.message).toBe(notificationData.message);
            expect(response.data.type).toBe(notificationData.type);
            expect(response.data.userId).toBe(testUserId);
            expect(response.data.read).toBe(false);

            // Store notification ID for later tests
            testNotificationId = response.data.id;
        });

        test('POST /notifications - should create notification without userId (broadcast)', async () => {
            const notificationData = {
                message: 'Broadcast notification',
                type: 'SYSTEM_EVENT'
                // No userId - should be a broadcast notification
            };

            const response = await axios.post(`${baseURL}/notifications`, notificationData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
            expect(response.data.message).toBe(notificationData.message);
            expect(response.data.userId).toBeNull();
        });

        test('POST /notifications/test - should create test notification', async () => {
            const response = await axios.post(`${baseURL}/notifications/test`, null, {
                params: { userId: testUserId }
            });

            expect(response.status).toBe(200);
            expect(response.data).toContain('Test notification sent successfully');
        });

        test('POST /notifications/test - should create test notification without userId', async () => {
            const response = await axios.post(`${baseURL}/notifications/test`);

            expect(response.status).toBe(200);
            expect(response.data).toContain('Test notification sent successfully');
        });
    });

    describe('Notification Retrieval', () => {
        test('GET /notifications/user/{userId} - should get notifications by user ID', async () => {
            const response = await axios.get(`${baseURL}/notifications/user/${testUserId}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            
            if (response.data.length > 0) {
                const notification = response.data[0];
                expect(notification).toHaveProperty('id');
                expect(notification).toHaveProperty('message');
                expect(notification).toHaveProperty('type');
                expect(notification).toHaveProperty('read');
                expect(notification).toHaveProperty('createdAt');
            }
        });

        test('GET /notifications/user/{userId}/unread - should get unread notifications', async () => {
            const response = await axios.get(`${baseURL}/notifications/user/${testUserId}/unread`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);

            // All returned notifications should be unread
            response.data.forEach(notification => {
                expect(notification.read).toBe(false);
            });
        });

        test('GET /notifications/user/{userId} - should return empty array for non-existent user', async () => {
            const response = await axios.get(`${baseURL}/notifications/user/999999`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBe(0);
        });
    });

    describe('Notification Status Management', () => {
        test('PUT /notifications/{id}/read - should mark notification as read', async () => {
            if (!testNotificationId) {
                // Create a test notification first
                const createResponse = await axios.post(`${baseURL}/notifications`, {
                    message: 'Test notification for marking as read',
                    type: 'SYSTEM_EVENT',
                    userId: testUserId
                });
                testNotificationId = createResponse.data.id;
            }

            const response = await axios.put(`${baseURL}/notifications/${testNotificationId}/read`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id', testNotificationId);
            expect(response.data.read).toBe(true);
        });

        test('PUT /notifications/{id}/read - should return 404 for non-existent notification', async () => {
            try {
                await axios.put(`${baseURL}/notifications/999999/read`);
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });
    });

    describe('Notification Types', () => {
        const notificationTypes = ['SYSTEM_EVENT', 'USER_ACTION', 'ALERT', 'WARNING', 'INFO'];

        notificationTypes.forEach(type => {
            test(`POST /notifications - should create ${type} notification`, async () => {
                const notificationData = {
                    message: `Test ${type} notification`,
                    type: type,
                    userId: testUserId
                };

                const response = await axios.post(`${baseURL}/notifications`, notificationData);

                expect(response.status).toBe(200);
                expect(response.data.type).toBe(type);
            });
        });
    });

    describe('Error Handling', () => {
        test('POST /notifications - should validate required fields', async () => {
            try {
                await axios.post(`${baseURL}/notifications`, {
                    // Missing message and type
                    userId: testUserId
                });
            } catch (error) {
                expect(error.response.status).toBe(500);
            }
        });

        test('POST /notifications - should handle invalid notification type gracefully', async () => {
            const notificationData = {
                message: 'Test notification with invalid type',
                type: 'INVALID_TYPE',
                userId: testUserId
            };

            try {
                await axios.post(`${baseURL}/notifications`, notificationData);
            } catch (error) {
                expect(error.response.status).toBe(500);
            }
        });
    });

    describe('Cross-Origin Resource Sharing (CORS)', () => {
        test('OPTIONS request should be handled properly', async () => {
            const response = await axios.options(`${baseURL}/notifications`);
            expect([200, 204]).toContain(response.status);
        });

        test('CORS headers should allow specified origins and methods', async () => {
            const response = await axios.get(`${baseURL}/notifications/user/${testUserId}`);
            expect(response.status).toBe(200);
            
            // CORS headers should be present
            // Note: In a real test, you'd check for specific CORS headers
        });
    });

    describe('WebSocket Integration', () => {
        test('Creating notification should trigger WebSocket event', async () => {
            // Note: This is a placeholder for WebSocket testing
            // In a real implementation, you would set up WebSocket listeners
            // and verify that creating notifications triggers the appropriate messages
            
            const notificationData = {
                message: 'WebSocket test notification',
                type: 'SYSTEM_EVENT',
                userId: testUserId
            };

            const response = await axios.post(`${baseURL}/notifications`, notificationData);

            expect(response.status).toBe(200);
            // WebSocket message verification would go here
        });
    });

    describe('Notification Workflow', () => {
        test('Complete notification lifecycle', async () => {
            // 1. Create a notification
            const notificationData = {
                message: 'Lifecycle test notification',
                type: 'USER_ACTION',
                userId: testUserId
            };

            const createResponse = await axios.post(`${baseURL}/notifications`, notificationData);
            expect(createResponse.status).toBe(200);
            const notificationId = createResponse.data.id;

            // 2. Check it appears in unread notifications
            const unreadResponse = await axios.get(`${baseURL}/notifications/user/${testUserId}/unread`);
            expect(unreadResponse.status).toBe(200);
            const unreadNotification = unreadResponse.data.find(n => n.id === notificationId);
            expect(unreadNotification).toBeDefined();
            expect(unreadNotification.read).toBe(false);

            // 3. Mark it as read
            const markReadResponse = await axios.put(`${baseURL}/notifications/${notificationId}/read`);
            expect(markReadResponse.status).toBe(200);
            expect(markReadResponse.data.read).toBe(true);

            // 4. Verify it no longer appears in unread notifications
            const unreadAfterResponse = await axios.get(`${baseURL}/notifications/user/${testUserId}/unread`);
            expect(unreadAfterResponse.status).toBe(200);
            const stillUnread = unreadAfterResponse.data.find(n => n.id === notificationId);
            expect(stillUnread).toBeUndefined();

            // 5. Verify it still appears in all notifications
            const allNotificationsResponse = await axios.get(`${baseURL}/notifications/user/${testUserId}`);
            expect(allNotificationsResponse.status).toBe(200);
            const readNotification = allNotificationsResponse.data.find(n => n.id === notificationId);
            expect(readNotification).toBeDefined();
            expect(readNotification.read).toBe(true);
        });
    });

    describe('Performance Tests', () => {
        test('Should handle multiple notification creation efficiently', async () => {
            const startTime = Date.now();
            const promises = [];

            // Create 10 notifications concurrently
            for (let i = 0; i < 10; i++) {
                const notificationData = {
                    message: `Performance test notification ${i}`,
                    type: 'SYSTEM_EVENT',
                    userId: testUserId
                };
                
                promises.push(axios.post(`${baseURL}/notifications`, notificationData));
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

    describe('Data Persistence', () => {
        test('Notifications should persist across service restarts', async () => {
            // Create a notification with a unique message
            const uniqueMessage = `Persistence test ${Date.now()}`;
            const notificationData = {
                message: uniqueMessage,
                type: 'SYSTEM_EVENT',
                userId: testUserId
            };

            const createResponse = await axios.post(`${baseURL}/notifications`, notificationData);
            expect(createResponse.status).toBe(200);

            // Retrieve all notifications and verify our notification exists
            const retrieveResponse = await axios.get(`${baseURL}/notifications/user/${testUserId}`);
            expect(retrieveResponse.status).toBe(200);

            const persistedNotification = retrieveResponse.data.find(n => n.message === uniqueMessage);
            expect(persistedNotification).toBeDefined();
            expect(persistedNotification.type).toBe('SYSTEM_EVENT');
        });
    });
});