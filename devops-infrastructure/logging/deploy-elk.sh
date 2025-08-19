#!/bin/bash

echo "🚀 Deploying ELK Stack for Logging..."

# Create logging namespace
echo "Creating logging namespace..."
kubectl apply -f namespace.yaml

# Deploy Elasticsearch
echo "Deploying Elasticsearch..."
kubectl apply -f elasticsearch/deployment.yaml

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
kubectl wait --for=condition=ready --timeout=600s pod -l app=elasticsearch -n logging

# Deploy Logstash
echo "Deploying Logstash..."
kubectl apply -f logstash/deployment.yaml

# Wait for Logstash to be ready
echo "Waiting for Logstash to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/logstash -n logging

# Deploy Kibana
echo "Deploying Kibana..."
kubectl apply -f kibana/deployment.yaml

# Wait for Kibana to be ready
echo "Waiting for Kibana to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/kibana -n logging

# Deploy Filebeat
echo "Deploying Filebeat..."
kubectl apply -f filebeat/daemonset.yaml

# Wait for Filebeat to be ready
echo "Waiting for Filebeat to be ready..."
kubectl rollout status daemonset/filebeat -n logging --timeout=300s

# Show access information
echo ""
echo "✅ ELK Stack deployed successfully!"
echo ""
echo "📊 Access Information:"
echo "Elasticsearch: kubectl port-forward svc/elasticsearch-client 9200:9200 -n logging"
echo "Kibana: kubectl port-forward svc/kibana 5601:5601 -n logging"
echo "Logstash: kubectl port-forward svc/logstash 5044:5044 9600:9600 -n logging"
echo ""
echo "🔧 Verify deployment:"
echo "kubectl get pods -n logging"
echo "kubectl get services -n logging"
echo ""
echo "📝 Next steps:"
echo "1. Access Kibana at http://localhost:5601"
echo "2. Create index pattern 'microservices-logs-*'"
echo "3. Configure dashboards for log analysis"