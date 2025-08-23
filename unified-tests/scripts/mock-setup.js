#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

console.log('🎭 Starting mock services for testing...');

// Mock User Service
const userApp = express();
userApp.use(cors());
userApp.use(express.json());

userApp.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'user-service' });
});

userApp.post('/auth/register', (req, res) => {
  res.json({ 
    id: 1, 
    email: req.body.email,
    message: 'User registered successfully' 
  });
});

userApp.post('/auth/login', (req, res) => {
  res.json({ 
    token: 'mock-jwt-token',
    user: { id: 1, email: req.body.email, role: 'USER' }
  });
});

const userServer = userApp.listen(8081, () => {
  console.log('✅ Mock User Service running on port 8081');
});

// Mock Audit Service  
const auditApp = express();
auditApp.use(cors());
auditApp.use(express.json());

auditApp.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'audit-service' });
});

auditApp.post('/audit-events', (req, res) => {
  res.json({ id: 1, message: 'Audit event created' });
});

const auditServer = auditApp.listen(8085, () => {
  console.log('✅ Mock Audit Service running on port 8085');
});

// Mock Inventory Service
const inventoryApp = express();
inventoryApp.use(cors());
inventoryApp.use(express.json());

inventoryApp.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'inventory-service' });
});

inventoryApp.get('/products', (req, res) => {
  res.json([
    { id: 1, name: 'Test Product', price: 100, stock: 10 }
  ]);
});

const inventoryServer = inventoryApp.listen(8083, () => {
  console.log('✅ Mock Inventory Service running on port 8083');
});

// Mock Notification Service
const notificationApp = express();
notificationApp.use(cors());
notificationApp.use(express.json());

notificationApp.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'notification-service' });
});

notificationApp.post('/notifications', (req, res) => {
  res.json({ id: 1, message: 'Notification sent' });
});

const notificationServer = notificationApp.listen(8084, () => {
  console.log('✅ Mock Notification Service running on port 8084');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down mock services...');
  userServer.close();
  auditServer.close();
  inventoryServer.close();
  notificationServer.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down mock services...');
  userServer.close();
  auditServer.close();
  inventoryServer.close();
  notificationServer.close();
  process.exit(0);
});

console.log('🎭 All mock services are running!');
console.log('Press Ctrl+C to stop');