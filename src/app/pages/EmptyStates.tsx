import { Inbox, FileText, Search, Bell, Users, MapPin, Wifi, Shield, Calendar, Package, Heart, Star, CheckCircle, Image as ImageIcon, Folder, AlertCircle } from 'lucide-react';

export default function EmptyStates() {
  const emptyStateScenarios = [
    {
      category: 'No Content',
      states: [
        {
          icon: Inbox,
          title: 'No Applications Yet',
          description: "You haven't applied for any services. Explore the catalog to find services you're eligible for.",
          action: 'Browse Services',
          actionIcon: Search,
        },
        {
          icon: Bell,
          title: 'No Notifications',
          description: "You're all caught up! We'll notify you when there are updates to your applications.",
          action: null,
        },
        {
          icon: FileText,
          title: 'No Documents',
          description: 'Link your DigiLocker account to access verified government documents automatically.',
          action: 'Connect DigiLocker',
          actionIcon: Shield,
        },
      ],
    },
    {
      category: 'Search & Filters',
      states: [
        {
          icon: Search,
          title: 'No Results Found',
          description: "We couldn't find any services matching \"driving license renewal\". Try different keywords or browse all services.",
          action: 'Clear Filters',
        },
        {
          icon: MapPin,
          title: 'No Services in Your Area',
          description: 'There are no local services available in your municipality. Check state-level or central services instead.',
          action: 'View All Services',
        },
      ],
    },
    {
      category: 'Error States',
      states: [
        {
          icon: Wifi,
          title: 'No Internet Connection',
          description: "You're offline. Your changes will be saved locally and synced when you reconnect.",
          action: 'Retry',
          variant: 'warning',
        },
        {
          icon: Package,
          title: 'Service Temporarily Unavailable',
          description: 'This service is undergoing maintenance. Please check back in a few hours.',
          action: 'Check Status',
          variant: 'warning',
        },
      ],
    },
    {
      category: 'Success & Completion',
      states: [
        {
          icon: CheckCircle,
          title: 'All Done!',
          description: "You've completed all pending actions. Your applications are being processed.",
          action: 'View Dashboard',
          variant: 'success',
        },
        {
          icon: Star,
          title: "You're Verified!",
          description: 'Your identity has been verified. You now have access to all premium services.',
          action: null,
          variant: 'success',
        },
      ],
    },
    {
      category: 'User Actions Required',
      states: [
        {
          icon: Calendar,
          title: 'Schedule Your Appointment',
          description: 'To complete your application, you need to book an in-person verification appointment.',
          action: 'Book Appointment',
        },
        {
          icon: Users,
          title: 'Add Family Members',
          description: 'Some services require family member details. Add them to unlock additional benefits.',
          action: 'Add Members',
        },
      ],
    },
  ];

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Empty States & Illustrations</h1>
          <p className="text-muted-foreground">Visual library for no-content scenarios and guidance</p>
        </div>

        {/* Design Guidelines */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Empty State Design Principles</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">1. Guide, Don't Block</h3>
              <p className="text-sm text-muted-foreground">
                Empty states are opportunities to educate and guide users toward meaningful actions, not dead ends.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">2. Be Helpful</h3>
              <p className="text-sm text-muted-foreground">
                Explain why the state is empty and what users can do next. Provide clear, actionable next steps.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">3. Stay Positive</h3>
              <p className="text-sm text-muted-foreground">
                Use encouraging, friendly language. Frame empty states as opportunities rather than failures.
              </p>
            </div>
          </div>
        </div>

        {/* Anatomy */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Empty State Anatomy</h2>

          <div className="max-w-2xl mx-auto border border-border rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <Inbox className="w-10 h-10 text-primary" />
              <div className="absolute -top-2 -left-2 text-xs font-mono text-muted-foreground">1. Icon</div>
            </div>
            <div className="relative mb-4">
              <h3 className="text-xl font-semibold">No Applications Yet</h3>
              <div className="absolute -top-2 -right-2 text-xs font-mono text-muted-foreground">2. Title</div>
            </div>
            <div className="relative mb-8">
              <p className="text-muted-foreground">
                You haven't applied for any services. Explore the catalog to find services you're eligible for.
              </p>
              <div className="absolute -bottom-2 -right-2 text-xs font-mono text-muted-foreground">3. Description</div>
            </div>
            <div className="relative">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
                Browse Services
              </button>
              <div className="absolute -bottom-2 -left-2 text-xs font-mono text-muted-foreground">4. Action (Optional)</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Icon Size</h4>
              <p className="text-xs text-muted-foreground">64px to 80px in circular container</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Spacing</h4>
              <p className="text-xs text-muted-foreground">24px between elements, 48px padding around</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Title</h4>
              <p className="text-xs text-muted-foreground">20px-24px, font-semibold, concise (3-5 words)</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Description</h4>
              <p className="text-xs text-muted-foreground">14px-16px, muted color, 1-2 sentences</p>
            </div>
          </div>
        </div>

        {/* Empty State Scenarios */}
        {emptyStateScenarios.map((category, catIndex) => (
          <div key={catIndex} className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">{category.category}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.states.map((state, index) => {
                const Icon = state.icon;
                const stateAny = state as any;
                const ActionIcon = stateAny.actionIcon;
                const variantColor =
                  stateAny.variant === 'success' ? 'success' :
                  stateAny.variant === 'warning' ? 'warning' :
                  'primary';

                return (
                  <div key={index} className="border border-border rounded-xl p-8 text-center hover:shadow-md transition-shadow">
                    <div className={`w-16 h-16 bg-${variantColor}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-8 h-8 text-${variantColor}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{state.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{state.description}</p>
                    {state.action && (
                      <button className={`px-4 py-2 bg-${variantColor} text-${variantColor}-foreground rounded-lg text-sm font-medium hover:bg-${variantColor}/90 flex items-center gap-2 mx-auto`}>
                        {ActionIcon && <ActionIcon className="w-4 h-4" />}
                        {state.action}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Size Variations */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Size Variations</h2>

          <div className="space-y-8">
            {/* Full Page */}
            <div>
              <h3 className="font-semibold mb-4">Full Page (Large)</h3>
              <div className="border border-border rounded-xl p-16 text-center bg-muted/20">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">No Documents Available</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Connect your DigiLocker account to access all your verified government documents in one place.
                </p>
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
                  Connect DigiLocker
                </button>
              </div>
            </div>

            {/* Card/Section */}
            <div>
              <h3 className="font-semibold mb-4">Card/Section (Medium)</h3>
              <div className="border border-border rounded-xl p-8 text-center bg-muted/20 max-w-lg">
                <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-info" />
                </div>
                <h4 className="text-lg font-semibold mb-2">No Favorites Yet</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Bookmark services you use frequently for quick access
                </p>
                <button className="px-4 py-2 bg-info text-info-foreground rounded-lg text-sm font-medium">
                  Browse Services
                </button>
              </div>
            </div>

            {/* Inline/List */}
            <div>
              <h3 className="font-semibold mb-4">Inline/List (Small)</h3>
              <div className="border border-border rounded-lg p-6 text-center bg-muted/20 max-w-md">
                <Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No files in this folder</p>
                <p className="text-xs text-muted-foreground">Upload documents to get started</p>
              </div>
            </div>
          </div>
        </div>

        {/* Illustration Styles */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Illustration Styles</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Icon Only */}
            <div className="border border-border rounded-xl p-8 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Icon Only</h4>
              <p className="text-sm text-muted-foreground">
                Simple, clean. Best for most scenarios. Uses Lucide icons.
              </p>
            </div>

            {/* Icon with Badge */}
            <div className="border border-border rounded-xl p-8 text-center">
              <div className="relative w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
              </div>
              <h4 className="font-semibold mb-2">Icon with Badge</h4>
              <p className="text-sm text-muted-foreground">
                For status or completion states. Adds visual emphasis.
              </p>
            </div>

            {/* Stacked Icons */}
            <div className="border border-border rounded-xl p-8 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute top-0 left-0 w-16 h-16 bg-info/10 rounded-full flex items-center justify-center">
                  <FileText className="w-7 h-7 text-info" />
                </div>
                <div className="absolute bottom-0 right-0 w-12 h-12 bg-primary/10 rounded-full border-4 border-card flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h4 className="font-semibold mb-2">Stacked Icons</h4>
              <p className="text-sm text-muted-foreground">
                Shows relationship between concepts (documents + security).
              </p>
            </div>
          </div>
        </div>

        {/* Do's and Don'ts */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Do's and Don'ts</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-success">✓ Do</h3>
              {[
                'Use positive, encouraging language',
                'Provide clear next steps',
                'Keep descriptions concise (1-2 sentences)',
                'Match icon to the context',
                'Offer primary action when possible',
                'Maintain consistent spacing and sizing',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-destructive">✗ Don't</h3>
              {[
                'Use negative or blaming language',
                'Leave users without guidance',
                'Write long paragraphs of text',
                'Use decorative icons unrelated to context',
                'Overwhelm with multiple actions',
                'Break visual hierarchy with inconsistent sizes',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
