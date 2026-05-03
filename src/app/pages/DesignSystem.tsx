import { CheckCircle, AlertTriangle, XCircle, Info, Shield, Clock, FileText } from 'lucide-react';

export default function DesignSystem() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4">Design System</h1>
          <p className="text-muted-foreground">
            ServiceFormAI OS design tokens, components, and patterns for trusted citizen service delivery
          </p>
        </div>

        {/* Colors */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Primary', color: 'primary', desc: 'Main actions, links' },
              { name: 'Success', color: 'success', desc: 'Verified, approved' },
              { name: 'Warning', color: 'warning', desc: 'Pending, action needed' },
              { name: 'Destructive', color: 'destructive', desc: 'Rejected, urgent' },
              { name: 'Info', color: 'info', desc: 'Information' },
              { name: 'Verified', color: 'verified', desc: 'Document verified' },
              { name: 'Consent', color: 'consent', desc: 'Consent flows' },
              { name: 'Grievance', color: 'grievance', desc: 'Grievances' },
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className={`h-20 bg-${item.color} rounded-lg shadow-sm`} />
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Status Badges */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Status Badges</h2>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1.5 bg-success/10 text-success text-sm rounded-full font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </span>
            <span className="px-3 py-1.5 bg-pending/10 text-pending text-sm rounded-full font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </span>
            <span className="px-3 py-1.5 bg-warning/10 text-warning text-sm rounded-full font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Deficiency
            </span>
            <span className="px-3 py-1.5 bg-destructive/10 text-destructive text-sm rounded-full font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected
            </span>
            <span className="px-3 py-1.5 bg-verified/10 text-verified text-sm rounded-full font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Verified
            </span>
            <span className="px-3 py-1.5 bg-info/10 text-info text-sm rounded-full font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Under Review
            </span>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Primary Button
            </button>
            <button className="px-6 py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 transition-colors">
              Success Button
            </button>
            <button className="px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
              Secondary Button
            </button>
            <button className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors">
              Destructive Button
            </button>
            <button className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors">
              Outline Button
            </button>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Service Recommendation Card</h4>
                  <p className="text-sm text-muted-foreground">Used for eligibility recommendations</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span>3 documents ready</span>
                </div>
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span>1 document needed</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                Check Eligibility
              </button>
            </div>

            {/* Document Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-verified/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-verified" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">Document Card</h4>
                    <Shield className="w-4 h-4 text-verified" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Verified from DigiLocker</p>
                  <p className="text-xs text-muted-foreground">Last updated: 15 Jan 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Inputs */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Form Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Ananya Sharma"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">Verified from DigiLocker · Editable</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                placeholder="ananya@example.com"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <select className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Select State</option>
                <option>Maharashtra</option>
                <option>Karnataka</option>
                <option>Tamil Nadu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Typography</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Display</p>
              <h1 className="text-4xl font-bold">ServiceFormAI OS</h1>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Page Title</p>
              <h2 className="text-2xl font-semibold">Citizen Service Feed</h2>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Section Title</p>
              <h3 className="text-lg font-semibold">Your Documents</h3>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Body Text</p>
              <p className="text-base">Your documents will be used only for this application unless you provide consent again.</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Caption</p>
              <p className="text-sm text-muted-foreground">Verified from DigiLocker</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
