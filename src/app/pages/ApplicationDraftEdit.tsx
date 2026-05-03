import { Save, Clock, Edit3, Trash2, FileText, AlertCircle, CheckCircle, Upload, ChevronRight, Info, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { consumerService } from '../services/api/consumer.service';

export default function ApplicationDraftEdit() {
  const { id } = useParams<{ id: string }>();
  const [autoSave, setAutoSave] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appTitle, setAppTitle] = useState('Birth Certificate Application');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!id) return;
    consumerService.getApplicationById(id).then((app) => {
      if (app.service?.name) setAppTitle(app.service.name);
    }).catch(() => {});
  }, [id]);

  const handleSaveDraft = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      const formData = formRef.current ? Object.fromEntries(new FormData(formRef.current)) : {};
      await consumerService.updateDraft(id, formData);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{appTitle}</h1>
                  <p className="text-sm text-muted-foreground">Draft saved • Last edited 5 minutes ago</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Draft
              </button>
              <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Submit Application
              </button>
            </div>
          </div>

          {/* Auto-save indicator */}
          <div className="flex items-center justify-between py-3 px-4 bg-info/5 border border-info/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">Auto-save enabled</span>
              </div>
              <span className="text-sm text-muted-foreground">• Changes are saved automatically every 30 seconds</span>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                autoSave ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}
            >
              {autoSave ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">1. Applicant Information</h2>
                <span className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                  Complete
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      defaultValue="Ananya Sharma"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Relationship <span className="text-destructive">*</span>
                    </label>
                    <select className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Mother</option>
                      <option>Father</option>
                      <option>Guardian</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mobile Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      defaultValue="+91 98765 43210"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      defaultValue="ananya.sharma@email.com"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Aadhaar Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="XXXX-XXXX-2847"
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Child Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">2. Child Information</h2>
                <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                  In Progress
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Child's First Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      defaultValue="Aarav"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Child's Last Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      defaultValue="Sharma"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date of Birth <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      defaultValue="2026-03-15"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Gender <span className="text-destructive">*</span>
                    </label>
                    <select className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Place of Birth <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter hospital or location name"
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    This field is required
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter hospital name (if applicable)"
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">3. Parent Information</h2>
                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                  Not Started
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Father's Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mother's Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Father's Aadhaar
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mother's Aadhaar
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">4. Supporting Documents</h2>
                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                  0/3 Uploaded
                </span>
              </div>

              <div className="space-y-4">
                {/* Document 1 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Hospital Discharge Summary</h3>
                        <p className="text-sm text-muted-foreground">Required • PDF, JPG, PNG (Max 5MB)</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2.5 px-4 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                  </button>
                </div>

                {/* Document 2 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Parent's ID Proof</h3>
                        <p className="text-sm text-muted-foreground">Required • Aadhaar or Passport</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2.5 px-4 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                  </button>
                </div>

                {/* Document 3 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Address Proof</h3>
                        <p className="text-sm text-muted-foreground">Required • Utility bill or rent agreement</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2.5 px-4 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <button onClick={handleSaveDraft} disabled={saving} className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as Draft
              </button>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted/50">
                  Cancel
                </button>
                <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
                  Submit Application
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Application Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Completion</span>
                    <span className="text-sm font-medium">40%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Applicant Information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-sm">Child Information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground"></div>
                    <span className="text-sm text-muted-foreground">Parent Information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground"></div>
                    <span className="text-sm text-muted-foreground">Supporting Documents</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Draft Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Draft Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">Apr 25, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Saved</span>
                  <span className="font-medium">5 minutes ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires In</span>
                  <span className="font-medium text-warning">25 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auto-save</span>
                  <span className="font-medium text-success">Active</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-info" />
                <h3 className="font-semibold">Need Help?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your draft is automatically saved. You can return anytime within 30 days to complete your application.
              </p>
              <button className="w-full py-2 px-4 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted/50">
                View Help Guide
              </button>
            </div>

            {/* Tips */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-3">Tips for Success</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Have all required documents ready before starting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Double-check all information for accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Upload clear, legible copies of documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Save draft frequently to avoid data loss</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Delete Draft?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this draft? All your progress will be permanently lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80"
              >
                Cancel
              </button>
              <button className="flex-1 py-2.5 px-4 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90">
                Delete Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
