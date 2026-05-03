# ServiceFormAI OS: Backend API Specification
**Version:** 1.0  
**Date:** April 30, 2026  
**Status:** Specification for Implementation

---

## Overview

This document specifies the backend API endpoints required to support the ServiceFormAI OS frontend. The frontend is 100% complete and uses mock data. This specification defines the real API contracts needed to replace mock data with actual backend integration.

---

## Technology Stack Recommendations

### Core Backend
- **Framework:** Node.js + Express.js OR Python + FastAPI OR Go + Gin
- **Database:** PostgreSQL (primary) + Redis (caching/sessions)
- **Auth:** JWT tokens + OAuth 2.0 (for Aadhaar/DigiLocker)
- **File Storage:** S3-compatible object storage (MinIO/AWS S3)
- **Queue:** BullMQ (Node.js) or Celery (Python) for async jobs

### Government Integrations
- **DigiLocker:** OAuth 2.0 + Document Pull API
- **Aadhaar eKYC:** UIDAI API (requires government approval)
- **SMS Gateway:** BSNL/Airtel Enterprise API
- **Payment:** Razorpay/PayU/Government Payment Gateway

### Infrastructure
- **Hosting:** NIC Cloud OR AWS GovCloud
- **SSL:** Let's Encrypt (auto-renewal)
- **Monitoring:** Prometheus + Grafana
- **Logs:** ELK Stack (Elasticsearch + Logstash + Kibana)

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "role": "tenant_admin|officer|citizen",
    "tenantId": "tenant_456",
    "email": "admin@revenue.gov.in",
    "permissions": ["service:create", "service:publish", "application:review"]
  },
  "expiresAt": "2026-05-01T12:00:00Z"
}
```

### Roles & Permissions Matrix

| Role | Permissions |
|------|-------------|
| `citizen` | Apply for services, track applications, view own data |
| `officer` | Review applications, approve/reject, add comments |
| `tenant_admin` | Create services, invite officers, configure workflows |
| `super_admin` | Manage all tenants, system configuration |

---

## API Endpoints

### 1. Tenant Onboarding

#### **POST** `/api/v1/tenant/onboarding/save-progress`
Save onboarding progress (auto-save during wizard)

**Request:**
```json
{
  "step": 2,
  "data": {
    "org": {
      "orgType": "state-dept",
      "orgName": "Directorate of Revenue, Maharashtra",
      "state": "Maharashtra",
      "phone": "+91 22 2202 1234",
      "email": "helpdesk@revenue.maharashtra.gov.in"
    },
    "admin": {
      "admins": [
        {
          "name": "Shri Ramesh Kumar Yadav",
          "email": "rk.yadav@revenue.gov.in",
          "mobile": "9812345678",
          "role": "dept-admin"
        }
      ],
      "twoFAMethod": "OTP via Mobile"
    }
  },
  "sessionId": "session_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "savedAt": "2026-04-30T10:30:00Z",
  "sessionId": "session_abc123"
}
```

#### **GET** `/api/v1/tenant/onboarding/resume/:sessionId`
Resume onboarding from last saved step

**Response:**
```json
{
  "currentStep": 2,
  "data": { ...saved data... },
  "sessionId": "session_abc123"
}
```

#### **POST** `/api/v1/tenant/onboarding/submit`
Final submission of tenant onboarding

**Request:**
```json
{
  "org": { ...org data... },
  "admin": { ...admin data... },
  "services": { ...selected services... },
  "branding": { ...branding config... }
}
```

**Response:**
```json
{
  "success": true,
  "tenantId": "SFAI-XYZ123",
  "subdomain": "revenue-maharashtra",
  "portalUrl": "revenue-maharashtra.serviceformai.gov.in",
  "status": "pending_verification",
  "nextSteps": [
    {
      "step": "email_verification",
      "description": "Check inbox for verification link",
      "eta": "immediately"
    },
    {
      "step": "org_verification",
      "description": "Organization verification via NIC records",
      "eta": "1-2 business days"
    }
  ]
}
```

---

### 2. Service Templates

#### **GET** `/api/v1/service-templates`
Get list of all available service templates (39 total covering complete citizen lifecycle)

**Response:**
```json
{
  "templates": [
    {
      "id": "birth-certificate",
      "name": "Birth Certificate",
      "category": "Civil Records",
      "description": "Official birth certificate...",
      "sla": "7 days",
      "popular": true,
      "fieldsCount": 10,
      "documentsCount": 4,
      "estimatedApplicationTime": "10 minutes",
      "targetAudience": "Parents/Guardians"
    }
  ],
  "total": 39,
  "categories": [
    "Civil Records",
    "Health & Welfare",
    "Education",
    "Transport",
    "Property & Land",
    "Utilities",
    "Municipal",
    "Business & Commerce",
    "Agriculture",
    "Food & Civil Supplies",
    "Grievances"
  ]
}
```

#### **GET** `/api/v1/service-templates/:templateId`
Get full template details

**Response:**
```json
{
  "id": "birth-certificate",
  "name": "Birth Certificate",
  "category": "Civil Records",
  "description": "...",
  "sla": "7 days",
  "fields": [ ...full field definitions... ],
  "eligibilityRules": [ ...rules... ],
  "documents": [ ...document requirements... ]
}
```

#### **POST** `/api/v1/tenant/:tenantId/service/create-from-template`
Create service from template (pre-populated)

**Request:**
```json
{
  "templateId": "birth-certificate",
  "customizations": {
    "name": "Birth Certificate - Pune Municipal Corporation",
    "sla": "5 days",
    "additionalFields": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "serviceId": "service_abc123",
  "status": "draft",
  "message": "Service created from template. Review and publish when ready."
}
```

#### **POST** `/api/v1/tenant/:tenantId/services/publish-batch`
Publish multiple services at once

**Request:**
```json
{
  "serviceIds": ["service_abc123", "service_def456", "service_ghi789"]
}
```

**Response:**
```json
{
  "success": true,
  "published": 3,
  "services": [
    {
      "id": "service_abc123",
      "name": "Birth Certificate",
      "status": "active",
      "liveUrl": "revenue-maharashtra.serviceformai.gov.in/services/birth-certificate"
    }
  ]
}
```

---

### 3. Service Creation

#### **POST** `/api/v1/tenant/:tenantId/service/create`
Create a new service (custom, from scratch)

**Request:**
```json
{
  "template": "scholarship",
  "name": "State Merit Scholarship 2026",
  "category": "Education",
  "description": "Financial assistance for eligible students...",
  "sla": "30 days",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "prefillable": true,
      "mapping": "DigiLocker→Aadhaar→Name"
    },
    {
      "id": "income",
      "type": "dropdown",
      "label": "Annual Family Income",
      "required": true,
      "options": ["Below ₹1,00,000", "₹1-2.5L", "Above ₹2.5L"]
    }
  ],
  "eligibilityRules": [
    {
      "field": "age",
      "operator": ">=",
      "value": "16"
    },
    {
      "field": "income",
      "operator": "<=",
      "value": "250000"
    }
  ],
  "documents": [
    {
      "name": "Aadhaar Card",
      "digilocker": "AADHAAR",
      "required": true
    },
    {
      "name": "Income Certificate",
      "digilocker": "INCOME_CERTIFICATE",
      "required": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "serviceId": "service_abc123",
  "status": "draft",
  "previewUrl": "revenue-maharashtra.serviceformai.gov.in/preview/service_abc123",
  "createdAt": "2026-04-30T10:30:00Z"
}
```

#### **PUT** `/api/v1/tenant/:tenantId/service/:serviceId`
Update existing service

**Request:** Same as create

**Response:**
```json
{
  "success": true,
  "serviceId": "service_abc123",
  "updatedAt": "2026-04-30T11:00:00Z"
}
```

#### **POST** `/api/v1/tenant/:tenantId/service/:serviceId/publish`
Publish service to production

**Request:**
```json
{
  "publishedBy": "user_admin_123",
  "notes": "Initial launch of scholarship service"
}
```

**Response:**
```json
{
  "success": true,
  "serviceId": "service_abc123",
  "status": "active",
  "liveUrl": "revenue-maharashtra.serviceformai.gov.in/services/scholarship",
  "publishedAt": "2026-04-30T12:00:00Z",
  "manifestUrl": "revenue-maharashtra.serviceformai.gov.in/api/manifest/service_abc123"
}
```

#### **GET** `/api/v1/tenant/:tenantId/services`
List all services for a tenant

**Query Params:**
- `status`: `active|draft|inactive` (optional)
- `page`: page number (default: 1)
- `limit`: items per page (default: 20)

**Response:**
```json
{
  "services": [
    {
      "id": "service_abc123",
      "name": "State Merit Scholarship 2026",
      "status": "active",
      "category": "Education",
      "applications": 234,
      "avgProcessingTime": "5.2 days",
      "slaCompliance": "96%",
      "createdAt": "2026-04-15T10:00:00Z",
      "publishedAt": "2026-04-20T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 3. Application Management

#### **POST** `/api/v1/tenant/:tenantId/service/:serviceId/application`
Submit a new application (citizen-facing)

**Request:**
```json
{
  "citizenId": "citizen_123",
  "formData": {
    "name": "Ananya Sharma",
    "dob": "2008-03-15",
    "income": "Below ₹1,00,000",
    "institution": "MIT, Pune"
  },
  "documents": [
    {
      "type": "AADHAAR",
      "source": "digilocker",
      "docId": "dl_aadhaar_xyz"
    },
    {
      "type": "INCOME_CERTIFICATE",
      "source": "upload",
      "fileId": "file_income_abc"
    }
  ],
  "consent": {
    "documentReuse": true,
    "dataProcessing": true,
    "consentedAt": "2026-04-30T10:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "SCH-2026-001234",
  "status": "submitted",
  "submittedAt": "2026-04-30T10:05:00Z",
  "trackingUrl": "revenue-maharashtra.serviceformai.gov.in/track/SCH-2026-001234",
  "estimatedCompletion": "2026-05-30T10:05:00Z"
}
```

#### **GET** `/api/v1/tenant/:tenantId/applications`
List applications (officer/admin view)

**Query Params:**
- `status`: `pending|deficiency|approved|rejected` (optional)
- `serviceId`: filter by service (optional)
- `page`: page number
- `limit`: items per page
- `search`: search by name/ID (optional)

**Response:**
```json
{
  "applications": [
    {
      "id": "SCH-2026-001234",
      "serviceId": "service_abc123",
      "serviceName": "State Merit Scholarship 2026",
      "applicantName": "Ananya Sharma",
      "status": "pending",
      "submittedAt": "2026-04-30T10:05:00Z",
      "slaDeadline": "2026-05-30T10:05:00Z",
      "daysRemaining": 30,
      "assignedTo": "officer_456",
      "priority": "normal"
    }
  ],
  "pagination": { ...pagination... }
}
```

#### **GET** `/api/v1/tenant/:tenantId/application/:applicationId`
Get application details

**Response:**
```json
{
  "id": "SCH-2026-001234",
  "serviceId": "service_abc123",
  "serviceName": "State Merit Scholarship 2026",
  "status": "pending",
  "applicant": {
    "id": "citizen_123",
    "name": "Ananya Sharma",
    "email": "ananya@example.com",
    "mobile": "+91 9876543210"
  },
  "formData": { ...form responses... },
  "documents": [
    {
      "type": "AADHAAR",
      "name": "Aadhaar Card",
      "source": "digilocker",
      "url": "https://secure-storage.serviceformai.gov.in/docs/...",
      "verified": true
    }
  ],
  "timeline": [
    {
      "event": "submitted",
      "timestamp": "2026-04-30T10:05:00Z",
      "actor": "citizen_123"
    },
    {
      "event": "assigned",
      "timestamp": "2026-04-30T11:00:00Z",
      "actor": "system",
      "assignedTo": "officer_456"
    }
  ],
  "sla": {
    "deadline": "2026-05-30T10:05:00Z",
    "daysRemaining": 30,
    "status": "on_track"
  }
}
```

#### **POST** `/api/v1/tenant/:tenantId/application/:applicationId/action`
Take action on application (approve/reject/deficiency)

**Request:**
```json
{
  "action": "approve",
  "officerId": "officer_456",
  "comments": "All documents verified. Applicant is eligible.",
  "attachments": []
}
```

**OR for deficiency:**
```json
{
  "action": "deficiency",
  "officerId": "officer_456",
  "deficiencies": [
    {
      "field": "income_certificate",
      "reason": "Income certificate expired. Please upload recent certificate (issued within 6 months).",
      "priority": "high"
    }
  ],
  "dueDate": "2026-05-10T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "SCH-2026-001234",
  "newStatus": "approved",
  "actionTakenAt": "2026-04-30T15:00:00Z",
  "certificateUrl": "https://revenue-maharashtra.serviceformai.gov.in/certificates/SCH-2026-001234.pdf"
}
```

---

### 4. DigiLocker Integration

#### **POST** `/api/v1/citizen/:citizenId/digilocker/auth`
Initiate DigiLocker OAuth flow

**Request:**
```json
{
  "redirectUri": "https://revenue-maharashtra.serviceformai.gov.in/callback",
  "scope": ["AADHAAR", "INCOME_CERTIFICATE"]
}
```

**Response:**
```json
{
  "authUrl": "https://digilocker.gov.in/oauth2/authorize?client_id=...&redirect_uri=...&state=xyz",
  "state": "xyz_random_state"
}
```

#### **POST** `/api/v1/citizen/:citizenId/digilocker/callback`
Handle DigiLocker OAuth callback

**Request:**
```json
{
  "code": "auth_code_from_digilocker",
  "state": "xyz_random_state"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "dl_access_token_abc",
  "documentsAvailable": [
    {
      "type": "AADHAAR",
      "name": "Aadhaar Card",
      "issuer": "UIDAI",
      "issuedDate": "2015-06-10",
      "docId": "dl_aadhaar_xyz"
    },
    {
      "type": "INCOME_CERTIFICATE",
      "name": "Income Certificate",
      "issuer": "Revenue Department, Maharashtra",
      "issuedDate": "2025-12-01",
      "docId": "dl_income_abc"
    }
  ]
}
```

#### **POST** `/api/v1/citizen/:citizenId/digilocker/fetch-document`
Fetch document from DigiLocker

**Request:**
```json
{
  "docId": "dl_aadhaar_xyz",
  "purpose": "application_sch_2026_001234",
  "consentId": "consent_xyz"
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "type": "AADHAAR",
    "url": "https://secure-storage.serviceformai.gov.in/docs/...",
    "metadata": {
      "name": "Ananya Sharma",
      "dob": "2008-03-15",
      "aadhaarNumber": "XXXX-XXXX-1234",
      "address": "..."
    },
    "verified": true,
    "fetchedAt": "2026-04-30T10:00:00Z"
  }
}
```

---

### 5. Dashboard & Analytics

#### **GET** `/api/v1/tenant/:tenantId/dashboard/stats`
Get dashboard statistics

**Response:**
```json
{
  "services": {
    "active": 23,
    "draft": 5,
    "inactive": 12
  },
  "applications": {
    "total": 2847,
    "pending": 156,
    "approved": 2234,
    "rejected": 45,
    "slaBreached": 12
  },
  "performance": {
    "avgProcessingTime": "5.2 days",
    "slaCompliance": "96%",
    "satisfactionScore": 4.6
  }
}
```

#### **GET** `/api/v1/tenant/:tenantId/dashboard/trends`
Get historical trends

**Query Params:**
- `period`: `7d|30d|90d|1y`
- `metrics`: `applications|processing_time|sla_compliance` (comma-separated)

**Response:**
```json
{
  "period": "30d",
  "data": [
    {
      "date": "2026-04-01",
      "applications": 85,
      "avgProcessingTime": 5.1,
      "slaCompliance": 95
    },
    {
      "date": "2026-04-02",
      "applications": 92,
      "avgProcessingTime": 5.3,
      "slaCompliance": 96
    }
    // ...more data points
  ]
}
```

---

### 6. User Management

#### **POST** `/api/v1/tenant/:tenantId/users/invite`
Invite officer/team member

**Request:**
```json
{
  "email": "officer@revenue.gov.in",
  "name": "Sunita Desai",
  "role": "officer",
  "permissions": ["application:review", "application:approve"],
  "invitedBy": "admin_123"
}
```

**Response:**
```json
{
  "success": true,
  "invitationId": "invite_abc",
  "invitationUrl": "revenue-maharashtra.serviceformai.gov.in/invite/invite_abc",
  "expiresAt": "2026-05-07T23:59:59Z"
}
```

#### **GET** `/api/v1/tenant/:tenantId/users`
List all users in tenant

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "name": "Shri Ramesh Kumar Yadav",
      "email": "rk.yadav@revenue.gov.in",
      "role": "tenant_admin",
      "status": "active",
      "lastActive": "2026-04-30T14:30:00Z"
    },
    {
      "id": "officer_456",
      "name": "Sunita Desai",
      "email": "sunita.desai@revenue.gov.in",
      "role": "officer",
      "status": "active",
      "assignedApplications": 14,
      "approvedCount": 142,
      "slaCompliance": "94%"
    }
  ]
}
```

---

## Data Models

### Tenant
```typescript
interface Tenant {
  id: string;
  orgType: string;
  orgName: string;
  orgShort?: string;
  state: string;
  district?: string;
  website?: string;
  phone: string;
  email: string;
  subdomain: string;
  portalName?: string;
  tagline?: string;
  logo?: string;
  colorPreset: {
    name: string;
    primary: string;
    accent: string;
  };
  languages: string[];
  status: 'pending_verification' | 'active' | 'suspended';
  createdAt: Date;
  verifiedAt?: Date;
}
```

### Service
```typescript
interface Service {
  id: string;
  tenantId: string;
  template?: string;
  name: string;
  category: string;
  description: string;
  sla: string;
  fields: FormField[];
  eligibilityRules: EligibilityRule[];
  documents: DocumentRequirement[];
  status: 'draft' | 'active' | 'inactive';
  createdBy: string;
  publishedBy?: string;
  createdAt: Date;
  publishedAt?: Date;
  updatedAt: Date;
}

interface FormField {
  id: string;
  type: 'text' | 'date' | 'dropdown' | 'file' | 'number';
  label: string;
  required: boolean;
  prefillable: boolean;
  mapping?: string; // e.g., "DigiLocker→Aadhaar→Name"
  options?: string[]; // for dropdown
  validation?: string;
}

interface EligibilityRule {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
  value: string;
}

interface DocumentRequirement {
  name: string;
  digilocker?: string; // DigiLocker document type
  required: boolean;
  description?: string;
}
```

### Application
```typescript
interface Application {
  id: string;
  tenantId: string;
  serviceId: string;
  citizenId: string;
  status: 'submitted' | 'pending' | 'deficiency' | 'approved' | 'rejected';
  formData: Record<string, any>;
  documents: ApplicationDocument[];
  timeline: TimelineEvent[];
  assignedTo?: string;
  priority: 'normal' | 'high' | 'urgent';
  slaDeadline: Date;
  submittedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface ApplicationDocument {
  type: string;
  name: string;
  source: 'digilocker' | 'upload';
  url: string;
  verified: boolean;
  verifiedAt?: Date;
}

interface TimelineEvent {
  event: string;
  timestamp: Date;
  actor: string;
  metadata?: Record<string, any>;
}
```

### Citizen
```typescript
interface Citizen {
  id: string;
  name?: string;
  email?: string;
  mobile: string;
  aadhaarLinked: boolean;
  digilockerConnected: boolean;
  registeredAt: Date;
  lastLoginAt?: Date;
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Security Requirements

### 1. Authentication
- All API endpoints (except public service catalog) require JWT token
- Token expiry: 24 hours
- Refresh token expiry: 30 days
- Implement token rotation on refresh

### 2. Authorization
- Role-based access control (RBAC)
- Resource-level permissions (tenant, service, application)
- Audit all permission checks

### 3. Data Protection
- Encrypt all PII data at rest (AES-256)
- Encrypt all data in transit (TLS 1.3)
- Mask Aadhaar numbers (show only last 4 digits)
- Never log sensitive data (passwords, Aadhaar, documents)

### 4. Rate Limiting
- API: 100 requests/minute per user
- Login: 5 attempts/15 minutes per IP
- OTP: 3 requests/hour per mobile number

### 5. DPDP Compliance
- Citizen consent required for all data processing
- Purpose limitation (use data only for declared purpose)
- Data retention policy (delete after service completion + 7 years)
- Right to access, correct, delete personal data

---

## Deployment Checklist

### Development Environment
- [ ] Local PostgreSQL database
- [ ] Redis for sessions/caching
- [ ] MinIO for file storage (S3-compatible)
- [ ] Mock DigiLocker API (for testing)

### Staging Environment
- [ ] NIC Cloud / AWS staging instance
- [ ] PostgreSQL RDS / Cloud SQL
- [ ] Redis cluster
- [ ] S3 bucket for file storage
- [ ] Staging DigiLocker sandbox

### Production Environment
- [ ] NIC Cloud / AWS GovCloud
- [ ] Multi-AZ PostgreSQL
- [ ] Redis cluster (HA)
- [ ] S3 with versioning and encryption
- [ ] Production DigiLocker integration
- [ ] SSL certificates (Let's Encrypt)
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] Monitoring & alerting (Prometheus + Grafana)
- [ ] Logging (ELK Stack)
- [ ] Backup automation (daily DB backups, 30-day retention)

---

## API Versioning

- All endpoints prefixed with `/api/v1/`
- Breaking changes require new version (`/api/v2/`)
- Maintain backward compatibility for 6 months
- Document deprecation notices 3 months in advance

---

## Testing Requirements

### Unit Tests
- 80%+ code coverage
- Test all business logic
- Mock external dependencies (DigiLocker, SMS, email)

### Integration Tests
- Test API endpoints with real database
- Test DigiLocker OAuth flow (staging sandbox)
- Test application submission → approval workflow

### Load Tests
- 1,000 concurrent users
- 100 applications/second
- 99.9% uptime SLA

---

## Next Steps for Backend Implementation

1. **Week 1-2:** Setup infrastructure
   - Database schema design
   - JWT authentication
   - Basic CRUD endpoints (tenants, services)

2. **Week 3-4:** Core features
   - Service creation workflow
   - Application submission
   - DigiLocker integration (mock for now)

3. **Week 5-6:** Officer workflows
   - Application review interface
   - Approval/rejection logic
   - Deficiency handling

4. **Week 7-8:** Production readiness
   - Security hardening
   - Load testing
   - Documentation
   - Deployment automation

---

*End of Backend API Specification*
