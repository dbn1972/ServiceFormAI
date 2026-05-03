import { Workflow, Users, Building2, Wallet, FileCheck, Shield, Zap, Globe } from 'lucide-react';

export default function EcosystemMap() {
  return (
    <div className="min-h-full bg-gradient-to-br from-background via-primary/5 to-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Product Ecosystem Map</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ServiceFormAI OS connects citizens, service producers, and multiple channels through an intelligent service delivery network
          </p>
        </div>

        {/* Ecosystem visualization */}
        <div className="relative">
          {/* Top Layer - Citizens & Channels */}
          <div className="mb-12">
            <h3 className="text-sm font-semibold text-center mb-6 text-muted-foreground">Citizens & Channels</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Citizens', color: 'primary' },
                { icon: Wallet, label: 'DigiLocker', color: 'verified' },
                { icon: Globe, label: 'UMANG Portal', color: 'info' },
                { icon: Building2, label: 'State Portal', color: 'consent' },
              ].map((item, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 bg-${item.color}/10 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <item.icon className={`w-6 h-6 text-${item.color}`} />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Core Platform */}
          <div className="mb-12">
            <h3 className="text-sm font-semibold text-center mb-6 text-muted-foreground">ServiceFormAI OS Core</h3>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <FileCheck className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Service Registry</h4>
                  <p className="text-sm text-muted-foreground">Service manifests, eligibility rules, jurisdiction routing</p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-success" />
                  </div>
                  <h4 className="font-semibold mb-2">Intelligence Layer</h4>
                  <p className="text-sm text-muted-foreground">Eligibility engine, recommendations, notifications</p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="w-10 h-10 bg-consent/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-consent" />
                  </div>
                  <h4 className="font-semibold mb-2">Consent Engine</h4>
                  <p className="text-sm text-muted-foreground">Document reuse, privacy controls, audit trail</p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center mb-4">
                    <Workflow className="w-5 h-5 text-info" />
                  </div>
                  <h4 className="font-semibold mb-2">Workflow OS</h4>
                  <p className="text-sm text-muted-foreground">Multi-tenant processing, officer queues, SLA tracking</p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="w-5 h-5 text-warning" />
                  </div>
                  <h4 className="font-semibold mb-2">API Gateway</h4>
                  <p className="text-sm text-muted-foreground">Plugin marketplace, integrations, webhooks</p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="w-10 h-10 bg-grievance/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-grievance" />
                  </div>
                  <h4 className="font-semibold mb-2">Governance</h4>
                  <p className="text-sm text-muted-foreground">Certification, audit logs, compliance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Producers */}
          <div>
            <h3 className="text-sm font-semibold text-center mb-6 text-muted-foreground">Service Producers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Central Govt', color: 'primary' },
                { label: 'State Dept', color: 'info' },
                { label: 'Municipality', color: 'consent' },
                { label: 'Banks & Partners', color: 'success' },
              ].map((item, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className={`w-12 h-12 bg-${item.color}/10 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <Building2 className={`w-6 h-6 text-${item.color}`} />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Flow arrows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent pointer-events-none" />
        </div>

        {/* Flow description */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', label: 'Publish', desc: 'Producer publishes service manifest' },
            { step: '2', label: 'Discover', desc: 'Citizen gets recommendation' },
            { step: '3', label: 'Apply', desc: 'Documents reused with consent' },
            { step: '4', label: 'Deliver', desc: 'Workflow processes and delivers' },
          ].map((flow, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                {flow.step}
              </div>
              <p className="font-semibold text-sm mb-1">{flow.label}</p>
              <p className="text-xs text-muted-foreground">{flow.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
