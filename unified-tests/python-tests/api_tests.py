#!/usr/bin/env python3
"""
Comprehensive API Tests for Microservices Frontend
Tests all backend APIs that power the frontend interface
"""

import time
import json
import requests
from datetime import datetime
import sys

class MicroservicesAPITest:
    def __init__(self, base_url="http://microservices.local:30080"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.session = requests.Session()
        self.session.timeout = 10
        
    def login(self):
        """Login and get JWT token"""
        try:
            print("🔐 Testing Login...")
            response = self.session.post(f"{self.base_url}/auth/login", 
                json={"email": "admin@example.com", "password": "admin123"})
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.user_id = data["userId"]
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                print(f"✅ Login successful - User: {data.get('name', 'Unknown')} (ID: {self.user_id})")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def test_frontend_health(self):
        """Test if frontend is accessible"""
        try:
            print("\n🌐 Testing Frontend Health...")
            
            response = self.session.get(self.base_url, timeout=5)
            
            if response.status_code == 200 and "Microservices Management System" in response.text:
                print("✅ Frontend is accessible and serving content")
                return True
            else:
                print(f"❌ Frontend health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Frontend health error: {e}")
            return False
    
    def test_users_api(self):
        """Test users API"""
        try:
            print("\n👤 Testing Users API...")
            
            # Test getting all users (admin only)
            response = self.session.get(f"{self.base_url}/users")
            
            if response.status_code == 200:
                users = response.json()
                print(f"✅ Retrieved {len(users)} users")
                
                # Check user structure if any exist
                if users:
                    user = users[0]
                    required_fields = ["id", "email", "name", "role"]
                    missing_fields = [field for field in required_fields if field not in user]
                    
                    if not missing_fields:
                        print("✅ User data structure is correct")
                        return True
                    else:
                        print(f"⚠️ Missing user fields: {missing_fields}")
                        return False
                else:
                    print("⚠️ No users found")
                    return False
            else:
                print(f"❌ Users API failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Users API error: {e}")
            return False
    
    def test_orders_api(self):
        """Test orders API"""
        try:
            print("\n🛒 Testing Orders API...")
            
            response = self.session.get(f"{self.base_url}/orders")
            
            if response.status_code == 200:
                orders = response.json()
                print(f"✅ Retrieved {len(orders)} orders")
                
                # Check order structure if any exist
                if orders:
                    order = orders[0]
                    required_fields = ["id", "userId", "product", "status"]
                    missing_fields = [field for field in required_fields if field not in order]
                    
                    if not missing_fields:
                        print("✅ Order data structure is correct")
                        return True
                    else:
                        print(f"⚠️ Missing order fields: {missing_fields}")
                        return False
                else:
                    print("ℹ️ No orders found (this is normal)")
                    return True
            else:
                print(f"❌ Orders API failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Orders API error: {e}")
            return False
    
    def test_notifications_api(self):
        """Test notifications API"""
        try:
            print("\n🔔 Testing Notifications API...")
            
            if not self.user_id:
                print("❌ User ID not available, cannot test notifications")
                return False
                
            response = self.session.get(f"{self.base_url}/notifications/user/{self.user_id}")
            
            if response.status_code == 200:
                notifications = response.json()
                print(f"✅ Retrieved {len(notifications)} notifications")
                
                # Check notification structure if any exist
                if notifications:
                    notification = notifications[0]
                    required_fields = ["id", "userId", "message", "type", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in notification]
                    
                    if not missing_fields:
                        print("✅ Notification structure is correct")
                        return True
                    else:
                        print(f"⚠️ Missing notification fields: {missing_fields}")
                        return False
                else:
                    print("ℹ️ No notifications found (this is normal)")
                    return True
            else:
                print(f"❌ Notifications API failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Notifications API error: {e}")
            return False
    
    def test_audit_api(self):
        """Test audit logs API"""
        try:
            print("\n📋 Testing Audit Logs API...")
            
            # Get audit logs
            response = self.session.get(f"{self.base_url}/audit/events")
            
            if response.status_code == 200:
                data = response.json()
                events = data.get("content", []) if isinstance(data, dict) else data
                total = data.get("totalElements", len(events)) if isinstance(data, dict) else len(events)
                
                print(f"✅ Retrieved {len(events)} audit events (total: {total})")
                
                # Check event structure
                if events:
                    event = events[0]
                    required_fields = ["id", "timestamp", "eventType", "serviceName", "action", "result"]
                    missing_fields = [field for field in required_fields if field not in event]
                    
                    if not missing_fields:
                        print("✅ Audit event structure is correct")
                        
                        # Test timestamp formatting
                        timestamp = event.get("timestamp")
                        if timestamp:
                            print(f"✅ Timestamp format: {timestamp}")
                        
                        return True
                    else:
                        print(f"⚠️ Missing required fields: {missing_fields}")
                        return False
                else:
                    print("⚠️ No audit events found")
                    return True  # This is okay, just means no data
            else:
                print(f"❌ Audit API failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Audit API error: {e}")
            return False
    
    def test_search_functionality(self):
        """Test search functionality"""
        try:
            print("\n🔍 Testing Search Functionality...")
            
            # Test global search
            test_queries = ["admin", "test", "CANCELLED"]
            
            for query in test_queries:
                print(f"  Searching for: '{query}'")
                
                # Test users search (admin only)
                response = self.session.get(f"{self.base_url}/users")
                if response.status_code == 200:
                    users = response.json()
                    matching_users = [u for u in users if query.lower() in u.get('name', '').lower() or query.lower() in u.get('email', '').lower()]
                    print(f"    Users matching '{query}': {len(matching_users)}")
                
                # Test orders search
                response = self.session.get(f"{self.base_url}/orders")
                if response.status_code == 200:
                    orders = response.json()
                    matching_orders = [o for o in orders if query.upper() in o.get('status', '').upper() or str(query) in str(o.get('id', ''))]
                    print(f"    Orders matching '{query}': {len(matching_orders)}")
                
                # Test notifications search
                if self.user_id:
                    response = self.session.get(f"{self.base_url}/notifications/user/{self.user_id}")
                    if response.status_code == 200:
                        notifications = response.json()
                        matching_notifications = [n for n in notifications if query.lower() in n.get('message', '').lower()]
                        print(f"    Notifications matching '{query}': {len(matching_notifications)}")
            
            print("✅ Search functionality tested")
            return True
                
        except Exception as e:
            print(f"❌ Search test error: {e}")
            return False
    
    def run_comprehensive_test(self):
        """Run all API tests that power the frontend"""
        print("🚀 Starting Comprehensive Frontend API Tests\n")
        
        tests = [
            ("Frontend Health", self.test_frontend_health),
            ("Login API", self.login),
            ("Users API", self.test_users_api),
            ("Orders API", self.test_orders_api),
            ("Notifications API", self.test_notifications_api),
            ("Audit Logs API", self.test_audit_api),
            ("Search Functionality", self.test_search_functionality),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ {test_name} crashed: {e}")
                results[test_name] = False
            
            time.sleep(1)  # Brief pause between tests
        
        # Print summary
        print("\n" + "="*60)
        print("📊 COMPREHENSIVE API TEST RESULTS SUMMARY")
        print("="*60)
        
        passed = sum(results.values())
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:.<35} {status}")
        
        print(f"\nOVERALL: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL API TESTS PASSED!")
            print("The frontend should work correctly with these APIs.")
            return True
        else:
            print("⚠️ Some API tests failed")
            print("This may cause issues in the frontend.")
            return False

if __name__ == "__main__":
    print("Frontend API Test Suite")
    print("This tests all the APIs that the frontend depends on")
    print("-" * 60)
    
    tester = MicroservicesAPITest()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n✅ The frontend APIs are working correctly!")
        print("You can now use the web interface with confidence.")
    else:
        print("\n❌ Some frontend APIs have issues.")
        print("Check the failed tests above for details.")
    
    exit(0 if success else 1)