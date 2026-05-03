import { Globe, Code, BarChart, Package } from 'lucide-react';

export default function ConsumerPortal() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Consumer Portal</h1>
          <p className="text-muted-foreground">DigiLocker / UMANG / State Portal Integration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {[
            { label: 'DigiLocker', services: 1247, users: '2.4M', status: 'active' },
            { label: 'UMANG', services: 856, users: '1.8M', status: 'active' },
            { label: 'State Portal', services: 423, users: '980K', status: 'active' },
          ].map((consumer, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Globe className="w-8 h-8 text-primary" />
                <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full font-medium">
                  {consumer.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{consumer.label}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{consumer.services} services subscribed</p>
                <p>{consumer.users} active users</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Service Marketplace</h3>
            <div className="space-y-3">
              {[
                { name: 'Scholarships', count: 45, subscribers: 3 },
                { name: 'Certificates', count: 128, subscribers: 8 },
                { name: 'Municipal Services', count: 89, subscribers: 12 },
                { name: 'Grievances', count: 234, subscribers: 15 },
              ].map((category, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{category.name}</h4>
                    <span className="text-xs text-muted-foreground">{category.count} services</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.subscribers} channels subscribed</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Integration Tools</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Code className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Renderer SDK</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Dynamic journey renderer for service forms
                </p>
                <button className="text-sm text-primary hover:underline">View Documentation →</button>
              </div>

              <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-success" />
                  <h4 className="font-semibold">API Credentials</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  OAuth tokens and webhook endpoints
                </p>
                <button className="text-sm text-success hover:underline">Manage Access →</button>
              </div>

              <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart className="w-5 h-5 text-info" />
                  <h4 className="font-semibold">Usage Analytics</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Service performance and citizen metrics
                </p>
                <button className="text-sm text-info hover:underline">View Dashboard →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
