import { Shield, Calendar, XCircle, Eye, Download } from 'lucide-react';

export default function ConsentManagement() {
  return (
    <div className="min-h-full bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Consent Management</h1>
          <p className="text-muted-foreground">View and manage all your data sharing permissions</p>
        </div>

        {/* Active Consents */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Active Consents</h2>
            <span className="text-sm text-muted-foreground">3 active</span>
          </div>

          <div className="space-y-4">
            {[
              {
                service: 'State Merit Scholarship 2026',
                dept: 'State Welfare Department',
                granted: '15 Apr 2026',
                expires: '15 Jul 2026',
                documents: ['Aadhaar', 'Income Certificate', 'Student Bonafide'],
                status: 'active',
              },
              {
                service: 'Trade License Application',
                dept: 'Municipal Corporation',
                granted: '10 Apr 2026',
                expires: '10 Jul 2026',
                documents: ['Aadhaar', 'Property Documents'],
                status: 'active',
              },
              {
                service: 'Income Certificate Request',
                dept: 'Revenue Department',
                granted: '5 Apr 2026',
                expires: '5 May 2026',
                documents: ['Aadhaar', 'Salary Slips'],
                status: 'expiring',
              },
            ].map((consent, index) => (
              <div key={index} className={`border rounded-xl p-6 ${
                consent.status === 'expiring' ? 'border-warning/30 bg-warning/5' : 'border-border'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{consent.service}</h3>
                      {consent.status === 'expiring' && (
                        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
                          Expiring Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{consent.dept}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground mb-1">Granted on</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{consent.granted}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Expires on</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className={`font-medium ${consent.status === 'expiring' ? 'text-warning' : ''}`}>
                            {consent.expires}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Documents shared:</p>
                      <div className="flex flex-wrap gap-2">
                        {consent.documents.map((doc, i) => (
                          <span key={i} className="text-xs bg-verified/10 text-verified px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </button>
                  <button className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 flex items-center gap-2 ml-auto">
                    <XCircle className="w-4 h-4" />
                    Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revoked Consents */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Consent History</h2>
            <span className="text-sm text-muted-foreground">2 revoked</span>
          </div>

          <div className="space-y-3">
            {[
              { service: 'Farmer Benefit Scheme', dept: 'Agriculture Dept', revokedOn: '1 Apr 2026' },
              { service: 'Property Tax Payment', dept: 'Municipal Corporation', revokedOn: '25 Mar 2026' },
            ].map((item, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm mb-1">{item.service}</p>
                    <p className="text-xs text-muted-foreground">{item.dept}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Revoked</span>
                    <p className="text-xs text-muted-foreground mt-1">{item.revokedOn}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-info/10 border border-info/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Your Data, Your Control</p>
              <p className="text-sm text-muted-foreground">
                You can revoke consent at any time. Revoking consent will prevent the department from accessing your documents for that specific service. Active applications may be affected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
