import { Users, FileText, CheckCircle, ArrowRight, HelpCircle, Printer, Camera, Clock } from 'lucide-react';

export default function CSCOperatorInterface() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CSC Operator Interface</h1>
          <p className="text-muted-foreground">Assisted service mode for Common Service Centers</p>
        </div>

        {/* Operator Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Applications Today', value: '12', icon: FileText, color: 'primary' },
            { label: 'Citizens Served', value: '8', icon: Users, color: 'success' },
            { label: 'Completed', value: '9', icon: CheckCircle, color: 'info' },
            { label: 'In Progress', value: '3', icon: Clock, color: 'warning' },
          ].map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}`} />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Citizen Session */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-primary/5 border-b border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Active Session</h2>
                    <p className="text-sm text-muted-foreground">Helping: Citizen #CSC-2026-045</p>
                  </div>
                  <button className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
                    End Session
                  </button>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                    Continue Application
                  </button>
                  <button className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">
                    Start New Service
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Large, Clear Steps */}
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h3 className="text-lg font-semibold">Citizen Information</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Collect basic details from the citizen
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-base font-medium mb-3">Full Name *</label>
                        <input
                          type="text"
                          placeholder="Enter citizen's full name"
                          className="w-full px-5 py-4 bg-input-background border-2 border-border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-base font-medium mb-3">Mobile Number *</label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          className="w-full px-5 py-4 bg-input-background border-2 border-border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-muted pl-6 py-2 opacity-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <h3 className="text-lg font-semibold">Select Service</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Choose the service citizen needs help with
                    </p>
                  </div>

                  <div className="border-l-4 border-muted pl-6 py-2 opacity-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <h3 className="text-lg font-semibold">Complete Application</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Help citizen fill and submit the form
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Operator Tools */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-3 bg-info/10 text-info border border-info/20 rounded-lg font-medium hover:bg-info/20 flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5" />
                  Scan Document
                </button>
                <button className="w-full py-3 bg-success/10 text-success border border-success/20 rounded-lg font-medium hover:bg-success/20 flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                <button className="w-full py-3 bg-warning/10 text-warning border border-warning/20 rounded-lg font-medium hover:bg-warning/20 flex items-center justify-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Help Guide
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-info/10 border border-info/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-2">Operator Guidance</p>
                  <p className="text-sm text-muted-foreground">
                    Speak clearly to the citizen. Explain each step in their preferred language. Verify all details before submitting.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Recent Sessions</h3>
              <div className="space-y-3">
                {[
                  { id: '044', service: 'Birth Certificate', status: 'completed' },
                  { id: '043', service: 'Income Certificate', status: 'completed' },
                  { id: '042', service: 'Scholarship', status: 'in-progress' },
                ].map((session, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Session #{session.id}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        session.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{session.service}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Assisted Mode Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <CheckCircle className="w-5 h-5 text-success mb-2" />
              <p className="font-medium mb-1">Large Touch Targets</p>
              <p className="text-muted-foreground">2× larger buttons and inputs for easy navigation</p>
            </div>
            <div>
              <CheckCircle className="w-5 h-5 text-success mb-2" />
              <p className="font-medium mb-1">Step-by-Step Guidance</p>
              <p className="text-muted-foreground">Clear instructions at each stage</p>
            </div>
            <div>
              <CheckCircle className="w-5 h-5 text-success mb-2" />
              <p className="font-medium mb-1">Document Scanning</p>
              <p className="text-muted-foreground">Integrated camera for quick uploads</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
