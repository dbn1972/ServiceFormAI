import { Link } from 'react-router-dom';
import {
  BookOpen,
  Code2,
  FileJson,
  Plug,
  ShieldCheck,
  Webhook,
  Workflow,
  CirclePlay,
} from 'lucide-react';

const sections = [
  {
    title: 'API Reference',
    description: 'Discover tenant-aware endpoints, request and response shapes, and versioned contracts.',
    icon: FileJson,
  },
  {
    title: 'Auth and Access',
    description: 'Learn how JWT, service accounts, and role-based access work across tenant contexts.',
    icon: ShieldCheck,
  },
  {
    title: 'Webhooks and Events',
    description: 'Track event contracts, retries, delivery visibility, and webhook security expectations.',
    icon: Webhook,
  },
  {
    title: 'Plugins and Extensions',
    description: 'Review the governed extension model for plugins, themes, and integration add-ons.',
    icon: Plug,
  },
  {
    title: 'Tenant Configuration',
    description: 'See how onboarding, settings, and environment setup are scoped per tenant.',
    icon: Workflow,
  },
  {
    title: 'Getting Started',
    description: 'Use the public product and support surfaces to move from discovery to first integration.',
    icon: CirclePlay,
  },
];

const quickLinks = [
  { label: 'Product features', to: '/features' },
  { label: 'Tenant onboarding', to: '/admin/tenants/onboarding' },
  { label: 'API integration', to: '/admin/api-integration' },
  { label: 'Plugin marketplace', to: '/admin/plugins' },
  { label: 'White-label settings', to: '/tenant/white-label' },
  { label: 'Audit trail', to: '/admin/audit' },
];

export default function DeveloperPortal() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background via-background to-muted/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_30%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <Code2 className="h-3.5 w-3.5" />
              Developer Portal
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Build against a governed multi-tenant platform.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-8 max-w-2xl">
              Use the portal to understand API contracts, tenant context, webhook behavior, and the extension model.
              This is the developer entry point for ServiceFormAI OS.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/admin/api-integration"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
              >
                Open API integration wizard
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Explore platform features
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl border border-border bg-muted/30 p-8 lg:p-10">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            Quick entry points
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}