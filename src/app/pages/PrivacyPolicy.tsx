import { Shield, Eye, Lock, Database, UserCheck, Globe, Download, Mail } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <Shield className="w-16 h-16 text-primary mb-6" />
          <h1 className="text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: April 29, 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Important Notice */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <Eye className="w-6 h-6 text-info flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Your Privacy Matters</h3>
              <p className="text-sm text-muted-foreground">
                ServiceFormAI OS is committed to protecting your personal information. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your data when you use our platform.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-12">
          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <div className="prose max-w-none text-muted-foreground space-y-4">
              <p className="mb-4">We collect the following types of information:</p>

              <div className="bg-card border border-border rounded-lg p-6 mb-4">
                <h3 className="font-semibold mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Full name, date of birth, gender</li>
                  <li>Contact details (mobile number, email address, residential address)</li>
                  <li>Aadhaar number (when you link DigiLocker)</li>
                  <li>PAN card, driving license, and other identity documents</li>
                  <li>Bank account details for payment processing</li>
                  <li>Educational qualifications, employment information</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 mb-4">
                <h3 className="font-semibold mb-3">Technical Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>IP address, browser type, device information</li>
                  <li>Operating system, screen resolution</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Usage data (pages visited, time spent, features used)</li>
                  <li>Geolocation data (with your permission)</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-3">Application Data</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Service applications submitted</li>
                  <li>Documents uploaded (certificates, proofs, photographs)</li>
                  <li>Application status and history</li>
                  <li>Communication with government departments</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">We use your personal information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To process your service applications and requests</li>
                <li>To verify your identity and eligibility for services</li>
                <li>To communicate with you about your applications (SMS, email, push notifications)</li>
                <li>To provide personalized service recommendations</li>
                <li>To improve our platform and user experience</li>
                <li>To detect and prevent fraud, security threats, and technical issues</li>
                <li>To comply with legal obligations and respond to law enforcement requests</li>
                <li>To generate anonymized analytics and reports for government departments</li>
              </ul>
            </div>
          </section>

          {/* 3. Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Data Sharing & Disclosure</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">We share your information only in the following circumstances:</p>

              <div className="bg-card border border-border rounded-lg p-6 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  With Government Departments
                </h3>
                <p className="text-sm mb-3">
                  Your application data is shared with relevant government departments to process your service requests.
                  This sharing is based on explicit consent you provide during application submission.
                </p>
                <p className="text-sm">
                  <strong>Example:</strong> When you apply for a scholarship, your details are shared with the Education
                  Department for verification and approval.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-success" />
                  With DigiLocker
                </h3>
                <p className="text-sm">
                  When you link your DigiLocker account, we access your documents through DigiLocker APIs with your
                  consent. We do not store DigiLocker documents permanently—they are fetched in real-time when needed.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5 text-info" />
                  Third-Party Service Providers
                </h3>
                <ul className="text-sm space-y-2">
                  <li>• Payment gateways (for processing service fees)</li>
                  <li>• SMS and email service providers (for notifications)</li>
                  <li>• Cloud hosting providers (AWS, Azure - all data stored in India)</li>
                  <li>• Analytics providers (anonymized data only)</li>
                </ul>
                <p className="text-sm mt-3">
                  All third-party providers are contractually bound to protect your data and use it only for specified purposes.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Consent Management */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Consent Management</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                You have full control over your data through our Consent Management Dashboard:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View all departments that have accessed your data</li>
                <li>See the purpose and duration of each consent</li>
                <li>Revoke consent at any time (may affect pending applications)</li>
                <li>Download a log of all data access activities</li>
                <li>Set automatic consent expiry periods</li>
              </ul>
            </div>
          </section>

          {/* 5. Data Security */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <div className="bg-success/10 border border-success/20 rounded-xl p-6">
              <Lock className="w-12 h-12 text-success mb-4" />
              <h3 className="font-semibold mb-4">Bank-Level Security Measures</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>AES-256 encryption for data at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>TLS 1.3 encryption for data in transit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>Multi-factor authentication (2FA) for all accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>Regular security audits and penetration testing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>SOC 2 Type II certified data centers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>All data stored within India (compliant with data localization norms)</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Your Data Rights</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">Under Indian data protection laws, you have the following rights:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Right to Access', desc: 'Request a copy of all personal data we hold about you' },
                  { title: 'Right to Correction', desc: 'Update or correct inaccurate personal information' },
                  { title: 'Right to Deletion', desc: 'Request deletion of your data (subject to legal requirements)' },
                  { title: 'Right to Portability', desc: 'Download your data in a machine-readable format' },
                  { title: 'Right to Withdraw Consent', desc: 'Revoke consent for data processing at any time' },
                  { title: 'Right to Object', desc: 'Object to automated decision-making or profiling' },
                ].map((right, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-2">{right.title}</h3>
                    <p className="text-xs text-muted-foreground">{right.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4">
                To exercise these rights, contact our Data Protection Officer at{' '}
                <a href="#" className="text-primary hover:underline">privacy@serviceformai.gov.in</a>
              </p>
            </div>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
            <div className="prose max-w-none text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Active user data: Retained as long as your account is active</li>
                <li>Application records: Retained for 7 years as per government record-keeping requirements</li>
                <li>Documents: Deleted after consent expiry (default: 1 year from application approval/rejection)</li>
                <li>Logs and analytics: Anonymized and retained for 2 years</li>
                <li>Inactive accounts: Deleted after 3 years of inactivity (with prior notice)</li>
              </ul>
            </div>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Cookies & Tracking</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remember your login session and preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Personalize your experience</li>
                <li>Prevent fraud and security threats</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings. Note that disabling cookies may limit platform functionality.
              </p>
            </div>
          </section>

          {/* 9. Changes */}
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Changes to This Policy</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes via:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Email notification to your registered email</li>
                <li>Prominent notice on the platform</li>
                <li>SMS for critical changes</li>
              </ul>
              <p className="mt-4">
                Your continued use after changes become effective constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="mb-4">For privacy-related questions or concerns, contact us:</p>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <strong>Data Protection Officer:</strong> privacy@serviceformai.gov.in
                </p>
                <p><strong>Address:</strong> ServiceFormAI Technologies Pvt Ltd, Electronics Niketan, 6 CGO Complex, Lodhi Road, New Delhi - 110003</p>
                <p><strong>Phone:</strong> +91-11-XXXX-XXXX</p>
              </div>
              <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Privacy Policy (PDF)
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 ServiceFormAI Technologies Pvt Ltd. All rights reserved.</p>
          <p className="mt-2">A Government of India Initiative under Ministry of Electronics & IT</p>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}