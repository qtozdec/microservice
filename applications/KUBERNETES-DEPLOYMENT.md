# Kubernetes Deployment Guide

## Обзор

Эта документация описывает процесс развертывания микросервисной платформы в Kubernetes.

## Готовые ресурсы

### 1. Docker образы
Созданы следующие образы:
- `user-service:latest`
- `order-service:latest` 
- `notification-service:latest`
- `inventory-service:latest`
- `audit-service:latest`

### 2. Kubernetes манифесты

#### Структура файлов:
```
k8s/
├── microservices/
│   ├── configmap.yaml          # ConfigMap для микросервисов
│   ├── secrets.yaml            # Secrets для микросервисов
│   ├── user-service.yaml       # Deployment и Service для user-service
│   ├── order-service.yaml      # Deployment и Service для order-service
│   ├── notification-service.yaml
│   ├── inventory-service.yaml
│   └── audit-service.yaml
├── k8s-deployment-complete.yaml # Полный манифест для развертывания
└── deploy-k8s.sh               # Скрипт развертывания
```

#### Компоненты инфраструктуры:
- PostgreSQL StatefulSet с инициализацией баз данных
- Redis Deployment
- Kafka и Zookeeper StatefulSet

## Развертывание

### Вариант 1: Использование готового скрипта

1. Убедитесь, что у вас настроен доступ к Kubernetes кластеру:
```bash
kubectl cluster-info
```

2. Запустите скрипт развертывания:
```bash
chmod +x deploy-k8s.sh
./deploy-k8s.sh
```

### Вариант 2: Пошаговое развертывание

1. **Создание namespace'ов:**
```bash
kubectl apply -f ../platform-infrastructure/namespaces/namespaces.yaml
```

2. **Развертывание инфраструктуры:**
```bash
# PostgreSQL
kubectl apply -f ../platform-infrastructure/databases/postgres/

# Redis  
kubectl apply -f ../platform-infrastructure/caching/redis.yaml

# Kafka
kubectl apply -f ../platform-infrastructure/messaging/kafka.yaml
```

3. **Развертывание конфигурации микросервисов:**
```bash
kubectl apply -f k8s/microservices/configmap.yaml
kubectl apply -f k8s/microservices/secrets.yaml
```

4. **Развертывание микросервисов:**
```bash
kubectl apply -f k8s/microservices/user-service.yaml
kubectl apply -f k8s/microservices/order-service.yaml
kubectl apply -f k8s/microservices/notification-service.yaml
kubectl apply -f k8s/microservices/inventory-service.yaml
kubectl apply -f k8s/microservices/audit-service.yaml
```

### Вариант 3: Одним файлом

```bash
kubectl apply -f k8s-deployment-complete.yaml
```

## Проверка развертывания

### 1. Проверка подов
```bash
# Инфраструктура
kubectl get pods -n devops

# Микросервисы
kubectl get pods -n microservices
```

### 2. Проверка сервисов
```bash
kubectl get svc -n microservices
kubectl get svc -n devops
```

### 3. Логи сервисов
```bash
kubectl logs -f deployment/user-service -n microservices
kubectl logs -f deployment/order-service -n microservices
```

## Доступ к сервисам

### Port-forwarding для локального доступа:

```bash
# User Service
kubectl port-forward svc/user-service 8081:8081 -n microservices

# Order Service  
kubectl port-forward svc/order-service 8082:8082 -n microservices

# Notification Service
kubectl port-forward svc/notification-service 8083:8083 -n microservices

# Inventory Service
kubectl port-forward svc/inventory-service 8084:8084 -n microservices

# Audit Service
kubectl port-forward svc/audit-service 8085:8085 -n microservices

# PostgreSQL (для отладки)
kubectl port-forward svc/postgres 15432:5432 -n devops

# Redis (для отладки)
kubectl port-forward svc/redis 6379:6379 -n devops
```

## Конфигурация

### Основные параметры:

- **Database**: PostgreSQL 15
  - Host: `postgres.devops.svc.cluster.local:5432`
  - User: `microservices_user`
  - Password: `changeme`

- **Redis**: Redis 7
  - Host: `redis.devops.svc.cluster.local:6379`
  - Password: `RedisSecure2024!`

- **JWT Secret**: `supersecurejwtsecretkey256bitslongforproductionuse12345`

### Environment переменные:
Все переменные окружения настроены через ConfigMap и Secrets в namespace `microservices`.

## Тестирование

После развертывания можно протестировать API:

```bash
# Health check
curl http://localhost:8081/health

# Регистрация пользователя
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123", "role": "ADMIN"}'

# Логин
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

## Масштабирование

Для увеличения количества реплик:

```bash
kubectl scale deployment user-service --replicas=3 -n microservices
kubectl scale deployment order-service --replicas=3 -n microservices
```

## Мониторинг

Все сервисы настроены с:
- Health check endpoints: `/health`, `/health/liveness`, `/health/readiness`
- Metrics endpoints: `/actuator/metrics`, `/actuator/prometheus`

## Удаление развертывания

```bash
kubectl delete namespace microservices
kubectl delete namespace devops
```

## Troubleshooting

### Проблемы с образами
Если образы не найдены, убедитесь что они собраны:
```bash
docker images | grep -E "(user-service|order-service|notification-service|inventory-service|audit-service)"
```

### Проблемы с подключением к БД
Проверьте статус PostgreSQL:
```bash
kubectl get pods -n devops
kubectl logs -f statefulset/postgres -n devops
```

### Проблемы с Redis
```bash
kubectl logs -f deployment/redis -n devops
kubectl exec -it deployment/redis -n devops -- redis-cli ping
```