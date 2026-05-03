import { FileText, AlertTriangle, Shield } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function TermsOfService() {
  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <FileText className="w-16 h-16 text-primary mb-6" />
          <h1 className="text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: April 29, 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Important Notice */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-info flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Important Notice</h3>
              <p className="text-sm text-muted-foreground">
                These Terms of Service constitute a legally binding agreement between you and ServiceFormAI OS.
                By accessing or using our platform, you agree to be bound by these terms. If you do not agree,
                please do not use our services.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-12">
          {/* 1. Acceptance */}
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                By accessing and using ServiceFormAI OS ("Platform"), you accept and agree to be bound by the terms
                and provision of this agreement. These Terms of Service govern your use of the Platform, including
                any related services, content, and functionality.
              </p>
              <p>
                This Platform is operated by ServiceFormAI Technologies Pvt Ltd, a Government of India initiative
                under the Ministry of Electronics & Information Technology (MeitY).
              </p>
            </div>
          </section>

          {/* 2. Eligibility */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">You must meet the following criteria to use this Platform:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be a citizen or resident of India</li>
                <li>You must be at least 18 years of age or have parental/guardian consent</li>
                <li>You must provide accurate and complete registration information</li>
                <li>You must not be prohibited from using the Platform under applicable laws</li>
              </ul>
            </div>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4"><strong>3.1 Account Creation:</strong> To access certain features, you must create an account by providing:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Valid mobile number or email address</li>
                <li>Aadhaar number (optional but recommended for DigiLocker integration)</li>
                <li>Accurate personal information as required</li>
              </ul>
              <p className="mb-4"><strong>3.2 Account Security:</strong> You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
            </div>
          </section>

          {/* 4. Platform Services */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Platform Services</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">ServiceFormAI OS provides:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to government service applications and forms</li>
                <li>DigiLocker integration for document verification</li>
                <li>Application status tracking and notifications</li>
                <li>Service discovery and eligibility checking</li>
                <li>Digital consent management for data sharing</li>
              </ul>
            </div>
          </section>

          {/* 5. User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. User Responsibilities</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">You agree NOT to:</h3>
              <ul className="space-y-3">
                {[
                  'Provide false, inaccurate, or misleading information',
                  'Impersonate any person or entity',
                  'Use automated systems (bots, scrapers) to access the Platform',
                  'Attempt to gain unauthorized access to any systems or data',
                  'Upload malicious code, viruses, or harmful content',
                  'Violate any applicable laws or regulations',
                  'Interfere with or disrupt the Platform\'s operation',
                  'Use the Platform for any illegal or unauthorized purpose',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 6. Data & Privacy */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Data Collection & Privacy</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                Your use of the Platform is subject to our Privacy Policy, which is incorporated into these Terms by
                reference. We collect and process personal data as described in our Privacy Policy.
              </p>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm flex items-start gap-2">
                  <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Your data rights:</strong> You have the right to access, correct, delete, and download
                    your personal data. See our Privacy Policy for details.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* 7. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Intellectual Property Rights</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                All content, features, and functionality of the Platform (including but not limited to text, graphics,
                logos, icons, images, software, and design) are owned by ServiceFormAI Technologies or its licensors
                and are protected by Indian and international copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                The Service Manifest Protocol and associated technologies are proprietary innovations of ServiceFormAI OS.
              </p>
            </div>
          </section>

          {/* 8. Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Disclaimers</h2>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-6">
              <p className="text-sm mb-4">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Accuracy, completeness, or timeliness of information</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement of third-party rights</li>
              </ul>
            </div>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p>
                To the maximum extent permitted by law, ServiceFormAI Technologies shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including but not limited to loss
                of profits, data, use, or other intangible losses resulting from your use of the Platform.
              </p>
            </div>
          </section>

          {/* 10. Termination */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                We reserve the right to suspend or terminate your account and access to the Platform at our sole
                discretion, without notice, for conduct that we believe:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violates these Terms of Service</li>
                <li>Is harmful to other users, us, or third parties</li>
                <li>Violates applicable laws or regulations</li>
              </ul>
            </div>
          </section>

          {/* 11. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold mb-4">11. Governing Law & Jurisdiction</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes
                arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the
                courts in New Delhi, India.
              </p>
            </div>
          </section>

          {/* 12. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold mb-4">12. Changes to These Terms</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the updated Terms on the Platform</li>
                <li>Sending an email notification to your registered email</li>
                <li>Displaying a prominent notice on the Platform</li>
              </ul>
              <p className="mt-4">
                Your continued use of the Platform after changes become effective constitutes your acceptance of
                the revised Terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="mb-4">For questions about these Terms, please contact us:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Email:</strong> legal@serviceformai.gov.in</p>
                <p><strong>Address:</strong> ServiceFormAI Technologies Pvt Ltd, Electronics Niketan, 6 CGO Complex, Lodhi Road, New Delhi - 110003</p>
                <p><strong>Phone:</strong> +91-11-XXXX-XXXX</p>
              </div>
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