#!/bin/bash

# 🚀 Traffic Generator for Microservices Demo
echo "🔥 Starting traffic generation for awesome metrics..."

# Port-forward services in background
echo "Setting up port forwards..."
kubectl port-forward svc/user-service 8081:8081 -n microservices &
kubectl port-forward svc/order-service 8082:8082 -n microservices &  
kubectl port-forward svc/notification-service 8083:8083 -n microservices &
kubectl port-forward svc/inventory-service 8084:8084 -n microservices &
kubectl port-forward svc/audit-service 8085:8085 -n microservices &

# Wait for port forwards to establish
sleep 5

echo "🎯 Generating realistic traffic patterns..."

# Function to generate random requests
generate_requests() {
    local service=$1
    local port=$2
    local endpoint=$3
    local count=${4:-10}
    
    for i in $(seq 1 $count); do
        curl -s -w "Response time: %{time_total}s\n" \
             "http://localhost:$port$endpoint" > /dev/null &
        sleep $(echo "scale=2; $RANDOM / 32767 * 2" | bc)
    done
}

# Generate continuous traffic
for round in {1..10}; do
    echo "🔄 Traffic round $round/10"
    
    # Health checks (fast and frequent)
    generate_requests "user" 8081 "/health" 5 &
    generate_requests "order" 8082 "/health" 5 &
    generate_requests "notification" 8083 "/health" 5 &
    generate_requests "inventory" 8084 "/health" 5 &
    generate_requests "audit" 8085 "/health" 5 &
    
    # API endpoints
    generate_requests "user" 8081 "/api/users" 3 &
    generate_requests "order" 8082 "/api/orders" 3 &
    generate_requests "inventory" 8084 "/api/products" 3 &
    
    # Actuator endpoints for metrics
    generate_requests "user" 8081 "/actuator/metrics" 2 &
    generate_requests "order" 8082 "/actuator/prometheus" 2 &
    generate_requests "inventory" 8084 "/actuator/health" 2 &
    
    # Random delays to create realistic patterns
    sleep $(shuf -i 2-8 -n 1)
    
    # Simulate some load spikes
    if [ $((round % 3)) -eq 0 ]; then
        echo "⚡ Spike load!"
        generate_requests "user" 8081 "/api/users" 15 &
        generate_requests "order" 8082 "/api/orders" 12 &
    fi
    
    wait
done

echo "✅ Traffic generation completed!"
echo "📊 Check Grafana at http://localhost:3003"
echo "🎯 Check Prometheus at http://localhost:9090"

# Keep port forwards alive for a bit
echo "Keeping services accessible for 2 more minutes..."
sleep 120

# Clean up
echo "🧹 Cleaning up port forwards..."
pkill -f "kubectl port-forward"

echo "🎉 Demo completed! Your metrics should look awesome now!"