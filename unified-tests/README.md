# Unified Microservices Testing Suite

Comprehensive testing suite for the microservices platform covering API testing, integration testing, performance testing, and end-to-end testing.

## Structure

```
unified-tests/
├── api/                    # API endpoint tests (formerly api-tests/tests/)
├── integration/           # Inter-service integration tests 
├── performance/           # Load and performance tests (K6)
├── e2e/                   # End-to-end workflow tests
├── helpers/               # Test helper utilities
├── utils/                 # Shell scripts and utilities
├── config/                # Test configuration files
├── data/                  # Test data and fixtures
└── scripts/               # Setup and maintenance scripts
```

## Test Types

### 1. API Tests (`npm run test:api`)
- Individual microservice REST API testing
- Authentication and authorization
- Input validation and error handling
- CORS and security headers

### 2. Integration Tests (`npm run test:integration`)
- Cross-service communication
- Database interactions
- Message queue integration
- WebSocket connections

### 3. Performance Tests (`npm run test:performance`)
- Load testing with K6
- Stress testing
- Concurrency testing
- Resource utilization monitoring

### 4. End-to-End Tests (`npm run test:e2e`)
- Complete user workflows
- Business process validation
- Full system integration

## Available Scripts

```bash
# Run all tests
npm test

# Run specific test types
npm run test:api              # API tests only
npm run test:integration      # Integration tests only
npm run test:e2e             # End-to-end tests only
npm run test:performance     # Performance tests with K6

# Run tests for specific services
npm run test:user            # User service tests
npm run test:order           # Order service tests
npm run test:inventory       # Inventory service tests
npm run test:notification    # Notification service tests
npm run test:audit           # Audit service tests

# Development and debugging
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage report

# Environment-specific tests
npm run test:staging         # Staging environment
npm run test:production      # Production environment

# Utilities
npm run setup                # Setup test environment
npm run cleanup              # Cleanup test data
```

## Configuration

- **Environment Variables**: Configure in `.env` file
- **Jest Configuration**: `jest.config.js`
- **TypeScript Configuration**: `tsconfig.json`
- **Test Setup**: `config/jest.setup.js`

## Prerequisites

Before running tests, ensure:

1. All microservices are running
2. Database and Redis are accessible
3. Environment variables are configured
4. Test data is seeded (if required)

## Running Tests

```bash
# Install dependencies
npm install

# Setup environment
npm run setup

# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Clean up test data after each test
3. **Environment**: Use separate test environment/database
4. **Mocking**: Mock external dependencies appropriately
5. **Assertions**: Use meaningful assertions with clear error messages