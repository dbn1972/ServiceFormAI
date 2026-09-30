import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('../pages/LandingPage'));
const Login = lazy(() => import('../pages/Login'));
const Registration = lazy(() => import('../pages/Registration'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const OAuthCallback = lazy(() => import('../pages/OAuthCallback'));
const AadhaarOTPLogin = lazy(() => import('../pages/AadhaarOTPLogin'));

// Public pages
const AboutUs = lazy(() => import('../pages/AboutUs'));
const AccessibilityGuide = lazy(() => import('../pages/AccessibilityGuide'));
const Features = lazy(() => import('../pages/Features'));
const DeveloperPortal = lazy(() => import('../pages/DeveloperPortal'));
const Install = lazy(() => import('../pages/Install'));
const ContactUs = lazy(() => import('../pages/ContactUs'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const CookiePolicy = lazy(() => import('../pages/CookiePolicy'));
const FAQ = lazy(() => import('../pages/FAQ'));
const HelpCenter = lazy(() => import('../pages/HelpCenter'));
const Pricing = lazy(() => import('../pages/Pricing'));

// Protected - Citizen pages
const CitizenDashboard = lazy(() => import('../pages/CitizenDashboard'));
const CitizenOnboarding = lazy(() => import('../pages/CitizenOnboarding'));
const ServiceCatalog = lazy(() => import('../pages/ServiceCatalog'));
const ServiceDetail = lazy(() => import('../pages/ServiceDetail'));
const ServiceComparison = lazy(() => import('../pages/ServiceComparison'));
const CitizenServiceFeed = lazy(() => import('../pages/CitizenServiceFeed'));
const SearchResults = lazy(() => import('../pages/SearchResults'));
const ApplicationJourney = lazy(() => import('../pages/ApplicationJourney'));
const ApplicationHistory = lazy(() => import('../pages/ApplicationHistory'));
const ApplicationCaseHistory = lazy(() => import('../pages/ApplicationCaseHistory'));
const ApplicationConfirmation = lazy(() => import('../pages/ApplicationConfirmation'));
const ApplicationDraftEdit = lazy(() => import('../pages/ApplicationDraftEdit'));
const StatusFlow = lazy(() => import('../pages/StatusFlow'));
const DocumentUpload = lazy(() => import('../pages/DocumentUpload'));
const DocumentTemplates = lazy(() => import('../pages/DocumentTemplates'));
const PaymentGateway = lazy(() => import('../pages/PaymentGateway'));
const CertificateDownload = lazy(() => import('../pages/CertificateDownload'));
const DigiLockerWallet = lazy(() => import('../pages/DigiLockerWallet'));
const GrievanceJourney = lazy(() => import('../pages/GrievanceJourney'));
const GrievanceDetail = lazy(() => import('../pages/GrievanceDetail'));
const AppealJourney = lazy(() => import('../pages/AppealJourney'));
const AppointmentBooking = lazy(() => import('../pages/AppointmentBooking'));
const FeedbackRating = lazy(() => import('../pages/FeedbackRating'));
const CitizenProfile = lazy(() => import('../pages/CitizenProfile'));
const NotificationsCenter = lazy(() => import('../pages/NotificationsCenter'));
const Settings = lazy(() => import('../pages/Settings'));
const EmailPreferences = lazy(() => import('../pages/EmailPreferences'));
const CitizenReports = lazy(() => import('../pages/CitizenReports'));
const LiveChatSupport = lazy(() => import('../pages/LiveChatSupport'));
const TutorialGuide = lazy(() => import('../pages/TutorialGuide'));
const DPDPPrivacyCenter = lazy(() => import('../pages/DPDPPrivacyCenter'));
const ConsentManagement = lazy(() => import('../pages/ConsentManagement'));

// Protected - Officer pages
const OfficerDashboard = lazy(() => import('../pages/OfficerDashboard'));
const OfficerQueue = lazy(() => import('../pages/OfficerQueue'));
const OfficerApplicationDetail = lazy(() => import('../pages/OfficerApplicationDetail'));
const DocumentVerificationInterface = lazy(() => import('../pages/DocumentVerificationInterface'));

// Protected - Admin pages
const AdminAnalytics = lazy(() => import('../pages/AdminAnalytics'));
const DepartmentDashboard = lazy(() => import('../pages/DepartmentDashboard'));
const DepartmentServiceConfig = lazy(() => import('../pages/DepartmentServiceConfig'));
const GovernanceConsole = lazy(() => import('../pages/GovernanceConsole'));
const TenantWorkflow = lazy(() => import('../pages/TenantWorkflow'));
const TenantOnboarding = lazy(() => import('../pages/TenantOnboarding'));
const TenantDashboard = lazy(() => import('../pages/TenantDashboard'));
const WhiteLabelSettings = lazy(() => import('../pages/WhiteLabelSettings'));
const ServiceCreationWizard = lazy(() => import('../pages/ServiceCreationWizard'));
const ServiceWorkflowConfig = lazy(() => import('../pages/ServiceWorkflowConfig'));
const FormBuilder = lazy(() => import('../pages/FormBuilder'));
const WorkflowEngine = lazy(() => import('../pages/WorkflowEngine'));
const RulesEngineConfig = lazy(() => import('../pages/RulesEngineConfig'));
const EligibilityEngine = lazy(() => import('../pages/EligibilityEngine'));
const APIIntegrationWizard = lazy(() => import('../pages/APIIntegrationWizard'));
const PluginMarketplace = lazy(() => import('../pages/PluginMarketplace'));
const ManifestStudio = lazy(() => import('../pages/ManifestStudio'));
const RedressQueue = lazy(() => import('../pages/RedressQueue'));
const TemplateBrowser = lazy(() => import('../pages/TemplateBrowser'));
const AuditTrail = lazy(() => import('../pages/AuditTrail'));
const SLAWarRoom = lazy(() => import('../pages/SLAWarRoom'));
const QueueOperations = lazy(() => import('../pages/QueueOperations'));
const OperationalIntelligence = lazy(() => import('../pages/OperationalIntelligence'));
const AdvancedAnalytics = lazy(() => import('../pages/AdvancedAnalytics'));
const EnterpriseReadinessDashboard = lazy(() => import('../pages/EnterpriseReadinessDashboard'));
const QADashboard = lazy(() => import('../pages/QADashboard'));
const MultiLanguage = lazy(() => import('../pages/MultiLanguage'));

// Design System pages (internal - not routed)
const DesignSystem = lazy(() => import('../pages/DesignSystem'));
const Cover = lazy(() => import('../pages/Cover'));

// Other
const OTPVerification = lazy(() => import('../pages/OTPVerification'));
const NotFound = lazy(() => import('../pages/NotFound'));

export const routes: RouteObject[] = [
  // Public routes
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Registration />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/auth/callback/:provider',
    element: <OAuthCallback />,
  },
  {
    path: '/auth/aadhaar-otp',
    element: <AadhaarOTPLogin />,
  },
  {
    path: '/otp-verify',
    element: <OTPVerification />,
  },

  // Public info pages
  {
    path: '/about',
    element: <AboutUs />,
  },
  {
    path: '/features',
    element: <Features />,
  },
  {
    path: '/developers',
    element: <DeveloperPortal />,
  },
  {
    path: '/install',
    element: <Install />,
  },
  {
    path: '/contact',
    element: <ContactUs />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/terms',
    element: <TermsOfService />,
  },
  {
    path: '/cookies',
    element: <CookiePolicy />,
  },
  {
    path: '/faq',
    element: <FAQ />,
  },
  {
    path: '/help',
    element: <HelpCenter />,
  },
  {
    path: '/accessibility-guide',
    element: <AccessibilityGuide />,
  },
  {
    path: '/pricing',
    element: <Pricing />,
  },

  // Protected - Citizen routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <CitizenDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding/citizen',
    element: (
      <ProtectedRoute>
        <CitizenOnboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/services',
    element: (
      <ProtectedRoute>
        <ServiceCatalog />
      </ProtectedRoute>
    ),
  },
  {
    path: '/discover/feed',
    element: (
      <ProtectedRoute>
        <CitizenServiceFeed />
      </ProtectedRoute>
    ),
  },
  {
    path: '/services/:id',
    element: (
      <ProtectedRoute>
        <ServiceDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/eligibility/:serviceId',
    element: (
      <ProtectedRoute>
        <EligibilityEngine />
      </ProtectedRoute>
    ),
  },
  {
    path: '/services/compare',
    element: (
      <ProtectedRoute>
        <ServiceComparison />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search',
    element: (
      <ProtectedRoute>
        <SearchResults />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications',
    element: (
      <ProtectedRoute>
        <ApplicationHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/new',
    element: (
      <ProtectedRoute>
        <ApplicationJourney />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id',
    element: (
      <ProtectedRoute>
        <StatusFlow />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id/history',
    element: (
      <ProtectedRoute>
        <ApplicationCaseHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id/edit',
    element: (
      <ProtectedRoute>
        <ApplicationDraftEdit />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id/confirmation',
    element: (
      <ProtectedRoute>
        <ApplicationConfirmation />
      </ProtectedRoute>
    ),
  },
  {
    path: '/documents/upload',
    element: (
      <ProtectedRoute>
        <DocumentUpload />
      </ProtectedRoute>
    ),
  },
  {
    path: '/documents/templates',
    element: (
      <ProtectedRoute>
        <DocumentTemplates />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment',
    element: (
      <ProtectedRoute>
        <PaymentGateway />
      </ProtectedRoute>
    ),
  },
  {
    path: '/certificates/:id',
    element: (
      <ProtectedRoute>
        <CertificateDownload />
      </ProtectedRoute>
    ),
  },
  {
    path: '/digilocker',
    element: (
      <ProtectedRoute>
        <DigiLockerWallet />
      </ProtectedRoute>
    ),
  },
  {
    path: '/grievances',
    element: (
      <ProtectedRoute>
        <GrievanceJourney />
      </ProtectedRoute>
    ),
  },
  {
    path: '/grievances/:id',
    element: (
      <ProtectedRoute>
        <GrievanceDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/appeals',
    element: (
      <ProtectedRoute>
        <AppealJourney />
      </ProtectedRoute>
    ),
  },
  {
    path: '/appointments',
    element: (
      <ProtectedRoute>
        <AppointmentBooking />
      </ProtectedRoute>
    ),
  },
  {
    path: '/feedback',
    element: (
      <ProtectedRoute>
        <FeedbackRating />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <CitizenProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <NotificationsCenter />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/email',
    element: (
      <ProtectedRoute>
        <EmailPreferences />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <CitizenReports />
      </ProtectedRoute>
    ),
  },
  {
    path: '/support',
    element: (
      <ProtectedRoute>
        <LiveChatSupport />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tutorial',
    element: (
      <ProtectedRoute>
        <TutorialGuide />
      </ProtectedRoute>
    ),
  },
  {
    path: '/privacy-center',
    element: (
      <ProtectedRoute>
        <DPDPPrivacyCenter />
      </ProtectedRoute>
    ),
  },
  {
    path: '/consent',
    element: (
      <ProtectedRoute>
        <ConsentManagement />
      </ProtectedRoute>
    ),
  },

  // Protected - Officer routes
  {
    path: '/officer/dashboard',
    element: (
      <ProtectedRoute requireOfficer>
        <OfficerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/officer/queue',
    element: (
      <ProtectedRoute requireOfficer>
        <OfficerQueue />
      </ProtectedRoute>
    ),
  },
  {
    path: '/officer/applications/:id',
    element: (
      <ProtectedRoute requireOfficer>
        <OfficerApplicationDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/officer/verify-documents',
    element: (
      <ProtectedRoute requireOfficer>
        <DocumentVerificationInterface />
      </ProtectedRoute>
    ),
  },

  // Protected - Admin routes
  {
    path: '/admin/analytics',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminAnalytics />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/advanced-analytics',
    element: (
      <ProtectedRoute requireAdmin>
        <AdvancedAnalytics />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/department',
    element: (
      <ProtectedRoute requireAdmin>
        <DepartmentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/department/services',
    element: (
      <ProtectedRoute requireAdmin>
        <DepartmentServiceConfig />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/governance',
    element: (
      <ProtectedRoute requireAdmin>
        <GovernanceConsole />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/tenants',
    element: (
      <ProtectedRoute requireAdmin>
        <TenantWorkflow />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/tenants/onboarding',
    element: (
      <ProtectedRoute requireAdmin>
        <TenantOnboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/tenants/dashboard',
    element: (
      <ProtectedRoute requireAdmin>
        <TenantDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/templates',
    element: (
      <ProtectedRoute requireAdmin>
        <TemplateBrowser />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/whitelabel',
    element: (
      <ProtectedRoute requireAdmin>
        <WhiteLabelSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/localization',
    element: (
      <ProtectedRoute requireAdmin>
        <MultiLanguage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/services/create',
    element: (
      <ProtectedRoute requireAdmin>
        <ServiceCreationWizard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/services/workflow',
    element: (
      <ProtectedRoute requireAdmin>
        <ServiceWorkflowConfig />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/form-builder',
    element: (
      <ProtectedRoute requireAdmin>
        <FormBuilder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/workflow-engine',
    element: (
      <ProtectedRoute requireAdmin>
        <WorkflowEngine />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/rules-engine',
    element: (
      <ProtectedRoute requireAdmin>
        <RulesEngineConfig />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/eligibility-engine',
    element: (
      <ProtectedRoute requireAdmin>
        <EligibilityEngine />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/api-integration',
    element: (
      <ProtectedRoute requireAdmin>
        <APIIntegrationWizard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/plugins',
    element: (
      <ProtectedRoute requireAdmin>
        <PluginMarketplace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/manifest',
    element: (
      <ProtectedRoute requireAdmin>
        <ManifestStudio />
      </ProtectedRoute>
    ),
  },
  {
    path: '/producer/redress',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'officer', 'reviewer']}>
        <RedressQueue />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/audit',
    element: (
      <ProtectedRoute requireAdmin>
        <AuditTrail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/sla',
    element: (
      <ProtectedRoute requireAdmin>
        <SLAWarRoom />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/queue',
    element: (
      <ProtectedRoute requireAdmin>
        <QueueOperations />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/operations',
    element: (
      <ProtectedRoute requireAdmin>
        <OperationalIntelligence />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/readiness',
    element: (
      <ProtectedRoute requireAdmin>
        <EnterpriseReadinessDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/qa',
    element: (
      <ProtectedRoute requireAdmin>
        <QADashboard />
      </ProtectedRoute>
    ),
  },

  // Tenant aliases for existing admin workspace pages
  {
    path: '/tenant/onboarding',
    element: (
      <ProtectedRoute requireAdmin>
        <TenantOnboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/dashboard',
    element: (
      <ProtectedRoute requireAdmin>
        <TenantDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/templates',
    element: (
      <ProtectedRoute requireAdmin>
        <TemplateBrowser />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/service/create',
    element: (
      <ProtectedRoute requireAdmin>
        <ServiceCreationWizard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/service/workflow',
    element: (
      <ProtectedRoute requireAdmin>
        <ServiceWorkflowConfig />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/settings',
    element: (
      <ProtectedRoute requireAdmin>
        <WhiteLabelSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/white-label',
    element: (
      <ProtectedRoute requireAdmin>
        <WhiteLabelSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/analytics',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminAnalytics />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant/api-integration/new',
    element: (
      <ProtectedRoute requireAdmin>
        <APIIntegrationWizard />
      </ProtectedRoute>
    ),
  },

  // Design System (internal showcase - optional)
  {
    path: '/design-system',
    element: <DesignSystem />,
  },
  {
    path: '/design-system/cover',
    element: <Cover />,
  },

  // 404 Not Found (must be last)
  {
    path: '*',
    element: <NotFound />,
  },
];
