import { Shield, Users, Globe, Zap, Target, Award, Heart, TrendingUp } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function AboutUs() {
  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Transforming Citizen Services with Intelligence</h1>
            <p className="text-xl text-muted-foreground mb-8">
              ServiceFormAI OS is India's first DigiLocker-first Citizen Service Intelligence Network,
              making government services accessible, transparent, and dignified for every citizen.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                Get Started
              </button>
              <button className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-card border border-border rounded-xl p-8">
            <Target className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              To empower every Indian citizen with seamless access to government services through intelligent
              automation, document reuse, and transparent workflows. We believe no citizen should have to submit
              the same document twice or navigate bureaucratic complexity alone.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8">
            <Globe className="w-12 h-12 text-success mb-4" />
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground">
              A future where government services are as simple as online shopping—where citizens discover
              services they qualify for, applications are pre-filled from verified documents, and status
              updates are real-time and transparent. Digital India, simplified.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Trust & Security',
                description: 'We protect citizen data with bank-grade encryption and transparent consent mechanisms.',
              },
              {
                icon: Users,
                title: 'Citizen-First',
                description: 'Every design decision is made with the citizen experience at the center.',
              },
              {
                icon: Zap,
                title: 'Simplicity',
                description: 'We hide complexity and present only what citizens need to know, when they need it.',
              },
              {
                icon: Heart,
                title: 'Accessibility',
                description: 'Services for all, regardless of literacy, language, device, or connectivity.',
              },
            ].map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Innovation */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6">The Service Manifest Protocol</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Our core product innovation—a machine-readable service definition that enables federated service
            delivery across central, state, and local governments. Each service becomes a portable, reusable
            manifest that can be deployed anywhere.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-2">Federated Discovery</h3>
              <p className="text-sm text-muted-foreground">
                Citizens see all services they qualify for—central, state, or local—in one unified feed.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-2">Auto-Eligibility</h3>
              <p className="text-sm text-muted-foreground">
                Machine-readable rules check eligibility instantly using DigiLocker-verified documents.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-2">Plug & Deploy</h3>
              <p className="text-sm text-muted-foreground">
                Municipalities can deploy any service manifest in minutes, not months.
              </p>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '2.4M+', label: 'Citizens Served' },
              { value: '3,456', label: 'Active Services' },
              { value: '87%', label: 'Time Saved' },
              { value: '94%', label: 'Satisfaction Rate' },
            ].map((stat, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Built for India, by Indians</h2>
          <div className="bg-card border border-border rounded-xl p-8">
            <p className="text-lg text-muted-foreground text-center mb-8">
              We are a team of technologists, designers, and public policy experts committed to making
              government services work better for every citizen. Our work is backed by the Ministry of
              Electronics & IT and aligned with Digital India initiatives.
            </p>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <Award className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-semibold">National Award</p>
                <p className="text-sm text-muted-foreground">Digital India 2025</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-success mx-auto mb-2" />
                <p className="font-semibold">Fast Growing</p>
                <p className="text-sm text-muted-foreground">500+ cities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Partners */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Technology Partners</h2>
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex flex-wrap justify-center gap-12 items-center">
              {['DigiLocker', 'Aadhaar (UIDAI)', 'UMANG', 'India Stack', 'MyGov'].map((partner, index) => (
                <div key={index} className="text-center">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center mb-2">
                    <Shield className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{partner}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Service Delivery?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join 500+ municipalities already using ServiceFormAI OS
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-white text-primary rounded-lg font-medium hover:bg-gray-100">
              Request Demo
            </button>
            <button className="px-6 py-3 bg-white/20 text-white border-2 border-white rounded-lg font-medium hover:bg-white/30">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}