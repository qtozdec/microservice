#!/bin/bash

echo "🎨 Creating awesome dashboard in Grafana..."

# Get the actual Prometheus datasource UID
DATASOURCE_UID=$(curl -s -u admin:grafana123 http://localhost:3003/api/datasources | jq -r '.[] | select(.type=="prometheus") | .uid')
echo "📊 Found Prometheus datasource UID: $DATASOURCE_UID"

# Create dashboard JSON
cat > /tmp/awesome-dashboard.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "🚀 Awesome Microservices Dashboard",
    "tags": ["microservices", "awesome"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "🎯 Services Health Status",
        "type": "stat",
        "targets": [
          {
            "datasource": {
              "type": "prometheus",
              "uid": "$DATASOURCE_UID"
            },
            "expr": "up{job=\"microservices\"}",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            },
            "mappings": [
              {"options": {"0": {"text": "DOWN", "color": "red"}}, "type": "value"},
              {"options": {"1": {"text": "UP", "color": "green"}}, "type": "value"}
            ]
          }
        },
        "options": {
          "colorMode": "background",
          "graphMode": "none",
          "justifyMode": "center",
          "orientation": "horizontal"
        },
        "gridPos": {"h": 6, "w": 24, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "🚀 HTTP Requests per Second",
        "type": "timeseries",
        "targets": [
          {
            "datasource": {
              "type": "prometheus",
              "uid": "$DATASOURCE_UID"
            },
            "expr": "sum by (instance) (rate(http_server_requests_seconds_count{job=\"microservices\"}[2m]))",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "lineWidth": 3,
              "fillOpacity": 20,
              "gradientMode": "opacity"
            },
            "unit": "reqps"
          }
        },
        "options": {
          "legend": {
            "displayMode": "table",
            "placement": "bottom",
            "calcs": ["mean", "max"]
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 6}
      },
      {
        "id": 3,
        "title": "🧠 JVM Memory Usage %",
        "type": "timeseries",
        "targets": [
          {
            "datasource": {
              "type": "prometheus",
              "uid": "$DATASOURCE_UID"
            },
            "expr": "sum by (instance) (jvm_memory_used_bytes{job=\"microservices\",area=\"heap\"}) / sum by (instance) (jvm_memory_max_bytes{job=\"microservices\",area=\"heap\"}) * 100",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "continuous-GrYlRd"},
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "lineWidth": 2,
              "fillOpacity": 40,
              "gradientMode": "scheme"
            },
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 90}
              ]
            }
          }
        },
        "options": {
          "legend": {
            "displayMode": "table",
            "placement": "bottom",
            "calcs": ["lastNotNull", "max"]
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 6}
      },
      {
        "id": 4,
        "title": "📊 HTTP Status Codes",
        "type": "timeseries",
        "targets": [
          {
            "datasource": {
              "type": "prometheus",
              "uid": "$DATASOURCE_UID"
            },
            "expr": "sum by (status) (rate(http_server_requests_seconds_count{job=\"microservices\"}[2m]))",
            "legendFormat": "HTTP {{status}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "custom": {
              "drawStyle": "bars",
              "fillOpacity": 80,
              "stacking": {"mode": "normal"}
            },
            "unit": "reqps"
          },
          "overrides": [
            {
              "matcher": {"id": "byRegexp", "options": ".*2.."},
              "properties": [{"id": "color", "value": {"fixedColor": "green", "mode": "fixed"}}]
            },
            {
              "matcher": {"id": "byRegexp", "options": ".*4.."},
              "properties": [{"id": "color", "value": {"fixedColor": "yellow", "mode": "fixed"}}]
            },
            {
              "matcher": {"id": "byRegexp", "options": ".*5.."},
              "properties": [{"id": "color", "value": {"fixedColor": "red", "mode": "fixed"}}]
            }
          ]
        },
        "options": {
          "legend": {
            "displayMode": "table",
            "placement": "bottom",
            "calcs": ["mean", "sum"]
          }
        },
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 14}
      }
    ],
    "time": {"from": "now-15m", "to": "now"},
    "refresh": "5s",
    "schemaVersion": 38,
    "version": 1
  },
  "folderId": 0,
  "overwrite": true
}
EOF

# Create the dashboard
echo "📊 Creating dashboard..."
RESULT=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -u admin:grafana123 \
  -d @/tmp/awesome-dashboard.json \
  http://localhost:3003/api/dashboards/db)

if echo "$RESULT" | grep -q "success"; then
    DASHBOARD_URL=$(echo "$RESULT" | jq -r '.url')
    echo "✅ Dashboard created successfully!"
    echo "🌐 URL: http://localhost:3003$DASHBOARD_URL"
else
    echo "❌ Error creating dashboard:"
    echo "$RESULT"
fi

# Cleanup
rm -f /tmp/awesome-dashboard.json

echo "🎉 Done! Check Grafana now!"