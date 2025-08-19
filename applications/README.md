# 📱 Microservices Applications

Business applications layer of the enterprise platform.

## 🏗️ Architecture

### **Frontend Application**
- **Technology**: React.js 18 + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Features**: Modern dashboard, order management, user management
- **Authentication**: JWT-based with role-based access

### **Backend Microservices**

#### **User Service** (Port 8081)
- **Purpose**: User authentication and management
- **Database**: PostgreSQL (user_service schema)
- **Features**:
  - JWT authentication
  - User registration/login
  - Role-based access control (USER/ADMIN)
  - Password encryption

#### **Order Service** (Port 8082)
- **Purpose**: Order processing and management
- **Database**: PostgreSQL (order_service schema)
- **Features**:
  - Order creation and tracking
  - Status workflow (PENDING → CONFIRMED → SHIPPED → DELIVERED)
  - Order history and filtering

#### **Notification Service** (Port 8083)
- **Purpose**: Event-driven notifications
- **Database**: PostgreSQL (notification_service schema)
- **Features**:
  - Real-time notifications
  - Event publishing via Kafka
  - Notification history and read status

## 🚀 Local Development

### **Quick Start with Docker Compose**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Services Access**
- **Frontend**: http://localhost:3000
- **User Service**: http://localhost:8081
- **Order Service**: http://localhost:8082
- **Notification Service**: http://localhost:8083

## 📦 Build & Deployment

### **Local Development**
```bash
# Simple startup (recommended)
./run-simple.sh

# Advanced startup with health checks
./run.sh

# Build all services
./build.sh
```

### **Kubernetes Deployment**
Applications are deployed via the platform infrastructure. See main README for full deployment instructions.

## 🔧 Technologies

### **Backend Stack**
- **Java 21** with Spring Boot 3.1.0
- **Maven 3** for build management
- **PostgreSQL** for data persistence
- **Apache Kafka** for event streaming
- **Redis** for caching
- **JWT** for authentication

### **Frontend Stack**
- **React 18** with modern hooks
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

## 🔍 API Endpoints

### **User Service** (8081)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users` - Get all users (admin)
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### **Order Service** (8082)
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `GET /api/orders/{id}` - Get order by ID
- `GET /api/orders/user/{userId}` - Get orders by user
- `PUT /api/orders/{id}/status` - Update order status

### **Notification Service** (8083)
- `GET /api/notifications/user/{userId}` - Get user notifications
- `GET /api/notifications/user/{userId}/unread` - Get unread notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `POST /api/notifications` - Create notification

## 🔄 Event-Driven Architecture

### **Kafka Topics**
- `user-events` - User lifecycle events
- `order-events` - Order status changes

### **Event Flow**
1. User creates order → Order Service publishes `order-created` event
2. Notification Service consumes event → Creates notification
3. User views notifications in real-time

## 🎯 Performance Features

### **Caching Strategy**
- **Redis caching** for frequently accessed data
- **Database connection pooling** with HikariCP
- **Frontend caching** with browser storage

### **Scalability**
- **Stateless services** for horizontal scaling
- **Event-driven communication** reduces coupling
- **Database sharding** support per service

## 🔒 Security

### **Authentication & Authorization**
- **JWT tokens** with RS256 signing
- **Role-based access control** (USER/ADMIN)
- **Password encryption** with BCrypt
- **CORS configuration** for browser security

### **API Security**
- **Input validation** and sanitization
- **SQL injection prevention**
- **Rate limiting** capabilities
- **HTTPS enforcement** in production

## 📊 Monitoring & Health

### **Health Endpoints**
- `/actuator/health` - Service health status
- `/actuator/metrics` - Prometheus metrics
- `/actuator/info` - Application information

### **Observability**
- **Structured logging** with correlation IDs
- **Metrics collection** for Prometheus
- **Distributed tracing** ready for Jaeger

## 🧪 Testing

### **Test Strategy**
```bash
# Unit tests
mvn test

# Integration tests
mvn verify

# Frontend tests
npm test

# End-to-end tests
npm run e2e
```

### **Test Coverage**
- **Target**: 80%+ code coverage
- **Quality gates** in CI/CD pipeline
- **Automated testing** on every commit

## 🛠️ Development Guidelines

### **Code Standards**
- **Java**: Google Java Style Guide
- **JavaScript**: ESLint + Prettier configuration
- **API Documentation**: OpenAPI 3.0 specifications
- **Git**: Conventional commits with feature branches

### **Development Workflow**
1. Create feature branch from main
2. Develop with local Docker Compose
3. Write tests for new functionality
4. Submit pull request with documentation
5. Automated CI/CD validation
6. Code review and merge

## 🚀 CI/CD Integration

### **Pipeline Stages**
1. **Build**: Maven compilation and packaging
2. **Test**: Unit and integration tests
3. **Security**: Dependency vulnerability scanning
4. **Build Images**: Docker image creation
5. **Deploy**: Kubernetes rolling deployment
6. **Verify**: Health checks and smoke tests

### **Deployment Environments**
- **Development**: Local Docker Compose
- **Staging**: Kubernetes staging namespace
- **Production**: Kubernetes production namespace

## 📋 Troubleshooting

### **Common Issues**

#### **Service Startup**
```bash
# Check service logs
docker-compose logs user-service

# Verify database connectivity
docker exec -it postgres psql -U postgres

# Test service health
curl http://localhost:8081/actuator/health
```

#### **Authentication Issues**
```bash
# Verify JWT configuration
kubectl get secret jwt-secret -o yaml

# Check token validity
curl -H "Authorization: Bearer <token>" http://localhost:8081/api/users
```

#### **Performance Issues**
```bash
# Monitor resource usage
docker stats

# Check database performance
kubectl exec -it postgres-0 -- pg_stat_activity

# Redis cache statistics
redis-cli info memory
```

### **Useful Commands**
```bash
# Restart specific service
docker-compose restart order-service

# View real-time logs
docker-compose logs -f notification-service

# Database access
docker exec -it postgres psql -U postgres -d order_service

# Redis CLI access
docker exec -it redis redis-cli
```

## 📚 Documentation

- **API Documentation**: Auto-generated Swagger UI
- **Database Schema**: ERD diagrams included
- **Architecture Decisions**: ADR documents
- **Deployment Guide**: Step-by-step instructions

For detailed deployment and infrastructure setup, see the main platform documentation.