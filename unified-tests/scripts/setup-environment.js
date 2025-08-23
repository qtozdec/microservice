#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up unified testing environment...');

// Check if .env file exists
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Please create one based on .env.example');
  process.exit(1);
}

// Install dependencies if node_modules doesn't exist
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
}

// Check if services are running
const axios = require('axios');
const services = [
  { name: 'User Service', url: 'http://localhost:8081/health' },
  { name: 'Order Service', url: 'http://localhost:8082/health' },
  { name: 'Inventory Service', url: 'http://localhost:8083/health' },
  { name: 'Notification Service', url: 'http://localhost:8084/health' },
  { name: 'Audit Service', url: 'http://localhost:8085/health' }
];

async function checkServices() {
  console.log('🔍 Checking service availability...');
  
  for (const service of services) {
    try {
      await axios.get(service.url, { timeout: 5000 });
      console.log(`✅ ${service.name} is running`);
    } catch (error) {
      console.log(`❌ ${service.name} is not available at ${service.url}`);
    }
  }
}

checkServices().then(() => {
  console.log('✅ Environment setup completed!');
  console.log('');
  console.log('Run tests with:');
  console.log('  npm test                 # All tests');
  console.log('  npm run test:api         # API tests only');
  console.log('  npm run test:integration # Integration tests only');
  console.log('  npm run test:performance # Performance tests');
}).catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});