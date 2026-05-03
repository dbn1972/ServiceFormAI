import { Check, X, Shield, Users, Building2, HelpCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import PublicFooter from '../components/PublicFooter';

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  const tiers = [
    {
      name: 'Starter',
      icon: Building2,
      desc: 'For small municipalities and departments',
      monthlyPrice: 15000,
      annualPrice: 150000,
      features: [
        { text: 'Up to 5 services', included: true },
        { text: 'Up to 1,000 applications/month', included: true },
        { text: 'DigiLocker integration', included: true },
        { text: 'Basic analytics dashboard', included: true },
        { text: 'Email support', included: true },
        { text: 'Up to 5 officer accounts', included: true },
        { text: 'Custom branding', included: false },
        { text: 'API access', included: false },
        { text: 'Priority support', included: false },
        { text: 'Dedicated account manager', included: false },
      ],
    },
    {
      name: 'Professional',
      icon: Users,
      desc: 'For mid-sized departments',
      monthlyPrice: 35000,
      annualPrice: 350000,
      badge: 'Most Popular',
      features: [
        { text: 'Up to 25 services', included: true },
        { text: 'Up to 10,000 applications/month', included: true },
        { text: 'DigiLocker integration', included: true },
        { text: 'Advanced analytics & reports', included: true },
        { text: 'Priority email & phone support', included: true },
        { text: 'Up to 25 officer accounts', included: true },
        { text: 'Custom branding', included: true },
        { text: 'API access', included: true },
        { text: 'SLA monitoring', included: true },
        { text: 'Dedicated account manager', included: false },
      ],
    },
    {
      name: 'Enterprise',
      icon: Shield,
      desc: 'For large state/central departments',
      monthlyPrice: 75000,
      annualPrice: 750000,
      features: [
        { text: 'Unlimited services', included: true },
        { text: 'Unlimited applications', included: true },
        { text: 'DigiLocker integration', included: true },
        { text: 'Advanced analytics & BI tools', included: true },
        { text: '24/7 priority support', included: true },
        { text: 'Unlimited officer accounts', included: true },
        { text: 'Custom branding & white-label', included: true },
        { text: 'Full API access & webhooks', included: true },
        { text: 'Advanced SLA & workflow automation', included: true },
        { text: 'Dedicated account manager & onboarding', included: true },
      ],
    },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your department's needs. All plans include core features.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-card border border-border rounded-lg">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billing === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billing === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Annual
              <span className="ml-2 px-2 py-0.5 bg-success/20 text-success rounded-full text-xs">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const price = billing === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            const isProfessional = tier.name === 'Professional';

            return (
              <div
                key={index}
                className={`bg-card rounded-xl p-8 ${
                  isProfessional
                    ? 'border-2 border-primary shadow-lg scale-105'
                    : 'border border-border'
                }`}
              >
                {tier.badge && (
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mb-4">
                    {tier.badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">{tier.desc}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">₹{(price / 1000).toFixed(0)}K</span>
                    <span className="text-muted-foreground">/{billing === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed annually • ₹{(tier.monthlyPrice / 1000).toFixed(0)}K/month if billed monthly
                    </p>
                  )}
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-medium mb-6 flex items-center justify-center gap-2 ${
                    isProfessional
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border hover:bg-accent'
                  }`}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? '' : 'text-muted-foreground'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Compare Plans</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Starter</th>
                    <th className="text-center p-4 font-semibold bg-primary/5">Professional</th>
                    <th className="text-center p-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Services', starter: '5', pro: '25', enterprise: 'Unlimited' },
                    { feature: 'Applications/month', starter: '1,000', pro: '10,000', enterprise: 'Unlimited' },
                    { feature: 'Officer accounts', starter: '5', pro: '25', enterprise: 'Unlimited' },
                    { feature: 'Storage', starter: '10 GB', pro: '100 GB', enterprise: '1 TB+' },
                    { feature: 'DigiLocker integration', starter: true, pro: true, enterprise: true },
                    { feature: 'Custom branding', starter: false, pro: true, enterprise: true },
                    { feature: 'API access', starter: false, pro: true, enterprise: true },
                    { feature: 'SLA monitoring', starter: false, pro: true, enterprise: true },
                    { feature: 'Support', starter: 'Email', pro: 'Email & Phone', enterprise: '24/7 Priority' },
                    { feature: 'Account manager', starter: false, pro: false, enterprise: true },
                  ].map((row, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? (
                            <Check className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="p-4 text-center bg-primary/5">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? (
                            <Check className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          row.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes, you can upgrade or downgrade your plan anytime. Changes take effect from the next billing cycle.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept UPI, Net Banking, and NEFT/RTGS transfers. Annual subscriptions can also be paid via PO.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes, we offer a 30-day free trial with full access to Professional plan features. No credit card required.',
              },
              {
                q: 'What happens if I exceed my plan limits?',
                a: 'We\'ll notify you when you approach your limits. You can upgrade your plan or pay overage fees for additional usage.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-2 flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-sm text-muted-foreground pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your service delivery?</h2>
          <p className="text-lg opacity-90 mb-8">
            Join 500+ government departments already using ServiceFormAI OS
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-primary rounded-lg font-medium text-lg hover:bg-gray-100">
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-white/20 text-white border-2 border-white rounded-lg font-medium text-lg hover:bg-white/30">
              Talk to Sales
            </button>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}