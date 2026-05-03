import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Copy, Check, ExternalLink, ArrowRight, Sparkles,
  FileText, GraduationCap, Briefcase, Shield, Globe, Lock, BadgeCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EnhancedGoLiveStepProps {
  tenantData: {
    orgName?: string;
    subdomain?: string;
    servicesCount?: number;
  };
}

export default function EnhancedGoLiveStep({ tenantData }: EnhancedGoLiveStepProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const tenantId = `SFAI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const subdomain = tenantData.subdomain || 'your-department';
  const portalUrl = `${subdomain}.serviceformai.gov.in`;

  useEffect(() => {
    // Trigger confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Trigger another burst after 0.5s
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 500);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 700);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateService = () => {
    navigate('/tenant/service/create');
  };

  const handleGoToDashboard = () => {
    navigate('/tenant/dashboard');
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium mb-6">
          <CheckCircle className="w-4 h-4" />
          Setup Complete
        </div>
        <h1 className="text-4xl font-bold mb-3">
          🎉 Your Service Portal is Live!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Congratulations! {tenantData.orgName || 'Your organization'} now has a fully configured
          government service portal ready to serve citizens.
        </p>

        {/* Portal URL */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/20 rounded-xl">
          <Globe className="w-5 h-5 text-primary" />
          <span className="font-mono font-semibold text-primary">{portalUrl}</span>
          <button
            onClick={() => handleCopy(portalUrl)}
            className="p-1.5 hover:bg-primary/10 rounded transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-primary" />}
          </button>
          <button className="p-1.5 hover:bg-primary/10 rounded transition-colors">
            <ExternalLink className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* What You Created */}
      <div className="bg-gradient-to-br from-primary/5 to-info/5 border border-primary/20 rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-4">What you just created:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Shield, label: 'Secure Tenant Environment', desc: 'ISO 27001 compliant infrastructure' },
            { icon: Globe, label: 'Custom Subdomain', desc: 'With SSL certificate included' },
            { icon: Lock, label: 'DigiLocker Integration', desc: 'Document reuse with citizen consent' },
            { icon: BadgeCheck, label: 'Admin Account', desc: 'Ready for team configuration' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-0.5">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tenant ID */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Your Tenant ID
            </p>
            <p className="text-xl font-mono font-bold text-primary">{tenantId}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Save this ID — you'll need it for support queries and API integrations
            </p>
          </div>
          <button
            onClick={() => handleCopy(tenantId)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy ID'}
          </button>
        </div>
      </div>

      {/* Next Step: Create First Service */}
      <div className="bg-gradient-to-r from-primary/10 to-info/10 border-2 border-primary/30 rounded-2xl p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">Next: Create Your First Service</h3>
            <p className="text-muted-foreground mb-6">
              Build and publish your first citizen service in just 3 minutes. Choose from pre-configured
              templates or create a custom service.
            </p>

            {/* Service Templates Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {[
                { id: 'scholarship', icon: GraduationCap, label: 'Scholarship', desc: 'Pre-built template' },
                { id: 'birth-cert', icon: FileText, label: 'Birth Certificate', desc: 'Pre-built template' },
                { id: 'custom', icon: Briefcase, label: 'Custom Service', desc: 'Build your own' },
              ].map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={handleCreateService}
                    className="p-4 bg-card border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <Icon className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-semibold text-sm mb-0.5">{template.label}</p>
                    <p className="text-xs text-muted-foreground">{template.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateService}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Create Your First Service
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleGoToDashboard}
                className="px-6 py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next Checklist */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Recommended Next Steps:</h3>
        <div className="space-y-3">
          {[
            { label: 'Create your first service', time: '~3 min', done: false, primary: true },
            { label: 'Invite officer team members', time: '~2 min', done: false },
            { label: 'Configure approval workflow', time: '~3 min', done: false },
            { label: 'Test service submission', time: '~5 min', done: false },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                item.done ? 'border-success bg-success' : item.primary ? 'border-primary' : 'border-border'
              }`}>
                {item.done && <Check className="w-4 h-4 text-success-foreground" />}
                {!item.done && item.primary && <span className="text-xs font-bold text-primary">1</span>}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.primary ? 'text-primary' : ''}`}>{item.label}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Support */}
      <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
        <p>
          Need help getting started?{' '}
          <a href="mailto:onboarding@serviceformai.gov.in" className="text-primary hover:underline">
            Contact support
          </a>
          {' '}or call{' '}
          <span className="font-medium">1800-XXX-XXXX</span> (toll-free, 9AM–6PM IST)
        </p>
      </div>
    </div>
  );
}
