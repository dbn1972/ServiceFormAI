import { Cookie, Info, Shield, Settings as SettingsIcon, Eye, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function CookiePolicy() {
  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <Cookie className="w-16 h-16 text-primary mb-6" />
          <h1 className="text-5xl font-bold mb-6">Cookie Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: April 30, 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Important Notice */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-info flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">What Are Cookies?</h3>
              <p className="text-sm text-muted-foreground">
                Cookies are small text files stored on your device when you visit our website. They help us provide
                you with a better experience by remembering your preferences and improving platform functionality.
              </p>
            </div>
          </div>
        </div>

        {/* Cookie Types */}
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Types of Cookies We Use</h2>

            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Shield className="w-5 h-5 text-success mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Essential Cookies (Required)</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      These cookies are necessary for the website to function and cannot be disabled.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold">Cookie Name</th>
                            <th className="text-left py-2 font-semibold">Purpose</th>
                            <th className="text-left py-2 font-semibold">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">session_token</td>
                            <td className="py-2">Maintains your login session</td>
                            <td className="py-2">Session</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">csrf_token</td>
                            <td className="py-2">Security protection against CSRF attacks</td>
                            <td className="py-2">Session</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-mono text-xs">auth_state</td>
                            <td className="py-2">OAuth authentication state management</td>
                            <td className="py-2">1 hour</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <SettingsIcon className="w-5 h-5 text-info mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Functional Cookies (Optional)</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      These cookies enable personalized features and remember your preferences.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold">Cookie Name</th>
                            <th className="text-left py-2 font-semibold">Purpose</th>
                            <th className="text-left py-2 font-semibold">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">language_pref</td>
                            <td className="py-2">Remembers your language preference</td>
                            <td className="py-2">1 year</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">theme_mode</td>
                            <td className="py-2">Stores dark/light mode preference</td>
                            <td className="py-2">1 year</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-mono text-xs">dashboard_layout</td>
                            <td className="py-2">Saves your dashboard customization</td>
                            <td className="py-2">6 months</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Eye className="w-5 h-5 text-warning mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Analytics Cookies (Optional)</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      These cookies help us understand how you use the platform so we can improve it.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold">Cookie Name</th>
                            <th className="text-left py-2 font-semibold">Purpose</th>
                            <th className="text-left py-2 font-semibold">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">_ga</td>
                            <td className="py-2">Google Analytics - Anonymous usage statistics</td>
                            <td className="py-2">2 years</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">_gid</td>
                            <td className="py-2">Google Analytics - Session tracking</td>
                            <td className="py-2">24 hours</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-mono text-xs">analytics_consent</td>
                            <td className="py-2">Stores your analytics consent preference</td>
                            <td className="py-2">1 year</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Third-Party Cookies</h2>
            <div className="prose max-w-none text-muted-foreground space-y-4">
              <p>
                We use cookies from trusted third-party services to provide essential functionality:
              </p>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-4">OAuth Authentication Providers</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Google OAuth:</strong> For Google sign-in authentication</li>
                  <li><strong>Microsoft Azure AD:</strong> For Microsoft/Office 365 sign-in</li>
                  <li><strong>DigiLocker:</strong> For India Stack document integration</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  These services may set their own cookies. Please refer to their privacy policies:
                  <a href="https://policies.google.com/privacy" className="text-primary hover:underline ml-1">Google</a>,
                  <a href="https://privacy.microsoft.com" className="text-primary hover:underline ml-1">Microsoft</a>,
                  <a href="https://digitallocker.gov.in/privacy" className="text-primary hover:underline ml-1">DigiLocker</a>
                </p>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Managing Your Cookie Preferences</h2>
            <div className="prose max-w-none text-muted-foreground space-y-4">
              <p>
                You have control over which cookies you accept:
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <SettingsIcon className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Platform Cookie Settings</h3>
                    <p className="text-sm mb-3">
                      Manage your cookie preferences directly on our platform:
                    </p>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                      Cookie Preferences
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-border">
                  <Ban className="w-5 h-5 text-warning mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Browser Settings</h3>
                    <p className="text-sm mb-2">
                      You can also control cookies through your browser settings:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline">Google Chrome</a></li>
                      <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" className="text-primary hover:underline">Mozilla Firefox</a></li>
                      <li><a href="https://support.apple.com/en-in/guide/safari/sfri11471/mac" className="text-primary hover:underline">Safari</a></li>
                      <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-primary hover:underline">Microsoft Edge</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Note:</strong> Disabling essential cookies may prevent you from using certain features
                  of the platform, including logging in and submitting applications.
                </p>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Cookie Data & Security</h2>
            <div className="prose max-w-none text-muted-foreground space-y-4">
              <p>
                We take the security of cookie data seriously:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li><strong>Encryption:</strong> All cookies containing sensitive data are encrypted</li>
                <li><strong>Secure Flag:</strong> Cookies are only transmitted over HTTPS</li>
                <li><strong>HttpOnly Flag:</strong> Session cookies cannot be accessed by JavaScript</li>
                <li><strong>SameSite Policy:</strong> CSRF protection through SameSite=Strict</li>
                <li><strong>Regular Audits:</strong> Periodic security audits of cookie usage</li>
              </ul>
            </div>
          </section>

          {/* DPDP Act Compliance */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. DPDP Act 2023 Compliance</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p>
                Our cookie policy complies with the Digital Personal Data Protection (DPDP) Act 2023:
              </p>

              <div className="bg-card border border-border rounded-lg p-6 mt-4">
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>We obtain explicit consent before setting non-essential cookies</li>
                  <li>You can withdraw consent at any time through cookie settings</li>
                  <li>We provide clear information about what cookies we use and why</li>
                  <li>Cookie data is processed lawfully and transparently</li>
                  <li>We do not sell or share cookie data with third parties for marketing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Updates to This Policy</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for
                regulatory reasons. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm mt-4">
                <li>Posting the updated policy on this page with a new "Last Updated" date</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a notice on the platform homepage</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Questions & Contact</h2>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                If you have questions about our use of cookies, please contact us:
              </p>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold mb-1">Email:</div>
                    <a href="mailto:privacy@serviceformai.gov.in" className="text-primary hover:underline">
                      privacy@serviceformai.gov.in
                    </a>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Data Protection Officer:</div>
                    <a href="mailto:dpo@serviceformai.gov.in" className="text-primary hover:underline">
                      dpo@serviceformai.gov.in
                    </a>
                  </div>
                  <div className="md:col-span-2">
                    <div className="font-semibold mb-1">Postal Address:</div>
                    <div className="text-muted-foreground">
                      ServiceFormAI Technologies Pvt Ltd<br />
                      Ministry of Electronics & Information Technology (MeitY)<br />
                      Electronics Niketan, 6 CGO Complex<br />
                      New Delhi - 110003, India
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Related Policies */}
        <div className="mt-12 p-6 bg-muted/50 rounded-xl">
          <h3 className="font-semibold mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="text-sm text-primary hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
            <Link to="/dpdp-privacy" className="text-sm text-primary hover:underline">DPDP Privacy Center</Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}