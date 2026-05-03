import { Link } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  FileCheck,
  Smartphone,
  Clock,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Award,
  Lock,
  Fingerprint
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';

export default function LandingPage() {
  return (
    <div className="min-h-full bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-lg">ServiceFormAI OS</div>
                <div className="text-xs text-muted-foreground">Government of India</div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <ThemeToggle />
              <LanguageSelector />
              <Link to="/login" className="text-sm text-foreground hover:text-primary transition-colors">
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">India's #1 Citizen Service Platform</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
                Government Services,
                <br />
                <span className="text-primary">Simplified</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Apply for government services in minutes with DigiLocker-powered auto-fill,
                real-time tracking, and intelligent service discovery.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                >
                  Watch Demo
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Services Available</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-success mb-1">10M+</div>
                  <div className="text-sm text-muted-foreground">Citizens Served</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-info mb-1">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                </div>
              </div>
            </div>

            {/* Right: Hero Image/Card */}
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                    <Fingerprint className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold">DigiLocker Connected</div>
                    <div className="text-sm text-muted-foreground">Auto-fill enabled</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    'PAN Card',
                    'Aadhaar Card',
                    'Driving License',
                    'Voter ID',
                    'Birth Certificate'
                  ].map((doc) => (
                    <div key={doc} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-success" />
                        <span className="text-sm font-medium">{doc}</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-semibold">100% Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed to make government services accessible to everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Fingerprint,
                title: 'DigiLocker Integration',
                description: 'Connect your DigiLocker account and never fill the same form twice. Auto-populate applications with verified documents.',
                color: 'text-primary'
              },
              {
                icon: Sparkles,
                title: 'Smart Service Discovery',
                description: 'AI-powered recommendations show you services you qualify for based on your profile and needs.',
                color: 'text-success'
              },
              {
                icon: Clock,
                title: 'Real-Time Tracking',
                description: 'Track your applications in real-time with SMS, email, and push notifications at every step.',
                color: 'text-info'
              },
              {
                icon: Shield,
                title: 'Bank-Grade Security',
                description: 'Your data is encrypted end-to-end and protected with multi-factor authentication.',
                color: 'text-warning'
              },
              {
                icon: Smartphone,
                title: 'Mobile-First Design',
                description: 'Apply from anywhere with our responsive mobile app. Works offline with sync.',
                color: 'text-destructive'
              },
              {
                icon: Globe,
                title: 'Multi-Language Support',
                description: 'Available in 22 Indian languages. Apply in your preferred language.',
                color: 'text-accent'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${feature.color}/10 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to access any government service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect DigiLocker',
                description: 'Link your DigiLocker account to auto-fill forms with verified documents. One-time setup takes 30 seconds.',
                icon: Fingerprint
              },
              {
                step: '2',
                title: 'Discover Services',
                description: 'Browse 500+ services or let AI recommend what you qualify for. Filter by category, department, or eligibility.',
                icon: Sparkles
              },
              {
                step: '3',
                title: 'Apply & Track',
                description: 'Submit applications with auto-filled forms. Track status in real-time and get notified at every step.',
                icon: TrendingUp
              }
            ].map((step) => (
              <div key={step.step} className="relative">
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <step.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Millions</h2>
            <p className="text-xl text-muted-foreground">
              What citizens are saying about ServiceFormAI OS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                role: 'Small Business Owner',
                location: 'Mumbai, Maharashtra',
                quote: 'Applied for my GST registration in 10 minutes. The DigiLocker integration saved me from uploading 15 different documents!'
              },
              {
                name: 'Rajesh Kumar',
                role: 'Software Engineer',
                location: 'Bangalore, Karnataka',
                quote: 'Real-time tracking is a game-changer. I knew exactly when my passport was being processed at each stage.'
              },
              {
                name: 'Anjali Patel',
                role: 'Student',
                location: 'Ahmedabad, Gujarat',
                quote: 'The multi-language support helped my grandmother apply for her pension. She did it all in Gujarati on her phone!'
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary/10 to-success/10 border border-border rounded-2xl p-12">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join millions of citizens accessing government services with ease
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted/50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold text-lg mb-4">ServiceFormAI OS</div>
              <p className="text-sm text-muted-foreground">
                India's first DigiLocker-first Citizen Service Intelligence Network
              </p>
            </div>

            <div>
              <div className="font-semibold mb-4">Product</div>
              <div className="space-y-2">
                <Link to="/features" className="block text-sm text-muted-foreground hover:text-foreground">Features</Link>
                <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
                <Link to="/services" className="block text-sm text-muted-foreground hover:text-foreground">Service Catalog</Link>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-4">Company</div>
              <div className="space-y-2">
                <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground">About Us</Link>
                <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground">Contact</Link>
                <Link to="/help" className="block text-sm text-muted-foreground hover:text-foreground">Help Center</Link>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-4">Legal</div>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
                <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
                <Link to="/cookies" className="block text-sm text-muted-foreground hover:text-foreground">Cookie Policy</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 ServiceFormAI OS. All rights reserved. | Government of India • MeitY
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Secured & Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}