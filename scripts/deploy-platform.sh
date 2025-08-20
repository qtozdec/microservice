#!/bin/bash

echo "🚀 Deploying Complete Microservices Platform"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if kubectl is available
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        print_warning "helm is not installed. Some deployments may not work."
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Function to create namespaces
create_namespaces() {
    print_info "Creating namespaces..."
    kubectl apply -f platform-infrastructure/namespaces/namespaces.yaml
    print_status "Namespaces created"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_info "Deploying platform infrastructure..."
    
    # Deploy storage classes
    kubectl apply -f platform-infrastructure/storage/storage-class.yaml
    
    # Deploy databases
    kubectl apply -f platform-infrastructure/databases/postgres/
    
    # Deploy caching
    kubectl apply -f platform-infrastructure/caching/redis.yaml
    
    # Deploy networking
    kubectl apply -f platform-infrastructure/networking/
    
    print_status "Platform infrastructure deployed"
}

# Function to deploy monitoring
deploy_monitoring() {
    print_info "Deploying monitoring stack (Prometheus + Grafana)..."
    cd devops-infrastructure/monitoring
    chmod +x deploy-monitoring.sh
    ./deploy-monitoring.sh
    cd ../../
    print_status "Monitoring stack deployed"
}

# Function to deploy logging
deploy_logging() {
    print_info "Deploying logging stack (ELK)..."
    cd devops-infrastructure/logging
    chmod +x deploy-elk.sh
    ./deploy-elk.sh
    cd ../../
    print_status "Logging stack deployed"
}

# Function to deploy ArgoCD
deploy_argocd() {
    print_info "Deploying ArgoCD for GitOps..."
    cd devops-infrastructure/ci-cd/argocd
    chmod +x deploy-argocd.sh
    ./deploy-argocd.sh
    cd ../../../
    print_status "ArgoCD deployed"
}

# Function to deploy microservices
deploy_microservices() {
    print_info "Deploying microservices..."
    
    # Build and deploy services (if Docker is available)
    if command -v docker &> /dev/null; then
        print_info "Building microservices..."
        chmod +x deploy-all.sh
        ./deploy-all.sh
    else
        print_warning "Docker not available. Please build and push images manually."
    fi
    
    print_status "Microservices deployment initiated"
}

# Function to run tests
run_tests() {
    print_info "Running integration tests..."
    
    if command -v npm &> /dev/null; then
        cd tests/integration
        npm install
        npm test
        cd ../../
        print_status "Integration tests completed"
    else
        print_warning "npm not available. Skipping integration tests."
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_info "Running performance tests..."
    
    if command -v k6 &> /dev/null; then
        k6 run tests/performance/k6-load-test.js
        print_status "Performance tests completed"
    else
        print_warning "k6 not available. Skipping performance tests."
    fi
}

# Function to display access information
show_access_info() {
    echo ""
    echo "🎉 Platform deployment completed!"
    echo "=================================="
    echo ""
    print_info "Access Information:"
    echo ""
    echo "📊 Monitoring & Dashboards:"
    echo "   Prometheus: kubectl port-forward svc/prometheus 9090:9090 -n monitoring"
    echo "   Grafana: kubectl port-forward svc/grafana 3000:3000 -n monitoring"
    echo "   Grafana credentials: admin / admin123"
    echo ""
    echo "📝 Logging:"
    echo "   Kibana: kubectl port-forward svc/kibana 5601:5601 -n logging"
    echo "   Elasticsearch: kubectl port-forward svc/elasticsearch-client 9200:9200 -n logging"
    echo ""
    echo "🔄 GitOps:"
    echo "   ArgoCD: kubectl port-forward svc/argocd-server 8080:443 -n argocd"
    echo "   ArgoCD credentials: admin / <check secret>"
    echo ""
    echo "🔧 Get ArgoCD password:"
    echo "   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
    echo ""
    echo "🚀 Microservices:"
    echo "   Frontend: kubectl port-forward svc/frontend 3000:80 -n microservices"
    echo "   User Service: kubectl port-forward svc/user-service 8081:8081 -n microservices"
    echo "   Order Service: kubectl port-forward svc/order-service 8082:8082 -n microservices"
    echo "   Notification Service: kubectl port-forward svc/notification-service 8083:8083 -n microservices"
    echo "   Inventory Service: kubectl port-forward svc/inventory-service 8084:8084 -n microservices"
    echo "   Audit Service: kubectl port-forward svc/audit-service 8085:8085 -n microservices"
    echo ""
    echo "🔍 Health Checks:"
    echo "   All services expose /health, /health/liveness, and /health/readiness endpoints"
    echo ""
    echo "📈 Performance Testing:"
    echo "   k6 run tests/performance/k6-load-test.js"
    echo ""
    echo "🧪 Integration Testing:"
    echo "   cd tests/integration && npm test"
}

# Function to show deployment status
show_status() {
    echo ""
    print_info "Deployment Status:"
    echo ""
    echo "Namespaces:"
    kubectl get namespaces | grep -E "(microservices|monitoring|logging|argocd)"
    echo ""
    echo "Microservices Pods:"
    kubectl get pods -n microservices
    echo ""
    echo "Monitoring Pods:"
    kubectl get pods -n monitoring
    echo ""
    echo "Logging Pods:"
    kubectl get pods -n logging
    echo ""
    echo "ArgoCD Pods:"
    kubectl get pods -n argocd
}

# Main deployment function
main() {
    echo ""
    print_info "Starting microservices platform deployment..."
    echo ""
    
    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_MONITORING=false
    SKIP_LOGGING=false
    SKIP_ARGOCD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-monitoring)
                SKIP_MONITORING=true
                shift
                ;;
            --skip-logging)
                SKIP_LOGGING=true
                shift
                ;;
            --skip-argocd)
                SKIP_ARGOCD=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-tests       Skip integration and performance tests"
                echo "  --skip-monitoring  Skip monitoring stack deployment"
                echo "  --skip-logging     Skip logging stack deployment"
                echo "  --skip-argocd      Skip ArgoCD deployment"
                echo "  --help, -h         Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_prerequisites
    create_namespaces
    deploy_infrastructure
    
    if [ "$SKIP_MONITORING" = false ]; then
        deploy_monitoring
    fi
    
    if [ "$SKIP_LOGGING" = false ]; then
        deploy_logging
    fi
    
    if [ "$SKIP_ARGOCD" = false ]; then
        deploy_argocd
    fi
    
    deploy_microservices
    
    # Wait for deployments to be ready
    print_info "Waiting for deployments to be ready..."
    sleep 30
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
        run_performance_tests
    fi
    
    show_status
    show_access_info
    
    print_status "Platform deployment completed successfully! 🎉"
}

# Run main function with all arguments
main "$@"