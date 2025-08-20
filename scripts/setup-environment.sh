#!/bin/bash

set -e

echo "🔧 Setting up Microservices Platform Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}==================== $1 ====================${NC}"
}

print_header "ENVIRONMENT SETUP"

# Check if .env file exists
if [ ! -f "../.env" ]; then
    print_status "Creating .env file from template..."
    cp ../.env.example ../.env
    print_warning "Please edit .env file with your actual values!"
    echo ""
else
    print_success ".env file already exists"
fi

# Setup service-specific environment files
print_status "Setting up service-specific environment files..."

# User Service
if [ ! -f "../applications/user-service/.env" ]; then
    if [ -f "../applications/user-service/.env.example" ]; then
        cp ../applications/user-service/.env.example ../applications/user-service/.env
        print_status "Created user-service/.env from template"
    fi
else
    print_success "user-service/.env already exists"
fi

# Order Service
if [ ! -f "../applications/order-service/.env" ]; then
    if [ -f "../applications/order-service/.env.example" ]; then
        cp ../applications/order-service/.env.example ../applications/order-service/.env
        print_status "Created order-service/.env from template"
    fi
else
    print_success "order-service/.env already exists"
fi

# Notification Service
if [ ! -f "../applications/notification-service/.env" ]; then
    if [ -f "../applications/notification-service/.env.example" ]; then
        cp ../applications/notification-service/.env.example ../applications/notification-service/.env
        print_status "Created notification-service/.env from template"
    fi
else
    print_success "notification-service/.env already exists"
fi

print_header "SECURITY REMINDERS"

print_warning "IMPORTANT: You must update the following before deploying:"
echo ""
echo "1. Root .env file with your actual database/Redis/JWT credentials"
echo "2. Service-specific .env files in applications/*/." 
echo "3. Kubernetes secrets in k8s/secrets/ with base64 encoded values"
echo ""

print_status "To encode values for Kubernetes secrets:"
echo "  echo -n 'your_actual_value' | base64"
echo ""

print_status "Key files to update:"
echo "  - .env (root configuration)"
echo "  - applications/user-service/.env"
echo "  - applications/order-service/.env"
echo "  - applications/notification-service/.env"
echo "  - k8s/secrets/postgres-secret.yaml"
echo "  - k8s/secrets/redis-secret.yaml"
echo "  - k8s/secrets/microservices-secret.yaml"
echo ""

print_header "DEPLOYMENT OPTIONS"

echo "After updating environment variables, you can deploy using:"
echo ""
echo "📦 Local Development:"
echo "  cd applications/ && docker-compose up -d"
echo ""
echo "☸️  Kubernetes (Full Platform):"
echo "  cd scripts/ && ./deploy-all.sh"
echo ""
echo "☸️  Kubernetes (Just Microservices):"
echo "  cd scripts/ && ./deploy-k8s.sh"
echo ""
echo "🔐 Kubernetes Secrets Only:"
echo "  cd scripts/ && ./deploy-secrets.sh"
echo ""

print_success "Environment setup completed!"
print_warning "Remember to update all configuration files with your actual values before deploying!"