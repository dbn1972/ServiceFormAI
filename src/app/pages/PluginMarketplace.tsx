import { Package, Shield, MessageSquare, Mail, CreditCard, FileCheck, MapPin, Search } from 'lucide-react';

export default function PluginMarketplace() {
  const plugins = [
    { icon: Shield, name: 'DigiLocker Integration', provider: 'Government of India', category: 'Identity', certified: true, installs: '2.4K' },
    { icon: MessageSquare, name: 'WhatsApp Business', provider: 'Meta', category: 'Messaging', certified: true, installs: '1.8K' },
    { icon: Mail, name: 'Email Service', provider: 'AWS SES', category: 'Messaging', certified: true, installs: '3.2K' },
    { icon: CreditCard, name: 'Payment Gateway', provider: 'Razorpay', category: 'Payment', certified: true, installs: '1.2K' },
    { icon: FileCheck, name: 'eSign Integration', provider: 'eSign', category: 'Verification', certified: true, installs: '890' },
    { icon: MapPin, name: 'GIS Mapping', provider: 'Google Maps', category: 'Location', certified: true, installs: '654' },
  ];

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Plugin Marketplace</h1>
          <p className="text-muted-foreground">Extend ServiceFormAI OS with certified plugins</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plugins..."
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {['All', 'Identity', 'Messaging', 'Payment', 'Verification', 'Storage', 'Analytics', 'Location'].map((cat, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                cat === 'All'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin, index) => (
            <div key={index} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <plugin.icon className="w-6 h-6 text-primary" />
                  </div>
                  {plugin.certified && (
                    <span className="flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                      <Shield className="w-3 h-3" />
                      Certified
                    </span>
                  )}
                </div>

                <h3 className="font-semibold mb-1">{plugin.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{plugin.provider}</p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="px-2 py-1 bg-muted rounded">{plugin.category}</span>
                  <span>{plugin.installs} installs</span>
                </div>

                <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Install Plugin
                </button>
              </div>

              <div className="bg-muted/30 px-6 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Sandbox available</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div className="mt-12 bg-info/10 border border-info/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 text-info flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Plugin Certification</h3>
              <p className="text-sm text-muted-foreground">
                All plugins undergo security, privacy, and reliability reviews before certification. Certified plugins display the shield badge and meet government standards for public service delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
