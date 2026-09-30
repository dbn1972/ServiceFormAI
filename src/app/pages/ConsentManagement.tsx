import { Shield, Calendar, XCircle, Eye, Download, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import {
  clearPendingOnboardingIdentity,
  getOnboardingIdentityFromUser,
  getPendingOnboardingIdentity,
  markOnboardingCompletedForUser,
} from '../utils/onboarding';
import { consumerService } from '../services/api';
import type { ConsentRecord } from '../shared/types';

export default function ConsentManagement() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [activeConsents, setActiveConsents] = useState<ConsentRecord[]>([]);
  const [history, setHistory] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConsents() {
      try {
        const [active, fullHistory] = await Promise.all([
          consumerService.getActiveConsents(),
          consumerService.getConsentHistory(),
        ]);

        if (!isMounted) {
          return;
        }

        setActiveConsents(active.records);
        setHistory(fullHistory.records.filter((record) => {
          const expiredGranted = record.status === 'granted' && Boolean(record.expires_at) && new Date(record.expires_at).getTime() <= Date.now();
          return record.status !== 'granted' || expiredGranted;
        }));
      } catch (error: any) {
        if (!isMounted) {
          return;
        }
        toast.error(error?.message || 'Unable to load consent records');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadConsents();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCount = activeConsents.length;
  const revokedCount = history.length;

  const derivedActiveConsents = useMemo(() => {
    if (activeConsents.length > 0) {
      return activeConsents;
    }

    return [] as ConsentRecord[];
  }, [activeConsents]);

  async function handleRevoke(consentId: string) {
    setRevokingId(consentId);
    try {
      const updated = await consumerService.revokeConsent(consentId);
      setActiveConsents((prev) => prev.filter((record) => record.id !== consentId));
      setHistory((prev) => [updated, ...prev]);
      toast.success('Consent revoked');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to revoke consent');
    } finally {
      setRevokingId(null);
    }
  }

  const handleContinue = () => {
    const onboardingIdentity = getPendingOnboardingIdentity() || getOnboardingIdentityFromUser(user);
    markOnboardingCompletedForUser(user, onboardingIdentity);
    clearPendingOnboardingIdentity();
    navigate('/dashboard');
  };

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
            <span className="text-sm text-muted-foreground">{activeCount} active</span>
          </div>

          {isLoading ? (
            <div className="py-8 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading active consents...
            </div>
          ) : derivedActiveConsents.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              No active consents yet. Service-specific consent requests will appear here after you apply for services that need document reuse or eligibility checks.
            </div>
          ) : (
            <div className="space-y-4">
            {derivedActiveConsents.map((consent) => {
              const expiresLabel = consent.expires_at
                ? new Date(consent.expires_at).toLocaleDateString()
                : 'No expiry';
              const grantedLabel = consent.granted_at
                ? new Date(consent.granted_at).toLocaleDateString()
                : new Date(consent.created_at).toLocaleDateString();
              const expiresAtMs = consent.expires_at ? new Date(consent.expires_at).getTime() : null;
              const isExpiring = expiresAtMs !== null && expiresAtMs > Date.now() && expiresAtMs - Date.now() < 7 * 24 * 60 * 60 * 1000;

              return (
              <div key={consent.id} className={`border rounded-xl p-6 ${
                isExpiring ? 'border-warning/30 bg-warning/5' : 'border-border'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold capitalize">{consent.purpose.replace(/_/g, ' ')}</h3>
                      {isExpiring && (
                        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
                          Expiring Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Tenant: {consent.tenant_id}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground mb-1">Granted on</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{grantedLabel}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Expires on</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className={`font-medium ${isExpiring ? 'text-warning' : ''}`}>
                            {expiresLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Purpose description:</p>
                      <p className="text-sm">{consent.purpose_description}</p>
                    </div>

                    {(consent.resource_type || consent.resource_id) && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Resource scope:</p>
                      <div className="flex flex-wrap gap-2">
                          {consent.resource_type && (
                            <span className="text-xs bg-verified/10 text-verified px-2 py-1 rounded-full font-medium flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {consent.resource_type}
                            </span>
                          )}
                          {consent.resource_id && (
                            <span className="text-xs bg-verified/10 text-verified px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                              {consent.resource_id}
                          </span>
                          )}
                      </div>
                      </div>
                    )}
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
                  <button
                    onClick={() => handleRevoke(consent.id)}
                    disabled={revokingId === consent.id}
                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 flex items-center gap-2 ml-auto disabled:opacity-50"
                  >
                    {revokingId === consent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Revoke Access
                  </button>
                </div>
              </div>
            );})}
          </div>
          )}
        </div>

        {/* Revoked Consents */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Consent History</h2>
            <span className="text-sm text-muted-foreground">{revokedCount} historical</span>
          </div>

          {isLoading ? (
            <div className="py-8 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading consent history...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              No revoked, denied, or expired consent records yet.
            </div>
          ) : (
            <div className="space-y-3">
            {history.map((item) => {
              const eventDate = item.revoked_at || item.denied_at || item.updated_at;
              return (
              <div key={item.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm mb-1 capitalize">{item.purpose.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">Tenant: {item.tenant_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full capitalize">{item.status}</span>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(eventDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            );})}
          </div>
          )}
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

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => navigate('/onboarding/citizen')}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
