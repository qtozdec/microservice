# Python Test Suite for Microservices Platform

This directory contains comprehensive Python tests for the microservices platform.

## Test Overview

### 🚀 Quick Start
```bash
# Run all tests
./run_all_tests.py

# Run individual test suites
./api_tests.py           # Backend API tests
./selenium_tests.py      # Web interface tests
./audit_tests.py         # Audit system tests  
./websocket_tests.py     # WebSocket connectivity tests
```

## Test Suites

### 1. API Tests (`api_tests.py`)
Tests all backend APIs that power the frontend:
- **Authentication**: Login, JWT token validation
- **Users API**: User management, profile data
- **Orders API**: Order management, status updates
- **Notifications API**: Notification retrieval and creation
- **Audit API**: Audit log access and event creation
- **Search**: Search functionality across all data types

**What it validates:**
- API endpoints are accessible
- Authentication works correctly
- Data structures are correct
- CRUD operations function properly

### 2. Selenium Tests (`selenium_tests.py`)
Tests the web interface using browser automation:
- **Frontend Loading**: Page loads and renders correctly
- **Login Flow**: Login form and authentication
- **Navigation**: Dashboard navigation between sections
- **Search UI**: Global search functionality
- **Profile**: User profile features
- **Data Display**: Tables, lists, and UI elements

**What it validates:**
- Web interface is accessible
- User interactions work correctly
- Data is displayed properly
- Navigation functions smoothly

### 3. Audit Tests (`audit_tests.py`)
Tests the audit logging system:
- **API Operations**: Audit event creation and retrieval
- **Filtering**: Event filtering by service, action, result
- **Search**: Audit event search capabilities
- **Frontend Display**: Audit logs shown in web interface
- **Event Generation**: New events created on actions

**What it validates:**
- Audit events are logged correctly
- Audit data is accessible via API
- Frontend displays audit information
- Search and filtering work

### 4. WebSocket Tests (`websocket_tests.py`)
Tests real-time WebSocket connectivity:
- **Endpoint Availability**: WebSocket endpoints exist
- **Connection Attempts**: Browser tries to connect
- **Error Detection**: 403 Forbidden and other errors
- **Console Logging**: JavaScript errors in browser

**What it validates:**
- WebSocket endpoints are configured
- Connection errors are identified
- Authentication issues are detected

## Prerequisites

### Required Software
```bash
# Python packages
pip3 install requests selenium

# Chrome browser and ChromeDriver
# Ubuntu/Debian:
sudo apt-get install google-chrome-stable chromium-chromedriver

# Or manually install ChromeDriver from:
# https://chromedriver.chromium.org/
```

### System Requirements
- Python 3.6+
- Chrome/Chromium browser
- ChromeDriver in PATH
- Network access to microservices.local:30080

## Usage Examples

### Run All Tests
```bash
./run_all_tests.py
```
- Runs all 4 test suites in sequence
- Provides comprehensive platform validation
- Takes 5-10 minutes to complete
- Shows detailed results and recommendations

### Run Specific Test Suite
```bash
# Quick API validation
./api_tests.py

# UI functionality check
./selenium_tests.py

# Audit system verification
./audit_tests.py

# WebSocket diagnostics
./websocket_tests.py
```

### Continuous Integration
```bash
# Use in CI/CD pipelines
if ./run_all_tests.py; then
    echo "All tests passed - deployment ready"
else
    echo "Tests failed - fix issues before deployment"
    exit 1
fi
```

## Test Results

### Success Indicators
- **✅ PASSED**: Test completed successfully
- **⚠️ PARTIAL**: Some issues but core functionality works
- **❌ FAILED**: Significant problems detected

### Common Issues and Solutions

#### API Tests Failing
- **Check services**: Ensure all microservices are running
- **Verify URLs**: Confirm microservices.local:30080 is accessible
- **Database**: Check database connections and data

#### Selenium Tests Failing  
- **Chrome**: Verify Chrome and ChromeDriver are installed
- **Frontend**: Ensure frontend is built and deployed
- **Network**: Check browser can access the application

#### Audit Tests Failing
- **Audit Service**: Verify audit service is running
- **Database**: Check audit database tables exist
- **Permissions**: Ensure audit endpoints are accessible

#### WebSocket Tests Failing
- **Normal**: WebSocket issues are common and often non-critical
- **Authentication**: WebSocket authentication may not be configured
- **Service**: Check if notification service supports WebSocket

## Output Interpretation

### Test Suite Summary
```
📊 COMPREHENSIVE TEST RESULTS SUMMARY
====================================
⏱️ Total execution time: 180.5 seconds
📊 Overall results: 3/4 test suites passed

API Tests..................................... ✅ PASSED
Selenium Tests................................ ✅ PASSED  
Audit Tests................................... ✅ PASSED
WebSocket Tests............................... ❌ FAILED
```

### Individual Test Details
Each test suite provides:
- Step-by-step execution logs
- Detailed error messages
- Data validation results
- Performance metrics
- Specific recommendations

## File Organization

```
python-tests/
├── README.md              # This documentation
├── run_all_tests.py       # Main test runner
├── api_tests.py           # Backend API tests
├── selenium_tests.py      # Web interface tests  
├── audit_tests.py         # Audit system tests
└── websocket_tests.py     # WebSocket tests
```

## Integration with Main Test Suite

These Python tests complement the existing JavaScript tests:
- **JavaScript tests** (`unified-tests/`): Unit and integration tests
- **Python tests** (`unified-tests/python-tests/`): End-to-end and system tests

Run both for comprehensive validation:
```bash
# JavaScript tests
cd unified-tests && npm test

# Python tests  
cd unified-tests/python-tests && ./run_all_tests.py
```

## Maintenance

### Adding New Tests
1. Add test methods to appropriate test class
2. Update test list in `run_comprehensive_test()`
3. Document new functionality in this README

### Updating Tests
- Keep tests synchronized with API changes
- Update selectors when UI changes
- Adjust timeouts for performance variations

### Troubleshooting
- Check logs for detailed error information
- Verify prerequisites are installed
- Test individual components first
- Use verbose output for debugging

---

**Note**: These tests are designed to validate the complete microservices platform functionality. They provide confidence that all components are working together correctly and users will have a good experience.