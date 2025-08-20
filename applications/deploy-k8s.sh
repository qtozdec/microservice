#!/bin/bash

set -e

echo "🚀 Deploying Microservices to Kubernetes"
echo "========================================"

# Color codes for output
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

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

print_status "Deploying Namespaces..."
kubectl apply -f ../platform-infrastructure/namespaces/namespaces.yaml
print_success "Namespaces created"

print_status "Deploying PostgreSQL..."
kubectl apply -f ../platform-infrastructure/databases/postgres/
print_status "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n devops --timeout=300s
print_success "PostgreSQL deployed"

print_status "Deploying Redis..."
kubectl apply -f ../platform-infrastructure/caching/redis.yaml
print_status "Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n devops --timeout=120s
print_success "Redis deployed"

print_status "Deploying Kafka and Zookeeper..."
kubectl apply -f ../platform-infrastructure/messaging/kafka.yaml
print_status "Waiting for Zookeeper to be ready..."
kubectl wait --for=condition=ready pod -l app=zookeeper -n devops --timeout=180s
print_status "Waiting for Kafka to be ready..."
kubectl wait --for=condition=ready pod -l app=kafka -n devops --timeout=300s
print_success "Kafka and Zookeeper deployed"

print_status "Deploying Microservices Configuration..."
kubectl apply -f k8s/microservices/configmap.yaml
kubectl apply -f k8s/microservices/secrets.yaml
print_success "Microservices configuration deployed"

print_status "Deploying Microservices..."
kubectl apply -f k8s/microservices/user-service.yaml
kubectl apply -f k8s/microservices/order-service.yaml
kubectl apply -f k8s/microservices/notification-service.yaml
kubectl apply -f k8s/microservices/inventory-service.yaml
kubectl apply -f k8s/microservices/audit-service.yaml

print_status "Waiting for microservices to be ready..."
kubectl wait --for=condition=available deployment/user-service -n microservices --timeout=300s
kubectl wait --for=condition=available deployment/order-service -n microservices --timeout=300s
kubectl wait --for=condition=available deployment/notification-service -n microservices --timeout=300s
kubectl wait --for=condition=available deployment/inventory-service -n microservices --timeout=300s
kubectl wait --for=condition=available deployment/audit-service -n microservices --timeout=300s

print_success "All microservices deployed successfully!"

echo ""
print_status "Deployment Status:"
echo ""
echo "Infrastructure (devops namespace):"
kubectl get pods -n devops
echo ""
echo "Microservices (microservices namespace):"
kubectl get pods -n microservices
echo ""
echo "Services:"
kubectl get svc -n microservices
echo ""

print_status "Access Information:"
echo "To access services locally, use kubectl port-forward:"
echo "  User Service:    kubectl port-forward svc/user-service 8081:8081 -n microservices"
echo "  Order Service:   kubectl port-forward svc/order-service 8082:8082 -n microservices"
echo "  Notification:    kubectl port-forward svc/notification-service 8083:8083 -n microservices"
echo "  Inventory:       kubectl port-forward svc/inventory-service 8084:8084 -n microservices"
echo "  Audit:           kubectl port-forward svc/audit-service 8085:8085 -n microservices"
echo ""

print_success "Microservices Platform deployed to Kubernetes! 🎉"