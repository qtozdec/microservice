# Kubernetes Deployment Fixes

This document describes the fixes applied to ensure stable out-of-the-box deployment of the microservices platform.

## Issues Fixed

### 1. Kafka-Zookeeper Connection Fix ✅
**Problem**: Kafka couldn't connect to Zookeeper due to incorrect DNS resolution
**Files Updated**: 
- `/platform-infrastructure/messaging/kafka.yaml`
**Change**: 
```yaml
KAFKA_ZOOKEEPER_CONNECT: "zookeeper.devops.svc.cluster.local:2181"
```

### 2. PostgreSQL Database Permissions Fix ✅
**Problem**: Microservices couldn't create tables due to missing schema permissions
**Files Updated**:
- `/applications/k8s-deployment-complete.yaml`
- `/platform-infrastructure/databases/postgres/configmap.yaml`
- `/applications/k8s/infrastructure/postgres.yaml`
- `/applications/init-databases.sql`

**Changes**: Added schema-level permissions:
```sql
GRANT ALL PRIVILEGES ON SCHEMA public TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO microservices_user;
```

### 3. Health Check Improvements ✅
**Problem**: Aggressive health checks caused services to crash-loop
**Files Updated**: 
- `/platform-infrastructure/messaging/kafka.yaml`

**Changes**:
- Increased initial delay and timeout values
- Added failure threshold buffers
- Made health checks less aggressive

### 4. Security Configuration for Health Endpoints ✅
**Problem**: Health endpoints required JWT authentication causing readiness probe failures
**Files Updated**:
- All SecurityConfig.java files in microservices

**Change**:
```java
.requestMatchers("/health", "/actuator/health").permitAll()
```

## Deployment Instructions

### Fresh Deployment
1. **Deploy Platform Infrastructure**:
   ```bash
   kubectl apply -f platform-infrastructure/
   ```

2. **Wait for PostgreSQL to be ready**:
   ```bash
   kubectl wait --for=condition=ready pod -l app=postgres -n devops --timeout=300s
   ```

3. **Run Database Initialization**:
   ```bash
   kubectl apply -f applications/k8s/jobs/postgres-init-job.yaml
   ```

4. **Deploy Microservices**:
   ```bash
   kubectl apply -f applications/k8s-deployment-complete.yaml
   ```

### Alternative: All-in-One Deployment
```bash
# Deploy everything at once (includes fixes)
kubectl apply -f applications/k8s-deployment-complete.yaml
kubectl apply -f platform-infrastructure/messaging/kafka.yaml
```

### Manual Database Initialization (if needed)
If the automated initialization fails, you can manually run:
```bash
kubectl exec -it postgres-0 -n devops -- psql -U postgres -f /init-scripts/init.sql
```

## Verification

### Check Service Status
```bash
kubectl get pods --all-namespaces
```

### Expected Output
```
NAMESPACE       NAME                                     READY   STATUS    RESTARTS
devops          kafka-0                                  1/1     Running   0
devops          postgres-0                               1/1     Running   0
devops          redis-xxx                                1/1     Running   0
devops          zookeeper-0                              1/1     Running   0
microservices   audit-service-xxx                        1/1     Running   0
microservices   inventory-service-xxx                    1/1     Running   0
microservices   notification-service-xxx                1/1     Running   0
microservices   order-service-xxx                        1/1     Running   0
microservices   user-service-xxx                         1/1     Running   0
```

### Test Health Endpoints
```bash
kubectl port-forward svc/user-service 8081:8080 -n microservices
curl http://localhost:8081/health
```

## Architecture Changes

### Database Schema Permissions
- Added comprehensive schema-level permissions
- Enabled automatic privilege granting for future tables
- Supports both manual and automated initialization

### Inter-Service Communication
- Fixed DNS resolution for cross-namespace communication
- Updated Kafka advertised listeners for proper cluster communication
- Improved health check reliability

### Security Configuration
- Health endpoints now bypass JWT authentication
- Maintains security for business endpoints
- Compatible with Kubernetes readiness/liveness probes

## Files Modified Summary

| Component | Files Changed | Purpose |
|-----------|---------------|---------|
| Kafka | `platform-infrastructure/messaging/kafka.yaml` | DNS resolution & health checks, bitnami image |
| PostgreSQL | 4 files | Schema permissions & initialization |
| Microservices | SecurityConfig.java files | Health endpoint accessibility |
| Jobs | `k8s/jobs/postgres-init-job.yaml` | Database initialization automation |
| Main Manifest | `k8s-deployment-complete.yaml` | Added missing Kafka config & fixed replicas |

## Latest Permanent Configuration Changes (2025-08-20)

### 1. Added Missing Kafka Configuration ✅
**File**: `applications/k8s-deployment-complete.yaml`
**Change**: Added missing SPRING_KAFKA_BOOTSTRAP_SERVERS to ConfigMap
```yaml
# Kafka Configuration
SPRING_KAFKA_BOOTSTRAP_SERVERS: "kafka.devops.svc.cluster.local:9092"
```

### 2. Fixed Deployment Replicas ✅
**File**: `applications/k8s-deployment-complete.yaml`
**Changes**:
- Redis: replicas: 1 → 2
- User Service: replicas: 1 → 2  
- Order Service: replicas: 1 → 2

### 3. Kafka Image and Configuration ✅
**File**: `platform-infrastructure/messaging/kafka.yaml`
**Changes**:
- Image: `confluentinc/cp-kafka:7.4.0` → `bitnami/kafka:3.4`
- Updated environment variables for bitnami image
- Fixed volume mount path to `/bitnami/kafka`

### 4. Zookeeper Health Checks ✅
**File**: `platform-infrastructure/messaging/kafka.yaml`
**Change**: Updated health check command to use `srvr` instead of `ruok`
```yaml
command:
  - sh
  - -c
  - "echo srvr | nc localhost 2181 | grep -q Mode"
```

## Rollback Instructions

If needed, the original configurations can be restored from git history:
```bash
git checkout HEAD~1 -- platform-infrastructure/messaging/kafka.yaml
git checkout HEAD~1 -- applications/k8s-deployment-complete.yaml
```

## Notes

- All changes maintain backward compatibility
- Security is preserved for business endpoints
- Database initialization is idempotent (can be run multiple times safely)
- Health checks are tuned for Docker Desktop resource constraints