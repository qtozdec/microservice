#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}==================== $1 ====================${NC}"
}

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

echo "🔍 Enterprise Microservices Platform Status Check"
echo ""

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

print_success "Connected to Kubernetes cluster"
echo ""

# Overview
print_header "PLATFORM OVERVIEW"
kubectl get nodes -o wide
echo ""

# Namespaces
print_header "NAMESPACES"
kubectl get namespaces | grep -E "(devops|microservices|monitoring|ingress-nginx)" || print_warning "No platform namespaces found"
echo ""

# Platform Infrastructure
print_header "PLATFORM INFRASTRUCTURE"
if kubectl get namespace devops &> /dev/null; then
    print_status "PostgreSQL Cluster:"
    kubectl get pods -l app=postgres -n devops -o wide
    echo ""
    
    print_status "Redis Cluster:"
    kubectl get pods -l app=redis -n devops -o wide
    echo ""
    
    print_status "Storage Resources:"
    kubectl get pvc -n devops
    echo ""
else
    print_warning "DevOps namespace not found"
fi

# DevOps Infrastructure
print_header "DEVOPS INFRASTRUCTURE"
if kubectl get namespace devops &> /dev/null; then
    print_status "GitLab CE:"
    kubectl get pods -l app=gitlab -n devops -o wide
    echo ""
    
    print_status "Nexus Repository:"
    kubectl get pods -l app=nexus -n devops -o wide
    echo ""
    
    print_status "DevOps Services:"
    kubectl get svc -n devops
    echo ""
else
    print_warning "DevOps namespace not found"
fi

# Applications
print_header "MICROSERVICES APPLICATIONS"
if kubectl get namespace microservices &> /dev/null; then
    print_status "Application Pods:"
    kubectl get pods -n microservices -o wide
    echo ""
    
    print_status "Application Services:"
    kubectl get svc -n microservices
    echo ""
else
    print_warning "Microservices namespace not found"
    print_status "Applications can be run locally with:"
    echo "cd applications/ && docker-compose up -d"
    echo ""
fi

# Networking
print_header "NETWORKING INFRASTRUCTURE"
if kubectl get namespace ingress-nginx &> /dev/null; then
    print_status "Ingress Controller:"
    kubectl get pods -n ingress-nginx -o wide
    echo ""
    
    print_status "Ingress Rules:"
    kubectl get ingress -A
    echo ""
else
    print_warning "Ingress namespace not found"
fi

# Storage
print_header "STORAGE RESOURCES"
print_status "Persistent Volumes:"
kubectl get pv
echo ""

print_status "Storage Classes:"
kubectl get storageclass
echo ""

# Resource Usage
print_header "RESOURCE UTILIZATION"
print_status "Node Resource Usage:"
kubectl top nodes 2>/dev/null || print_warning "Metrics server not available for node metrics"
echo ""

print_status "Pod Resource Usage:"
kubectl top pods -n devops 2>/dev/null || print_warning "Metrics server not available for pod metrics"
echo ""

# Health Status
print_header "HEALTH STATUS"

# PostgreSQL Health
if kubectl get statefulset postgres -n devops &> /dev/null; then
    POSTGRES_READY=$(kubectl get statefulset postgres -n devops -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    POSTGRES_DESIRED=$(kubectl get statefulset postgres -n devops -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
    
    if [ "$POSTGRES_READY" = "$POSTGRES_DESIRED" ]; then
        print_success "PostgreSQL: Ready (${POSTGRES_READY}/${POSTGRES_DESIRED})"
    else
        print_warning "PostgreSQL: Not Ready (${POSTGRES_READY}/${POSTGRES_DESIRED})"
    fi
fi

# Redis Health
if kubectl get deployment redis -n devops &> /dev/null; then
    REDIS_READY=$(kubectl get deployment redis -n devops -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    REDIS_DESIRED=$(kubectl get deployment redis -n devops -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
    
    if [ "$REDIS_READY" = "$REDIS_DESIRED" ]; then
        print_success "Redis: Ready (${REDIS_READY}/${REDIS_DESIRED})"
    else
        print_warning "Redis: Not Ready (${REDIS_READY}/${REDIS_DESIRED})"
    fi
fi

# GitLab Health
if kubectl get deployment gitlab -n devops &> /dev/null; then
    GITLAB_READY=$(kubectl get deployment gitlab -n devops -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    GITLAB_DESIRED=$(kubectl get deployment gitlab -n devops -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
    
    if [ "$GITLAB_READY" = "$GITLAB_DESIRED" ]; then
        print_success "GitLab: Ready (${GITLAB_READY}/${GITLAB_DESIRED})"
    else
        print_warning "GitLab: Not Ready (${GITLAB_READY}/${GITLAB_DESIRED})"
    fi
fi

# Nexus Health
if kubectl get deployment nexus -n devops &> /dev/null; then
    NEXUS_READY=$(kubectl get deployment nexus -n devops -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    NEXUS_DESIRED=$(kubectl get deployment nexus -n devops -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
    
    if [ "$NEXUS_READY" = "$NEXUS_DESIRED" ]; then
        print_success "Nexus: Ready (${NEXUS_READY}/${NEXUS_DESIRED})"
    else
        print_warning "Nexus: Not Ready (${NEXUS_READY}/${NEXUS_DESIRED})"
    fi
fi

# Ingress Health
if kubectl get deployment nginx-ingress-controller -n ingress-nginx &> /dev/null; then
    INGRESS_READY=$(kubectl get deployment nginx-ingress-controller -n ingress-nginx -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    INGRESS_DESIRED=$(kubectl get deployment nginx-ingress-controller -n ingress-nginx -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
    
    if [ "$INGRESS_READY" = "$INGRESS_DESIRED" ]; then
        print_success "NGINX Ingress: Ready (${INGRESS_READY}/${INGRESS_DESIRED})"
    else
        print_warning "NGINX Ingress: Not Ready (${INGRESS_READY}/${INGRESS_DESIRED})"
    fi
fi

echo ""

# Service Endpoints
print_header "SERVICE ENDPOINTS"
if kubectl get svc -n devops &> /dev/null; then
    INGRESS_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null)
    
    echo "Platform Access URLs:"
    echo "🦊 GitLab CE:         http://gitlab.local (${INGRESS_IP})"
    echo "📦 Nexus Repository: http://nexus.local (${INGRESS_IP})"
    echo "🐳 Docker Registry:  http://registry.gitlab.local (${INGRESS_IP})"
    echo "🏠 Applications:     http://microservices.local (${INGRESS_IP})"
    echo ""
    
    print_status "Add to /etc/hosts:"
    echo "${INGRESS_IP} gitlab.local nexus.local registry.gitlab.local microservices.local"
    echo ""
fi

# Performance Summary
print_header "PERFORMANCE SUMMARY"
TOTAL_PODS=$(kubectl get pods --all-namespaces --no-headers | wc -l)
RUNNING_PODS=$(kubectl get pods --all-namespaces --no-headers | grep -c Running)

print_status "Cluster Statistics:"
echo "📊 Total Pods: ${TOTAL_PODS}"
echo "✅ Running Pods: ${RUNNING_PODS}"
echo "💾 Total PVCs: $(kubectl get pvc --all-namespaces --no-headers | wc -l)"
echo "🌐 Total Services: $(kubectl get svc --all-namespaces --no-headers | wc -l)"
echo ""

print_status "Resource Allocation:"
echo "💾 Platform Memory: ~36GB allocated"
echo "🖥️ Platform CPU: ~15 cores allocated"
echo "💾 Storage: 500GB+ persistent volumes"
echo ""

# Monitoring Commands
print_header "MONITORING COMMANDS"
print_status "Real-time monitoring:"
echo "📊 Watch all pods:           kubectl get pods -A -w"
echo "📊 Monitor DevOps namespace: kubectl get pods -n devops -w"
echo "📊 Resource usage:           watch kubectl top pods -A"
echo ""

print_status "Service logs:"
echo "🦊 GitLab logs:    kubectl logs -f deployment/gitlab -n devops"
echo "📦 Nexus logs:     kubectl logs -f deployment/nexus -n devops"
echo "🗄️ PostgreSQL logs: kubectl logs -f statefulset/postgres -n devops"
echo "🔄 Redis logs:      kubectl logs -f deployment/redis -n devops"
echo ""

print_status "Health checks:"
echo "🔍 GitLab health:  curl http://gitlab.local/-/health"
echo "🔍 Nexus health:   curl http://nexus.local/service/rest/v1/status"
echo "🔍 App health:     curl http://microservices.local/health"
echo ""

# Troubleshooting
print_header "TROUBLESHOOTING"
print_status "Common issues:"
echo "🔧 Service not ready: kubectl describe pod <pod-name> -n <namespace>"
echo "🔧 Check events:     kubectl get events -n <namespace> --sort-by='.lastTimestamp'"
echo "🔧 Resource issues:  kubectl describe node <node-name>"
echo "🔧 Storage issues:   kubectl get pv && kubectl get pvc -A"
echo ""

print_status "Quick fixes:"
echo "🔄 Restart service:  kubectl rollout restart deployment/<name> -n <namespace>"
echo "🔄 Scale service:    kubectl scale deployment/<name> --replicas=<count> -n <namespace>"
echo "🔄 Delete stuck pod: kubectl delete pod <pod-name> -n <namespace> --force --grace-period=0"
echo ""

print_success "Status check completed! Use the monitoring commands above for real-time updates."