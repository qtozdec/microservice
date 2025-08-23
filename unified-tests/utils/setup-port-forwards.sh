#!/bin/bash
# Setup port forwards for all microservices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up port forwards for microservices...${NC}"

# Kill existing port forwards
echo -e "${YELLOW}Killing existing port forwards...${NC}"
pkill -f "kubectl port-forward" || true
sleep 2

# Create background port forwards
echo -e "${GREEN}Starting port forwards:${NC}"

echo "  - User Service (8081)"
kubectl port-forward deployment/user-service 8081:8081 -n microservices > /dev/null 2>&1 &
USER_PF_PID=$!

echo "  - Audit Service (8085)"
kubectl port-forward deployment/audit-service 8085:8085 -n microservices > /dev/null 2>&1 &
AUDIT_PF_PID=$!

echo "  - Order Service (8082)"
kubectl port-forward deployment/order-service 8082:8082 -n microservices > /dev/null 2>&1 &
ORDER_PF_PID=$!

echo "  - Inventory Service (8083)"
kubectl port-forward deployment/inventory-service 8083:8083 -n microservices > /dev/null 2>&1 &
INVENTORY_PF_PID=$!

echo "  - Notification Service (8084)"
kubectl port-forward deployment/notification-service 8084:8084 -n microservices > /dev/null 2>&1 &
NOTIFICATION_PF_PID=$!

# Wait for port forwards to be ready
echo -e "${YELLOW}Waiting for port forwards to be ready...${NC}"
sleep 5

# Test connectivity
echo -e "${GREEN}Testing connectivity:${NC}"

test_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    
    if curl -s --max-time 5 "http://localhost:${port}${endpoint}" > /dev/null; then
        echo -e "  ✅ ${service_name} (port ${port})"
        return 0
    else
        echo -e "  ❌ ${service_name} (port ${port})"
        return 1
    fi
}

# Test all services
FAILURES=0
test_service "User Service" 8081 "/health" || ((FAILURES++))
test_service "Order Service" 8082 "/health" || ((FAILURES++))
test_service "Inventory Service" 8083 "/health" || ((FAILURES++))
test_service "Notification Service" 8084 "/health" || ((FAILURES++))
test_service "Audit Service" 8085 "/health" || ((FAILURES++))

# Save PIDs for cleanup
echo "USER_PF_PID=${USER_PF_PID}" > .port-forward-pids
echo "ORDER_PF_PID=${ORDER_PF_PID}" >> .port-forward-pids
echo "INVENTORY_PF_PID=${INVENTORY_PF_PID}" >> .port-forward-pids
echo "NOTIFICATION_PF_PID=${NOTIFICATION_PF_PID}" >> .port-forward-pids
echo "AUDIT_PF_PID=${AUDIT_PF_PID}" >> .port-forward-pids

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All services are ready for testing!${NC}"
    echo -e "${BLUE}Port forward PIDs saved to .port-forward-pids${NC}"
    echo -e "${BLUE}Use 'kill \$(cat .port-forward-pids | cut -d= -f2)' to stop all port forwards${NC}"
else
    echo -e "${RED}❌ Some services failed connectivity test. Check logs and try again.${NC}"
    exit 1
fi