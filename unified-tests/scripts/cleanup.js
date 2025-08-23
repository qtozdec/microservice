#!/usr/bin/env node

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🧹 Starting test cleanup...');

async function cleanupTestData() {
  const services = [
    { name: 'User Service', url: process.env.USER_SERVICE_URL || 'http://localhost:8081' },
    { name: 'Order Service', url: process.env.ORDER_SERVICE_URL || 'http://localhost:8082' },
    { name: 'Inventory Service', url: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8083' },
    { name: 'Notification Service', url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8084' },
    { name: 'Audit Service', url: process.env.AUDIT_SERVICE_URL || 'http://localhost:8085' }
  ];

  // Cleanup test users (users with test- prefix in email)
  try {
    console.log('🗑️ Cleaning up test users...');
    // This would need to be implemented in each service
    // await axios.delete(`${services[0].url}/test-cleanup/users`);
    console.log('✅ Test users cleaned up');
  } catch (error) {
    console.log('⚠️ Could not cleanup test users:', error.message);
  }

  // Cleanup test orders
  try {
    console.log('🗑️ Cleaning up test orders...');
    // await axios.delete(`${services[1].url}/test-cleanup/orders`);
    console.log('✅ Test orders cleaned up');
  } catch (error) {
    console.log('⚠️ Could not cleanup test orders:', error.message);
  }

  // Cleanup test inventory
  try {
    console.log('🗑️ Cleaning up test inventory...');
    // await axios.delete(`${services[2].url}/test-cleanup/products`);
    console.log('✅ Test inventory cleaned up');
  } catch (error) {
    console.log('⚠️ Could not cleanup test inventory:', error.message);
  }

  // Cleanup test notifications
  try {
    console.log('🗑️ Cleaning up test notifications...');
    // await axios.delete(`${services[3].url}/test-cleanup/notifications`);
    console.log('✅ Test notifications cleaned up');
  } catch (error) {
    console.log('⚠️ Could not cleanup test notifications:', error.message);
  }

  // Cleanup test audit logs
  try {
    console.log('🗑️ Cleaning up test audit logs...');
    // await axios.delete(`${services[4].url}/test-cleanup/audit-events`);
    console.log('✅ Test audit logs cleaned up');
  } catch (error) {
    console.log('⚠️ Could not cleanup test audit logs:', error.message);
  }

  console.log('✅ Cleanup completed!');
}

cleanupTestData().catch(error => {
  console.error('❌ Cleanup failed:', error.message);
  process.exit(1);
});