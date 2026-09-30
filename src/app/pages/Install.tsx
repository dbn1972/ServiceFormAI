import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Database,
  Layers3,
  ShieldCheck,
  Workflow,
  Server,
} from 'lucide-react';

const steps = [
  {
    title: 'Select your deployment model',
    description: 'Choose managed SaaS, private cloud, or self-hosted based on your tenancy and compliance needs.',
    icon: Layers3,
  },
  {
    title: 'Configure core adapters',
    description: 'Set database, object storage, cache, CDN, and queue options before first run.',
    icon: Cloud,
  },
  {
    title: 'Validate and bootstrap',
    description: 'Run checks for connectivity, secrets, and tenant-safe defaults before activating the platform.',
    icon: ShieldCheck,
  },
  {
    title: 'Create the first tenant',
    description: 'Complete onboarding, branding, admin setup, and service publication in a controlled flow.',
    icon: Workflow,
  },
];

const requirements = [
  'PostgreSQL or MySQL database',
  'S3-compatible object storage',
  'Redis cache',
  'SQS, Kafka, or RabbitMQ queue adapter',
  'CDN endpoint for public assets',
  'TLS-enabled network access and secrets management',
];

const checks = [
  'Database connectivity and migrations',
  'Storage bucket or container access',
  'Queue adapter readiness and retry policy',
  'Tenant-scoped auth defaults',
  'Audit and logging configuration',
  'Backup and recovery prerequisites',
];

export default function Install() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <Server className="h-3.5 w-3.5" />
              Installation Guide
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Bootstrap the platform with governed defaults.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-8 max-w-2xl">
              The installation surface helps operators validate infrastructure, choose runtime adapters, and bring up
              the first tenant safely.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/developers"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
              >
                Open developer portal
              </Link>
              <Link
                to="/admin/tenants/onboarding"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Tenant onboarding
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Database className="h-4 w-4 text-primary" />
              Required setup items
            </div>
            <ul className="mt-6 space-y-3">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Workflow className="h-4 w-4 text-primary" />
              Bootstrap checks
            </div>
            <ul className="mt-6 space-y-3">
              {checks.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-2xl border border-border bg-muted/20 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl border border-border bg-primary/5 p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Need the operator-ready setup path?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              The install surface is intentionally lightweight here, but it now exists as a public entry point for the
              bootstrap flow required by the platform charter.
            </p>
          </div>
          <Link
            to="/developers"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
          >
            Continue to developer portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}