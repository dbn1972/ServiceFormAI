import { CheckCircle, Shield, Wallet, Bell, Zap, ChevronRight } from 'lucide-react';

export default function CitizenOnboarding() {
  return (
    <div className="min-h-full bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Onboarding Step 1 - Welcome */}
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-primary-foreground" />
            </div>

            <h2 className="text-2xl font-bold mb-3">Welcome to ServiceFormAI</h2>
            <p className="text-muted-foreground mb-8">
              Your one-stop platform for government services, schemes, and benefits
            </p>

            {/* Benefits */}
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

            <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-3">
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>

            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Skip for now
            </button>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pb-6">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <div className="w-2 h-2 bg-muted rounded-full" />
            <div className="w-2 h-2 bg-muted rounded-full" />
            <div className="w-2 h-2 bg-muted rounded-full" />
          </div>
        </div>

        {/* Additional Onboarding Screens Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { step: '2', title: 'Connect DigiLocker', color: 'verified' },
            { step: '3', title: 'Set Preferences', color: 'info' },
            { step: '4', title: 'Enable Notifications', color: 'warning' },
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
