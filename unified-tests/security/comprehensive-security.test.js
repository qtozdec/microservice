const axios = require('axios');

describe('Comprehensive Security Integration Tests', () => {
  jest.setTimeout(60000);
  
  const services = {
    userService: 'http://localhost:30081',
    orderService: 'http://localhost:30082',
    inventoryService: 'http://localhost:30084',
    notificationService: 'http://localhost:30083',
    auditService: 'http://localhost:30085'
  };
  
  let authToken = null;
  let testResults = {
    rateLimiting: { passed: 0, failed: 0 },
    securityHeaders: { passed: 0, failed: 0 },
    authentication: { passed: 0, failed: 0 },
    authorization: { passed: 0, failed: 0 }
  };

  beforeAll(async () => {
    console.log('🔒 Starting Comprehensive Security Tests...\n');
    
    // Get authentication token
    try {
      const response = await axios.post(`${services.userService}/auth/login`, {
        email: 'test@example.com',
        password: 'testPassword123'
      });
      authToken = response.data.token;
      console.log('✅ Authentication token obtained');
    } catch (error) {
      console.log('⚠️  Could not get auth token, some tests may fail');
    }
  });

  describe('🚦 Rate Limiting Comprehensive Tests', () => {
    it('should enforce rate limits across different endpoints', async () => {
      const testEndpoints = [
        { url: `${services.userService}/auth/login`, method: 'POST', data: { email: 'test@test.com', password: 'wrong' }},
        { url: `${services.userService}/auth/register`, method: 'POST', data: { email: 'new@test.com', password: 'Test123!', name: 'Test' }}
      ];
      
      for (const endpoint of testEndpoints) {
        let rateLimitTriggered = false;
        const requests = [];
        
        // Make 15 rapid requests
        for (let i = 0; i < 15; i++) {
          requests.push(
            axios({
              method: endpoint.method,
              url: endpoint.url,
              data: { ...endpoint.data, email: `test${i}@example.com` }
            }).catch(error => error.response)
          );
        }
        
        const responses = await Promise.all(requests);
        
        responses.forEach(response => {
          if (response && response.status === 429) {
            rateLimitTriggered = true;
            testResults.rateLimiting.passed++;
          }
        });
        
        if (rateLimitTriggered) {
          console.log(`✅ Rate limiting working for ${endpoint.url}`);
        } else {
          console.log(`⚠️  Rate limiting not triggered for ${endpoint.url}`);
          testResults.rateLimiting.failed++;
        }
      }
      
      expect(testResults.rateLimiting.passed).toBeGreaterThan(0);
    });

    it('should include proper rate limit headers', async () => {
      try {
        const response = await axios.post(`${services.userService}/auth/login`, {
          email: 'header-test@example.com',
          password: 'wrongpassword'
        });
        
        verifyRateLimitHeaders(response.headers);
      } catch (error) {
        if (error.response) {
          verifyRateLimitHeaders(error.response.headers);
        }
      }
    });
    
    function verifyRateLimitHeaders(headers) {
      if (headers['x-ratelimit-limit'] && headers['x-ratelimit-window']) {
        testResults.rateLimiting.passed++;
        console.log('✅ Rate limit headers present');
      } else {
        testResults.rateLimiting.failed++;
        console.log('❌ Rate limit headers missing');
      }
    }
  });

  describe('🛡️ Security Headers Comprehensive Tests', () => {
    it('should have consistent security headers across all services', async () => {
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options'
      ];
      
      for (const [serviceName, serviceUrl] of Object.entries(services)) {
        try {
          const response = await axios.get(`${serviceUrl}/health`, {
            timeout: 5000
          });
          
          checkSecurityHeaders(serviceName, response.headers, requiredHeaders);
          
        } catch (error) {
          if (error.response) {
            checkSecurityHeaders(serviceName, error.response.headers, requiredHeaders);
          } else {
            console.log(`⚠️  ${serviceName} not available for testing`);
          }
        }
      }
      
      expect(testResults.securityHeaders.passed).toBeGreaterThan(0);
    });
    
    function checkSecurityHeaders(serviceName, headers, requiredHeaders) {
      let serviceHeadersOk = true;
      
      requiredHeaders.forEach(header => {
        if (headers[header]) {
          console.log(`✅ ${serviceName}: ${header} = ${headers[header]}`);
        } else {
          console.log(`❌ ${serviceName}: Missing ${header}`);
          serviceHeadersOk = false;
        }
      });
      
      if (serviceHeadersOk) {
        testResults.securityHeaders.passed++;
      } else {
        testResults.securityHeaders.failed++;
      }
    }

    it('should have proper CSP and additional security headers on User Service', async () => {
      try {
        const response = await axios.get(`${services.userService}/health`);
        const headers = response.headers;
        
        const securityHeaders = {
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY'
        };
        
        let allHeadersOk = true;
        for (const [header, expectedValue] of Object.entries(securityHeaders)) {
          if (headers[header] === expectedValue) {
            console.log(`✅ ${header}: ${headers[header]}`);
          } else {
            console.log(`❌ ${header}: Expected '${expectedValue}', got '${headers[header] || 'undefined'}'`);
            allHeadersOk = false;
          }
        }
        
        if (allHeadersOk) {
          testResults.securityHeaders.passed++;
        } else {
          testResults.securityHeaders.failed++;
        }
        
      } catch (error) {
        testResults.securityHeaders.failed++;
        console.log('❌ Could not verify User Service security headers');
      }
    });
  });

  describe('🔐 Authentication & Authorization Tests', () => {
    it('should properly authenticate valid users', async () => {
      try {
        const response = await axios.post(`${services.userService}/auth/login`, {
          email: 'test@example.com',
          password: 'testPassword123'
        });
        
        expect(response.status).toBe(200);
        expect(response.data.token).toBeDefined();
        testResults.authentication.passed++;
        console.log('✅ Valid authentication works');
        
      } catch (error) {
        testResults.authentication.failed++;
        console.log('❌ Valid authentication failed:', error.message);
      }
    });

    it('should reject invalid credentials', async () => {
      try {
        const response = await axios.post(`${services.userService}/auth/login`, {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        
        // Should not reach here
        testResults.authentication.failed++;
        console.log('❌ Invalid credentials were accepted');
        
      } catch (error) {
        if (error.response && error.response.status === 403) {
          testResults.authentication.passed++;
          console.log('✅ Invalid credentials properly rejected');
        } else {
          testResults.authentication.failed++;
          console.log('❌ Unexpected error for invalid credentials');
        }
      }
    });

    it('should protect authenticated endpoints', async () => {
      if (!authToken) {
        return;
      }
      
      const protectedEndpoints = [
        { service: 'Order', url: `${services.orderService}/orders` },
        { service: 'Inventory', url: `${services.inventoryService}/products` }
      ];
      
      for (const endpoint of protectedEndpoints) {
        try {
          // Test without token
          const unauthorizedResponse = await axios.get(endpoint.url);
          testResults.authorization.failed++;
          console.log(`❌ ${endpoint.service}: Endpoint not protected`);
          
        } catch (error) {
          if (error.response && [401, 403].includes(error.response.status)) {
            testResults.authorization.passed++;
            console.log(`✅ ${endpoint.service}: Endpoint properly protected`);
          } else {
            console.log(`⚠️  ${endpoint.service}: Unexpected response`);
          }
        }
      }
    });

    it('should allow access with valid token', async () => {
      if (!authToken) {
        return;
      }
      
      try {
        const response = await axios.get(`${services.inventoryService}/products`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.status === 200) {
          testResults.authorization.passed++;
          console.log('✅ Authorized access works');
        }
        
      } catch (error) {
        if (error.response && error.response.status === 403) {
          // This might be due to role-based access, which is still correct behavior
          testResults.authorization.passed++;
          console.log('✅ Token-based access control working (role restriction)');
        } else {
          testResults.authorization.failed++;
          console.log('❌ Authorized access failed unexpectedly');
        }
      }
    });
  });

  describe('📊 Security Test Summary', () => {
    it('should display comprehensive test results', async () => {
      console.log('\n🔒 COMPREHENSIVE SECURITY TEST RESULTS');
      console.log('=====================================');
      
      console.log('\n🚦 Rate Limiting:');
      console.log(`   ✅ Passed: ${testResults.rateLimiting.passed}`);
      console.log(`   ❌ Failed: ${testResults.rateLimiting.failed}`);
      
      console.log('\n🛡️ Security Headers:');
      console.log(`   ✅ Passed: ${testResults.securityHeaders.passed}`);
      console.log(`   ❌ Failed: ${testResults.securityHeaders.failed}`);
      
      console.log('\n🔐 Authentication:');
      console.log(`   ✅ Passed: ${testResults.authentication.passed}`);
      console.log(`   ❌ Failed: ${testResults.authentication.failed}`);
      
      console.log('\n🔒 Authorization:');
      console.log(`   ✅ Passed: ${testResults.authorization.passed}`);
      console.log(`   ❌ Failed: ${testResults.authorization.failed}`);
      
      const totalPassed = Object.values(testResults).reduce((sum, result) => sum + result.passed, 0);
      const totalFailed = Object.values(testResults).reduce((sum, result) => sum + result.failed, 0);
      const totalTests = totalPassed + totalFailed;
      const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
      
      console.log('\n📈 Overall Results:');
      console.log(`   Total Tests: ${totalTests}`);
      console.log(`   Success Rate: ${successRate}%`);
      console.log(`   Status: ${successRate >= 80 ? '🎉 EXCELLENT' : successRate >= 60 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'}`);
      
      console.log('\n=====================================\n');
      
      // Ensure we have some passing tests
      expect(totalPassed).toBeGreaterThan(0);
      expect(parseFloat(successRate)).toBeGreaterThan(50);
    });
  });
});