#!/bin/bash
# Final simplified API tests

echo "🚀 Microservices Platform - API Tests"
echo "===================================="
echo

# Test User Service
echo "👤 User Service Tests:"
echo -n "  Health check: "
if curl -s --max-time 5 "http://localhost:8081/health" | grep -q '"status":"UP"'; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
fi

echo -n "  User registration: "
timestamp=$(date +%s)
email="test-${timestamp}@example.com"
if curl -s --max-time 10 \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"name": "Test User", "email": "'$email'", "password": "testpass123"}' \
    "http://localhost:8081/auth/register" | grep -q '"token"'; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
fi

echo

# Test Audit Service  
echo "📊 Audit Service Tests:"
echo -n "  Health check: "
if curl -s --max-time 5 "http://localhost:8085/health" | grep -q '"status":"UP"'; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
fi

echo -n "  Get audit events: "
if curl -s --max-time 5 "http://localhost:8085/audit" | grep -q '"content"'; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
fi

echo

# Check other services availability
echo "🔗 Other Services:"
echo -n "  Inventory service: "
if curl -s --max-time 3 "http://localhost:8083/health" > /dev/null 2>&1; then
    echo "✅ ACCESSIBLE"
else
    echo "⚠️  NOT ACCESSIBLE"
fi

echo -n "  Notification service: "
if curl -s --max-time 3 "http://localhost:8084/health" > /dev/null 2>&1; then
    echo "✅ ACCESSIBLE" 
else
    echo "⚠️  NOT ACCESSIBLE"
fi

echo
echo "🎉 Basic API tests completed!"
echo
echo "📝 Test Suite Ready!"
echo "The api-tests folder contains:"
echo "  • setup-port-forwards.sh - Setup all port forwards"
echo "  • minimal-test.sh - Quick user service test"
echo "  • minimal-audit-test.sh - Quick audit service test"  
echo "  • final-test.sh - Complete basic tests"
echo "  • test-data/ - Sample test data"
echo "  • .env.example - Configuration template"