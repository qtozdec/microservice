# 🌐 Frontend и Ingress - Инструкция по развёртыванию

## ✅ Что сделано

### 📱 **Frontend Application**
- ✅ React.js приложение с современным UI
- ✅ Docker контейнер с NGINX
- ✅ Kubernetes развёртывание с 2 репликами
- ✅ Переменные окружения для конфигурации API
- ✅ Адаптированы API endpoints для работы с Ingress

### 🌐 **NGINX Ingress Controller**
- ✅ Развёрнут NGINX Ingress Controller v1.8.1
- ✅ Настроена конфигурация для микросервисов
- ✅ Создан ingress для мониторинга и DevOps инструментов
- ✅ NodePort сервис для доступа (порт 30080)

### 🔗 **Маршрутизация**
- ✅ Frontend доступен по корневому пути `/`
- ✅ API микросервисов доступны по `/api/*`
- ✅ Настроены CORS для frontend-API взаимодействия
- ✅ Health check endpoints для мониторинга

## 🚀 Развёртывание

### 1. Быстрое развёртывание всего
```bash
cd scripts/
./deploy-k8s.sh
```

### 2. Развёртывание только Ingress
```bash
cd scripts/
./deploy-ingress.sh
```

### 3. Развёртывание frontend отдельно
```bash
# Собрать Docker образ
docker build -t frontend:latest -f applications/frontend/Dockerfile applications/frontend/

# Развернуть в Kubernetes
kubectl apply -f k8s/microservices/frontend.yaml
```

## 🌍 Доступ к приложениям

### **Локальная настройка**
Добавьте в `/etc/hosts` (или `C:\Windows\System32\drivers\etc\hosts` на Windows):
```
127.0.0.1 microservices.local
127.0.0.1 grafana.local
127.0.0.1 prometheus.local
127.0.0.1 kibana.local
127.0.0.1 gitlab.local
127.0.0.1 nexus.local
127.0.0.1 argocd.local
```

### **URL доступа**
| Сервис | URL | Описание |
|--------|-----|----------|
| 📱 **Frontend** | http://microservices.local:30080 | React приложение |
| 📊 **Grafana** | http://grafana.local:30080 | Мониторинг и дашборды |
| 🔍 **Prometheus** | http://prometheus.local:30080 | Метрики |
| 📝 **Kibana** | http://kibana.local:30080 | Логи |
| 🦊 **GitLab** | http://gitlab.local:30080 | Git репозиторий |
| 📦 **Nexus** | http://nexus.local:30080 | Артефакты |
| 🚀 **ArgoCD** | http://argocd.local:30080 | GitOps |

### **API Endpoints**
| API | URL | Описание |
|-----|-----|----------|
| 👤 **User API** | http://microservices.local:30080/api/users | Управление пользователями |
| 🔐 **Auth API** | http://microservices.local:30080/api/auth | Аутентификация |
| 📋 **Order API** | http://microservices.local:30080/api/orders | Управление заказами |
| 🔔 **Notifications** | http://microservices.local:30080/api/notifications | Уведомления |

## 🛠️ Структура файлов

```
microservices-platform/
├── applications/frontend/           # React приложение
│   ├── Dockerfile                  # Docker образ
│   ├── nginx.conf                 # NGINX конфигурация  
│   ├── .env.example              # Переменные окружения
│   └── src/                      # Исходный код
├── k8s/microservices/
│   └── frontend.yaml             # Kubernetes deployment
├── platform-infrastructure/networking/ingress/
│   ├── nginx-ingress-controller.yaml    # Ingress controller
│   ├── microservices-ingress.yaml      # Маршруты для микросервисов
│   └── monitoring-ingress.yaml         # Маршруты для мониторинга
└── scripts/
    └── deploy-ingress.sh         # Скрипт развёртывания
```

## 🔧 Конфигурация

### **Frontend Environment Variables**
```env
# API Configuration
VITE_API_BASE_URL=http://microservices.local
VITE_WEBSOCKET_URL=ws://microservices.local/ws

# Application Settings
VITE_APP_NAME=Microservices Platform
VITE_APP_VERSION=1.0.0
```

### **Ingress Annotations**
```yaml
nginx.ingress.kubernetes.io/use-regex: "true"
nginx.ingress.kubernetes.io/enable-cors: "true"
nginx.ingress.kubernetes.io/cors-allow-origin: "*"
nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

## 📊 Мониторинг и проверка

### **Проверка статуса**
```bash
# Проверить поды
kubectl get pods -n microservices
kubectl get pods -n ingress-nginx

# Проверить ingress
kubectl get ingress -n microservices

# Проверить сервисы
kubectl get svc -n ingress-nginx
```

### **Тестирование доступа**
```bash
# Тест frontend
curl -H "Host: microservices.local" http://localhost:30080

# Тест API endpoints
curl -H "Host: microservices.local" http://localhost:30080/api/users
curl -H "Host: microservices.local" http://localhost:30080/api/orders

# Проверка health endpoints
curl -H "Host: microservices.local" http://localhost:30080/actuator/health
```

### **Логи для диагностики**
```bash
# Логи frontend
kubectl logs deployment/frontend -n microservices

# Логи ingress controller
kubectl logs deployment/ingress-nginx-controller -n ingress-nginx

# Логи API сервисов
kubectl logs deployment/user-service -n microservices
kubectl logs deployment/order-service -n microservices
```

## 🚨 Устранение неполадок

### **Frontend не запускается**
```bash
# Проверить права доступа
kubectl describe pod <frontend-pod> -n microservices

# Пересобрать образ
docker build -t frontend:latest -f applications/frontend/Dockerfile applications/frontend/

# Перезапустить
kubectl rollout restart deployment/frontend -n microservices
```

### **Ingress не работает**
```bash
# Проверить статус controller
kubectl get pods -n ingress-nginx
kubectl describe pod <ingress-pod> -n ingress-nginx

# Проверить конфигурацию
kubectl describe ingress microservices-ingress -n microservices
```

### **API недоступны**
```bash
# Проверить сервисы
kubectl get svc -n microservices

# Прямой доступ к API
kubectl port-forward svc/user-service 8081:8081 -n microservices
curl http://localhost:8081/api/users
```

## 🎯 Следующие шаги

1. **Настройка SSL/TLS** - добавить HTTPS сертификаты
2. **Автомасштабирование** - настроить HPA для frontend
3. **Service Mesh** - интеграция с Istio для advanced routing
4. **CDN** - подключение CloudFlare или аналогов
5. **Мониторинг Ingress** - добавить метрики NGINX в Prometheus

---

**🎉 Frontend и Ingress успешно развёрнуты и готовы к использованию!**