#!/bin/bash

echo "🚀 Deploying Prometheus + Grafana Monitoring Stack..."

# Create monitoring namespace
echo "Creating monitoring namespace..."
kubectl apply -f namespace.yaml

# Deploy Prometheus RBAC
echo "Deploying Prometheus RBAC..."
kubectl apply -f prometheus/rbac.yaml

# Deploy Prometheus ConfigMap and Deployment
echo "Deploying Prometheus..."
kubectl apply -f prometheus/configmap.yaml
kubectl apply -f prometheus/deployment.yaml

# Deploy Grafana ConfigMaps and Deployment
echo "Deploying Grafana..."
kubectl apply -f grafana/configmap.yaml
kubectl apply -f grafana/deployment.yaml

# Wait for deployments to be ready
echo "Waiting for Prometheus to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n monitoring

echo "Waiting for Grafana to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring

# Show access information
echo ""
echo "✅ Monitoring stack deployed successfully!"
echo ""
echo "📊 Access Information:"
echo "Prometheus: kubectl port-forward svc/prometheus 9090:9090 -n monitoring"
echo "Grafana: kubectl port-forward svc/grafana 3000:3000 -n monitoring"
echo "Grafana credentials: admin / admin123"
echo ""
echo "🔧 Verify deployment:"
echo "kubectl get pods -n monitoring"
echo "kubectl get services -n monitoring"