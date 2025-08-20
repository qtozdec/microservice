#!/bin/bash

echo "🎯 Testing Monitoring Setup..."

# Test Prometheus targets
echo "📊 Checking Prometheus targets..."
if curl -s http://localhost:9090/api/v1/targets | grep -q "microservices"; then
    echo "✅ Prometheus is scraping microservices"
else
    echo "❌ Prometheus targets not found"
fi

# Test Grafana API
echo "🎨 Checking Grafana API..."
if curl -s http://localhost:3003/api/health | grep -q "ok"; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana not responding"
fi

# Test metrics availability
echo "📈 Checking available metrics..."
METRICS=(
    "up{job=\"microservices\"}"
    "http_server_requests_seconds_count"
    "jvm_memory_used_bytes"
    "hikaricp_connections_active"
)

for metric in "${METRICS[@]}"; do
    if curl -s "http://localhost:9090/api/v1/query?query=$metric" | grep -q "success"; then
        echo "✅ $metric available"
    else
        echo "❌ $metric not found"
    fi
done

echo ""
echo "🎊 Monitoring Demo is Ready!"
echo ""
echo "🌐 Open these URLs:"
echo "   Grafana:    http://localhost:3003 (admin/grafana123)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "🎯 Look for the dashboard: '🚀 Awesome Microservices Dashboard'"
echo "🚀 Traffic is being generated automatically!"