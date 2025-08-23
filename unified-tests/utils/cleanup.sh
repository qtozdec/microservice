#!/bin/bash
# Cleanup script for API tests

echo "🧹 Cleaning up API test environment..."

# Kill port forwards
echo "Stopping port forwards..."
pkill -f "kubectl port-forward" || true

# Clean up test files
echo "Cleaning temporary files..."
rm -f .port-forward-pids
rm -f test_avatar.txt
rm -f *.tmp

# Clean up test results if they exist  
if [ -d "results" ]; then
    echo "Cleaning test results..."
    rm -rf results/*
fi

echo "✅ Cleanup completed!"
echo
echo "To restart tests:"
echo "  1. ./setup-port-forwards.sh"
echo "  2. ./final-test.sh"