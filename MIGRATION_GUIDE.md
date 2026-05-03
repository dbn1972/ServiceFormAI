# Migration Guide: Integrating Backend with Frontend

This guide will help you connect your existing 97 pages to the NestJS backend using the new API service layer.

## 📋 Prerequisites

1. ✅ NestJS backend code is written
2. ✅ Backend deployed to Railway/Render or running locally
3. ✅ PostgreSQL database configured
4. ✅ Frontend structure created

## 🚀 Quick Start

### Step 1: Configure API URL

Create a `.env.local` file in the root directory:

```env
# For local development
VITE_API_URL=http://localhost:3000/api

# For production (Railway example)
# VITE_API_URL=https://your-app.railway.app/api
```

### Step 2: Test Backend Connection

1. Start your NestJS backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Verify it's running at `http://localhost:3000`

3. Test the API:
   ```bash
   curl http://localhost:3000/api/health
   ```

### Step 3: Update Login Page

Replace the existing login logic with the API service:

**Before** (`/src/app/pages/Login.tsx`):
```typescript
// Mock login
const handleLogin = () => {
  localStorage.setItem('user', JSON.stringify(mockUser));
  navigate('/dashboard');
};
```

**After**:
```typescript
import { useAuth } from '../shared/hooks';
import { toast } from 'sonner';

function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, 'consumer'); // or 'tenant'
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    // ... form UI
    <Button onClick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </Button>
  );
}
```

## 📄 Page-by-Page Migration

### Consumer Pages

#### Service Catalog (`/src/app/pages/ServiceCatalog.tsx`)

**Before**:
```typescript
const [services] = useState(mockServices);
```

**After**:
```typescript
import { consumerService } from '../services/api';
import { useApi } from '../shared/hooks';
import type { TenantService } from '../shared/types';

function ServiceCatalog() {
  const { data, loading, error, execute } = useApi<{ data: TenantService[] }>();

  useEffect(() => {
    execute(() => consumerService.getServices(
      { isPublished: true },
      { page: 1, limit: 20 }
    ));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      {data?.data.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
```

#### Application Journey (`/src/app/pages/ApplicationJourney.tsx`)

**Before**:
```typescript
const handleSubmit = (formData: any) => {
  console.log('Submitting:', formData);
  navigate('/applications/confirmation');
};
```

**After**:
```typescript
import { consumerService } from '../services/api';
import { toast } from 'sonner';

function ApplicationJourney() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { serviceId } = useParams();

  const handleSubmit = async (formData: Record<string, any>) => {
    setSubmitting(true);
    try {
      const application = await consumerService.submitApplication({
        serviceId: serviceId!,
        formData,
      });
      
      toast.success('Application submitted successfully!');
      navigate(`/applications/${application.id}/confirmation`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DynamicFormRenderer
      schema={formSchema}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}
```

#### Application History (`/src/app/pages/ApplicationHistory.tsx`)

**Before**:
```typescript
const [applications] = useState(mockApplications);
```

**After**:
```typescript
import { consumerService } from '../services/api';
import { useApi } from '../shared/hooks';
import type { Application } from '../shared/types';

function ApplicationHistory() {
  const { data, loading, execute } = useApi<{ data: Application[] }>();
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    execute(() => consumerService.getMyApplications(
      { status: filter || undefined },
      { page: 1, limit: 10 }
    ));
  }, [filter]);

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="">All Applications</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="UNDER_REVIEW">Under Review</option>
        <option value="APPROVED">Approved</option>
      </select>

      {loading ? (
        <LoadingState />
      ) : (
        data?.data.map(app => (
          <ApplicationCard key={app.id} application={app} />
        ))
      )}
    </div>
  );
}
```

### Producer Pages

#### Form Builder (`/src/app/pages/FormBuilder.tsx`)

See the example in `/src/app/modules/producer/pages/FormBuilderExample.tsx`

Key changes:
```typescript
import { producerService } from '../services/api';
import type { CreateServiceDto, FormSchema } from '../shared/types';

const handleSave = async () => {
  const serviceData: CreateServiceDto = {
    name: serviceName,
    description: serviceDescription,
    category: serviceCategory,
    formSchema: { title: serviceName, fields: formFields },
  };

  const service = await producerService.createService(serviceData);
  toast.success('Service created!');
};
```

#### Tenant Dashboard (`/src/app/pages/TenantDashboard.tsx`)

**Before**:
```typescript
const [analytics] = useState(mockAnalytics);
```

**After**:
```typescript
import { producerService } from '../services/api';
import { useApi } from '../shared/hooks';
import type { TenantAnalytics } from '../shared/types';

function TenantDashboard() {
  const { data: analytics, loading } = useApi<TenantAnalytics>();

  useEffect(() => {
    execute(() => producerService.getTenantAnalytics());
  }, []);

  return (
    <div>
      <h1>Total Applications: {analytics?.totalApplications}</h1>
      <p>SLA Compliance: {analytics?.slaCompliance}%</p>
      {/* ... render charts with analytics data */}
    </div>
  );
}
```

#### Officer Queue (`/src/app/pages/OfficerQueue.tsx`)

**Before**:
```typescript
const [applications] = useState(mockQueue);
```

**After**:
```typescript
import { producerService } from '../services/api';
import type { Application } from '../shared/types';

function OfficerQueue() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const result = await producerService.getApplicationsQueue(
        { status: 'UNDER_REVIEW' }
      );
      setApplications(result.data);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId: string, status: string) => {
    await producerService.updateApplicationStatus(appId, {
      status: status as any,
      notes: 'Reviewed and processed',
    });
    toast.success('Status updated');
    loadQueue(); // Reload queue
  };

  return (
    <div>
      {applications.map(app => (
        <ApplicationItem
          key={app.id}
          application={app}
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
    </div>
  );
}
```

## 🔄 Common Patterns

### Pattern 1: Fetch Data on Mount

```typescript
import { useEffect } from 'react';
import { useApi } from '../shared/hooks';
import { consumerService } from '../services/api';

function MyComponent() {
  const { data, loading, error, execute } = useApi();

  useEffect(() => {
    execute(() => consumerService.getServices());
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* render data */}</div>;
}
```

### Pattern 2: Submit Form Data

```typescript
import { useState } from 'react';
import { consumerService } from '../services/api';
import { toast } from 'sonner';

function MyForm() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      await consumerService.submitApplication({ serviceId, formData });
      toast.success('Submitted!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Pattern 3: Upload Files

```typescript
import { consumerService } from '../services/api';

async function handleFileUpload(file: File, applicationId: string) {
  try {
    const result = await consumerService.uploadDocument(
      applicationId,
      file,
      'id_proof'
    );
    console.log('Uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Pattern 4: Protected Routes

```typescript
import { useAuth } from '../shared/hooks';
import { Navigate } from 'react-router';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

## 🛠️ Troubleshooting

### Issue: CORS Errors

**Solution**: Enable CORS in your NestJS backend:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.com'],
  credentials: true,
});
```

### Issue: 401 Unauthorized

**Solution**: Check that tokens are being saved and sent:

```typescript
// Manually check localStorage
console.log(localStorage.getItem('accessToken'));

// The apiService automatically includes the token
// But you can verify headers in Network tab
```

### Issue: TypeScript Errors

**Solution**: Ensure types match backend:

```typescript
// If backend changes, update types in:
// /src/app/shared/types/api.types.ts

export interface TenantService {
  // Update to match backend entity
}
```

## 📊 Migration Checklist

Use this checklist to track your migration progress:

### Authentication & Core
- [ ] Update Login page
- [ ] Update Registration page
- [ ] Update ProtectedRoute component
- [ ] Test authentication flow

### Consumer Pages (15 pages)
- [ ] ServiceCatalog
- [ ] ServiceDetail
- [ ] ServiceComparison
- [ ] SearchResults
- [ ] ApplicationJourney
- [ ] ApplicationHistory
- [ ] ApplicationConfirmation
- [ ] StatusFlow
- [ ] DocumentUpload
- [ ] PaymentGateway
- [ ] DigiLockerWallet
- [ ] GrievanceJourney
- [ ] CitizenDashboard
- [ ] CitizenProfile
- [ ] NotificationsCenter

### Producer Pages (20 pages)
- [ ] TenantDashboard
- [ ] TenantOnboarding
- [ ] ServiceCreationWizard
- [ ] FormBuilder
- [ ] WorkflowEngine
- [ ] RulesEngineConfig
- [ ] EligibilityEngine
- [ ] WhiteLabelSettings
- [ ] AdminAnalytics
- [ ] AdvancedAnalytics
- [ ] DepartmentDashboard
- [ ] GovernanceConsole
- [ ] APIIntegrationWizard
- [ ] PluginMarketplace
- [ ] ManifestStudio
- [ ] AuditTrail
- [ ] SLAWarRoom
- [ ] OperationalIntelligence

### Officer Pages (3 pages)
- [ ] OfficerDashboard
- [ ] OfficerQueue
- [ ] OfficerApplicationDetail
- [ ] DocumentVerificationInterface

## 🎯 Next Steps

1. **Start with authentication** - Get login/register working first
2. **Migrate one consumer flow** - ServiceCatalog → ServiceDetail → ApplicationJourney
3. **Migrate one producer flow** - FormBuilder → ServiceCreationWizard → TenantDashboard
4. **Test end-to-end** - Create service as producer, apply as consumer
5. **Add error handling** - Ensure all API calls have proper error states
6. **Add loading states** - Use the `loading` state from `useApi` hook
7. **Deploy** - Deploy both frontend and backend to production

## 📚 Resources

- **API Services**: `/src/app/services/api/`
- **Type Definitions**: `/src/app/shared/types/api.types.ts`
- **Example Pages**: `/src/app/modules/consumer/pages/ServiceCatalogExample.tsx`
- **Backend Code**: `/backend/src/`

## 💡 Tips

1. **Use TypeScript** - Let types guide you through the API
2. **Console log responses** - See what data you're getting
3. **Check Network tab** - Verify API calls are being made
4. **Start simple** - Get one page working, then copy the pattern
5. **Keep mock data** - Use as fallback during development

---

**Need Help?** Refer to `/FRONTEND_STRUCTURE.md` for architecture overview.
