#!/bin/bash

echo "🚀 Creating ADVANCED awesome dashboard..."

# Get datasource UID
DATASOURCE_UID=$(curl -s -u admin:grafana123 http://localhost:3003/api/datasources | jq -r '.[] | select(.type=="prometheus") | .uid')
echo "📊 Using Prometheus datasource UID: $DATASOURCE_UID"

# Create advanced dashboard
curl -s -X POST \
  -H "Content-Type: application/json" \
  -u admin:grafana123 \
  -d '{
    "dashboard": {
      "id": null,
      "title": "🔥 ULTIMATE Microservices Dashboard",
      "tags": ["microservices", "ultimate", "awesome"],
      "timezone": "browser",
      "refresh": "5s",
      "time": {"from": "now-15m", "to": "now"},
      "panels": [
        {
          "id": 1,
          "title": "🎯 Services Health Overview",
          "type": "stat",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "up{job=\"microservices\"}",
              "legendFormat": "{{instance}}"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "color": {"mode": "thresholds"},
              "thresholds": {
                "steps": [
                  {"color": "red", "value": 0},
                  {"color": "green", "value": 1}
                ]
              },
              "mappings": [
                {"options": {"0": {"text": "💀 DOWN", "color": "red"}}, "type": "value"},
                {"options": {"1": {"text": "✅ UP", "color": "green"}}, "type": "value"}
              ]
            }
          },
          "options": {
            "colorMode": "background",
            "graphMode": "none",
            "justifyMode": "center",
            "orientation": "horizontal",
            "textMode": "value_and_name"
          },
          "gridPos": {"h": 6, "w": 24, "x": 0, "y": 0}
        },
        {
          "id": 2,
          "title": "🚀 HTTP Requests Rate (RPS)",
          "type": "timeseries",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "sum by (instance) (rate(http_server_requests_seconds_count{job=\"microservices\"}[2m]))",
              "legendFormat": "🔥 {{instance}}"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "color": {"mode": "palette-classic"},
              "custom": {
                "drawStyle": "line",
                "lineInterpolation": "smooth",
                "lineWidth": 3,
                "fillOpacity": 25,
                "gradientMode": "opacity",
                "showPoints": "never",
                "spanNulls": false
              },
              "unit": "reqps"
            }
          },
          "options": {
            "legend": {
              "displayMode": "table",
              "placement": "bottom",
              "calcs": ["mean", "max", "lastNotNull"]
            }
          },
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 6}
        },
        {
          "id": 3,
          "title": "⚡ Total RPS Gauge",
          "type": "gauge",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "sum(rate(http_server_requests_seconds_count{job=\"microservices\"}[2m]))",
              "legendFormat": "Total RPS"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "color": {"mode": "thresholds"},
              "thresholds": {
                "steps": [
                  {"color": "green", "value": 0},
                  {"color": "yellow", "value": 50},
                  {"color": "red", "value": 100}
                ]
              },
              "unit": "reqps",
              "min": 0,
              "max": 200
            }
          },
          "options": {
            "orientation": "auto",
            "showThresholdLabels": false,
            "showThresholdMarkers": true
          },
          "gridPos": {"h": 8, "w": 6, "x": 12, "y": 6}
        },
        {
          "id": 4,
          "title": "⏱️ Response Time P95",
          "type": "timeseries",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "histogram_quantile(0.95, sum by (instance, le) (rate(http_server_requests_seconds_bucket{job=\"microservices\"}[2m])))",
              "legendFormat": "⏱️ {{instance}} P95"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "color": {"mode": "continuous-RdYlGr"},
              "custom": {
                "drawStyle": "line",
                "lineInterpolation": "smooth",
                "lineWidth": 2,
                "fillOpacity": 30,
                "gradientMode": "scheme"
              },
              "unit": "s",
              "thresholds": {
                "steps": [
                  {"color": "green", "value": 0},
                  {"color": "yellow", "value": 0.1},
                  {"color": "red", "value": 0.5}
                ]
              }
            }
          },
          "options": {
            "legend": {
              "displayMode": "table",
              "placement": "bottom",
              "calcs": ["mean", "max"]
            }
          },
          "gridPos": {"h": 8, "w": 6, "x": 18, "y": 6}
        },
        {
          "id": 5,
          "title": "🧠 JVM Memory Usage",
          "type": "timeseries",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "sum by (instance) (jvm_memory_used_bytes{job=\"microservices\",area=\"heap\"}) / sum by (instance) (jvm_memory_max_bytes{job=\"microservices\",area=\"heap\"}) * 100",
              "legendFormat": "🧠 {{instance}} Memory"
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
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 14}
        },
        {
          "id": 6,
          "title": "📊 HTTP Status Distribution",
          "type": "timeseries",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "sum by (status) (rate(http_server_requests_seconds_count{job=\"microservices\"}[2m]))",
              "legendFormat": "{{status}} responses"
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
                "matcher": {"id": "byRegexp", "options": "2.."},
                "properties": [{"id": "color", "value": {"fixedColor": "green", "mode": "fixed"}}]
              },
              {
                "matcher": {"id": "byRegexp", "options": "4.."},
                "properties": [{"id": "color", "value": {"fixedColor": "yellow", "mode": "fixed"}}]
              },
              {
                "matcher": {"id": "byRegexp", "options": "5.."},
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
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 14}
        },
        {
          "id": 7,
          "title": "🗄️ Database Connection Pool",
          "type": "timeseries",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "hikaricp_connections_active{job=\"microservices\"}",
              "legendFormat": "🔗 {{instance}} Active"
            },
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "hikaricp_connections_max{job=\"microservices\"}",
              "legendFormat": "📊 {{instance}} Max"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "color": {"mode": "palette-classic"},
              "custom": {
                "drawStyle": "line",
                "lineInterpolation": "smooth",
                "lineWidth": 2,
                "fillOpacity": 20
              },
              "unit": "short"
            }
          },
          "options": {
            "legend": {
              "displayMode": "table",
              "placement": "bottom",
              "calcs": ["lastNotNull", "max"]
            }
          },
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 22}
        },
        {
          "id": 8,
          "title": "🗑️ GC Activity",
          "type": "timeseries",
          "targets": [
            {
              "datasource": {"type": "prometheus", "uid": "'$DATASOURCE_UID'"},
              "expr": "rate(jvm_gc_pause_seconds_sum{job=\"microservices\"}[2m])",
              "legendFormat": "🗑️ {{instance}} - {{gc}}"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "color": {"mode": "continuous-RdYlGr"},
              "custom": {
                "drawStyle": "bars",
                "fillOpacity": 70,
                "stacking": {"mode": "normal"}
              },
              "unit": "s"
            }
          },
          "options": {
            "legend": {
              "displayMode": "table",
              "placement": "bottom",
              "calcs": ["mean", "max"]
            }
          },
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 22}
        }
      ],
      "schemaVersion": 38,
      "version": 1
    },
    "folderId": 0,
    "overwrite": true
  }' \
  http://localhost:3003/api/dashboards/db | jq -r '
    if .status == "success" then
      "✅ ULTIMATE Dashboard created! 🎉\n🌐 URL: http://localhost:3003" + .url
    else
      "❌ Error: " + (.message // "Unknown error")
    end
  '

echo ""
echo "🎊 ULTIMATE Microservices Dashboard is ready!"
echo "🔥 Features: 8 panels, emojis, gradients, gauges, and more!"
echo "🌐 Open: http://localhost:3003"
echo "🔑 Login: admin / grafana123"