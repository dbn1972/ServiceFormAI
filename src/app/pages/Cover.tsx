import { Wallet, FileCheck, Shield, Workflow, Map, Package, CheckCircle, Zap } from 'lucide-react';

export default function Cover() {
  return (
    <div className="min-h-full bg-gradient-to-br from-primary/5 via-background to-accent/20 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        {/* Main heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Citizen Service Intelligence Network</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
            ServiceFormAI OS
          </h1>

          <p className="text-2xl md:text-3xl font-medium text-primary mb-4">
            Share once. Apply many times. Track everywhere.
          </p>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Citizen Service Intelligence Network for schemes, services, grievances, benefits, and trusted document reuse.
          </p>
        </div>

        {/* Visual metaphor */}
        <div className="mb-12 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Citizen Wallet */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Citizen Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connected to DigiLocker, verified documents, and citizen profile
              </p>
            </div>

            {/* Service Network */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Service Network</h3>
              <p className="text-sm text-muted-foreground">
                Departments, municipalities, banks, and approved providers
              </p>
            </div>

            {/* Workflow Engine */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-4">
                <Workflow className="w-6 h-6 text-info" />
              </div>
              <h3 className="font-semibold mb-2">Workflow Engine</h3>
              <p className="text-sm text-muted-foreground">
                Multi-tenant OS with routing, tracking, and delivery
              </p>
            </div>
          </div>

          {/* Connection lines visual */}
          <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Wallet, label: 'DigiLocker-first MVP', color: 'primary' },
            { icon: FileCheck, label: 'Service Manifest Protocol', color: 'success' },
            { icon: Shield, label: 'Consent-based Document Reuse', color: 'consent' },
            { icon: Workflow, label: 'Multi-tenant Workflow OS', color: 'info' },
            { icon: Zap, label: 'Eligibility Intelligence', color: 'warning' },
            { icon: Map, label: 'Citizen Service Feed', color: 'grievance' },
            { icon: CheckCircle, label: 'Grievances as Services', color: 'approved' },
            { icon: Package, label: 'Plugin-first Architecture', color: 'primary' },
          ].map((badge, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors"
            >
              <badge.icon className={`w-6 h-6 mx-auto mb-2 text-${badge.color}`} />
              <p className="text-xs font-medium text-foreground">{badge.label}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            World-class Citizen Service Intelligence Network
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Digital public infrastructure for schemes, certificates, grievances, and benefits
          </p>
        </div>
      </div>
    </div>
  );
}
