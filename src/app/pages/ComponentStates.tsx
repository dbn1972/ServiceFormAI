import { Loader2, AlertCircle, CheckCircle, Inbox, WifiOff, XCircle } from 'lucide-react';

export default function ComponentStates() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Component States & Variations</h1>
          <p className="text-muted-foreground">Loading, error, empty, and disabled states for all components</p>
        </div>

        {/* Button States */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Button States</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-sm font-medium mb-3">Default</p>
              <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Submit
              </button>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Hover</p>
              <button className="w-full px-4 py-3 bg-primary/90 text-primary-foreground rounded-lg font-medium shadow-md">
                Submit
              </button>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Active/Pressed</p>
              <button className="w-full px-4 py-3 bg-primary/80 text-primary-foreground rounded-lg font-medium shadow-inner">
                Submit
              </button>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Loading</p>
              <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2" disabled>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </button>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Disabled</p>
              <button className="w-full px-4 py-3 bg-muted text-muted-foreground rounded-lg font-medium cursor-not-allowed opacity-50" disabled>
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Input States */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Input States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Default</p>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Filled</p>
              <input
                type="text"
                value="Ananya Sharma"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                readOnly
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Error</p>
              <input
                type="text"
                placeholder="Required field"
                className="w-full px-4 py-3 bg-input-background border-2 border-destructive rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
              />
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                This field is required
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Success/Verified</p>
              <input
                type="text"
                value="Ananya Sharma"
                className="w-full px-4 py-3 bg-input-background border-2 border-success rounded-lg"
                readOnly
              />
              <p className="text-sm text-success mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Verified from DigiLocker
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Disabled</p>
              <input
                type="text"
                placeholder="Not editable"
                className="w-full px-4 py-3 bg-muted text-muted-foreground border border-border rounded-lg cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Loading</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Validating..."
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  disabled
                />
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            </div>
          </div>
        </div>

        {/* Card States */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Card States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Loading Card */}
            <div className="border border-border rounded-xl p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4">Loading skeleton</p>
            </div>

            {/* Error Card */}
            <div className="border-2 border-destructive/30 bg-destructive/5 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Failed to Load</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Unable to retrieve application data. Please try again.
                  </p>
                </div>
              </div>
              <button className="w-full py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium">
                Retry
              </button>
              <p className="text-xs text-center text-muted-foreground mt-4">Error state</p>
            </div>

            {/* Empty Card */}
            <div className="border border-border rounded-xl p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold mb-2">No Applications</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't applied for any services yet
                </p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  Browse Services
                </button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4">Empty state</p>
            </div>
          </div>
        </div>

        {/* Network States */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Network & Connectivity States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-warning/30 bg-warning/5 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <WifiOff className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Offline Mode</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You're currently offline. Changes will sync when connection is restored.
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm font-medium">
                      Retry Connection
                    </button>
                    <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">
                      View Saved
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-info/30 bg-info/5 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Loader2 className="w-6 h-6 text-info flex-shrink-0 mt-0.5 animate-spin" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Syncing Data</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Uploading documents and form data...
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-info transition-all duration-300" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Validation States */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Form Validation States</h2>
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email (Valid)</label>
              <div className="relative">
                <input
                  type="email"
                  value="ananya@example.com"
                  className="w-full px-4 py-3 pr-10 bg-input-background border-2 border-success rounded-lg"
                  readOnly
                />
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number (Invalid Format)</label>
              <div className="relative">
                <input
                  type="tel"
                  value="123"
                  className="w-full px-4 py-3 pr-10 bg-input-background border-2 border-destructive rounded-lg"
                />
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm text-destructive mt-1">Please enter a valid 10-digit mobile number</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth (Validating)</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-4 py-3 pr-10 bg-input-background border border-border rounded-lg"
                  disabled
                />
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">Verifying age eligibility...</p>
            </div>
          </div>
        </div>

        {/* List States */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">List & Data States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Loading List */}
            <div>
              <h3 className="font-medium mb-3">Loading</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty List */}
            <div>
              <h3 className="font-medium mb-3">Empty</h3>
              <div className="border border-dashed border-border rounded-lg p-8 text-center">
                <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No items found</p>
                <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
              </div>
            </div>

            {/* Error List */}
            <div>
              <h3 className="font-medium mb-3">Error</h3>
              <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Failed to load</p>
                <button className="text-xs text-destructive hover:underline mt-2">
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
