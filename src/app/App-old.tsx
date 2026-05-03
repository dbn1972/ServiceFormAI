// @ts-nocheck -- legacy file, superseded by App.tsx
import { useState } from 'react';
import { Menu, X, Home, Map, Palette, Smartphone, Wallet, FileText, TrendingUp, AlertCircle, Building2, MapPin, FileCode, Globe, Package, Shield, PlayCircle, Layout, BookOpen, Edit, Eye, UserPlus, BarChart3, Search, Lock, Languages, Zap, Users, Tablet, Grid3x3, Moon, Ruler, Table2, User, Bell, GitBranch, Settings as SettingsIcon, Image, MessageCircle, Code, Sparkles, Layers, Type, Terminal, Briefcase, UserCog, Building, Info, Mail, LogIn, UserPlus as RegisterIcon, CheckCircle, Upload, CreditCard, HelpCircle, BookOpen as HelpIcon, IndianRupee, ArrowLeftRight, List, Download, Award, ClipboardEdit, ShieldCheck, MessageCircleMore, Calendar, Star } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Toaster } from './components/ui/sonner';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import AccessibilityToolbox from './components/AccessibilityToolbox';
import AccessibilityTrigger from './components/AccessibilityTrigger';
import Cover from './pages/Cover';
import EcosystemMap from './pages/EcosystemMap';
import DesignSystem from './pages/DesignSystem';
import CitizenServiceFeed from './pages/CitizenServiceFeed';
import DigiLockerWallet from './pages/DigiLockerWallet';
import ApplicationJourney from './pages/ApplicationJourney';
import StatusFlow from './pages/StatusFlow';
import GrievanceJourney from './pages/GrievanceJourney';
import TenantWorkflow from './pages/TenantWorkflow';
import MunicipalityPack from './pages/MunicipalityPack';
import ManifestStudio from './pages/ManifestStudio';
import ConsumerPortal from './pages/ConsumerPortal';
import PluginMarketplace from './pages/PluginMarketplace';
import GovernanceConsole from './pages/GovernanceConsole';
import PrototypeFlows from './pages/PrototypeFlows';
import ResponsiveLayouts from './pages/ResponsiveLayouts';
import DesignAnnotations from './pages/DesignAnnotations';
import FormBuilder from './pages/FormBuilder';
import OfficerApplicationDetail from './pages/OfficerApplicationDetail';
import CitizenOnboarding from './pages/CitizenOnboarding';
import AdminAnalytics from './pages/AdminAnalytics';
import ServiceCatalog from './pages/ServiceCatalog';
import ConsentManagement from './pages/ConsentManagement';
import MultiLanguage from './pages/MultiLanguage';
import LowBandwidth from './pages/LowBandwidth';
import CSCOperatorInterface from './pages/CSCOperatorInterface';
import MobileAppVariants from './pages/MobileAppVariants';
import ComponentStates from './pages/ComponentStates';
import DarkMode from './pages/DarkMode';
import DesignTokens from './pages/DesignTokens';
import DataVariations from './pages/DataVariations';
import CitizenProfile from './pages/CitizenProfile';
import WorkflowEngine from './pages/WorkflowEngine';
import NotificationsCenter from './pages/NotificationsCenter';
import Settings from './pages/Settings';
import IconographyLibrary from './pages/IconographyLibrary';
import MotionDesign from './pages/MotionDesign';
import AccessibilityGuide from './pages/AccessibilityGuide';
import ErrorMessagesLibrary from './pages/ErrorMessagesLibrary';
import EmptyStates from './pages/EmptyStates';
import BrandGuidelines from './pages/BrandGuidelines';
import DeveloperHandoff from './pages/DeveloperHandoff';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import AboutUs from './pages/AboutUs';
import Features from './pages/Features';
import ContactUs from './pages/ContactUs';
import TermsOfService from './pages/TermsOfService';
import Login from './pages/Login';
import Registration from './pages/Registration';
import ServiceDetail from './pages/ServiceDetail';
import ApplicationConfirmation from './pages/ApplicationConfirmation';
import DocumentUpload from './pages/DocumentUpload';
import SearchResults from './pages/SearchResults';
import PaymentGateway from './pages/PaymentGateway';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FAQ from './pages/FAQ';
import HelpCenter from './pages/HelpCenter';
import Pricing from './pages/Pricing';
import ServiceComparison from './pages/ServiceComparison';
import OfficerQueue from './pages/OfficerQueue';
import DepartmentServiceConfig from './pages/DepartmentServiceConfig';
import GrievanceDetail from './pages/GrievanceDetail';
import CertificateDownload from './pages/CertificateDownload';
import ApplicationDraftEdit from './pages/ApplicationDraftEdit';
import DocumentVerificationInterface from './pages/DocumentVerificationInterface';
import LiveChatSupport from './pages/LiveChatSupport';
import ApplicationHistory from './pages/ApplicationHistory';
import AppointmentBooking from './pages/AppointmentBooking';
import FeedbackRating from './pages/FeedbackRating';
import DocumentTemplates from './pages/DocumentTemplates';
import CitizenReports from './pages/CitizenReports';
import OTPVerification from './pages/OTPVerification';
import EmailPreferences from './pages/EmailPreferences';
import TutorialGuide from './pages/TutorialGuide';
import TenantOnboarding from './pages/TenantOnboarding';
import EligibilityEngine from './pages/EligibilityEngine';
import AuditTrail from './pages/AuditTrail';
import SLAWarRoom from './pages/SLAWarRoom';
import RulesEngineConfig from './pages/RulesEngineConfig';
import DPDPPrivacyCenter from './pages/DPDPPrivacyCenter';
import OperationalIntelligence from './pages/OperationalIntelligence';
import LandingPage from './pages/LandingPage';
import OAuthCallback from './pages/OAuthCallback';
import AadhaarOTPLogin from './pages/AadhaarOTPLogin';
import CookiePolicy from './pages/CookiePolicy';

const pages = [
  { id: 'cover', name: 'Cover', icon: Home, component: Cover },
  { id: 'ecosystem', name: 'Ecosystem Map', icon: Map, component: EcosystemMap },
  { id: 'design-system', name: 'Design System', icon: Palette, component: DesignSystem },
  { id: 'citizen-feed', name: 'Citizen Service Feed', icon: Smartphone, component: CitizenServiceFeed },
  { id: 'wallet', name: 'DigiLocker Wallet', icon: Wallet, component: DigiLockerWallet },
  { id: 'application', name: 'Application Journey', icon: FileText, component: ApplicationJourney },
  { id: 'status', name: 'Status & Deficiency', icon: TrendingUp, component: StatusFlow },
  { id: 'grievance', name: 'Grievance Journey', icon: AlertCircle, component: GrievanceJourney },
  { id: 'tenant', name: 'Tenant Workflow OS', icon: Building2, component: TenantWorkflow },
  { id: 'tenant-onboarding', name: 'Tenant Self-Onboarding', icon: UserPlus, component: TenantOnboarding },
  { id: 'eligibility-engine', name: 'Eligibility Discovery Engine', icon: Sparkles, component: EligibilityEngine },
  { id: 'audit-trail', name: 'Audit Trail & Consent Ledger', icon: Shield, component: AuditTrail },
  { id: 'sla-war-room', name: 'SLA War Room', icon: Zap, component: SLAWarRoom },
  { id: 'rules-engine', name: 'Rules Engine Config', icon: GitBranch, component: RulesEngineConfig },
  { id: 'dpdp-privacy', name: 'DPDP Privacy Centre', icon: Lock, component: DPDPPrivacyCenter },
  { id: 'ops-intelligence', name: 'Operational Intelligence', icon: Sparkles, component: OperationalIntelligence },
  { id: 'municipality', name: 'Municipality Pack', icon: MapPin, component: MunicipalityPack },
  { id: 'manifest', name: 'Manifest Studio', icon: FileCode, component: ManifestStudio },
  { id: 'consumer', name: 'Consumer Portal', icon: Globe, component: ConsumerPortal },
  { id: 'plugins', name: 'Plugin Marketplace', icon: Package, component: PluginMarketplace },
  { id: 'governance', name: 'Governance Console', icon: Shield, component: GovernanceConsole },
  { id: 'prototypes', name: 'Prototype Flows', icon: PlayCircle, component: PrototypeFlows },
  { id: 'responsive', name: 'Responsive Layouts', icon: Layout, component: ResponsiveLayouts },
  { id: 'annotations', name: 'Design Annotations', icon: BookOpen, component: DesignAnnotations },
  { id: 'form-builder', name: 'Form Builder', icon: Edit, component: FormBuilder },
  { id: 'officer-detail', name: 'Officer App Detail', icon: Eye, component: OfficerApplicationDetail },
  { id: 'onboarding', name: 'Citizen Onboarding', icon: UserPlus, component: CitizenOnboarding },
  { id: 'analytics', name: 'Admin Analytics', icon: BarChart3, component: AdminAnalytics },
  { id: 'catalog', name: 'Service Catalog', icon: Search, component: ServiceCatalog },
  { id: 'consent', name: 'Consent Management', icon: Lock, component: ConsentManagement },
  { id: 'multilang', name: 'Multi-Language', icon: Languages, component: MultiLanguage },
  { id: 'lowband', name: 'Low-Bandwidth Mode', icon: Zap, component: LowBandwidth },
  { id: 'csc', name: 'CSC Operator', icon: Users, component: CSCOperatorInterface },
  { id: 'mobile-variants', name: 'Mobile App Variants', icon: Tablet, component: MobileAppVariants },
  { id: 'component-states', name: 'Component States', icon: Grid3x3, component: ComponentStates },
  { id: 'dark-mode', name: 'Dark Mode', icon: Moon, component: DarkMode },
  { id: 'design-tokens', name: 'Design Tokens', icon: Ruler, component: DesignTokens },
  { id: 'data-variations', name: 'Data Variations', icon: Table2, component: DataVariations },
  { id: 'citizen-profile', name: 'Citizen Profile', icon: User, component: CitizenProfile },
  { id: 'workflow-engine', name: 'Workflow Engine', icon: GitBranch, component: WorkflowEngine },
  { id: 'notifications', name: 'Notifications', icon: Bell, component: NotificationsCenter },
  { id: 'settings', name: 'Settings', icon: SettingsIcon, component: Settings },
  { id: 'iconography', name: 'Iconography Library', icon: Sparkles, component: IconographyLibrary },
  { id: 'motion', name: 'Motion Design', icon: Zap, component: MotionDesign },
  { id: 'accessibility', name: 'Accessibility Guide', icon: Eye, component: AccessibilityGuide },
  { id: 'error-messages', name: 'Error Messages', icon: AlertCircle, component: ErrorMessagesLibrary },
  { id: 'empty-states', name: 'Empty States', icon: Image, component: EmptyStates },
  { id: 'brand', name: 'Brand Guidelines', icon: Palette, component: BrandGuidelines },
  { id: 'developer', name: 'Developer Handoff', icon: Code, component: DeveloperHandoff },
  { id: 'citizen-dashboard', name: 'Citizen Dashboard', icon: Home, component: CitizenDashboard },
  { id: 'officer-dashboard', name: 'Officer Dashboard', icon: Briefcase, component: OfficerDashboard },
  { id: 'department-dashboard', name: 'Department Dashboard', icon: Building, component: DepartmentDashboard },
  { id: 'about', name: 'About Us', icon: Info, component: AboutUs },
  { id: 'features', name: 'Features', icon: Sparkles, component: Features },
  { id: 'contact', name: 'Contact Us', icon: Mail, component: ContactUs },
  { id: 'terms', name: 'Terms of Service', icon: FileText, component: TermsOfService },
  { id: 'privacy', name: 'Privacy Policy', icon: Shield, component: PrivacyPolicy },
  { id: 'pricing', name: 'Pricing', icon: IndianRupee, component: Pricing },
  { id: 'faq', name: 'FAQ', icon: HelpCircle, component: FAQ },
  { id: 'help-center', name: 'Help Center', icon: HelpIcon, component: HelpCenter },
  { id: 'landing', name: 'Landing Page', icon: Home, component: LandingPage },
  { id: 'login', name: 'Login', icon: LogIn, component: Login },
  { id: 'registration', name: 'Registration', icon: RegisterIcon, component: Registration },
  { id: 'oauth-callback', name: 'OAuth Callback', icon: Lock, component: OAuthCallback },
  { id: 'aadhaar-otp', name: 'Aadhaar OTP Login', icon: Shield, component: AadhaarOTPLogin },
  { id: 'cookies', name: 'Cookie Policy', icon: Shield, component: CookiePolicy },
  { id: 'service-detail', name: 'Service Detail', icon: Eye, component: ServiceDetail },
  { id: 'app-confirmation', name: 'Application Confirmation', icon: CheckCircle, component: ApplicationConfirmation },
  { id: 'document-upload', name: 'Document Upload', icon: Upload, component: DocumentUpload },
  { id: 'search-results', name: 'Search Results', icon: Search, component: SearchResults },
  { id: 'payment', name: 'Payment Gateway', icon: CreditCard, component: PaymentGateway },
  { id: 'service-comparison', name: 'Service Comparison', icon: ArrowLeftRight, component: ServiceComparison },
  { id: 'officer-queue', name: 'Officer Queue', icon: List, component: OfficerQueue },
  { id: 'dept-config', name: 'Department Config', icon: SettingsIcon, component: DepartmentServiceConfig },
  { id: 'grievance-detail', name: 'Grievance Detail', icon: AlertCircle, component: GrievanceDetail },
  { id: 'certificate-download', name: 'Certificate Download', icon: Download, component: CertificateDownload },
  { id: 'application-draft-edit', name: 'Application Draft Edit', icon: ClipboardEdit, component: ApplicationDraftEdit },
  { id: 'document-verification-interface', name: 'Document Verification Interface', icon: ShieldCheck, component: DocumentVerificationInterface },
  { id: 'live-chat-support', name: 'Live Chat Support', icon: MessageCircleMore, component: LiveChatSupport },
  { id: 'application-history', name: 'Application History', icon: FileText, component: ApplicationHistory },
  { id: 'appointment-booking', name: 'Appointment Booking', icon: Calendar, component: AppointmentBooking },
  { id: 'feedback-rating', name: 'Feedback Rating', icon: Star, component: FeedbackRating },
  { id: 'document-templates', name: 'Document Templates', icon: FileText, component: DocumentTemplates },
  { id: 'citizen-reports', name: 'Citizen Reports', icon: FileText, component: CitizenReports },
  { id: 'otp-verification', name: 'OTP Verification', icon: Lock, component: OTPVerification },
  { id: 'email-preferences', name: 'Email Preferences', icon: Mail, component: EmailPreferences },
  { id: 'tutorial-guide', name: 'Tutorial Guide', icon: BookOpen, component: TutorialGuide },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('cover');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const CurrentComponent = pages.find(p => p.id === currentPage)?.component || Cover;

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <AppProvider>
            <div className="h-screen w-full flex overflow-hidden bg-background">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-sidebar-border">
              <h1 className="text-lg font-semibold text-sidebar-foreground">ServiceFormAI OS</h1>
              <p className="text-sm text-muted-foreground mt-1">Design System</p>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {pages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        setCurrentPage(page.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        currentPage === page.id
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{page.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="p-4 border-t border-sidebar-border">
              <div className="px-4 py-3 bg-accent rounded-lg">
                <p className="text-xs font-medium text-accent-foreground">76 Pages</p>
                <p className="text-xs text-muted-foreground mt-1">Production-ready design system</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="lg:hidden flex items-center gap-4 px-4 py-4 border-b border-border bg-card">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold flex-1">{pages.find(p => p.id === currentPage)?.name}</h2>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 overflow-auto">
            <CurrentComponent />
          </div>
        </main>

        {/* Accessibility Toolbox & Trigger */}
        <AccessibilityToolbox />
        <AccessibilityTrigger />
      </div>
      <Toaster />
          </AppProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}