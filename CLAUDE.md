# Claude Code Configuration

## CRITICAL RULE: Always Rebuild & Redeploy After Code Changes

**NEVER FORGET**: If you make ANY changes to ANY service code (INCLUDING FRONTEND), you MUST:

1. **Build Docker image** (e.g., `docker build -t inventory-service .`)
2. **Restart Kubernetes deployment** (e.g., `kubectl rollout restart deployment/inventory-service -n microservices`)
3. **Wait for rollout to complete** (`kubectl rollout status deployment/inventory-service -n microservices --timeout=60s`)
4. **Then test**

**FRONTEND IS ALSO A SERVICE!** Changes to React components, services, or any frontend code require rebuilding and redeploying the frontend container.

## 🔐 КРИТИЧЕСКИ ВАЖНО - УПРАВЛЕНИЕ СЕКРЕТАМИ:

**НИКОГДА НЕ КОММИТИТЬ АКТУАЛЬНЫЕ СЕКРЕТЫ В GIT!**

1. **Использовать только script для генерации секретов**:
   ```bash
   ./scripts/generate-secrets.sh development
   ./scripts/generate-secrets.sh production
   ```

2. **Актуальные секреты хранятся в** `k8s/secrets/{environment}/` (в .gitignore)
3. **Коммитить только** `*.template` файлы
4. **Ротация секретов** каждые 90 дней
5. **При компрометации** - немедленная ротация всех секретов
6. **Документация**: `docs/SECURITY-SECRETS-MANAGEMENT.md`


## ⚠️ ВАЖНО: ПОРТЫ УЖЕ ПРОБРОШЕНЫ!

**НЕ НУЖНО НАСТРАИВАТЬ PORT FORWARDING!** Все сервисы доступны через NodePort:

### Service Endpoints (NodePort):
- **User Service**: http://localhost:30081 (Authentication, User Management)
- **Order Service**: http://localhost:30082 (Order Management) 
- **Notification Service**: http://localhost:30083 (Notifications)
- **Inventory Service**: http://localhost:30084 (Product Management)
- **Audit Service**: http://localhost:30085 (Audit Logging)

### Health Check URLs (NodePort):
- User Service: http://localhost:30081/health
- Order Service: http://localhost:30082/health  
- Notification Service: http://localhost:30083/health
- Inventory Service: http://localhost:30084/health
- Audit Service: http://localhost:30085/health

## JWT Authentication

All services now have unified JWT validation with these methods:
- `extractEmail()`, `extractUsername()`, `extractRole()`, `extractUserId()`
- `isTokenValid(String token)` with exception handling
- `isTokenValid(String token, String email)` for additional validation

### Testing JWT:
```bash
# Login to get JWT token (NodePort)
curl -X POST http://localhost:30081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testPassword123"}'

# Use token with other services (NodePort)
curl -H "Authorization: Bearer <token>" http://localhost:30082/orders
```

## Running Tests

```bash
cd unified-tests
npm test
```

## Deployment Commands

**ОБЯЗАТЕЛЬНО: ВСЕГДА СНАЧАЛА ДЕЛАТЬ DOCKER BUILD!**

```bash
# ПОЛНАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ при изменении кода сервиса:

# 1. Собрать Docker образ (из папки сервиса)
cd applications/inventory-service
docker build -t inventory-service .

# 2. Перезапустить деплоймент
kubectl rollout restart deployment/inventory-service -n microservices

# 3. Дождаться завершения
kubectl rollout status deployment/inventory-service -n microservices --timeout=60s

# 4. Проверить
curl http://localhost:30084/health
```

**Команды для всех сервисов:**
```bash
kubectl rollout restart deployment/user-service -n microservices
kubectl rollout restart deployment/order-service -n microservices  
kubectl rollout restart deployment/notification-service -n microservices
kubectl rollout restart deployment/inventory-service -n microservices
kubectl rollout restart deployment/audit-service -n microservices
```