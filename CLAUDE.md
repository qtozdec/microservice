# Claude Code Configuration

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