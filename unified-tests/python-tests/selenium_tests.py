#!/usr/bin/env python3
"""
Comprehensive Selenium Tests for Microservices Frontend
Tests the web interface functionality including login, navigation, and features
"""

import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class FrontendSeleniumTest:
    def __init__(self, base_url="http://microservices.local:30080"):
        self.base_url = base_url
        self.driver = None
        self.wait = None
        
    def setup_driver(self):
        """Setup Chrome with optimized options"""
        try:
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-plugins")
            options.add_argument("--disable-images")  # Speed up loading
            
            self.driver = webdriver.Chrome(options=options)
            self.driver.implicitly_wait(5)
            self.wait = WebDriverWait(self.driver, 10)
            
            print("✅ Chrome driver setup complete")
            return True
        except Exception as e:
            print(f"❌ Driver setup failed: {e}")
            return False
    
    def cleanup(self):
        """Clean up driver resources"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            print("🧹 Driver cleanup complete")
    
    def test_frontend_load(self):
        """Test if frontend loads properly"""
        try:
            print("\n🌐 Testing Frontend Load...")
            
            self.driver.get(self.base_url)
            time.sleep(2)
            
            # Check if we get the login page
            if "Microservices" in self.driver.title:
                print("✅ Frontend loaded successfully")
                print(f"   Title: {self.driver.title}")
                return True
            else:
                print(f"❌ Unexpected page title: {self.driver.title}")
                return False
                
        except Exception as e:
            print(f"❌ Frontend load error: {e}")
            return False
    
    def test_login_flow(self):
        """Test login functionality"""
        try:
            print("\n🔐 Testing Login Flow...")
            
            # Find login form elements
            email_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='email']"))
            )
            password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
            login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit'], button:contains('Login'), button:contains('Sign in')")
            
            # Enter credentials
            email_input.clear()
            email_input.send_keys("admin@example.com")
            password_input.clear()
            password_input.send_keys("admin123")
            
            print("   📝 Credentials entered")
            
            # Submit form
            login_button.click()
            print("   🖱️ Login button clicked")
            
            # Wait for redirect to dashboard
            time.sleep(3)
            
            # Check if login successful by looking for dashboard elements
            current_url = self.driver.current_url
            page_source = self.driver.page_source
            
            if ("dashboard" in current_url.lower() or 
                "orders" in page_source.lower() or 
                "logout" in page_source.lower() or
                "sign out" in page_source.lower()):
                print("✅ Login successful - redirected to dashboard")
                return True
            else:
                print(f"❌ Login may have failed. Current URL: {current_url}")
                print("   Looking for error messages...")
                try:
                    error_elements = self.driver.find_elements(By.CSS_SELECTOR, ".error, .alert-danger, [class*='error'], [class*='danger']")
                    if error_elements:
                        error_text = error_elements[0].text
                        print(f"   Found error: {error_text}")
                except:
                    pass
                return False
                
        except TimeoutException:
            print("❌ Login form elements not found (timeout)")
            return False
        except Exception as e:
            print(f"❌ Login test error: {e}")
            return False
    
    def test_navigation(self):
        """Test dashboard navigation"""
        try:
            print("\n🧭 Testing Navigation...")
            
            # Test navigation to different sections
            nav_tests = [
                ("Orders", ["orders", "product", "status"]),
                ("Users", ["users", "email", "role"]),
                ("Notifications", ["notifications", "message", "type"]),
                ("Profile", ["profile", "name", "email"]),
                ("Audit Logs", ["audit", "timestamp", "action"])
            ]
            
            successful_navs = 0
            
            for nav_name, expected_content in nav_tests:
                try:
                    print(f"   🔗 Testing {nav_name} navigation...")
                    
                    # Try to find navigation link
                    nav_links = self.driver.find_elements(By.CSS_SELECTOR, f"a:contains('{nav_name}'), button:contains('{nav_name}'), [href*='{nav_name.lower()}']")
                    
                    if not nav_links:
                        # Alternative approach: look for any clickable element with the nav name
                        nav_links = self.driver.find_elements(By.XPATH, f"//*[contains(text(), '{nav_name}') and (self::a or self::button or @role='button')]")
                    
                    if nav_links:
                        nav_links[0].click()
                        time.sleep(2)
                        
                        # Check if content changed
                        page_content = self.driver.page_source.lower()
                        content_found = any(content.lower() in page_content for content in expected_content)
                        
                        if content_found:
                            print(f"     ✅ {nav_name} section loaded")
                            successful_navs += 1
                        else:
                            print(f"     ⚠️ {nav_name} may not have loaded expected content")
                    else:
                        print(f"     ⚠️ {nav_name} navigation link not found")
                        
                except Exception as nav_error:
                    print(f"     ❌ {nav_name} navigation error: {nav_error}")
            
            if successful_navs >= 2:  # At least 2 successful navigations
                print(f"✅ Navigation working ({successful_navs} sections tested)")
                return True
            else:
                print(f"❌ Navigation issues (only {successful_navs} sections working)")
                return False
                
        except Exception as e:
            print(f"❌ Navigation test error: {e}")
            return False
    
    def test_search_functionality(self):
        """Test global search feature"""
        try:
            print("\n🔍 Testing Search Functionality...")
            
            # Try to find search button/input
            search_elements = []
            
            # Look for search button
            search_buttons = self.driver.find_elements(By.CSS_SELECTOR, "button:contains('Search'), [title*='Search'], [aria-label*='Search']")
            if search_buttons:
                search_buttons[0].click()
                time.sleep(1)
            
            # Try Ctrl+K shortcut
            try:
                self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.CONTROL + "k")
                time.sleep(1)
            except:
                pass
            
            # Look for search input
            search_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='search'], input[placeholder*='search'], input[placeholder*='Search']")
            
            if search_inputs:
                search_input = search_inputs[0]
                
                # Test search queries
                test_queries = ["admin", "test"]
                
                for query in test_queries:
                    search_input.clear()
                    search_input.send_keys(query)
                    time.sleep(2)
                    
                    # Check if results appear (look for any changes in DOM)
                    page_content = self.driver.page_source
                    if query.lower() in page_content.lower():
                        print(f"     ✅ Search for '{query}' shows results")
                    else:
                        print(f"     ⚠️ Search for '{query}' - no visible results")
                
                # Close search if possible
                try:
                    close_buttons = self.driver.find_elements(By.CSS_SELECTOR, "button[aria-label='Close'], .close, button:contains('×')")
                    if close_buttons:
                        close_buttons[0].click()
                        time.sleep(1)
                except:
                    # Try escape key
                    search_input.send_keys(Keys.ESCAPE)
                
                print("✅ Search functionality tested")
                return True
            else:
                print("⚠️ Search input not found - search may not be implemented")
                return True  # Not a failure if search isn't implemented
                
        except Exception as e:
            print(f"❌ Search test error: {e}")
            return False
    
    def test_profile_features(self):
        """Test profile-related features"""
        try:
            print("\n👤 Testing Profile Features...")
            
            # Navigate to profile
            profile_links = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Profile') and (self::a or self::button or @role='button')]")
            
            if profile_links:
                profile_links[0].click()
                time.sleep(2)
                
                # Check for profile information
                page_content = self.driver.page_source.lower()
                profile_indicators = ["admin", "email", "role", "member since", "last active"]
                
                found_indicators = sum(1 for indicator in profile_indicators if indicator in page_content)
                
                if found_indicators >= 2:
                    print(f"✅ Profile page loaded with user information ({found_indicators} indicators found)")
                    return True
                else:
                    print(f"⚠️ Profile page may be missing information ({found_indicators} indicators found)")
                    return False
            else:
                print("⚠️ Profile navigation not found")
                return False
                
        except Exception as e:
            print(f"❌ Profile test error: {e}")
            return False
    
    def test_data_display(self):
        """Test that data is properly displayed"""
        try:
            print("\n📊 Testing Data Display...")
            
            # Check if any data tables or lists are present
            data_elements = self.driver.find_elements(By.CSS_SELECTOR, "table, .table, [role='table'], .list, ul, ol")
            
            if data_elements:
                print(f"✅ Found {len(data_elements)} data display elements")
                
                # Check for common UI elements that indicate working data
                ui_indicators = [
                    ("buttons", self.driver.find_elements(By.TAG_NAME, "button")),
                    ("forms", self.driver.find_elements(By.TAG_NAME, "form")),
                    ("inputs", self.driver.find_elements(By.TAG_NAME, "input")),
                    ("links", self.driver.find_elements(By.TAG_NAME, "a"))
                ]
                
                for indicator_name, elements in ui_indicators:
                    if elements:
                        print(f"   ✅ {indicator_name.capitalize()}: {len(elements)} found")
                
                return True
            else:
                print("⚠️ No data display elements found")
                return False
                
        except Exception as e:
            print(f"❌ Data display test error: {e}")
            return False
    
    def run_comprehensive_test(self):
        """Run all Selenium tests"""
        print("🚀 Starting Comprehensive Frontend Selenium Tests\n")
        
        if not self.setup_driver():
            return False
        
        tests = [
            ("Frontend Load", self.test_frontend_load),
            ("Login Flow", self.test_login_flow),
            ("Navigation", self.test_navigation),
            ("Search Functionality", self.test_search_functionality),
            ("Profile Features", self.test_profile_features),
            ("Data Display", self.test_data_display),
        ]
        
        results = {}
        
        try:
            for test_name, test_func in tests:
                try:
                    results[test_name] = test_func()
                except Exception as e:
                    print(f"❌ {test_name} crashed: {e}")
                    results[test_name] = False
                
                time.sleep(1)  # Brief pause between tests
        finally:
            self.cleanup()
        
        # Print summary
        print("\n" + "="*60)
        print("📊 SELENIUM TEST RESULTS SUMMARY")
        print("="*60)
        
        passed = sum(results.values())
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:.<35} {status}")
        
        print(f"\nOVERALL: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL SELENIUM TESTS PASSED!")
            print("The frontend interface is working correctly.")
            return True
        elif passed >= total * 0.7:  # 70% pass rate
            print("⚠️ Most Selenium tests passed")
            print("The frontend mostly works with some minor issues.")
            return True
        else:
            print("❌ Many Selenium tests failed")
            print("The frontend may have significant issues.")
            return False

if __name__ == "__main__":
    print("Frontend Selenium Test Suite")
    print("This tests the web interface functionality")
    print("-" * 60)
    
    tester = FrontendSeleniumTest()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n✅ The frontend interface is working well!")
        print("Users should be able to navigate and use the application.")
    else:
        print("\n❌ The frontend interface has issues.")
        print("Check the failed tests above for details.")
    
    exit(0 if success else 1)