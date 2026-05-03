import { Plus, GripVertical, Settings, Eye, Trash2, Type, Calendar, CheckSquare, Upload } from 'lucide-react';

export default function FormBuilder() {
  return (
    <div className="min-h-full bg-background">
      <div className="flex h-screen">
        {/* Left Panel - Form Builder */}
        <div className="flex-1 border-r border-border overflow-y-auto">
          <div className="border-b border-border p-6 bg-card">
            <h2 className="text-xl font-semibold mb-2">Form Builder</h2>
            <p className="text-sm text-muted-foreground">State Merit Scholarship 2026</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {/* Draggable Field */}
              <div className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-primary" />
                        <span className="font-medium">Full Name</span>
                        <span className="text-xs bg-verified/10 text-verified px-2 py-0.5 rounded-full">Prefillable</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-muted rounded">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                      disabled
                    />
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Maps to: DigiLocker → Aadhaar → Name</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Field */}
              <div className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-info" />
                        <span className="font-medium">Date of Birth</span>
                        <span className="text-xs bg-verified/10 text-verified px-2 py-0.5 rounded-full">Prefillable</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-muted rounded">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                      disabled
                    />
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Maps to: DigiLocker → Aadhaar → DOB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Select Field */}
              <div className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-success" />
                        <span className="font-medium">Annual Income Range</span>
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Required</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-muted rounded">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <select className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" disabled>
                      <option>Select income range</option>
                      <option>Below ₹1,00,000</option>
                      <option>₹1,00,000 - ₹2,50,000</option>
                      <option>Above ₹2,50,000</option>
                    </select>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Used in eligibility rule: income ≤ ₹2,50,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload Field */}
              <div className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-warning" />
                        <span className="font-medium">Bank Account Proof</span>
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Required</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-muted rounded">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>DigiLocker fallback: BANK_PASSBOOK, BANK_ACCOUNT_VERIFICATION</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Field Button */}
              <button className="w-full py-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Field</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Field Library & Preview */}
        <div className="w-80 bg-muted/30 overflow-y-auto">
          <div className="border-b border-border p-4">
            <div className="flex gap-2 mb-4">
              <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                Fields
              </button>
              <button className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">
                <Eye className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">Field Types</h3>
            <div className="space-y-2">
              {[
                { icon: Type, label: 'Text Input', color: 'primary' },
                { icon: Calendar, label: 'Date Picker', color: 'info' },
                { icon: CheckSquare, label: 'Dropdown', color: 'success' },
                { icon: CheckSquare, label: 'Checkbox', color: 'verified' },
                { icon: CheckSquare, label: 'Radio Group', color: 'consent' },
                { icon: Upload, label: 'File Upload', color: 'warning' },
                { icon: Type, label: 'Text Area', color: 'primary' },
                { icon: Type, label: 'Number', color: 'info' },
              ].map((field, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className={`w-8 h-8 bg-${field.color}/10 rounded flex items-center justify-center`}>
                    <field.icon className={`w-4 h-4 text-${field.color}`} />
                  </div>
                  <span className="text-sm font-medium">{field.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">DigiLocker Fields</h3>
              <div className="space-y-2">
                {[
                  'Name (from Aadhaar)',
                  'Date of Birth',
                  'Address',
                  'Mobile Number',
                  'Email',
                ].map((field, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-2 p-3 bg-verified/5 border border-verified/20 rounded-lg hover:bg-verified/10 transition-colors text-left text-sm"
                  >
                    <div className="w-6 h-6 bg-verified/10 rounded flex items-center justify-center">
                      <Type className="w-3 h-3 text-verified" />
                    </div>
                    {field}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
