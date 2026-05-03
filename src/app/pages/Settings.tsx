import { User, Bell, Shield, Globe, Palette, Smartphone, Download, HelpCircle, LogOut, ChevronRight, Moon, Sun, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const navigate = useNavigate();
  const { logout, user } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and app settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left - Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-8">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-sm">Settings Menu</h3>
              </div>
              <nav className="p-2">
                {[
                  { icon: User, label: 'Account', active: true },
                  { icon: Bell, label: 'Notifications', active: false },
                  { icon: Shield, label: 'Privacy & Security', active: false },
                  { icon: Globe, label: 'Language & Region', active: false },
                  { icon: Palette, label: 'Appearance', active: false },
                  { icon: Smartphone, label: 'Devices', active: false },
                  { icon: Download, label: 'Data & Storage', active: false },
                  { icon: HelpCircle, label: 'Help & Support', active: false },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                        item.active
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Right - Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      defaultValue={user?.email ?? ''}
                      className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                      Update
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Used for login and important notifications</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mobile Number</label>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      value="+91 98765 43210"
                      className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button className="px-4 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80">
                      Verify
                    </button>
                  </div>
                  <p className="text-xs text-success mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <button className="text-sm text-primary hover:underline">Change Password</button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                {[
                  {
                    title: 'Application Status Updates',
                    description: 'Get notified about application approvals, rejections, and status changes',
                    email: true,
                    sms: true,
                    push: true,
                  },
                  {
                    title: 'Document Expiry Alerts',
                    description: 'Reminders when your documents are about to expire',
                    email: true,
                    sms: false,
                    push: true,
                  },
                  {
                    title: 'New Service Recommendations',
                    description: 'Get suggestions for services you might be eligible for',
                    email: false,
                    sms: false,
                    push: true,
                  },
                  {
                    title: 'System Announcements',
                    description: 'Important platform updates and maintenance schedules',
                    email: true,
                    sms: false,
                    push: false,
                  },
                ].map((pref, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-1">{pref.title}</h4>
                      <p className="text-xs text-muted-foreground">{pref.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" defaultChecked={pref.email} />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" defaultChecked={pref.sms} />
                        <span>SMS</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" defaultChecked={pref.push} />
                        <span>Push</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Privacy & Security</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Two-Factor Authentication</h4>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-full h-full bg-muted rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Biometric Login</h4>
                    <p className="text-xs text-muted-foreground">Use fingerprint or face recognition to login</p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-full h-full bg-muted rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Activity Log</h4>
                    <p className="text-xs text-muted-foreground">Keep track of all account activity</p>
                  </div>
                  <button className="px-3 py-1 bg-muted text-muted-foreground rounded text-xs font-medium hover:bg-muted/80">
                    View Log
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Manage Consents</h4>
                    <p className="text-xs text-muted-foreground">Review and revoke data sharing permissions</p>
                  </div>
                  <button className="px-3 py-1 bg-muted text-muted-foreground rounded text-xs font-medium hover:bg-muted/80">
                    Manage
                  </button>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Appearance</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: Sun, label: 'Light', active: true },
                      { icon: Moon, label: 'Dark', active: false },
                      { icon: Smartphone, label: 'System', active: false },
                    ].map((theme, index) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={index}
                          className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                            theme.active
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Font Size</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs">A</span>
                    <input type="range" className="flex-1" min="12" max="20" defaultValue="16" />
                    <span className="text-xl">A</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Compact Mode</h4>
                    <p className="text-xs text-muted-foreground">Show more content on screen</p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-full h-full bg-muted rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Language & Region */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Language & Region</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Language</label>
                  <select className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>English</option>
                    <option>हिंदी (Hindi)</option>
                    <option>मराठी (Marathi)</option>
                    <option>தமிழ் (Tamil)</option>
                    <option>తెలుగు (Telugu)</option>
                    <option>ગુજરાતી (Gujarati)</option>
                    <option>ಕನ್ನಡ (Kannada)</option>
                    <option>বাংলা (Bengali)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time Zone</label>
                  <select className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Asia/Kolkata (IST) UTC+5:30</option>
                    <option>Asia/Dubai (GST) UTC+4:00</option>
                    <option>America/New_York (EST) UTC-5:00</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date Format</label>
                  <select className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>DD/MM/YYYY (31/12/2025)</option>
                    <option>MM/DD/YYYY (12/31/2025)</option>
                    <option>YYYY-MM-DD (2025-12-31)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data & Storage */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Data & Storage</h2>

              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Download My Data</h4>
                    <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                      Request
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get a copy of all your data including applications, documents, and activity history
                  </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Clear Cache</h4>
                    <button className="px-3 py-1 bg-muted text-muted-foreground rounded text-xs font-medium hover:bg-muted/80">
                      Clear
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Free up storage by clearing temporary files and cached data
                  </p>
                </div>

                <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-destructive">Delete Account</h4>
                    <button className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-xs font-medium">
                      Delete
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">About</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">App Version</span>
                  <span className="font-medium">2.4.1</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Build Number</span>
                  <span className="font-medium">20260429</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">April 29, 2026</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex gap-3">
                <button className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80">
                  Privacy Policy
                </button>
                <button className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80">
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
