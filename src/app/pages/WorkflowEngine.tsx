import { Play, GitBranch, CheckCircle, Clock, Mail, FileText, Users, Zap, Code, Save, Eye } from 'lucide-react';

export default function WorkflowEngine() {
  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workflow Engine</h1>
            <p className="text-muted-foreground">Visual workflow designer for service automation</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Workflow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Node Library */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-8">
              <h3 className="font-semibold mb-4">Workflow Nodes</h3>

              <div className="space-y-6">
                {/* Triggers */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">TRIGGERS</p>
                  <div className="space-y-2">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg cursor-move hover:bg-primary/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Play className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Application Start</span>
                      </div>
                      <p className="text-xs text-muted-foreground">When a new application is submitted</p>
                    </div>
                    <div className="p-3 bg-info/10 border border-info/20 rounded-lg cursor-move hover:bg-info/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-info" />
                        <span className="text-sm font-medium">Scheduled</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Run at specific times</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">ACTIONS</p>
                  <div className="space-y-2">
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg cursor-move hover:bg-success/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium">Approve</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Auto-approve application</p>
                    </div>
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg cursor-move hover:bg-warning/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium">Send Email</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Notify via email</p>
                    </div>
                    <div className="p-3 bg-purple/10 border border-purple/20 rounded-lg cursor-move hover:bg-purple/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple" />
                        <span className="text-sm font-medium">Assign Officer</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Route to specific officer</p>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">CONDITIONS</p>
                  <div className="space-y-2">
                    <div className="p-3 bg-accent border border-border rounded-lg cursor-move hover:bg-accent/80 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="w-4 h-4 text-accent-foreground" />
                        <span className="text-sm font-medium">If/Else</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Conditional branching</p>
                    </div>
                    <div className="p-3 bg-accent border border-border rounded-lg cursor-move hover:bg-accent/80 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Code className="w-4 h-4 text-accent-foreground" />
                        <span className="text-sm font-medium">Custom Logic</span>
                      </div>
                      <p className="text-xs text-muted-foreground">JavaScript function</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Canvas Header */}
              <div className="border-b border-border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Scholarship Application Workflow</h3>
                      <p className="text-xs text-muted-foreground">Auto-approval for eligible applicants</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full">Active</span>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="p-8 min-h-[600px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="relative">
                  {/* Start Node */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-0">
                    <div className="w-48 bg-primary/10 border-2 border-primary rounded-xl p-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Play className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-sm">Application Received</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Trigger: New submission</p>
                      <button className="w-full py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                        Configure
                      </button>
                    </div>
                    {/* Arrow down */}
                    <div className="w-0.5 h-12 bg-border mx-auto my-2"></div>
                  </div>

                  {/* Check Eligibility Node */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-32">
                    <div className="w-48 bg-info/10 border-2 border-info rounded-xl p-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-info" />
                        <span className="font-semibold text-sm">Check Eligibility</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Verify age, income, documents</p>
                      <button className="w-full py-1 bg-info/20 text-info rounded text-xs font-medium">
                        Configure
                      </button>
                    </div>
                    {/* Arrow down */}
                    <div className="w-0.5 h-12 bg-border mx-auto my-2"></div>
                  </div>

                  {/* Condition Node */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-64">
                    <div className="w-48 bg-accent border-2 border-border rounded-xl p-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="w-5 h-5 text-accent-foreground" />
                        <span className="font-semibold text-sm">Is Eligible?</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">If all criteria met</p>
                      <button className="w-full py-1 bg-accent/80 text-accent-foreground rounded text-xs font-medium">
                        Configure
                      </button>
                    </div>
                  </div>

                  {/* Yes Branch - Auto Approve */}
                  <div className="absolute left-[20%] top-96">
                    {/* Arrow from condition */}
                    <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-success"></div>
                    <div className="w-48 bg-success/10 border-2 border-success rounded-xl p-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="font-semibold text-sm">Auto-Approve</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Status: Approved</p>
                      <button className="w-full py-1 bg-success/20 text-success rounded text-xs font-medium">
                        Configure
                      </button>
                    </div>
                    <div className="w-0.5 h-8 bg-border mx-auto my-2"></div>
                    {/* Send Email */}
                    <div className="w-48 bg-warning/10 border-2 border-warning rounded-xl p-4 shadow-lg mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-warning" />
                        <span className="font-semibold text-sm">Send Approval Email</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Template: approval.html</p>
                      <button className="w-full py-1 bg-warning/20 text-warning rounded text-xs font-medium">
                        Configure
                      </button>
                    </div>
                  </div>

                  {/* No Branch - Manual Review */}
                  <div className="absolute right-[20%] top-96">
                    {/* Arrow from condition */}
                    <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-destructive"></div>
                    <div className="w-48 bg-destructive/10 border-2 border-destructive rounded-xl p-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-destructive" />
                        <span className="font-semibold text-sm">Assign to Officer</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Manual review required</p>
                      <button className="w-full py-1 bg-destructive/20 text-destructive rounded text-xs font-medium">
                        Configure
                      </button>
                    </div>
                    <div className="w-0.5 h-8 bg-border mx-auto my-2"></div>
                    {/* Send Email */}
                    <div className="w-48 bg-warning/10 border-2 border-warning rounded-xl p-4 shadow-lg mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-warning" />
                        <span className="font-semibold text-sm">Send Pending Email</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Template: under_review.html</p>
                      <button className="w-full py-1 bg-warning/20 text-warning rounded text-xs font-medium">
                        Configure
                      </button>
                    </div>
                  </div>

                  {/* Branch Labels */}
                  <div className="absolute left-[35%] top-[21.5rem]">
                    <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">YES</span>
                  </div>
                  <div className="absolute right-[35%] top-[21.5rem]">
                    <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">NO</span>
                  </div>
                </div>
              </div>

              {/* Canvas Footer */}
              <div className="border-t border-border p-4 bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last edited: 2 hours ago by Admin</span>
                  <div className="flex items-center gap-4">
                    <span>7 nodes • 2 branches</span>
                    <button className="px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 font-medium">
                      + Add Node
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Settings */}
            <div className="bg-card border border-border rounded-xl p-6 mt-6">
              <h3 className="font-semibold mb-4">Workflow Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Workflow Name</label>
                  <input
                    type="text"
                    value="Scholarship Auto-Approval"
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Service Type</label>
                  <select className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm">
                    <option>Scholarship</option>
                    <option>Certificate</option>
                    <option>License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm">
                    <option>Active</option>
                    <option>Draft</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
