# 🚀 Enterprise Microservices Platform

Complete enterprise-grade microservices platform with comprehensive DevOps infrastructure, monitoring, logging, security, and deployment automation.

## ✨ Features Implemented

### 🔧 Infrastructure & DevOps
- ✅ **Prometheus + Grafana** - Complete monitoring stack with custom dashboards
- ✅ **ELK Stack** - Elasticsearch, Logstash, Kibana, and Filebeat for centralized logging
- ✅ **ArgoCD** - GitOps continuous deployment platform
- ✅ **GitLab CI/CD** - Complete pipelines with testing, security scanning, and deployment
- ✅ **Health Checks** - Comprehensive health monitoring for all services
- ✅ **Performance Monitoring** - Real-time metrics, alerting, and performance dashboards
- ✅ **WebSocket Support** - Real-time communication and live updates

### 🏗️ Microservices Architecture
- ✅ **User Service** - Authentication, authorization, and user management (Port 8081)
- ✅ **Order Service** - Order processing with real-time status updates (Port 8082)
- ✅ **Notification Service** - Event-driven notification system (Port 8083)
- ✅ **Inventory Service** - Product management with real-time WebSocket updates (Port 8084)
- ✅ **Audit Service** - Comprehensive audit logging and compliance tracking (Port 8085)
- ✅ **Frontend Application** - React-based dashboard with real-time features

### 🧪 Testing & Quality Assurance
- ✅ **Integration Testing** - Comprehensive test suite for all services
- ✅ **Performance Testing** - Load testing with k6 and performance benchmarks
- ✅ **Quality Gates** - Code quality checks and coverage reporting
- ✅ **Security Scanning** - Vulnerability scanning in CI/CD pipeline

### 🛡️ Security & Compliance
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-based Access Control** - Fine-grained permission system
- ✅ **Audit Logging** - Complete audit trail for compliance
- ✅ **Security Scanning** - Container and dependency vulnerability scanning

## 🏗️ Project Structure

### 📱 **applications/**
Business applications and microservices
```
applications/
├── frontend/                    # React.js frontend application
├── user-service/              # User management microservice
├── order-service/             # Order processing microservice
├── notification-service/      # Notification microservice
├── inventory-service/         # Inventory & product management
├── audit-service/             # Audit logging service
└── docker-compose.yml         # Local development setup
```

### 🔧 **platform-infrastructure/**
Core infrastructure services that support applications
```
platform-infrastructure/
├── databases/                  # Database services
│   └── postgres/              # PostgreSQL cluster configuration
├── caching/                   # Caching layer
│   └── redis.yaml            # Redis configuration
├── messaging/                 # Message brokers
│   └── kafka.yaml            # Apache Kafka configuration
├── storage/                   # Persistent storage
│   └── storage-class.yaml    # Storage classes and PVs
├── networking/                # Network infrastructure
│   └── ingress/              # NGINX Ingress Controller
└── namespaces/               # Kubernetes namespaces
```

### 🛠️ **devops-infrastructure/**
DevOps tools and automation
```
devops-infrastructure/
├── ci-cd/                     # Continuous Integration/Deployment
│   ├── gitlab/               # GitLab CE configuration
│   └── argocd/               # ArgoCD GitOps setup
├── artifact-management/       # Artifact storage
│   └── nexus/                # Nexus Repository
├── monitoring/                # Observability stack
│   ├── prometheus/           # Metrics collection
│   └── grafana/              # Visualization and dashboards
├── logging/                   # Centralized logging
│   ├── elasticsearch/        # Search and analytics
│   ├── logstash/            # Log processing
│   ├── kibana/              # Log visualization
│   └── filebeat/            # Log shipping
└── security/                  # Security tools
    └── README.md             # Vault, RBAC (future)
```

### 📜 **scripts/**
Automation and deployment scripts
```
scripts/
├── deploy-all.sh             # Complete platform deployment
├── deploy-k8s.sh            # Kubernetes services deployment
├── deploy-monitoring.sh     # Monitoring stack deployment
├── deploy-elk.sh            # Logging stack deployment
├── deploy-argocd.sh         # GitOps deployment
├── status.sh                # Platform status checker
└── generate-traffic.sh      # Load testing script
```

## 🚀 Quick Start

### 1. Clone and Setup Environment

```bash
git clone https://github.com/your-username/microservices-platform.git
cd microservices-platform

# Setup environment variables (REQUIRED)
cp .env.example .env
# Edit .env with your actual values

# Setup service-specific environment variables
find applications/ -name ".env.example" -exec sh -c 'cp "$1" "${1%.example}"' _ {} \;
# Edit each .env file with your actual credentials
```

⚠️ **IMPORTANT**: You must configure all `.env` files with your actual credentials before running the platform. See [SECURITY.md](SECURITY.md) for details.

### 2. Local Development (Docker Compose)

```bash
cd applications/
docker-compose up -d

# Access services
# Frontend: http://localhost:3000
# User Service: http://localhost:8081
# Order Service: http://localhost:8082
# Notification Service: http://localhost:8083
```

### 3. Full Platform Deployment (One Command)

```bash
# Deploy everything (monitoring, logging, GitOps, services)
cd scripts/
chmod +x deploy-all.sh
./deploy-all.sh
```

### 4. Individual Component Deployment

```bash
# Deploy monitoring stack
cd scripts/
./deploy-monitoring.sh

# Deploy logging stack  
./deploy-elk.sh

# Deploy GitOps
./deploy-argocd.sh

# Deploy microservices
./deploy-k8s.sh
```

## 📋 Technology Stack

### **Backend Technologies**
- **Java 21** with Spring Boot 3.1.0
- **Maven 3** for build management
- **PostgreSQL** for data persistence
- **Apache Kafka** for event streaming
- **Redis** for caching and session storage
- **JWT** for authentication

### **Frontend Technologies**
- **React 18** with modern hooks
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

### **Infrastructure Technologies**
- **Kubernetes** for container orchestration
- **Docker** for containerization
- **NGINX Ingress** for load balancing
- **Prometheus + Grafana** for monitoring
- **ELK Stack** for centralized logging

### **DevOps Technologies**
- **GitLab CE** for Git repository and CI/CD
- **ArgoCD** for GitOps deployments
- **Nexus Repository** for artifact management
- **Helm** for Kubernetes package management

## 🔍 API Endpoints

### **User Service** (8081)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users` - Get all users (admin)
- `GET /actuator/health` - Health check
- `GET /actuator/prometheus` - Metrics

### **Order Service** (8082)
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `GET /api/orders/{id}` - Get order by ID
- `PUT /api/orders/{id}/status` - Update order status
- `GET /actuator/health` - Health check

### **Notification Service** (8083)
- `GET /api/notifications/user/{userId}` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/{id}/read` - Mark as read
- `GET /actuator/health` - Health check

## 📊 Monitoring & Operations

### **Prometheus Metrics** (Port 9090)
```bash
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
# Access: http://localhost:9090
```

**Available Metrics:**
- `up{job="microservices"}` - Service availability
- `http_server_requests_seconds_count` - HTTP request count
- `jvm_memory_used_bytes` - JVM memory usage
- `hikaricp_connections_active` - Database connections

### **Grafana Dashboards** (Port 3000)
```bash
kubectl port-forward svc/grafana 3001:3000 -n monitoring
# Access: http://localhost:3001
# Credentials: admin / admin123
```

**Pre-configured Dashboards:**
- **Microservices Overview** - Service health and performance
- **JVM Metrics** - Memory, GC, and thread monitoring
- **HTTP Metrics** - Request rates and response times
- **Database Metrics** - Connection pools and query performance

### **Health Checks**
```bash
# Platform infrastructure
kubectl get pods -n microservices
kubectl get pods -n devops
kubectl get pods -n monitoring

# Individual service health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
```

### **Status Script**
```bash
cd scripts/
./status.sh
```

## 🔄 Event-Driven Architecture

### **Kafka Topics**
- `user-events` - User lifecycle events (registration, login, updates)
- `order-events` - Order status changes (created, confirmed, shipped)

### **Event Flow**
1. User creates order → Order Service publishes `order-created` event
2. Notification Service consumes event → Creates notification
3. Audit Service logs the transaction
4. User views notifications in real-time

## 🔐 Security

### **Environment Variables Configuration**

Create environment-specific configuration files:

**Root `.env` file:**
```env
# Database Configuration
POSTGRES_DB=microservices_db
POSTGRES_USER=microservices_user
POSTGRES_PASSWORD=your_secure_password

# Redis Configuration
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_min_32_chars

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=kafka.devops.svc.cluster.local:9092
```

**Service-specific `.env` files:**
```bash
# applications/user-service/.env
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres.devops.svc.cluster.local:5432/user_service_db
SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
```

### **Kubernetes Secrets**
```bash
# Create secrets from .env files
kubectl create secret generic microservices-config \
  --from-env-file=.env \
  --namespace=microservices

# Database credentials
kubectl create secret generic postgres-secret \
  --from-literal=username=microservices_user \
  --from-literal=password=your_secure_password \
  --namespace=devops
```

### **Default Credentials** (Change in Production!)
- **GitLab**: root / gitlab_root_password
- **Nexus**: admin / (check container logs)
- **PostgreSQL**: postgres / postgres_pass
- **Grafana**: admin / admin123

## 🔧 Configuration

### **Resource Allocation**
- **Total Memory**: ~36GB allocated across services
- **Total CPU**: ~15 cores utilized
- **Storage**: 500GB+ persistent storage

### **Performance Targets**
- **500+ concurrent users** for applications
- **100+ CI/CD parallel jobs**
- **200+ artifact downloads/minute**
- **Sub-second response times**

### **Scaling Operations**
```bash
# Scale applications
kubectl scale deployment user-service --replicas=3 -n microservices
kubectl scale deployment order-service --replicas=3 -n microservices

# Scale infrastructure
kubectl scale statefulset postgres --replicas=2 -n devops
```

## 🌐 Access URLs

After deployment, services are available at:
- **Applications**: http://microservices.local
- **GitLab**: http://gitlab.local
- **Nexus**: http://nexus.local
- **Docker Registry**: http://registry.gitlab.local
- **Grafana**: http://grafana.local
- **Kibana**: http://kibana.local

Add these entries to your `/etc/hosts` file:
```
<CLUSTER_IP> microservices.local
<CLUSTER_IP> gitlab.local
<CLUSTER_IP> nexus.local
<CLUSTER_IP> grafana.local
<CLUSTER_IP> kibana.local
```

## 🚀 Development Workflow

### **Local Development**
1. Start applications with Docker Compose
2. Develop and test locally
3. Push code to GitLab
4. CI/CD pipeline builds and tests
5. Deploy to Kubernetes staging/production

### **CI/CD Pipeline**
1. **Build**: Docker images with Nexus caching
2. **Test**: Automated testing and security scanning
3. **Security**: Vulnerability scanning with Trivy
4. **Deploy**: Rolling deployment to Kubernetes
5. **Monitor**: Health checks and performance monitoring

## 🧪 Testing

### **Local Testing**
```bash
# Unit tests
cd applications/user-service && mvn test

# Integration tests
cd applications/ && docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Load testing
cd scripts/ && ./generate-traffic.sh
```

### **Automated Testing**
- **Unit Tests**: JUnit 5 with MockMVC
- **Integration Tests**: TestContainers with PostgreSQL
- **API Tests**: REST Assured for endpoint testing
- **Performance Tests**: k6 load testing scripts

## 📈 Scalability

### **Horizontal Scaling**
- Application replicas can be scaled independently
- Database read replicas for high-read workloads
- Load balancing across service instances
- Auto-scaling based on CPU/memory metrics

### **Vertical Scaling**
- Resource limits can be increased per service
- Storage can be expanded dynamically
- Memory and CPU allocation adjustable
- Database connection pool tuning

## 📋 Troubleshooting

### **Common Issues**

#### **Service Startup**
```bash
# Check service logs
kubectl logs -f deployment/user-service -n microservices

# Verify database connectivity
kubectl exec -it postgres-0 -n devops -- psql -U postgres

# Test service health
curl http://localhost:8081/actuator/health
```

#### **Authentication Issues**
```bash
# Verify JWT configuration
kubectl get secret microservices-config -o yaml -n microservices

# Check token validity
curl -H "Authorization: Bearer <token>" http://localhost:8081/api/users
```

#### **Performance Issues**
```bash
# Monitor resource usage
kubectl top pods -n microservices

# Check database performance
kubectl exec -it postgres-0 -n devops -- psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Redis cache statistics
kubectl exec -it redis-0 -n devops -- redis-cli info memory
```

### **Useful Commands**
```bash
# Check overall platform status
cd scripts/ && ./status.sh

# Restart specific service
kubectl rollout restart deployment/order-service -n microservices

# View real-time logs
kubectl logs -f deployment/notification-service -n microservices

# Database access
kubectl exec -it postgres-0 -n devops -- psql -U postgres

# Redis CLI access
kubectl exec -it redis-0 -n devops -- redis-cli
```

## 🛣️ Roadmap

### **Phase 1: Core Platform** ✅
- Microservices applications
- Database and caching infrastructure
- CI/CD with GitLab
- Artifact management with Nexus

### **Phase 2: Observability** ✅
- Prometheus metrics collection
- Grafana dashboards
- ELK logging stack
- Health check automation

### **Phase 3: Security & Compliance** 🔄
- HashiCorp Vault for secrets
- RBAC and network policies
- Security scanning integration
- Compliance monitoring

### **Phase 4: Advanced Features** 📋
- Service mesh (Istio)
- Advanced CI/CD (GitOps)
- Multi-environment management
- Disaster recovery automation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Develop and test locally
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Submit pull request
7. CI/CD pipeline validates changes

## 🆘 Support

For issues and questions:
1. Check service logs: `kubectl logs <pod-name> -n <namespace>`
2. Verify resource usage: `kubectl top pods -n <namespace>`
3. Review configuration: `kubectl describe <resource> -n <namespace>`
4. Check network connectivity: `kubectl exec -it <pod> -- ping <service>`
5. Use the status script: `scripts/status.sh`

## 📚 Quick Reference

### **Essential Commands**
```bash
# Deploy entire platform
cd scripts/ && ./deploy-all.sh

# Check platform status
cd scripts/ && ./status.sh

# Access monitoring
kubectl port-forward svc/grafana 3001:3000 -n monitoring

# Access logs
kubectl port-forward svc/kibana 5601:5601 -n logging

# Scale services
kubectl scale deployment/<service> --replicas=<count> -n microservices
```

### **Environment Variables**
All services support environment-based configuration. See individual service directories for `.env.example` files.

### **Networking**
- **Internal**: Services communicate via Kubernetes DNS
- **External**: NGINX Ingress provides load balancing
- **Security**: Network policies isolate namespaces

---

**Built for enterprise teams with high-performance requirements and modern DevOps practices.**