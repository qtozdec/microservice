#!/bin/bash

# Microservices API Tests Runner
# This script runs comprehensive API tests for all microservices

set -e

echo "🚀 Starting API Tests for Microservices Platform"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local service_url=$1
    local service_name=$2
    
    echo -n "Checking $service_name... "
    if curl -s "$service_url/actuator/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

# Function to wait for a service to be available
wait_for_service() {
    local service_url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name to be available..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$service_url/actuator/health" > /dev/null 2>&1; then
            echo -e "${GREEN}$service_name is available!${NC}"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts - $service_name not ready, waiting 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}$service_name is not available after $max_attempts attempts${NC}"
    return 1
}

# Load environment variables
if [ -f config/.env ]; then
    export $(cat config/.env | xargs)
    echo "✓ Environment variables loaded from config/.env"
else
    echo -e "${YELLOW}Warning: config/.env not found, using defaults${NC}"
fi

# Default service URLs if not set
USER_SERVICE_URL=${USER_SERVICE_URL:-http://localhost:8081}
AUDIT_SERVICE_URL=${AUDIT_SERVICE_URL:-http://localhost:8082}
INVENTORY_SERVICE_URL=${INVENTORY_SERVICE_URL:-http://localhost:8083}
NOTIFICATION_SERVICE_URL=${NOTIFICATION_SERVICE_URL:-http://localhost:8084}
ORDER_SERVICE_URL=${ORDER_SERVICE_URL:-http://localhost:8085}

echo
echo "🔍 Checking service availability..."
echo "=================================="

# Check all services
services_available=true

if ! check_service "$USER_SERVICE_URL" "User Service"; then
    services_available=false
fi

if ! check_service "$AUDIT_SERVICE_URL" "Audit Service"; then
    services_available=false
fi

if ! check_service "$INVENTORY_SERVICE_URL" "Inventory Service"; then
    services_available=false
fi

if ! check_service "$NOTIFICATION_SERVICE_URL" "Notification Service"; then
    services_available=false
fi

if ! check_service "$ORDER_SERVICE_URL" "Order Service"; then
    services_available=false
fi

# If services are not available, try to wait for them
if [ "$services_available" = false ]; then
    echo
    echo -e "${YELLOW}Some services are not available. Waiting for them to start...${NC}"
    
    # Wait for critical services
    wait_for_service "$USER_SERVICE_URL" "User Service" || true
    wait_for_service "$AUDIT_SERVICE_URL" "Audit Service" || true
    wait_for_service "$INVENTORY_SERVICE_URL" "Inventory Service" || true
    wait_for_service "$NOTIFICATION_SERVICE_URL" "Notification Service" || true
    wait_for_service "$ORDER_SERVICE_URL" "Order Service" || true
fi

echo
echo "📦 Installing dependencies..."
echo "============================"

if [ ! -d node_modules ]; then
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo
echo "🧪 Running API Tests..."
echo "======================"

# Parse command line arguments
TEST_FILTER=""
VERBOSE=false
COVERAGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --filter)
            TEST_FILTER="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --user)
            TEST_FILTER="User Service"
            shift
            ;;
        --audit)
            TEST_FILTER="Audit Service"
            shift
            ;;
        --inventory)
            TEST_FILTER="Inventory Service"
            shift
            ;;
        --notification)
            TEST_FILTER="Notification Service"
            shift
            ;;
        --order)
            TEST_FILTER="Order Service"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --filter <pattern>   Run only tests matching pattern"
            echo "  --verbose           Run tests in verbose mode"
            echo "  --coverage          Generate test coverage report"
            echo "  --user              Run only User Service tests"
            echo "  --audit             Run only Audit Service tests"
            echo "  --inventory         Run only Inventory Service tests"
            echo "  --notification      Run only Notification Service tests"
            echo "  --order             Run only Order Service tests"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Build Jest command
JEST_CMD="npx jest"

if [ "$VERBOSE" = true ]; then
    JEST_CMD="$JEST_CMD --verbose"
fi

if [ "$COVERAGE" = true ]; then
    JEST_CMD="$JEST_CMD --coverage"
fi

if [ ! -z "$TEST_FILTER" ]; then
    JEST_CMD="$JEST_CMD --testNamePattern=\"$TEST_FILTER\""
fi

# Run tests
echo "Running command: $JEST_CMD"
echo

if eval $JEST_CMD; then
    echo
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    echo "================================="
    
    # Test summary
    echo
    echo "📊 Test Summary:"
    echo "• User Service API: Authentication, User Management, Profiles, Avatars"
    echo "• Audit Service API: Event Logging, Filtering, Statistics, Compliance"
    echo "• Inventory Service API: Product Management, Stock Control, Analytics"
    echo "• Notification Service API: Creation, Retrieval, Status Management"
    echo "• Order Service API: Order Lifecycle, Status Updates, Authentication"
    
    exit 0
else
    echo
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo "===================="
    echo
    echo "Tips for troubleshooting:"
    echo "• Check if all services are running and accessible"
    echo "• Verify database connections and migrations"
    echo "• Check service logs for errors"
    echo "• Ensure test data is properly set up"
    echo
    echo "Run individual service tests:"
    echo "• npm run test:user"
    echo "• npm run test:audit"
    echo "• npm run test:inventory"
    echo "• npm run test:notification"
    echo "• npm run test:order"
    
    exit 1
fi