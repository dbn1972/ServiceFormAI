# ServiceFormAI OS - System Architecture

> **Complete technical architecture overview**

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICEFORMAI OS PLATFORM                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                │
│                         (React + Vite + TypeScript)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │   CONSUMER     │  │   PRODUCER     │  │    OFFICER     │            │
│  │   MODULE       │  │   MODULE       │  │    MODULE      │            │
│  ├────────────────┤  ├────────────────┤  ├────────────────┤            │
│  │ • Services     │  │ • Form Builder │  │ • Review Queue │            │
│  │ • Apply        │  │ • Workflow Eng │  │ • Verification │            │
│  │ • Track Status │  │ • Analytics    │  │ • Approval     │            │
│  │ • Documents    │  │ • White-label  │  │ • Processing   │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     API SERVICE LAYER                           │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  • authService    • consumerService    • producerService       │    │
│  │  • Token Management    • Error Handling    • Type Safety       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ HTTPS/REST API
                                   │ JWT Authentication
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER                                 │
│                         (NestJS + TypeScript)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │  AUTH MODULE   │  │ CONSUMER MODULE│  │ PRODUCER MODULE│            │
│  ├────────────────┤  ├────────────────┤  ├────────────────┤            │
│  │ • Register     │  │ • Get Services │  │ • Create Svcs  │            │
│  │ • Login        │  │ • Submit Apps  │  │ • Manage Apps  │            │
│  │ • JWT Tokens   │  │ • Track Status │  │ • Analytics    │            │
│  │ • Refresh      │  │ • Upload Docs  │  │ • Settings     │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     GUARDS & MIDDLEWARE                         │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  • JWT Strategy    • Role Guards    • Tenant Isolation         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ TypeORM
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                  │
│                           (PostgreSQL)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐     │
│  │  Tenant  │  │ TenantService│  │Application │  │ TenantUser   │     │
│  │          │  │              │  │            │  │              │     │
│  │ • name   │  │ • formSchema │  │ • formData │  │ • role       │     │
│  │ • domain │  │ • workflow   │  │ • status   │  │ • tenantId   │     │
│  └──────────┘  └──────────────┘  └────────────┘  └──────────────┘     │
│                                                                          │
│  ┌──────────────┐                                                       │
│  │ ConsumerUser │                                                       │
│  │              │                                                       │
│  │ • email      │                                                       │
│  │ • name       │                                                       │
│  └──────────────┘                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### 1. Consumer Submits Application

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│          │         │          │         │          │         │          │
│ Citizen  │────────>│ Frontend │────────>│ Backend  │────────>│ Database │
│          │         │          │         │          │         │          │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
     │                    │                    │                    │
     │  Fill form         │                    │                    │
     ├───────────────────>│                    │                    │
     │                    │  POST /consumer/   │                    │
     │                    │  applications      │                    │
     │                    │  + JWT token       │                    │
     │                    ├───────────────────>│                    │
     │                    │                    │  Validate token    │
     │                    │                    │  Extract user      │
     │                    │                    │  Validate data     │
     │                    │                    ├───────────────────>│
     │                    │                    │  INSERT application│
     │                    │                    │<───────────────────┤
     │                    │  Response:         │  Return record     │
     │                    │  {id, tracking#}   │                    │
     │                    │<───────────────────┤                    │
     │  Success!          │                    │                    │
     │  Tracking: ABC123  │                    │                    │
     │<───────────────────┤                    │                    │
     │                    │                    │                    │
```

### 2. Producer Creates Service

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│          │         │          │         │          │         │          │
│  Admin   │────────>│ Frontend │────────>│ Backend  │────────>│ Database │
│          │         │          │         │          │         │          │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
     │                    │                    │                    │
     │  Design form       │                    │                    │
     ├───────────────────>│                    │                    │
     │                    │  POST /producer/   │                    │
     │                    │  services          │                    │
     │                    │  + JWT + TenantID  │                    │
     │                    ├───────────────────>│                    │
     │                    │                    │  Validate token    │
     │                    │                    │  Check role=ADMIN  │
     │                    │                    │  Validate schema   │
     │                    │                    ├───────────────────>│
     │                    │                    │  INSERT service    │
     │                    │                    │<───────────────────┤
     │                    │  Response:         │  Return record     │
     │                    │  {id, formSchema}  │                    │
     │                    │<───────────────────┤                    │
     │  Service created!  │                    │                    │
     │<───────────────────┤                    │                    │
     │                    │                    │                    │
```

## 🔐 Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│          │         │          │         │          │         │          │
│  User    │────────>│ Frontend │────────>│ Backend  │────────>│ Database │
│          │         │          │         │          │         │          │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
     │                    │                    │                    │
     │ 1. Enter email/pwd │                    │                    │
     ├───────────────────>│                    │                    │
     │                    │ 2. POST /auth/login│                    │
     │                    ├───────────────────>│                    │
     │                    │                    │ 3. Find user       │
     │                    │                    ├───────────────────>│
     │                    │                    │<───────────────────┤
     │                    │                    │ 4. Verify password │
     │                    │                    │ 5. Generate JWT    │
     │                    │ 6. Return tokens   │                    │
     │                    │<───────────────────┤                    │
     │ 7. Save to localStorage                 │                    │
     │    - accessToken                        │                    │
     │    - refreshToken                       │                    │
     │    - user data                          │                    │
     │<───────────────────┤                    │                    │
     │                    │                    │                    │
     │ 8. All API calls include:              │                    │
     │    Authorization: Bearer {accessToken}  │                    │
     │                    │                    │                    │
```

## 🗂️ Database Schema

```sql
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     Tenant       │
├──────────────────┤
│ id (PK)          │
│ name             │
│ subdomain        │
│ type             │──────┐
│ logo             │      │ 1:N
│ primaryColor     │      │
│ isActive         │      │
└──────────────────┘      │
                          │
                          ▼
                ┌──────────────────┐
                │  TenantService   │
                ├──────────────────┤
                │ id (PK)          │
                │ tenantId (FK)    │
                │ name             │──────┐
                │ description      │      │ 1:N
                │ category         │      │
                │ formSchema (JSON)│      │
                │ workflowConfig   │      │
                │ isPublished      │      │
                └──────────────────┘      │
                                          │
                                          ▼
                                ┌──────────────────┐
                                │   Application    │
                                ├──────────────────┤
                                │ id (PK)          │
                                │ serviceId (FK)   │
                                │ consumerUserId   │
                                │ tenantId (FK)    │
                                │ formData (JSON)  │
                                │ status           │
                                │ trackingNumber   │
                                │ submittedAt      │
                                └──────────────────┘

┌──────────────────┐                    ┌──────────────────┐
│   TenantUser     │                    │  ConsumerUser    │
├──────────────────┤                    ├──────────────────┤
│ id (PK)          │                    │ id (PK)          │
│ tenantId (FK)    │                    │ email            │
│ email            │                    │ name             │
│ name             │                    │ phone            │
│ role             │                    │ aadhaarHash      │
│ passwordHash     │                    │ passwordHash     │
└──────────────────┘                    └──────────────────┘
```

## 📊 Data Models

### Dynamic Form Schema

```typescript
{
  "title": "Building Permit Application",
  "description": "Apply for a building permit",
  "fields": [
    {
      "id": "applicantName",
      "type": "text",
      "name": "applicantName",
      "label": "Applicant's Full Name",
      "required": true,
      "validation": [
        {
          "type": "min",
          "value": 3,
          "message": "Name must be at least 3 characters"
        }
      ]
    },
    {
      "id": "propertyAddress",
      "type": "textarea",
      "name": "propertyAddress",
      "label": "Property Address",
      "required": true
    },
    {
      "id": "constructionType",
      "type": "select",
      "name": "constructionType",
      "label": "Type of Construction",
      "options": [
        { "value": "residential", "label": "Residential" },
        { "value": "commercial", "label": "Commercial" }
      ]
    }
  ]
}
```

### Workflow Configuration

```typescript
{
  "stages": [
    {
      "id": "initial_review",
      "name": "Initial Review",
      "assignedRole": "OFFICER",
      "actions": ["approve", "reject", "request_documents"],
      "nextStages": ["technical_review", "rejected"],
      "slaHours": 48
    },
    {
      "id": "technical_review",
      "name": "Technical Review",
      "assignedRole": "ADMIN",
      "actions": ["approve", "reject"],
      "nextStages": ["approved", "rejected"],
      "slaHours": 72
    }
  ],
  "slaHours": 120,
  "notifications": [
    {
      "trigger": "STAGE_CHANGE",
      "channels": ["EMAIL", "SMS"],
      "template": "status_update"
    }
  ]
}
```

## 🔒 Security Architecture

### Multi-Tenant Isolation

```
Request Flow:
1. JWT token includes: userId + tenantId (for tenant users)
2. Backend extracts tenantId from token
3. All database queries filtered by tenantId
4. Ensures data isolation between tenants

┌─────────────────────────────────────────┐
│         Tenant A (Municipality)         │
├─────────────────────────────────────────┤
│ • Can only see their services           │
│ • Can only see applications to them     │
│ • Can only manage their users           │
│ • Isolated database queries             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Tenant B (University)           │
├─────────────────────────────────────────┤
│ • Completely separate data              │
│ • Cannot access Tenant A's data         │
│ • Own branding and configuration        │
└─────────────────────────────────────────┘
```

### Role-Based Access Control

```
┌─────────────────────────────────────────────────────────┐
│                    RBAC Hierarchy                        │
└─────────────────────────────────────────────────────────┘

Tenant User Roles:
    
    ADMIN
      │
      ├─ Create/Edit/Delete services
      ├─ Manage users
      ├─ View all applications
      ├─ Update any application
      ├─ Configure tenant settings
      └─ Access analytics
    
    OFFICER
      │
      ├─ View assigned applications
      ├─ Update application status
      ├─ Verify documents
      └─ View limited analytics
    
    VIEWER
      │
      ├─ View services (read-only)
      └─ View applications (read-only)

Consumer User:
    
    CONSUMER
      │
      ├─ Browse services
      ├─ Submit applications
      ├─ View own applications
      ├─ Upload documents
      └─ Track status
```

## 🚀 Deployment Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                      PRODUCTION DEPLOYMENT                         │
└───────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Vercel    │         │   Railway   │         │   Railway   │
│  (Frontend) │────────>│  (Backend)  │────────>│(PostgreSQL) │
│             │  HTTPS  │             │         │             │
│ React App   │         │ NestJS API  │         │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                       │
      │                       │                       │
      ▼                       ▼                       ▼
  CDN Edge             Load Balancer          Automated Backups
  Caching              Auto-scaling            Point-in-time
  SSL/TLS              Health Checks           Recovery
  
Domain Setup:
  - https://serviceformai.com       → Frontend (Vercel)
  - https://api.serviceformai.com   → Backend (Railway)
```

## 📈 Scalability Considerations

### Horizontal Scaling

```
┌────────────────────────────────────────────────┐
│        Load Balancer (Railway/Cloud)           │
└────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ Backend API  │        │ Backend API  │
│ Instance 1   │        │ Instance 2   │
└──────────────┘        └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   PostgreSQL        │
        │   (Connection Pool) │
        └─────────────────────┘
```

### Caching Strategy

```
1. Frontend: Static assets cached by CDN
2. Backend: Redis cache for frequently accessed data
3. Database: Query result caching
4. API: HTTP caching headers
```

## 🔍 Monitoring & Observability

```
┌─────────────────────────────────────────────────────────┐
│                   MONITORING STACK                       │
└─────────────────────────────────────────────────────────┘

Frontend (Vercel):
  • Vercel Analytics
  • Real User Monitoring (RUM)
  • Error tracking (Sentry)
  • Performance metrics

Backend (Railway):
  • Application logs
  • Error tracking (Sentry)
  • Performance monitoring (APM)
  • Database query monitoring

Database:
  • Connection pool metrics
  • Query performance
  • Storage usage
  • Backup status

Alerts:
  • High error rate → Email/Slack
  • Slow response time → Alert on-call
  • Database issues → Immediate alert
  • SLA breach → Escalation
```

## 📱 Future Enhancements

```
Phase 1 (Current):
  ✅ Multi-tenant architecture
  ✅ Dynamic form engine
  ✅ Application workflow
  ✅ Admin dashboard
  ✅ Basic analytics

Phase 2 (Next):
  ⏳ Real-time notifications (WebSocket)
  ⏳ Advanced analytics & reporting
  ⏳ Integration marketplace
  ⏳ Mobile apps (React Native)
  ⏳ AI-powered form validation

Phase 3 (Future):
  ⏳ Microservices architecture
  ⏳ Event-driven architecture
  ⏳ GraphQL API
  ⏳ Multi-region deployment
  ⏳ Advanced caching (Redis)
```

---

**This architecture provides**:
- ✅ Scalability for millions of users
- ✅ Multi-tenant data isolation
- ✅ Security and compliance
- ✅ High availability (99.9% uptime)
- ✅ Developer-friendly structure
- ✅ Easy to maintain and extend
