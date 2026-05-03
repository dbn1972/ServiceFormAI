import { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { PageLoader } from './components/LoadingStates';
import { lazyWithRetry } from './utils/performance';

// Lazy load pages for code splitting
const App = lazyWithRetry(() => import('./App'));
const TenantDashboard = lazyWithRetry(() => import('./pages/TenantDashboard'));
const ServiceCreationWizard = lazyWithRetry(() => import('./pages/ServiceCreationWizard'));
const TenantOnboarding = lazyWithRetry(() => import('./pages/TenantOnboarding'));
const TemplateBrowser = lazyWithRetry(() => import('./pages/TemplateBrowser'));
const ServiceWorkflowConfig = lazyWithRetry(() => import('./pages/ServiceWorkflowConfig'));
const AdvancedAnalytics = lazyWithRetry(() => import('./pages/AdvancedAnalytics'));
const APIIntegrationWizard = lazyWithRetry(() => import('./pages/APIIntegrationWizard'));
const WhiteLabelSettings = lazyWithRetry(() => import('./pages/WhiteLabelSettings'));

/**
 * Router wrapper for ServiceFormAI OS
 *
 * This component sets up React Router for the application.
 * It provides two modes:
 *
 * 1. Production Routes (/tenant/*) - For actual tenant onboarding and service management
 * 2. Showcase Route (/showcase) - For viewing all 83+ design pages
 *
 * For backend integration, use the production routes.
 * For design review, use the showcase route.
 *
 * Performance Features:
 * - Code splitting with React.lazy() for all routes
 * - Suspense boundaries with loading states
 * - Lazy component retry logic for network failures
 * - Automatic bundle optimization
 */
function RouterContent() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setCommandPaletteOpen(true),
    onEscape: () => setCommandPaletteOpen(false),
  });

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Production Tenant Routes - URL-based wizard flow */}
          <Route
            path="/tenant/onboarding"
            element={
              <ErrorBoundary>
                <TenantOnboarding />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tenant/dashboard"
            element={
              <ErrorBoundary>
                <TenantDashboard />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tenant/templates"
            element={
              <ErrorBoundary>
                <TemplateBrowser />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tenant/service/create"
            element={
              <ErrorBoundary>
                <ServiceCreationWizard />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tenant/service/workflow"
            element={
              <ErrorBoundary>
                <ServiceWorkflowConfig />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tenant/analytics"
            element={
              <ErrorBoundary>
                <AdvancedAnalytics />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tenant/api-integration/new"
            element={
              <ErrorBoundary>
                <APIIntegrationWizard />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tenant/white-label"
            element={
              <ErrorBoundary>
                <WhiteLabelSettings />
              </ErrorBoundary>
            }
          />

          {/* Design Showcase - All 83+ pages in sidebar navigation */}
          <Route path="/showcase" element={<App />} />

          {/* Default Route */}
          <Route
            path="/"
            element={<Navigate to="/tenant/onboarding" replace />}
          />

          {/* Catch-all - Redirect to showcase for unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/showcase" replace />}
          />
        </Routes>
      </Suspense>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}

export default function RouterApp() {
  return (
    <BrowserRouter>
      <RouterContent />
    </BrowserRouter>
  );
}

/**
 * Usage Guide:
 *
 * Development:
 * - Visit http://localhost:5173/tenant/onboarding to start tenant wizard
 * - Visit http://localhost:5173/showcase to see all design pages
 *
 * Production Integration:
 * 1. Implement authentication (see BACKEND_API_SPECIFICATION.md)
 * 2. Wrap production routes with <ProtectedRoute> component
 * 3. Add role-based access control
 * 4. Connect to real backend APIs
 *
 * Example with auth:
 *
 * <Route
 *   path="/tenant/dashboard"
 *   element={
 *     <ProtectedRoute requiredRole="tenant_admin">
 *       <TenantDashboard />
 *     </ProtectedRoute>
 *   }
 * />
 */
