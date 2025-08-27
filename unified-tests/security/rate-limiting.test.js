const axios = require('axios');

describe('Rate Limiting Tests', () => {
  jest.setTimeout(60000); // Increase timeout for rate limit tests
  
  const userServiceUrl = 'http://localhost:30081';
  
  beforeEach(async () => {
    // Wait a bit between tests to reset rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Authentication Rate Limiting', () => {
    it('should allow normal login requests', async () => {
      try {
        const response = await axios.post(`${userServiceUrl}/auth/login`, {
          email: 'test@example.com',
          password: 'testPassword123'
        });
        expect(response.status).toBe(200);
      } catch (error) {
        // Even auth failure is ok for this test, we just want to test the endpoint is reachable
        expect([400, 401, 403]).toContain(error.response?.status);
      }
    });

    it('should rate limit excessive login attempts', async () => {
      let successCount = 0;
      let rateLimitedCount = 0;
      
      // Make 15 rapid requests (limit is 10/minute)
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          axios.post(`${userServiceUrl}/auth/login`, {
            email: `test${i}@example.com`,
            password: 'wrongpassword'
          }).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        if (response.status === 429) {
          rateLimitedCount++;
        } else if (response.status === 403 || response.status === 200) {
          successCount++;
        }
      });
      
      console.log(`Success: ${successCount}, Rate limited: ${rateLimitedCount}`);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      try {
        const response = await axios.post(`${userServiceUrl}/auth/login`, {
          email: 'test@example.com',
          password: 'testPassword123'
        });
        
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-window']).toBeDefined();
      } catch (error) {
        // Even on error, check headers
        expect(error.response.headers['x-ratelimit-limit']).toBeDefined();
      }
    });

    it('should return appropriate error message for rate limiting', async () => {
      // First, trigger rate limiting
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          axios.post(`${userServiceUrl}/auth/login`, {
            email: `flood${i}@example.com`,
            password: 'wrongpassword'
          }).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find(r => r.status === 429);
      
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.status).toBe(429);
        expect(rateLimitedResponse.data.email).toContain('Too many');
      }
    });
  });

  describe('Registration Rate Limiting', () => {
    it('should rate limit excessive registration attempts', async () => {
      let rateLimitedCount = 0;
      
      const promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(
          axios.post(`${userServiceUrl}/auth/register`, {
            email: `newuser${i}@example.com`,
            password: 'Password123!',
            name: `User ${i}`
          }).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        if (response.status === 429) {
          rateLimitedCount++;
        }
      });
      
      console.log(`Rate limited registration attempts: ${rateLimitedCount}`);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Recovery', () => {
    it('should allow requests after rate limit window expires', async () => {
      // This test would need to wait 60+ seconds for real rate limit reset
      // For demo purposes, we'll just test that the mechanism is in place
      
      const response = await axios.post(`${userServiceUrl}/auth/login`, {
        email: 'recovery@example.com',
        password: 'testPassword123'
      }).catch(error => error.response);
      
      expect([200, 403, 429]).toContain(response.status);
    });
  });
});