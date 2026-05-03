import { Mail, Bell, CheckCircle, Smartphone, Globe } from 'lucide-react';

export default function EmailPreferences() {
  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
          <p className="text-muted-foreground">Manage how you receive updates and notifications</p>
        </div>

        {/* Email Preferences */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Email Notifications</h2>
              <p className="text-sm text-muted-foreground">ananya.sharma@email.com</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Application Status Updates', sublabel: 'Get notified when your application status changes', checked: true },
              { label: 'Document Requests', sublabel: 'Alerts when additional documents are needed', checked: true },
              { label: 'Payment Confirmations', sublabel: 'Receipts and payment success notifications', checked: true },
              { label: 'Service Announcements', sublabel: 'New services and platform updates', checked: false },
              { label: 'Marketing & Promotions', sublabel: 'Special offers and promotional content', checked: false },
            ].map((pref, idx) => (
              <label key={idx} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={pref.checked}
                  className="w-5 h-5 rounded border-border mt-0.5"
                />
                <div>
                  <p className="font-medium mb-1">{pref.label}</p>
                  <p className="text-sm text-muted-foreground">{pref.sublabel}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">SMS Notifications</h2>
              <p className="text-sm text-muted-foreground">+91 98765 43210</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Critical Alerts', sublabel: 'Important status updates via SMS', checked: true },
              { label: 'Appointment Reminders', sublabel: 'SMS reminder before scheduled appointments', checked: true },
              { label: 'OTP & Security Codes', sublabel: 'Verification codes for secure access', checked: true },
            ].map((pref, idx) => (
              <label key={idx} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={pref.checked}
                  className="w-5 h-5 rounded border-border mt-0.5"
                />
                <div>
                  <p className="font-medium mb-1">{pref.label}</p>
                  <p className="text-sm text-muted-foreground">{pref.sublabel}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-info" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Push Notifications</h2>
              <p className="text-sm text-muted-foreground">Browser and mobile app alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Real-time Updates', sublabel: 'Instant notifications for important events', checked: true },
              { label: 'Chat Messages', sublabel: 'New messages from support team', checked: true },
              { label: 'Deadline Reminders', sublabel: 'Alerts for upcoming document submission deadlines', checked: false },
            ].map((pref, idx) => (
              <label key={idx} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={pref.checked}
                  className="w-5 h-5 rounded border-border mt-0.5"
                />
                <div>
                  <p className="font-medium mb-1">{pref.label}</p>
                  <p className="text-sm text-muted-foreground">{pref.sublabel}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Notification Frequency</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="radio" name="frequency" defaultChecked className="w-4 h-4" />
              <div>
                <p className="font-medium">Real-time (Recommended)</p>
                <p className="text-sm text-muted-foreground">Get notifications as they happen</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="radio" name="frequency" className="w-4 h-4" />
              <div>
                <p className="font-medium">Daily Digest</p>
                <p className="text-sm text-muted-foreground">One email per day with all updates</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="radio" name="frequency" className="w-4 h-4" />
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">Weekly roundup of all activity</p>
              </div>
            </label>
          </div>
        </div>

        {/* Language Preference */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-warning" />
            </div>
            <h2 className="text-lg font-semibold">Language Preference</h2>
          </div>
          <select className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
            <option>English</option>
            <option>हिंदी (Hindi)</option>
            <option>ಕನ್ನಡ (Kannada)</option>
            <option>தமிழ் (Tamil)</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button className="flex-1 py-3 px-6 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80">
            Reset to Default
          </button>
          <button className="flex-1 py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
