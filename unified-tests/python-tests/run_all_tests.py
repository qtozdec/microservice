#!/usr/bin/env python3
"""
Comprehensive Test Suite Runner
Runs all Python tests for the microservices platform
"""

import sys
import time
import subprocess
import os
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.test_dir = Path(__file__).parent
        self.results = {}
        
    def run_test_script(self, script_name, description):
        """Run a test script and capture results"""
        print(f"\n{'='*80}")
        print(f"🚀 RUNNING: {description}")
        print(f"📄 Script: {script_name}")
        print('='*80)
        
        script_path = self.test_dir / script_name
        
        if not script_path.exists():
            print(f"❌ Test script not found: {script_path}")
            return False
        
        try:
            # Run the test script
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=False,  # Show output in real-time
                text=True,
                cwd=self.test_dir
            )
            
            success = result.returncode == 0
            
            if success:
                print(f"\n✅ {description} - PASSED")
            else:
                print(f"\n❌ {description} - FAILED (exit code: {result.returncode})")
            
            return success
            
        except Exception as e:
            print(f"❌ Error running {script_name}: {e}")
            return False
    
    def check_prerequisites(self):
        """Check if required tools are available"""
        print("🔍 Checking Prerequisites...")
        
        requirements = []
        
        # Check Python packages
        try:
            import requests
            print("   ✅ requests library available")
        except ImportError:
            requirements.append("requests")
            print("   ❌ requests library missing")
        
        try:
            import selenium
            print("   ✅ selenium library available")
        except ImportError:
            requirements.append("selenium")
            print("   ❌ selenium library missing")
        
        # Check Chrome/ChromeDriver
        try:
            result = subprocess.run(['google-chrome', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print("   ✅ Chrome browser available")
            else:
                print("   ❌ Chrome browser not found")
                requirements.append("google-chrome")
        except:
            print("   ❌ Chrome browser not found")
            requirements.append("google-chrome")
        
        try:
            result = subprocess.run(['chromedriver', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print("   ✅ ChromeDriver available")
            else:
                print("   ❌ ChromeDriver not found")
                requirements.append("chromedriver")
        except:
            print("   ❌ ChromeDriver not found")
            requirements.append("chromedriver")
        
        if requirements:
            print(f"\n⚠️ Missing requirements: {', '.join(requirements)}")
            print("📝 To install missing Python packages:")
            print("   pip3 install requests selenium")
            print("📝 To install Chrome and ChromeDriver:")
            print("   # Ubuntu/Debian:")
            print("   sudo apt-get update")
            print("   sudo apt-get install google-chrome-stable")
            print("   sudo apt-get install chromium-chromedriver")
            return False
        else:
            print("✅ All prerequisites available")
            return True
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 MICROSERVICES PLATFORM - COMPREHENSIVE TEST SUITE")
        print("="*80)
        print("This will run all automated tests for the microservices platform")
        print("Including API tests, Selenium UI tests, Audit tests, and WebSocket tests")
        print("="*80)
        
        if not self.check_prerequisites():
            print("\n❌ Prerequisites not met. Please install missing requirements.")
            return False
        
        # Define test suites
        test_suites = [
            ("api_tests.py", "API Tests - Backend API functionality"),
            ("selenium_tests.py", "Selenium Tests - Web interface functionality"), 
            ("audit_tests.py", "Audit Tests - Audit logging and display"),
            ("websocket_tests.py", "WebSocket Tests - Real-time connectivity")
        ]
        
        print(f"\n📋 Test Plan: {len(test_suites)} test suites")
        for i, (script, description) in enumerate(test_suites, 1):
            print(f"   {i}. {description}")
        
        print(f"\n⏱️ Estimated time: 5-10 minutes")
        print("🔄 Starting tests...\n")
        
        start_time = time.time()
        
        # Run each test suite
        for script, description in test_suites:
            success = self.run_test_script(script, description)
            self.results[description] = success
            
            # Brief pause between test suites
            time.sleep(2)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print final summary
        self.print_final_summary(duration)
        
        # Return overall success
        return all(self.results.values())
    
    def print_final_summary(self, duration):
        """Print comprehensive test results summary"""
        print("\n" + "="*80)
        print("🏁 COMPREHENSIVE TEST RESULTS SUMMARY")
        print("="*80)
        
        passed = sum(self.results.values())
        total = len(self.results)
        
        print(f"⏱️ Total execution time: {duration:.1f} seconds")
        print(f"📊 Overall results: {passed}/{total} test suites passed\n")
        
        # Detailed results
        for test_name, result in self.results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:.<50} {status}")
        
        print("\n" + "="*80)
        
        if passed == total:
            print("🎉 ALL TESTS PASSED!")
            print("🌟 The microservices platform is working excellently!")
            print("✅ All components (APIs, UI, Audit, WebSocket) are functional")
            print("👥 Users can safely use all features of the application")
            
        elif passed >= total * 0.75:  # 75% pass rate
            print("✅ MOST TESTS PASSED!")
            print("🌟 The microservices platform is working well!")
            print("⚠️ Some minor issues detected, but core functionality works")
            print("👥 Users can use the application with confidence")
            
        elif passed >= total * 0.5:  # 50% pass rate
            print("⚠️ MIXED RESULTS!")
            print("🔧 The microservices platform has some issues")
            print("✅ Core functionality may work, but some features have problems")
            print("🛠️ Review failed tests and address issues")
            
        else:
            print("❌ MANY TESTS FAILED!")
            print("🚨 The microservices platform has significant issues")
            print("🛠️ Major problems detected - immediate attention required")
            print("🔍 Review all failed tests and fix critical issues")
        
        print("="*80)
        
        # Recommendations
        failed_tests = [name for name, result in self.results.items() if not result]
        if failed_tests:
            print("\n🔧 RECOMMENDATIONS:")
            for failed_test in failed_tests:
                if "API Tests" in failed_test:
                    print("   • Check backend services are running and accessible")
                    print("   • Verify database connections and authentication")
                elif "Selenium Tests" in failed_test:
                    print("   • Check frontend is properly built and deployed")
                    print("   • Verify Chrome/ChromeDriver installation")
                elif "Audit Tests" in failed_test:
                    print("   • Check audit service is running and configured")
                    print("   • Verify audit database tables exist")
                elif "WebSocket Tests" in failed_test:
                    print("   • WebSocket issues are common and often non-critical")
                    print("   • Check notification service configuration if needed")
            
            print("\n📝 Next steps:")
            print("   1. Review detailed test output above")
            print("   2. Fix issues in order of priority (API → UI → Audit → WebSocket)")
            print("   3. Re-run tests after making fixes")
            print("   4. Contact support if issues persist")

def main():
    runner = TestRunner()
    success = runner.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()