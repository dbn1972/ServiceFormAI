import { Shield, FileText, CheckCircle, ChevronRight, Lock, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { consumerService } from '../services/api/consumer.service';

export default function DigiLockerWallet() {
  const [profileName, setProfileName] = useState('Ananya Sharma');
  const [initials, setInitials] = useState('AS');

  useEffect(() => {
    consumerService.getProfile().then((p) => {
      if (p.name) {
        setProfileName(p.name);
        const parts = p.name.trim().split(' ');
        const first = parts[0] ?? '';
        const last = parts.length > 1 ? parts[parts.length - 1] : null;
        setInitials(last ? ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() : (first.slice(0, 2)).toUpperCase());
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-full bg-background">
      <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wallet Home Screen */}
            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">DigiLocker</h3>
                    <p className="text-sm opacity-90">Verified Documents</p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold">{initials}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{profileName}</p>
                      <p className="text-xs opacity-80">ID: XXXX-XXXX-1234</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Identity Verified</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs opacity-80">Documents</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs opacity-80">Used</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-xs opacity-80">Expiring</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Your Documents</h4>

                <div className="space-y-3">
                  {[
                    { name: 'Aadhaar Card', type: 'Identity', verified: true, status: 'Recently used', color: 'success' },
                    { name: 'PAN Card', type: 'Identity', verified: true, status: 'Available', color: 'success' },
                    { name: 'Income Certificate', type: 'Certificate', verified: true, status: 'Expires in 20 days', color: 'warning' },
                    { name: 'Student Bonafide', type: 'Education', verified: true, status: 'Available', color: 'success' },
                    { name: 'Domicile Certificate', type: 'Certificate', verified: true, status: 'Available', color: 'success' },
                    { name: 'Bank Account Proof', type: 'Financial', verified: true, status: 'Recently used', color: 'success' },
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className={`w-10 h-10 bg-${doc.color}/10 rounded-lg flex items-center justify-center`}>
                        <FileText className={`w-5 h-5 text-${doc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{doc.name}</p>
                          <Shield className="w-3 h-3 text-verified" />
                        </div>
                        <p className="text-xs text-muted-foreground">{doc.type} · {doc.status}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Add New Document
                </button>
              </div>
            </div>

            {/* Consent Screen */}
            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-consent/10 border-b border-consent/20 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-consent/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-consent" />
                  </div>
                  <h3 className="text-lg font-semibold">Document Access Request</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  State Welfare Department wants to access your documents
                </p>
              </div>

              <div className="p-6">
                <div className="bg-info/10 border border-info/20 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Why am I seeing this?</p>
                      <p className="text-xs text-muted-foreground">
                        You're applying for State Merit Scholarship. Your documents will be used only for eligibility verification and application processing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Documents Requested</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Aadhaar Card', required: true, available: true },
                      { name: 'Income Certificate', required: true, available: true },
                      { name: 'Student Bonafide', required: true, available: true },
                      { name: 'Bank Account Proof', required: true, available: true },
                      { name: 'Caste Certificate', required: false, available: false },
                    ].map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            doc.available ? 'bg-success/10' : 'bg-muted'
                          }`}>
                            <FileText className={`w-4 h-4 ${doc.available ? 'text-success' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{doc.name}</p>
                              {doc.required && (
                                <span className="text-xs text-destructive">*</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {doc.available ? 'Available in wallet' : 'Not available'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.available && (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Data Usage Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span className="font-medium">Scholarship Application</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valid for:</span>
                      <span className="font-medium">90 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shared with:</span>
                      <span className="font-medium">State Welfare Dept</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revocable:</span>
                      <span className="font-medium text-success">Yes</span>
                    </div>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-6">
                  <p className="text-xs text-muted-foreground">
                    Your documents will be used only for this application unless you provide consent again. You can revoke access at any time from consent history.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
                    Decline
                  </button>
                  <button className="flex-1 py-3 bg-consent text-consent-foreground rounded-lg text-sm font-medium hover:bg-consent/90 transition-colors">
                    Allow Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
