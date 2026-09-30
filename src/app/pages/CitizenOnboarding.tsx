import { CheckCircle, Shield, Wallet, Bell, Zap, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type OnboardingStep = 1 | 2 | 3;

export default function CitizenOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [preferredLanguage, setPreferredLanguage] = useState(() => localStorage.getItem('citizenPreferredLanguage') || 'en');
  const [enableNotifications, setEnableNotifications] = useState(() => localStorage.getItem('citizenNotificationsEnabled') !== 'false');
  const [connectDigilocker, setConnectDigilocker] = useState(() => localStorage.getItem('citizenWantsDigiLocker') !== 'false');

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Welcome to ServiceFormAI';
    if (step === 2) return 'Your Preferences';
    return 'Finish Setup';
  }, [step]);

  const stepDescription = useMemo(() => {
    if (step === 1) return 'Understand how the platform helps you discover and complete services.';
    if (step === 2) return 'Choose your language and notification preferences.';
    return 'Confirm how you want to continue with documents and service recommendations.';
  }, [step]);

  const continueToConsent = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as OnboardingStep);
      return;
    }

    localStorage.setItem('citizenPreferredLanguage', preferredLanguage);
    localStorage.setItem('citizenNotificationsEnabled', enableNotifications ? 'true' : 'false');
    localStorage.setItem('citizenWantsDigiLocker', connectDigilocker ? 'true' : 'false');
    navigate('/consent');
  };

  const handleSecondaryAction = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    setStep((prev) => (prev - 1) as OnboardingStep);
  };

  return (
    <div className="min-h-full bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Onboarding Step 1 - Welcome */}
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-primary-foreground" />
            </div>

            <h2 className="text-2xl font-bold mb-3">{stepTitle}</h2>
            <p className="text-muted-foreground mb-8">
              {stepDescription}
            </p>

            {step === 1 && (
              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Discover Services</p>
                    <p className="text-xs text-muted-foreground">Get personalized recommendations for schemes you may be eligible for</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-verified/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-verified" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Reuse Documents</p>
                    <p className="text-xs text-muted-foreground">Connect your DigiLocker and never upload the same document twice</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Track Everything</p>
                    <p className="text-xs text-muted-foreground">Real-time status updates for all your applications and grievances</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Stay Informed</p>
                    <p className="text-xs text-muted-foreground">Get notified about deadlines, updates, and new opportunities</p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 mb-8 text-left">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred language</label>
                  <select
                    value={preferredLanguage}
                    onChange={(event) => setPreferredLanguage(event.target.value)}
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-3"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                  </select>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <input
                    type="checkbox"
                    checked={enableNotifications}
                    onChange={(event) => setEnableNotifications(event.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-sm mb-1">Enable notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates about application status, approvals, deficiencies, and deadlines.</p>
                  </div>
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 mb-8 text-left">
                <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <input
                    type="checkbox"
                    checked={connectDigilocker}
                    onChange={(event) => setConnectDigilocker(event.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-sm mb-1">Use DigiLocker for document reuse</p>
                    <p className="text-xs text-muted-foreground">Recommended for faster form completion, prefill, and reduced document uploads.</p>
                  </div>
                </label>

                <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-sm text-muted-foreground">
                  You will review and manage your consent on the next screen before accessing the dashboard.
                </div>
              </div>
            )}

            <button
              onClick={continueToConsent}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              {step < 3 ? 'Continue' : 'Continue to Consent'}
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleSecondaryAction}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {step === 1 ? 'Skip intro' : 'Back'}
            </button>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pb-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className={`w-2 h-2 rounded-full ${item === step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        {/* Additional Onboarding Screens Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Welcome', color: 'success' },
            { step: '2', title: 'Preferences', color: 'info' },
            { step: '3', title: 'Consent', color: 'warning' },
          ].map((screen, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className={`w-8 h-8 bg-${screen.color}/10 rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className={`text-xs font-bold text-${screen.color}`}>{screen.step}</span>
              </div>
              <p className="text-xs text-muted-foreground">{screen.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
