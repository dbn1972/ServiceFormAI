import { Bell, Search, GraduationCap, AlertCircle, FileText, CheckCircle, Clock, Calendar, ChevronRight, Shield, Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { consumerService } from '../services/api/consumer.service';

export default function CitizenServiceFeed() {
  useEffect(() => {
    consumerService.getServices(undefined, { limit: 20 }).then((_res) => {
      // services available: _res.data — used for future search/filter
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-full bg-background">
      {/* Mobile mockup container */}
      <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Status bar */}
          <div className="bg-card px-6 pt-3 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 border border-current rounded-sm">
                  <div className="w-2 h-full bg-current" />
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="bg-card px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Welcome, Ananya</h2>
                <p className="text-sm text-muted-foreground">Your services</p>
              </div>
              <button className="w-10 h-10 bg-accent rounded-full flex items-center justify-center relative">
                <Bell className="w-5 h-5 text-accent-foreground" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search services..."
                className="w-full pl-10 pr-4 py-3 bg-input-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[600px]">
            {/* For You section */}
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">For You</h3>

              {/* Scholarship recommendation */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">State Merit Scholarship</h4>
                    <p className="text-xs text-muted-foreground mb-2">You may be eligible</p>
                    <div className="flex items-center gap-2 text-xs text-success mb-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>3 documents ready in DigiLocker</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-warning">
                      <AlertCircle className="w-3 h-3" />
                      <span>1 document needed</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Check Eligibility
                </button>
              </div>

              {/* Expiring document */}
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-warning-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">Income Certificate Expiring</h4>
                    <p className="text-xs text-muted-foreground mb-2">Expires in 20 days</p>
                    <button className="text-xs font-medium text-warning hover:underline">
                      Renew now →
                    </button>
                  </div>
                </div>
              </div>

              {/* Grievance resolved */}
              <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-success-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">Streetlight Complaint Resolved</h4>
                    <p className="text-xs text-muted-foreground mb-2">Ward 12, Sector 5</p>
                    <button className="text-xs font-medium text-success hover:underline">
                      View details →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue section */}
            <div className="px-6 py-4 bg-muted/30">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Continue</h3>

              <div className="bg-card border border-border rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Trade License Application</h4>
                  <span className="px-2 py-1 bg-pending/10 text-pending text-xs rounded-full font-medium">
                    Pending
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  <span>Action required by 15 May</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-primary" style={{ width: '60%' }} />
                </div>
                <button className="text-xs font-medium text-primary hover:underline">
                  Complete application →
                </button>
              </div>
            </div>

            {/* Your Documents section */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Your Documents</h3>
                <button className="text-xs font-medium text-primary hover:underline">
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Aadhaar Card', verified: true, used: 'Recently used' },
                  { name: 'Student Certificate', verified: true, used: 'Available' },
                  { name: 'Income Certificate', verified: true, used: 'Expires soon' },
                ].map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-verified/10 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-verified" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{doc.name}</p>
                        {doc.verified && (
                          <Shield className="w-3 h-3 text-verified flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.used}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom padding */}
            <div className="h-20" />
          </div>

          {/* Bottom navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3">
            <div className="flex items-center justify-around">
              {[
                { icon: Wallet, label: 'Services', active: true },
                { icon: FileText, label: 'Applications', active: false },
                { icon: AlertCircle, label: 'Grievances', active: false },
                { icon: Bell, label: 'Alerts', active: false },
              ].map((item, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center gap-1 min-w-0"
                >
                  <item.icon className={`w-5 h-5 ${item.active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs ${item.active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
