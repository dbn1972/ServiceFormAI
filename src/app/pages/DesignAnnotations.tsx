import { BookOpen, Shield, Zap, FileCheck, Eye, Lock, Users, Map } from 'lucide-react';

export default function DesignAnnotations() {
  const annotations = [
    {
      icon: FileCheck,
      title: 'Why Citizen Feed Matters',
      desc: "Most citizens don't know what services they're eligible for. The feed transforms passive search into active discovery with consent-based recommendations.",
      color: 'primary',
    },
    {
      icon: Lock,
      title: 'Why Consent is Designed This Way',
      desc: 'Consent must be service-specific, time-bound, and revocable. Plain language explanations build trust. No blanket permissions.',
      color: 'consent',
    },
    {
      icon: Shield,
      title: 'Why Document Reuse is Central',
      desc: 'Citizens upload the same documents repeatedly. DigiLocker-first design eliminates redundancy while maintaining explicit consent for each use.',
      color: 'verified',
    },
    {
      icon: Zap,
      title: 'Why Eligibility Appears Before Long Forms',
      desc: "Quick eligibility checks prevent citizens from wasting time on applications they don't qualify for. Guidance reduces drop-off.",
      color: 'warning',
    },
    {
      icon: Eye,
      title: 'Why Status is Always Visible',
      desc: 'Citizens should never wonder "where is my application?" Timeline-based status with SLA transparency builds accountability.',
      color: 'info',
    },
    {
      icon: FileCheck,
      title: 'Why Grievances are Services',
      desc: 'Treating grievances as first-class services enables SLA tracking, routing, and resolution workflows instead of disconnected complaint systems.',
      color: 'grievance',
    },
    {
      icon: Map,
      title: 'How DigiLocker-first Expands',
      desc: 'The platform serves DigiLocker, UMANG, state portals, and municipal apps through the same Service Manifest Protocol. Multi-channel by design.',
      color: 'success',
    },
    {
      icon: Users,
      title: 'How Officers Process Applications',
      desc: 'Officers need speed and clarity. Queue-based workflows with document verification, deficiency handling, and audit trails reduce manual overhead.',
      color: 'primary',
    },
  ];

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Design Rationale</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Design Annotations</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Understanding the strategic decisions behind ServiceFormAI OS design patterns and how they protect privacy, build trust, and deliver citizen-centric service experiences.
          </p>
        </div>

        {/* Annotations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {annotations.map((item, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 bg-${item.color}/10 rounded-lg flex items-center justify-center mb-4`}>
                <item.icon className={`w-6 h-6 text-${item.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Core Principles */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Core Design Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { num: '1', label: 'Trust before transaction', desc: 'Build trust through transparency' },
              { num: '2', label: 'Consent before data sharing', desc: 'Explicit permission for every use' },
              { num: '3', label: 'Reuse before re-upload', desc: 'Verified documents eliminate redundancy' },
              { num: '4', label: 'Eligibility before long forms', desc: 'Quick checks prevent wasted effort' },
              { num: '5', label: 'Guidance before complexity', desc: 'Progressive disclosure reduces overwhelm' },
              { num: '6', label: 'Status always visible', desc: 'Accountability through transparency' },
              { num: '7', label: 'Citizen language over bureaucracy', desc: 'Plain language accessibility' },
              { num: '8', label: 'Officers need speed and clarity', desc: 'Efficient workflows reduce overhead' },
              { num: '9', label: 'Admins need governance and audit', desc: 'Compliance built into platform' },
              { num: '10', label: 'Local governments need templates', desc: 'Reusable patterns not custom builds' },
            ].map((principle, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-sm">{principle.num}</span>
                </div>
                <div>
                  <p className="font-semibold mb-1">{principle.label}</p>
                  <p className="text-sm text-muted-foreground">{principle.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Privacy */}
        <div className="bg-card border border-border rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">How the Design Protects Privacy and Trust</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-consent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-consent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Service-Specific Consent</h4>
                <p className="text-sm text-muted-foreground">
                  Every document access requires explicit consent for a specific service and purpose. No blanket permissions. Citizens can revoke access at any time.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-verified/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-verified" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Document References Not Copies</h4>
                <p className="text-sm text-muted-foreground">
                  Platform stores document references and metadata, not unnecessary copies. Verified documents remain in DigiLocker under citizen control.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-info" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Transparent Recommendations</h4>
                <p className="text-sm text-muted-foreground">
                  Citizens can see why a service was recommended, what signals were used, and how to turn off recommendations. No hidden profiling.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Complete Audit Trail</h4>
                <p className="text-sm text-muted-foreground">
                  Every consent grant, document access, officer action, and status change is logged. Citizens and auditors can trace every interaction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            ServiceFormAI OS design system — World-class citizen service intelligence network
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Digital public infrastructure for trusted service delivery
          </p>
        </div>
      </div>
    </div>
  );
}
