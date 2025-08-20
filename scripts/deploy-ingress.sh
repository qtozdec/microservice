#!/bin/bash

set -e

echo "🌐 Deploying NGINX Ingress Controller and Routes..."

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

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

print_header "NGINX INGRESS CONTROLLER"

print_status "Deploying NGINX Ingress Controller..."
kubectl apply -f ../platform-infrastructure/networking/ingress/nginx-ingress-controller.yaml

print_status "Waiting for NGINX Ingress Controller to be ready..."
kubectl wait --for=condition=available deployment/ingress-nginx-controller -n ingress-nginx --timeout=300s
print_success "NGINX Ingress Controller deployed and ready"

print_header "FRONTEND DEPLOYMENT"

print_status "Deploying Frontend application..."
kubectl apply -f ../k8s/microservices/frontend.yaml

print_status "Waiting for Frontend to be ready..."
kubectl wait --for=condition=available deployment/frontend -n microservices --timeout=300s
print_success "Frontend deployed and ready"

print_header "INGRESS ROUTING RULES"

print_status "Deploying microservices ingress rules..."
kubectl apply -f ../platform-infrastructure/networking/ingress/microservices-ingress.yaml
print_success "Microservices ingress rules deployed"

print_status "Deploying monitoring ingress rules..."
kubectl apply -f ../platform-infrastructure/networking/ingress/monitoring-ingress.yaml
print_success "Monitoring ingress rules deployed"

print_header "ACCESS INFORMATION"

# Get ingress IP
INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
if [ -z "$INGRESS_IP" ]; then
    INGRESS_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    INGRESS_PORT=":30080"
else
    INGRESS_PORT=""
fi

print_success "🎉 Ingress deployed successfully!"
echo ""

print_warning "Add these entries to your /etc/hosts file:"
echo "$INGRESS_IP microservices.local"
echo "$INGRESS_IP grafana.local"
echo "$INGRESS_IP prometheus.local"
echo "$INGRESS_IP kibana.local"
echo "$INGRESS_IP gitlab.local"
echo "$INGRESS_IP nexus.local"
echo "$INGRESS_IP argocd.local"
echo ""

print_status "🌐 Access URLs:"
echo "📱 Frontend Application: http://microservices.local${INGRESS_PORT}"
echo "📊 Grafana Dashboard:   http://grafana.local${INGRESS_PORT}"
echo "🔍 Prometheus Metrics:  http://prometheus.local${INGRESS_PORT}"
echo "📝 Kibana Logs:         http://kibana.local${INGRESS_PORT}"
echo "🦊 GitLab:              http://gitlab.local${INGRESS_PORT}"
echo "📦 Nexus Repository:    http://nexus.local${INGRESS_PORT}"
echo "🚀 ArgoCD:              http://argocd.local${INGRESS_PORT}"
echo ""

print_status "🔗 API Endpoints (via ingress):"
echo "👤 User API:            http://microservices.local${INGRESS_PORT}/api/users"
echo "📋 Order API:           http://microservices.local${INGRESS_PORT}/api/orders"
echo "🔔 Notification API:    http://microservices.local${INGRESS_PORT}/api/notifications"
echo "🔐 Auth API:            http://microservices.local${INGRESS_PORT}/api/auth"
echo ""

print_header "TESTING INGRESS"

print_status "Testing frontend accessibility..."
if curl -s -o /dev/null -w "%{http_code}" "http://${INGRESS_IP}${INGRESS_PORT}" | grep -q "200"; then
    print_success "✅ Frontend is accessible via ingress"
else
    print_warning "⚠️  Frontend may not be ready yet. Wait a few minutes and try again."
fi

print_status "Testing API endpoints..."
for endpoint in "/api/users" "/api/orders" "/api/notifications"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${INGRESS_IP}${INGRESS_PORT}${endpoint}" || echo "000")
    if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" || "$HTTP_CODE" == "200" ]]; then
        print_success "✅ ${endpoint} is accessible (HTTP $HTTP_CODE)"
    else
        print_warning "⚠️  ${endpoint} returned HTTP $HTTP_CODE"
    fi
done

print_header "DEPLOYMENT COMPLETE"

print_success "🎉 Frontend and Ingress deployment completed!"
print_status "The microservices platform is now accessible via web browser"
print_warning "Make sure to update your /etc/hosts file with the IP addresses shown above"