import { Wallet, Zap, Shield, Globe, BarChart3, GitBranch, Smartphone, Users, CheckCircle, Clock, FileText, Bell, Search, Lock } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function Features() {
  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-16 text-center">
          <h1 className="text-5xl font-bold mb-6">Everything You Need for Modern Service Delivery</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built on the Service Manifest Protocol, ServiceFormAI OS provides intelligent automation,
            document reuse, and transparent workflows out of the box.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Core Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">Core Platform Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Wallet,
                title: 'DigiLocker-First Architecture',
                description: 'Automatic document verification and reuse. Citizens never submit the same document twice. Integrated with DigiLocker API for instant access to Aadhaar, PAN, certificates, and more.',
                badge: 'Core Innovation',
              },
              {
                icon: Zap,
                title: 'Auto-Eligibility Checks',
                description: 'Machine-readable service manifests check eligibility in real-time using verified citizen data. Know if you qualify before you apply.',
                badge: 'AI-Powered',
              },
              {
                icon: GitBranch,
                title: 'Visual Workflow Engine',
                description: 'No-code workflow builder for officers. Design approval flows, set SLA rules, configure auto-approvals, and route applications intelligently.',
                badge: 'No-Code',
              },
              {
                icon: Search,
                title: 'Intelligent Service Discovery',
                description: 'Personalized service recommendations based on citizen profile, age, income, location, and past applications. Federated search across all government levels.',
                badge: 'Smart Matching',
              },
              {
                icon: FileText,
                title: 'Form Builder & Pre-fill',
                description: 'Drag-and-drop form designer with DigiLocker field mapping. Forms auto-populate from verified documents, saving 80% of citizen effort.',
                badge: 'Time Saver',
              },
              {
                icon: Bell,
                title: 'Real-Time Status Tracking',
                description: 'Live application status with SMS/email notifications. Citizens see exactly where their application is and what happens next.',
                badge: 'Transparency',
              },
              {
                icon: Shield,
                title: 'Consent Management',
                description: 'GDPR-compliant consent framework. Citizens control which departments access their data, for how long, and can revoke anytime.',
                badge: 'Privacy-First',
              },
              {
                icon: BarChart3,
                title: 'Analytics & Insights',
                description: 'Department-wide dashboards, officer performance metrics, SLA tracking, and AI-powered recommendations for resource allocation.',
                badge: 'Data-Driven',
              },
              {
                icon: Globe,
                title: 'Multi-Language Support',
                description: '8 Indian languages out of the box (English, Hindi, Marathi, Tamil, Telugu, Gujarati, Kannada, Bengali). Add more as needed.',
                badge: 'Inclusive',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Citizen Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">For Citizens</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-8">
              <Smartphone className="w-12 h-12 text-success mb-4" />
              <h3 className="text-xl font-semibold mb-4">Mobile-First Experience</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Works on 2G/3G networks with low-bandwidth mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Offline drafts sync when connection returns</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Touch-optimized for small screens</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>PWA support for app-like experience</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-xl p-8">
              <Users className="w-12 h-12 text-info mb-4" />
              <h3 className="text-xl font-semibold mb-4">Accessibility Built-In</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <span>WCAG 2.1 AA compliant for screen readers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <span>High contrast mode and dark theme</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <span>Text-to-speech for low-literacy users</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <span>CSC operator mode for assisted applications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Officer Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">For Officers & Departments</h2>

          <div className="bg-card border border-border rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Clock className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold mb-3">Smart Queue Management</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• SLA-based priority sorting</li>
                  <li>• Auto-assignment by workload</li>
                  <li>• Bulk approve/reject actions</li>
                  <li>• Filters by service, status, date</li>
                </ul>
              </div>

              <div>
                <FileText className="w-10 h-10 text-success mb-4" />
                <h3 className="font-semibold mb-3">Document Verification</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• DigiLocker auto-verification</li>
                  <li>• Side-by-side document viewer</li>
                  <li>• Deficiency templates</li>
                  <li>• Audit trail for every action</li>
                </ul>
              </div>

              <div>
                <BarChart3 className="w-10 h-10 text-info mb-4" />
                <h3 className="font-semibold mb-3">Performance Analytics</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Officer leaderboards</li>
                  <li>• Approval rate tracking</li>
                  <li>• SLA compliance reports</li>
                  <li>• Citizen satisfaction scores</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Integration & Security */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">Enterprise-Grade Security & Integration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-border rounded-xl p-8">
              <Lock className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-4">Bank-Level Security</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>AES-256 encryption at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>TLS 1.3 for all API calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>SOC 2 Type II certified</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Regular security audits</span>
                </li>
              </ul>
            </div>

            <div className="border border-border rounded-xl p-8">
              <Globe className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4">API-First Integration</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>RESTful APIs with OpenAPI spec</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Webhooks for real-time events</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Pre-built DigiLocker connector</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Plugin marketplace for extensions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">See All Features in Action</h2>
          <p className="text-xl mb-8 opacity-90">
            Book a personalized demo with our team
          </p>
          <button className="px-8 py-4 bg-white text-primary rounded-lg font-medium text-lg hover:bg-gray-100">
            Request Demo
          </button>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}