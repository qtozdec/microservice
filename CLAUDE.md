# Claude Code Configuration

## CRITICAL RULE: Always Rebuild & Redeploy After Code Changes

**NEVER FORGET**: If you make ANY changes to ANY service code (INCLUDING FRONTEND), you MUST:

1. **Rebuild the service**
2. **Redeploy to Kubernetes** 
3. **Wait for rollout to complete**
4. **Then test**

```bash
# MANDATORY after ANY code changes to ANY services (including frontend):
kubectl rollout restart deployment/<service-name> -n microservices
kubectl rollout status deployment/<service-name> -n microservices --timeout=60s

# For frontend specifically:
kubectl rollout restart deployment/frontend -n microservices
kubectl rollout status deployment/frontend -n microservices --timeout=60s
```

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

## Microservices Port Mapping (Kubernetes)

When working with the microservices platform in Kubernetes, use these port forwards for testing:

```bash
# Setup port forwarding for all services
kubectl port-forward -n microservices service/user-service 8081:8081 &
kubectl port-forward -n microservices service/order-service 8082:8082 &  
kubectl port-forward -n microservices service/notification-service 8083:8083 &
kubectl port-forward -n microservices service/inventory-service 8084:8084 &
kubectl port-forward -n microservices service/audit-service 8085:8085 &
```

### Service Endpoints:
- **User Service**: http://localhost:8081 (Authentication, User Management)
- **Order Service**: http://localhost:8082 (Order Management) 
- **Notification Service**: http://localhost:8083 (Notifications)
- **Inventory Service**: http://localhost:8084 (Product Management)
- **Audit Service**: http://localhost:8085 (Audit Logging)

### Health Check URLs:
- User Service: http://localhost:8081/health
- Order Service: http://localhost:8082/health  
- Notification Service: http://localhost:8083/health
- Inventory Service: http://localhost:8084/health
- Audit Service: http://localhost:8085/health

## JWT Authentication

All services now have unified JWT validation with these methods:
- `extractEmail()`, `extractUsername()`, `extractRole()`, `extractUserId()`
- `isTokenValid(String token)` with exception handling
- `isTokenValid(String token, String email)` for additional validation

### Testing JWT:
```bash
# Login to get JWT token
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'

# Use token with other services  
curl -H "Authorization: Bearer <token>" http://localhost:8082/orders
```

## Running Tests

```bash
cd unified-tests
npm test
```

## Deployment Commands

```bash
# Restart all services after code changes
kubectl rollout restart deployment/user-service -n microservices
kubectl rollout restart deployment/order-service -n microservices  
kubectl rollout restart deployment/notification-service -n microservices
kubectl rollout restart deployment/inventory-service -n microservices
kubectl rollout restart deployment/audit-service -n microservices
```