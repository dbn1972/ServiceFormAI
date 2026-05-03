/**
 * Volume 12 §9 — Module-by-Module Quality Model
 * Appendix A — Module QA Checklist Template
 *
 * This manifest defines the QA plan for every major product module.
 * It is machine-readable and drives the QA Dashboard at /admin/qa-dashboard.
 *
 * Format: QAModule[]
 */

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'not-tested';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AutomationLevel = 'full' | 'partial' | 'manual' | 'none';

export interface ModuleRisk {
  description: string;
  severity: Severity;
}

export interface QAModule {
  id: string;
  name: string;
  owner: string;
  purpose: string;
  roles: string[];
  keyScreens: string[];
  keyAPIs: string[];
  keyEntities: string[];
  criticalJourneys: string[];
  schemaChangesInvolved: boolean;
  responsiveCoverageNeeded: string[];
  darkModeCoverageNeeded: boolean;
  accessibilityChecks: string[];
  automationLevel: AutomationLevel;
  automationTests: string[];
  manualTests: string[];
  releaseBlockers: string[];
  knownRisks: ModuleRisk[];
  // Computed/runtime
  status?: CheckStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// §9 — Minimum module coverage (all required modules)
// ─────────────────────────────────────────────────────────────────────────────
export const MODULE_QA_MANIFEST: QAModule[] = [
  // ── Auth / Login ────────────────────────────────────────────────────────────
  {
    id: 'auth',
    name: 'Authentication & Login',
    owner: 'Security Team',
    purpose: 'Authenticates tenants, citizens, and officers. Manages sessions and password resets.',
    roles: ['citizen', 'admin', 'officer', 'public'],
    keyScreens: ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback/:provider'],
    keyAPIs: [
      'POST /auth/login/tenant',
      'POST /auth/login/consumer',
      'POST /auth/register/tenant',
      'POST /auth/forgot-password',
      'GET /auth/reset-password/verify',
      'POST /auth/reset-password',
      'POST /auth/refresh',
      'POST /auth/logout',
    ],
    keyEntities: ['User', 'Tenant', 'RefreshToken'],
    criticalJourneys: [
      'Tenant admin login with email/password',
      'Citizen login with email or mobile OTP',
      'Google SSO login',
      'Forgot password → email → reset',
      'Session refresh on expiry',
      'Logout and token invalidation',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['mobile', 'tablet', 'desktop'],
    darkModeCoverageNeeded: true,
    accessibilityChecks: [
      'Login form labels',
      'Password show/hide toggle accessible',
      'Error messages aria-live',
      'SSO buttons labeled',
      'Tab order logical',
    ],
    automationLevel: 'partial',
    automationTests: [
      'e2e/auth.spec.ts',
      'src/test/api-contracts/auth.contract.test.ts',
      'backend/src/auth/auth.service.spec.ts',
    ],
    manualTests: [
      'SSO OAuth flow end-to-end',
      'Mobile OTP delivery and input',
      'Session expiry during active form fill',
    ],
    releaseBlockers: [],
    knownRisks: [
      { description: 'Token leakage via XSS in localStorage', severity: 'high' },
      { description: 'Rate limiting bypass on login endpoint', severity: 'high' },
    ],
  },

  // ── Citizen / Consumer ──────────────────────────────────────────────────────
  {
    id: 'citizen',
    name: 'Citizen Service Journey',
    owner: 'Product Team',
    purpose: 'End-to-end citizen journey: browse services, apply, track, download certificates.',
    roles: ['citizen'],
    keyScreens: [
      '/dashboard',
      '/services',
      '/services/:id',
      '/applications',
      '/applications/:id',
      '/applications/:id/confirmation',
      '/payment',
      '/certificates/:id',
      '/digilocker',
    ],
    keyAPIs: [
      'GET /consumer/services',
      'GET /consumer/services/:id',
      'POST /consumer/applications',
      'GET /consumer/my-applications',
      'GET /consumer/applications/:id',
      'GET /consumer/applications/track/:trackingNumber',
    ],
    keyEntities: ['Application', 'Service', 'Document', 'Payment'],
    criticalJourneys: [
      'Browse service catalog and find a service',
      'Submit application for a service',
      'Upload supporting documents',
      'Track application status by tracking number',
      'Download approved certificate',
      'Raise grievance on rejected application',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['mobile', 'tablet', 'desktop'],
    darkModeCoverageNeeded: true,
    accessibilityChecks: [
      'Form wizard step indicators labeled',
      'File upload accessible',
      'Status timeline readable by screen reader',
      'Payment form accessible',
    ],
    automationLevel: 'partial',
    automationTests: ['e2e/citizen-journey.spec.ts'],
    manualTests: [
      'Full application submission with file upload',
      'Multi-step form wizard on mobile',
      'Payment gateway integration',
      'Certificate download and verify',
    ],
    releaseBlockers: [],
    knownRisks: [
      { description: 'Large file upload timeout on slow mobile', severity: 'medium' },
      { description: 'Form data loss on accidental navigation', severity: 'high' },
    ],
  },

  // ── Officer ─────────────────────────────────────────────────────────────────
  {
    id: 'officer',
    name: 'Officer Processing Queue',
    owner: 'Product Team',
    purpose: 'Officers review, approve, reject, and assign applications.',
    roles: ['officer'],
    keyScreens: [
      '/officer/dashboard',
      '/officer/queue',
      '/officer/applications/:id',
      '/officer/verify-documents',
    ],
    keyAPIs: [
      'GET /producer/applications',
      'GET /producer/applications/:id',
      'PATCH /producer/applications/:id/status',
      'PATCH /producer/applications/:id/assign',
    ],
    keyEntities: ['Application', 'OfficerAssignment', 'StatusHistory'],
    criticalJourneys: [
      'Officer views assigned queue',
      'Officer reviews and approves application',
      'Officer rejects with reason',
      'Officer requests additional documents',
      'Officer views full audit trail',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['desktop', 'tablet'],
    darkModeCoverageNeeded: true,
    accessibilityChecks: [
      'Queue table is screen-reader friendly',
      'Status change confirmation dialogs accessible',
    ],
    automationLevel: 'partial',
    automationTests: ['e2e/admin-journey.spec.ts'],
    manualTests: [
      'Document verification UI with zoom',
      'Bulk assign applications',
      'SLA breach alert visibility',
    ],
    releaseBlockers: [],
    knownRisks: [
      { description: 'Race condition on concurrent application status updates', severity: 'high' },
    ],
  },

  // ── Admin / Tenant ──────────────────────────────────────────────────────────
  {
    id: 'admin',
    name: 'Admin Console & Tenant Management',
    owner: 'Platform Team',
    purpose: 'Tenant admins manage services, users, settings, analytics, and whitelabeling.',
    roles: ['admin'],
    keyScreens: [
      '/admin/analytics',
      '/admin/departments',
      '/admin/services/create',
      '/admin/form-builder',
      '/admin/audit',
      '/admin/sla',
      '/admin/whitelabel',
      '/admin/readiness',
    ],
    keyAPIs: [
      'GET /producer/services',
      'POST /producer/services',
      'GET /producer/analytics',
      'GET /producer/users',
      'GET /producer/settings',
      'PUT /producer/settings',
      'GET /health/readiness-score',
    ],
    keyEntities: ['Service', 'TenantUser', 'TenantSettings', 'Analytics'],
    criticalJourneys: [
      'Create and publish a new service',
      'Configure service workflow and form fields',
      'Invite and assign officer roles',
      'View analytics and SLA reports',
      'Update white-label settings',
      'View enterprise readiness score',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['desktop', 'tablet'],
    darkModeCoverageNeeded: true,
    accessibilityChecks: [
      'Form builder drag-and-drop keyboard accessible',
      'Data tables with pagination accessible',
      'Modal dialogs focus-trapped',
    ],
    automationLevel: 'partial',
    automationTests: ['e2e/admin-journey.spec.ts'],
    manualTests: [
      'Full service creation wizard',
      'White-label branding preview',
      'Analytics chart readability',
      'Audit trail export',
    ],
    releaseBlockers: [],
    knownRisks: [
      { description: 'Form builder state loss on page refresh', severity: 'high' },
    ],
  },

  // ── Scalability / Queue ──────────────────────────────────────────────────────
  {
    id: 'scalability',
    name: 'Scalability, Queue & Health',
    owner: 'Platform Team',
    purpose: 'Manages queue processing, cache, and system health endpoints.',
    roles: ['admin'],
    keyScreens: ['/admin/operations', '/admin/readiness'],
    keyAPIs: [
      'GET /health',
      'GET /ready',
      'GET /live',
      'GET /metrics',
      'GET /readiness-score',
      'GET /admin/scalability/summary',
      'POST /admin/scalability/queue/pause',
      'POST /admin/scalability/queue/resume',
    ],
    keyEntities: ['QueueJob', 'CacheEntry', 'ScalabilityConfig'],
    criticalJourneys: [
      'Health check passes (liveness + readiness probes)',
      'Queue pause/resume by admin',
      'Cache hit/miss metrics visible',
      'Enterprise readiness score computed correctly',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['desktop'],
    darkModeCoverageNeeded: false,
    accessibilityChecks: ['Metrics dashboard tables accessible'],
    automationLevel: 'full',
    automationTests: ['backend/src/scalability/health.controller.spec.ts'],
    manualTests: [
      'Queue stress test with 1000 concurrent jobs',
      'Cache expiry and stale-while-revalidate behavior',
    ],
    releaseBlockers: [],
    knownRisks: [
      { description: 'Redis unavailable falls back to memory — no alerting', severity: 'medium' },
    ],
  },

  // ── Installation / Bootstrap ─────────────────────────────────────────────────
  {
    id: 'installation',
    name: 'Installation & Bootstrap',
    owner: 'DevOps Team',
    purpose: 'One-command installer, first-run bootstrap, upgrade, and rollback.',
    roles: ['admin'],
    keyScreens: ['/admin/readiness'],
    keyAPIs: ['GET /readiness-score', 'GET /ready'],
    keyEntities: ['Tenant', 'User (bootstrap admin)'],
    criticalJourneys: [
      'Fresh install with ./install.sh succeeds',
      'Pre-install validation passes all checks',
      'Post-install validation passes',
      'Upgrade without data loss',
      'Rollback restores previous state',
    ],
    schemaChangesInvolved: true,
    responsiveCoverageNeeded: ['desktop'],
    darkModeCoverageNeeded: false,
    accessibilityChecks: [],
    automationLevel: 'partial',
    automationTests: ['deployment/scripts/validate.sh'],
    manualTests: [
      'Clean VM install from scratch',
      'Upgrade across 2 versions',
      'Rollback after failed migration',
      'Air-gapped install with pre-pulled images',
    ],
    releaseBlockers: [],
    knownRisks: [
      { description: 'DB migration failure during upgrade leaves app in broken state', severity: 'critical' },
    ],
  },

  // ── Audit ────────────────────────────────────────────────────────────────────
  {
    id: 'audit',
    name: 'Audit Trail',
    owner: 'Compliance Team',
    purpose: 'Immutable audit log for all mutations. DPDP Act 2023 compliance.',
    roles: ['admin'],
    keyScreens: ['/admin/audit'],
    keyAPIs: ['GET /producer/audit'],
    keyEntities: ['AuditLog'],
    criticalJourneys: [
      'Application status change creates audit entry',
      'Admin views full audit trail with filters',
      'Audit export for compliance',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['desktop'],
    darkModeCoverageNeeded: true,
    accessibilityChecks: ['Audit table has correct aria-sort attributes'],
    automationLevel: 'none',
    automationTests: [],
    manualTests: ['Full audit trail after application lifecycle', 'Export audit log to CSV'],
    releaseBlockers: [],
    knownRisks: [
      { description: 'Audit entries not created for all mutations', severity: 'critical' },
    ],
  },

  // ── Tenant Settings ──────────────────────────────────────────────────────────
  {
    id: 'tenant-settings',
    name: 'Tenant Settings & White-label',
    owner: 'Product Team',
    purpose: 'Tenant-level configuration including branding, email, SSO, and feature flags.',
    roles: ['admin'],
    keyScreens: ['/admin/whitelabel', '/settings'],
    keyAPIs: ['GET /producer/settings', 'PUT /producer/settings'],
    keyEntities: ['TenantSettings'],
    criticalJourneys: [
      'Update logo and primary color',
      'Save SMTP settings',
      'Enable/disable feature flags',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['desktop', 'tablet'],
    darkModeCoverageNeeded: true,
    accessibilityChecks: ['Color picker accessible', 'Settings form labels correct'],
    automationLevel: 'none',
    automationTests: [],
    manualTests: [
      'White-label preview matches saved settings',
      'Email test on SMTP save',
    ],
    releaseBlockers: [],
    knownRisks: [],
  },

  // ── Public / Legal ────────────────────────────────────────────────────────────
  {
    id: 'public-pages',
    name: 'Public Website & Legal Pages',
    owner: 'Marketing / Legal',
    purpose: 'Landing page, pricing, about, FAQ, privacy policy, terms, cookie policy.',
    roles: ['public'],
    keyScreens: ['/', '/about', '/pricing', '/faq', '/privacy', '/terms', '/cookies', '/contact'],
    keyAPIs: [],
    keyEntities: [],
    criticalJourneys: [
      'User lands on homepage and sees CTA',
      'User navigates to pricing',
      'User reads privacy policy',
      'User submits contact form',
    ],
    schemaChangesInvolved: false,
    responsiveCoverageNeeded: ['mobile', 'tablet', 'desktop'],
    darkModeCoverageNeeded: true,
    accessibilityChecks: [
      'All links have accessible names',
      'Headings in logical order',
      'Images have alt text',
      'Color contrast WCAG AA',
    ],
    automationLevel: 'partial',
    automationTests: ['e2e/landing.spec.ts', 'e2e/responsive.spec.ts', 'e2e/accessibility.spec.ts'],
    manualTests: ['Cookie consent banner behavior', 'Contact form submission'],
    releaseBlockers: [],
    knownRisks: [],
  },
];

// ── Utility: get module by id ─────────────────────────────────────────────────
export function getModuleById(id: string): QAModule | undefined {
  return MODULE_QA_MANIFEST.find((m) => m.id === id);
}

// ── Utility: compute summary stats ────────────────────────────────────────────
export function getManifestSummary() {
  const total = MODULE_QA_MANIFEST.length;
  const fullyAutomated = MODULE_QA_MANIFEST.filter((m) => m.automationLevel === 'full').length;
  const partial = MODULE_QA_MANIFEST.filter((m) => m.automationLevel === 'partial').length;
  const manual = MODULE_QA_MANIFEST.filter((m) => m.automationLevel === 'manual' || m.automationLevel === 'none').length;
  const criticalRisks = MODULE_QA_MANIFEST.flatMap((m) =>
    m.knownRisks.filter((r) => r.severity === 'critical')
  ).length;
  const highRisks = MODULE_QA_MANIFEST.flatMap((m) =>
    m.knownRisks.filter((r) => r.severity === 'high')
  ).length;

  return { total, fullyAutomated, partial, manual, criticalRisks, highRisks };
}
