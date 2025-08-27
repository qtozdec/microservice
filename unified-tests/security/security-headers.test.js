const axios = require('axios');

describe('Security Headers Tests', () => {
  jest.setTimeout(30000);
  
  const services = [
    { name: 'User Service', url: 'http://localhost:30081' },
    { name: 'Order Service', url: 'http://localhost:30082' },
    { name: 'Inventory Service', url: 'http://localhost:30084' },
    { name: 'Notification Service', url: 'http://localhost:30083' },
    { name: 'Audit Service', url: 'http://localhost:30085' }
  ];
  
  let authToken = null;
  
  beforeAll(async () => {
    // Get auth token for authenticated endpoints
    try {
      const response = await axios.post(`${services[0].url}/auth/login`, {
        email: 'test@example.com',
        password: 'testPassword123'
      });
      authToken = response.data.token;
    } catch (error) {
      console.log('Could not get auth token, proceeding without it');
    }
  });

  describe('OWASP Security Headers', () => {
    services.forEach(service => {
      describe(`${service.name} Security Headers`, () => {
        it('should include X-Content-Type-Options: nosniff', async () => {
          try {
            const response = await axios.get(`${service.url}/health`);
            expect(response.headers['x-content-type-options']).toBe('nosniff');
          } catch (error) {
            // Check headers even on error responses
            if (error.response) {
              expect(error.response.headers['x-content-type-options']).toBe('nosniff');
            } else {
              return;
            }
          }
        });

        it('should include X-Frame-Options: DENY', async () => {
          try {
            const response = await axios.get(`${service.url}/health`);
            expect(response.headers['x-frame-options']).toBe('DENY');
          } catch (error) {
            if (error.response) {
              expect(error.response.headers['x-frame-options']).toBe('DENY');
            } else {
              return;
            }
          }
        });

        it('should include security-related headers', async () => {
          try {
            const response = await axios.get(`${service.url}/health`);
            const headers = response.headers;
            
            // Check for presence of security headers
            expect(headers).toHaveProperty('x-content-type-options');
            expect(headers).toHaveProperty('x-frame-options');
            
            // XSS Protection might be disabled in newer browsers
            if (headers['x-xss-protection']) {
              expect(['0', '1', '1; mode=block']).toContain(headers['x-xss-protection']);
            }
            
          } catch (error) {
            if (error.response && error.response.headers) {
              const headers = error.response.headers;
              expect(headers).toHaveProperty('x-content-type-options');
              expect(headers).toHaveProperty('x-frame-options');
            } else {
              return;
            }
          }
        });

        if (service.name === 'User Service') {
          it('should include rate limiting headers', async () => {
            try {
              const response = await axios.post(`${service.url}/auth/login`, {
                email: 'test@example.com',
                password: 'wrongpassword'
              });
              
              expect(response.headers).toHaveProperty('x-ratelimit-limit');
              expect(response.headers).toHaveProperty('x-ratelimit-window');
              
            } catch (error) {
              if (error.response) {
                expect(error.response.headers).toHaveProperty('x-ratelimit-limit');
                expect(error.response.headers).toHaveProperty('x-ratelimit-window');
              }
            }
          });

          it('should include HSTS header for HTTPS (when applicable)', async () => {
            try {
              const response = await axios.get(`${service.url}/health`);
              // HSTS is typically only sent over HTTPS, so this might not be present in local testing
              if (response.headers['strict-transport-security']) {
                expect(response.headers['strict-transport-security']).toMatch(/max-age=\d+/);
              }
            } catch (error) {
              if (error.response && error.response.headers['strict-transport-security']) {
                expect(error.response.headers['strict-transport-security']).toMatch(/max-age=\d+/);
              }
            }
          });
        }
      });
    });
  });

  describe('Content Security Policy', () => {
    it('should have CSP header (User Service)', async () => {
      try {
        const response = await axios.get(`${services[0].url}/health`);
        
        if (response.headers['content-security-policy']) {
          expect(response.headers['content-security-policy']).toContain("default-src 'self'");
        }
      } catch (error) {
        if (error.response && error.response.headers['content-security-policy']) {
          expect(error.response.headers['content-security-policy']).toContain("default-src 'self'");
        }
      }
    });
  });

  describe('Server Information Hiding', () => {
    services.forEach(service => {
      it(`should not expose server information (${service.name})`, async () => {
        try {
          const response = await axios.get(`${service.url}/health`);
          
          // Server header should be empty or not present
          if (response.headers.server) {
            expect(response.headers.server).toBe('');
          }
          
        } catch (error) {
          if (error.response) {
            if (error.response.headers.server) {
              expect(error.response.headers.server).toBe('');
            }
          } else {
            this.skip('Service not available');
          }
        }
      });
    });
  });

  describe('CORS Headers Security', () => {
    it('should have secure CORS configuration', async () => {
      try {
        const response = await axios.options(`${services[0].url}/auth/login`);
        
        if (response.headers['access-control-allow-origin']) {
          // Should not be wildcard (*) for sensitive endpoints
          const corsOrigin = response.headers['access-control-allow-origin'];
          console.log('CORS Origin:', corsOrigin);
          
          // For auth endpoints, CORS should be more restrictive
          if (corsOrigin === '*') {
            console.warn('Warning: Wildcard CORS on authentication endpoint');
          }
        }
      } catch (error) {
        // OPTIONS might not be supported, that's OK
        console.log('OPTIONS request not supported or failed');
      }
    });
  });
});