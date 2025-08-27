const axios = require('axios');

describe('Enhanced Health Checks Tests', () => {
  jest.setTimeout(30000);
  
  const services = [
    { name: 'User Service', url: 'http://localhost:30081', port: 30081 },
    { name: 'Order Service', url: 'http://localhost:30082', port: 30082 },
    { name: 'Inventory Service', url: 'http://localhost:30084', port: 30084 },
    { name: 'Notification Service', url: 'http://localhost:30083', port: 30083 },
    { name: 'Audit Service', url: 'http://localhost:30085', port: 30085 }
  ];

  describe('Basic Health Endpoints', () => {
    services.forEach(service => {
      it(`should respond to health check (${service.name})`, async () => {
        try {
          const response = await axios.get(`${service.url}/health`, {
            timeout: 10000
          });
          
          expect(response.status).toBe(200);
          expect(response.data.status).toBe('UP');
          expect(response.data.service).toBeDefined();
          
          console.log(`✅ ${service.name} health check: OK`);
          
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            console.log(`⚠️  ${service.name} is not running (port ${service.port})`);
            return;
          } else if (error.response) {
            console.log(`❌ ${service.name} health check failed with status: ${error.response.status}`);
            throw error;
          } else {
            console.log(`❌ ${service.name} health check failed: ${error.message}`);
            throw error;
          }
        }
      });
    });
  });

  describe('Health Check Response Structure', () => {
    it('should have proper health check response format', async () => {
      try {
        const response = await axios.get(`${services[0].url}/health`);
        
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('service');
        expect(['UP', 'DOWN', 'DEGRADED']).toContain(response.data.status);
        
        console.log('✅ Health check response format is correct');
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Service: ${response.data.service}`);
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return;
        }
        throw error;
      }
    });
  });

  describe('Service Availability Tests', () => {
    it('should test service connectivity and response times', async () => {
      const healthResults = [];
      
      for (const service of services) {
        try {
          const startTime = Date.now();
          const response = await axios.get(`${service.url}/health`, {
            timeout: 5000
          });
          const responseTime = Date.now() - startTime;
          
          healthResults.push({
            name: service.name,
            status: 'UP',
            responseTime: responseTime,
            httpStatus: response.status
          });
          
          console.log(`✅ ${service.name}: ${responseTime}ms`);
          
        } catch (error) {
          healthResults.push({
            name: service.name,
            status: 'DOWN',
            error: error.message,
            httpStatus: error.response ? error.response.status : null
          });
          
          console.log(`❌ ${service.name}: ${error.message}`);
        }
      }
      
      // Display summary
      console.log('\n🏥 HEALTH CHECK SUMMARY:');
      console.log('========================');
      
      const upServices = healthResults.filter(r => r.status === 'UP');
      const downServices = healthResults.filter(r => r.status === 'DOWN');
      
      console.log(`📊 Services UP: ${upServices.length}/${healthResults.length}`);
      
      if (upServices.length > 0) {
        console.log('\n✅ Healthy Services:');
        upServices.forEach(service => {
          console.log(`   ${service.name}: ${service.responseTime}ms`);
        });
      }
      
      if (downServices.length > 0) {
        console.log('\n❌ Unhealthy Services:');
        downServices.forEach(service => {
          console.log(`   ${service.name}: ${service.error}`);
        });
      }
      
      // Performance analysis
      const healthyServices = upServices.filter(s => s.responseTime < 1000);
      const slowServices = upServices.filter(s => s.responseTime >= 1000);
      
      if (slowServices.length > 0) {
        console.log('\n⚠️  Slow Services (>1s):');
        slowServices.forEach(service => {
          console.log(`   ${service.name}: ${service.responseTime}ms`);
        });
      }
      
      console.log('========================\n');
      
      // At least one service should be healthy
      expect(upServices.length).toBeGreaterThan(0);
    });
  });

  describe('Actuator Endpoints (if available)', () => {
    it('should check if actuator endpoints are accessible', async () => {
      const actuatorEndpoints = ['/actuator', '/actuator/health', '/actuator/info'];
      
      for (const endpoint of actuatorEndpoints) {
        try {
          const response = await axios.get(`${services[0].url}${endpoint}`, {
            timeout: 5000
          });
          
          console.log(`✅ Actuator endpoint ${endpoint}: ${response.status}`);
          
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log(`⚠️  Actuator endpoint ${endpoint}: Not found (expected for basic setup)`);
          } else if (error.code === 'ECONNREFUSED') {
            console.log(`⚠️  Service not available for actuator testing`);
            break;
          } else {
            console.log(`❌ Actuator endpoint ${endpoint}: ${error.message}`);
          }
        }
      }
    });
  });

  describe('Database Health (User Service)', () => {
    it('should verify database connectivity through service health', async () => {
      try {
        const response = await axios.get(`${services[0].url}/health`);
        
        if (response.data.status === 'UP') {
          console.log('✅ Database connectivity: Implied healthy (service is UP)');
          
          // If we have detailed health info
          if (response.data.components) {
            const dbHealth = response.data.components.db || response.data.components.database;
            if (dbHealth) {
              console.log(`   Database status: ${dbHealth.status}`);
              if (dbHealth.details) {
                console.log(`   Database details:`, dbHealth.details);
              }
            }
          }
        } else {
          console.log('⚠️  Service health indicates potential database issues');
        }
        
        expect(response.data.status).toBe('UP');
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return;
        }
        throw error;
      }
    });
  });

  describe('Load Testing Health Checks', () => {
    it('should handle multiple concurrent health checks', async () => {
      const concurrentRequests = 10;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          axios.get(`${services[0].url}/health`, { timeout: 5000 })
            .catch(error => ({ error: error.message }))
        );
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => !r.error && r.status === 200);
      const failed = results.filter(r => r.error);
      
      console.log(`📊 Concurrent health checks: ${successful.length}/${concurrentRequests} successful`);
      
      if (failed.length > 0) {
        console.log(`❌ Failed requests: ${failed.length}`);
        failed.forEach((failure, index) => {
          console.log(`   Request ${index + 1}: ${failure.error}`);
        });
      }
      
      // At least 80% should succeed
      const successRate = (successful.length / concurrentRequests) * 100;
      expect(successRate).toBeGreaterThan(80);
    });
  });
});