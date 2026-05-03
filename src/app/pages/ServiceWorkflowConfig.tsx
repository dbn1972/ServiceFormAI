import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  Trash2,
  GitBranch,
  CheckCircle,
  Clock,
  Bell,
  Users,
  FileText,
  Zap,
  AlertTriangle,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ALL_SERVICE_TEMPLATES } from '../data/serviceTemplates';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'approval';
  name: string;
  config: any;
  order: number;
}

const DEFAULT_WORKFLOWS: Record<string, WorkflowStep[] | undefined> = {
  'auto-approval-low-risk': [
    {
      id: 'trigger-1',
      type: 'trigger',
      name: 'Application Submitted',
      config: { event: 'application.submitted' },
      order: 1
    },
    {
      id: 'condition-1',
      type: 'condition',
      name: 'Check Eligibility',
      config: {
        rules: [
          { field: 'age', operator: '>=', value: '18' },
          { field: 'documents', operator: 'all_verified', value: true }
        ]
      },
      order: 2
    },
    {
      id: 'action-1',
      type: 'action',
      name: 'Auto-Approve',
      config: { status: 'approved', notify: true },
      order: 3
    },
    {
      id: 'action-2',
      type: 'action',
      name: 'Send Approval Email',
      config: { template: 'approval_notification', to: 'applicant' },
      order: 4
    }
  ],
  'manual-review': [
    {
      id: 'trigger-1',
      type: 'trigger',
      name: 'Application Submitted',
      config: { event: 'application.submitted' },
      order: 1
    },
    {
      id: 'action-1',
      type: 'action',
      name: 'Assign to Officer Queue',
      config: { department: 'auto', priority: 'normal' },
      order: 2
    },
    {
      id: 'approval-1',
      type: 'approval',
      name: 'Officer Review',
      config: { role: 'officer', sla_hours: 48 },
      order: 3
    },
    {
      id: 'condition-1',
      type: 'condition',
      name: 'Check Decision',
      config: { field: 'officer_decision', operator: '==', value: 'approved' },
      order: 4
    },
    {
      id: 'action-2',
      type: 'action',
      name: 'Update Status',
      config: { status: 'approved' },
      order: 5
    }
  ],
  'two-tier-approval': [
    {
      id: 'trigger-1',
      type: 'trigger',
      name: 'Application Submitted',
      config: { event: 'application.submitted' },
      order: 1
    },
    {
      id: 'approval-1',
      type: 'approval',
      name: 'First Level (Officer)',
      config: { role: 'officer', sla_hours: 24 },
      order: 2
    },
    {
      id: 'approval-2',
      type: 'approval',
      name: 'Second Level (Senior Officer)',
      config: { role: 'senior_officer', sla_hours: 48 },
      order: 3
    },
    {
      id: 'action-1',
      type: 'action',
      name: 'Final Approval',
      config: { status: 'approved', generate_certificate: true },
      order: 4
    }
  ]
};

export default function ServiceWorkflowConfig() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service') || 'birth-certificate';

  const template = (ALL_SERVICE_TEMPLATES.find(t => t.id === serviceId) || ALL_SERVICE_TEMPLATES[0])!;

  const [selectedWorkflow, setSelectedWorkflow] = useState('manual-review');
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(DEFAULT_WORKFLOWS['manual-review'] ?? []);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [slaConfig, setSlaConfig] = useState({
    enabled: true,
    targetDays: parseInt(template.sla.split(' ')[0] ?? '7') || 7,
    warningThreshold: 80, // % of SLA
    escalationThreshold: 100
  });
  const [notificationConfig, setNotificationConfig] = useState({
    onSubmit: true,
    onStatusChange: true,
    onApproval: true,
    onRejection: true,
    slaReminders: true
  });

  const handleWorkflowChange = (workflowType: string) => {
    setSelectedWorkflow(workflowType);
    setWorkflowSteps(DEFAULT_WORKFLOWS[workflowType] ?? []);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger': return Play;
      case 'action': return Zap;
      case 'condition': return GitBranch;
      case 'approval': return CheckCircle;
      default: return FileText;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'primary';
      case 'action': return 'success';
      case 'condition': return 'warning';
      case 'approval': return 'info';
      default: return 'muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Workflow Configuration</h1>
                <p className="text-muted-foreground">
                  Configure approval workflow for <strong>{template.name}</strong>
                </p>
              </div>
              <button className="px-6 py-3 bg-success text-success-foreground rounded-lg font-semibold hover:bg-success/90 transition-colors flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Workflow Templates */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Service Info Card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Service Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{template.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target SLA:</span>
                    <p className="font-medium">{template.sla}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Complexity:</span>
                    <p className="font-medium">{template.fields.length} fields, {template.documents.length} documents</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Audience:</span>
                    <p className="font-medium">{template.targetAudience}</p>
                  </div>
                </div>
              </div>

              {/* Workflow Templates */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Workflow Templates</h3>
                <div className="space-y-2">
                  {[
                    {
                      id: 'auto-approval-low-risk',
                      name: 'Auto-Approval',
                      description: 'Automatic approval for low-risk services',
                      icon: Zap,
                      color: 'success'
                    },
                    {
                      id: 'manual-review',
                      name: 'Manual Review',
                      description: 'Officer review required for all applications',
                      icon: Users,
                      color: 'info'
                    },
                    {
                      id: 'two-tier-approval',
                      name: 'Two-Tier Approval',
                      description: 'Officer + Senior Officer approval',
                      icon: GitBranch,
                      color: 'warning'
                    }
                  ].map(workflow => (
                    <button
                      key={workflow.id}
                      onClick={() => handleWorkflowChange(workflow.id)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        selectedWorkflow === workflow.id
                          ? 'bg-primary/10 border-primary/50'
                          : 'bg-card border-border hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 bg-${workflow.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <workflow.icon className={`w-5 h-5 text-${workflow.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">{workflow.name}</h4>
                          <p className="text-xs text-muted-foreground">{workflow.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h3 className="font-semibold">Estimated Impact</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span className="font-semibold">
                      {selectedWorkflow === 'auto-approval-low-risk' ? '< 1 hour' : selectedWorkflow === 'manual-review' ? '2-3 days' : '4-5 days'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Officer Load:</span>
                    <span className="font-semibold">
                      {selectedWorkflow === 'auto-approval-low-risk' ? 'Low (10%)' : selectedWorkflow === 'manual-review' ? 'Medium (50%)' : 'High (80%)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-Approval Rate:</span>
                    <span className="font-semibold">
                      {selectedWorkflow === 'auto-approval-low-risk' ? '~70%' : selectedWorkflow === 'manual-review' ? '0%' : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Workflow Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Steps */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Workflow Steps</h3>
                <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>

              <div className="space-y-4">
                {workflowSteps.map((step, index) => {
                  const Icon = getStepIcon(step.type);
                  const color = getStepColor(step.type);
                  const isExpanded = expandedStep === step.id;

                  return (
                    <div key={step.id} className="relative">
                      {/* Connector Line */}
                      {index < workflowSteps.length - 1 && (
                        <div className="absolute left-6 top-14 w-0.5 h-6 bg-border" />
                      )}

                      {/* Step Card */}
                      <div className={`border rounded-lg transition-all ${
                        isExpanded ? 'border-primary/50 shadow-md' : 'border-border'
                      }`}>
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                          className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 bg-${color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-6 h-6 text-${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  Step {index + 1}: {step.type}
                                </span>
                              </div>
                              <h4 className="font-semibold">{step.name}</h4>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </button>

                        {/* Expanded Config */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border">
                            <div className="pt-4 space-y-3">
                              {step.type === 'condition' && step.config.rules && (
                                <>
                                  <h5 className="text-sm font-semibold">Conditions</h5>
                                  {step.config.rules.map((rule: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm p-3 bg-muted/30 rounded-lg">
                                      <span className="font-medium">{rule.field}</span>
                                      <span className="text-muted-foreground">{rule.operator}</span>
                                      <span className="font-medium">{rule.value}</span>
                                    </div>
                                  ))}
                                </>
                              )}
                              {step.type === 'action' && (
                                <>
                                  <h5 className="text-sm font-semibold">Action Configuration</h5>
                                  <div className="space-y-2">
                                    {Object.entries(step.config).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                                        <span className="font-medium">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                              {step.type === 'approval' && (
                                <>
                                  <h5 className="text-sm font-semibold">Approval Configuration</h5>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                                      <span className="text-muted-foreground">Approver Role:</span>
                                      <span className="font-medium capitalize">{step.config.role.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                                      <span className="text-muted-foreground">SLA:</span>
                                      <span className="font-medium">{step.config.sla_hours} hours</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              <div className="flex gap-2 pt-2">
                                <button className="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted flex items-center justify-center gap-2">
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button className="px-3 py-2 border border-destructive/50 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 flex items-center gap-2">
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SLA Configuration */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                SLA Management
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <h4 className="font-semibold mb-1">Enable SLA Tracking</h4>
                    <p className="text-sm text-muted-foreground">Monitor and enforce service level agreements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slaConfig.enabled}
                      onChange={(e) => setSlaConfig({ ...slaConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {slaConfig.enabled && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Target Days</label>
                        <input
                          type="number"
                          value={slaConfig.targetDays}
                          onChange={(e) => setSlaConfig({ ...slaConfig, targetDays: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Warning at (%)</label>
                        <input
                          type="number"
                          value={slaConfig.warningThreshold}
                          onChange={(e) => setSlaConfig({ ...slaConfig, warningThreshold: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Escalate at (%)</label>
                        <input
                          type="number"
                          value={slaConfig.escalationThreshold}
                          onChange={(e) => setSlaConfig({ ...slaConfig, escalationThreshold: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">SLA Breach Notifications</p>
                          <p className="text-muted-foreground">
                            Officers will receive alerts at {slaConfig.warningThreshold}% ({Math.round(slaConfig.targetDays * slaConfig.warningThreshold / 100)} days)
                            and escalations at {slaConfig.escalationThreshold}% ({Math.round(slaConfig.targetDays * slaConfig.escalationThreshold / 100)} days)
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notification Configuration */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'onSubmit', label: 'Application Submitted', description: 'Notify citizen when application is received' },
                  { key: 'onStatusChange', label: 'Status Updates', description: 'Notify on any status change (under review, pending docs, etc.)' },
                  { key: 'onApproval', label: 'Application Approved', description: 'Notify citizen when application is approved' },
                  { key: 'onRejection', label: 'Application Rejected', description: 'Notify citizen when application is rejected with reasons' },
                  { key: 'slaReminders', label: 'SLA Reminders', description: 'Send reminders to officers when approaching SLA deadline' }
                ].map(notification => (
                  <div key={notification.key} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-semibold mb-1">{notification.label}</h4>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationConfig[notification.key as keyof typeof notificationConfig]}
                        onChange={(e) => setNotificationConfig({ ...notificationConfig, [notification.key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
