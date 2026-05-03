# ServiceFormAI Backend - NestJS

Multi-tenant B2B2C Dynamic Form Engine Platform

## 🏗️ Architecture

- **Framework:** NestJS (Enterprise TypeScript)
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport
- **Validation:** class-validator
- **Multi-Tenant:** Tenant isolation at all layers

## 📦 Features

### ✅ Completed
- **Authentication Module** - JWT auth for tenant users and consumers
- **Consumer Module** - APIs for DigiLocker/UMANG integration
- **Producer Module** - APIs for tenant admins to manage services
- **Database Layer** - TypeORM entities and PostgreSQL integration
- **RBAC** - Role-based access control (admin, officer, clerk, consumer)
- **Tenant Isolation** - Automatic tenant scoping

### 🔨 To Build
- Form validation engine
- Workflow state machine
- Notification system
- Document management
- Analytics module

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 14+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb serviceformai

# Run database migrations
psql -U postgres -d serviceformai -f ../database/schema.sql

# Start development server
pnpm start:dev
```

Server runs on `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication Endpoints

#### Register Tenant User
```http
POST /api/v1/auth/register/tenant
Content-Type: application/json

{
  "tenantId": "uuid",
  "email": "admin@pune.gov.in",
  "password": "SecurePass123",
  "role": "admin",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login Tenant User
```http
POST /api/v1/auth/login/tenant
Content-Type: application/json

{
  "email": "admin@pune.gov.in",
  "password": "SecurePass123"
}
```

#### Register Consumer (DigiLocker/UMANG)
```http
POST /api/v1/auth/register/consumer
Content-Type: application/json

{
  "consumerSource": "digilocker",
  "externalId": "aadhaar-hash-123",
  "email": "citizen@example.com",
  "phone": "+919876543210",
  "digilockerData": {
    "name": "John Citizen",
    "dob": "1990-01-15"
  }
}
```

### Consumer Endpoints (For DigiLocker/UMANG)

#### Get Available Services
```http
GET /api/v1/consumer/services?category=civil&search=birth
```

#### Get Service Details
```http
GET /api/v1/consumer/services/:serviceId
```

#### Get Form Schema
```http
GET /api/v1/consumer/services/:serviceId/schema
```

#### Submit Application
```http
POST /api/v1/consumer/applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceId": "uuid",
  "formData": {
    "full_name": "John Doe",
    "birth_date": "2023-01-01"
  }
}
```

#### Track Application
```http
GET /api/v1/consumer/applications/:applicationId
Authorization: Bearer {token}
```

#### Get My Applications
```http
GET /api/v1/consumer/my-applications?status=submitted
Authorization: Bearer {token}
```

### Producer Endpoints (For Tenant Admins)

#### Create Service
```http
POST /api/v1/producer/services
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Birth Certificate",
  "category": "Civil Records",
  "description": "Apply for birth certificate",
  "formSchema": {
    "fields": [
      {
        "id": "full_name",
        "type": "text",
        "label": "Full Name",
        "required": true,
        "digilocker_mapping": "aadhaar.name"
      }
    ]
  },
  "workflowConfig": {
    "stages": [
      {
        "id": "review",
        "name": "Initial Review",
        "approver_role": "clerk"
      }
    ]
  },
  "published": true,
  "slaDays": 7,
  "fees": 50
}
```

#### Get Tenant Services
```http
GET /api/v1/producer/services
Authorization: Bearer {token}
```

#### Update Service
```http
PUT /api/v1/producer/services/:serviceId
Authorization: Bearer {token}
Content-Type: application/json

{
  "published": true,
  "fees": 100
}
```

#### Delete Service
```http
DELETE /api/v1/producer/services/:serviceId
Authorization: Bearer {token}
```

#### Get Applications
```http
GET /api/v1/producer/applications?status=submitted
Authorization: Bearer {token}
```

#### Update Application Status
```http
PUT /api/v1/producer/applications/:applicationId/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",
  "stage": "Final Approval"
}
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── guards/           # JWT & RBAC guards
│   │   ├── strategies/       # Passport strategies
│   │   ├── dto/              # Data transfer objects
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   ├── consumer/             # Consumer APIs (DigiLocker/UMANG)
│   │   ├── dto/
│   │   ├── consumer.service.ts
│   │   ├── consumer.controller.ts
│   │   └── consumer.module.ts
│   ├── producer/             # Producer APIs (Tenant admins)
│   │   ├── dto/
│   │   ├── producer.service.ts
│   │   ├── producer.controller.ts
│   │   └── producer.module.ts
│   ├── database/             # Database layer
│   │   ├── entities/         # TypeORM entities
│   │   └── database.module.ts
│   ├── common/               # Shared utilities
│   │   └── decorators/       # Custom decorators
│   ├── app.module.ts
│   └── main.ts
├── database/
│   └── schema.sql            # PostgreSQL schema
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🔐 Security

- JWT authentication with access/refresh tokens
- Bcrypt password hashing (10 rounds)
- Tenant isolation middleware
- RBAC with decorators
- Input validation (class-validator)
- CORS enabled

## 🧪 Development

```bash
# Run development server
pnpm start:dev

# Build for production
pnpm build

# Start production server
pnpm start:prod

# Run tests
pnpm test
```

## 🌍 Environment Variables

See `.env.example` for all configuration options:
- Database connection
- JWT secrets
- Port configuration
- CORS origins

## 📖 Next Steps

1. Build form validation engine
2. Implement workflow state machine
3. Add notification system (email/SMS)
4. Build document management
5. Add analytics module
6. Connect frontend to APIs

## 🤝 NestJS Benefits

✅ **Dependency Injection** - Clean, testable code  
✅ **Decorators** - `@UseGuards(JwtAuthGuard)`, `@Roles('admin')`  
✅ **Type Safety** - Full TypeScript support  
✅ **Auto-validation** - class-validator integration  
✅ **Modular** - Easy to scale and maintain  
✅ **Enterprise-ready** - Built for large teams  

## 📝 License

MIT
