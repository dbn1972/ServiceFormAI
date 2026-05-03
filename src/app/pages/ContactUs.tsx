import { Mail, Phone, MapPin, Clock, MessageCircle, Send, Building2, HelpCircle } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function ContactUs() {
  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-16 text-center">
          <h1 className="text-5xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to our team.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Organization</label>
                    <input
                      type="text"
                      placeholder="Your organization name"
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <select className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Select a topic</option>
                    <option>Product Demo Request</option>
                    <option>Sales Inquiry</option>
                    <option>Technical Support</option>
                    <option>Partnership Opportunity</option>
                    <option>General Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <textarea
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Office Address */}
            <div className="bg-card border border-border rounded-xl p-6">
              <MapPin className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold mb-3">Head Office</h3>
              <p className="text-sm text-muted-foreground">
                ServiceFormAI Technologies Pvt Ltd<br />
                Electronics Niketan, 6 CGO Complex<br />
                Lodhi Road, New Delhi - 110003<br />
                India
              </p>
            </div>

            {/* Email */}
            <div className="bg-card border border-border rounded-xl p-6">
              <Mail className="w-10 h-10 text-success mb-4" />
              <h3 className="font-semibold mb-3">Email Us</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Sales:</strong> sales@serviceformai.gov.in
                </p>
                <p className="text-muted-foreground">
                  <strong>Support:</strong> support@serviceformai.gov.in
                </p>
                <p className="text-muted-foreground">
                  <strong>General:</strong> info@serviceformai.gov.in
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-card border border-border rounded-xl p-6">
              <Phone className="w-10 h-10 text-info mb-4" />
              <h3 className="font-semibold mb-3">Call Us</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Toll-Free:</strong> 1800-XXX-XXXX
                </p>
                <p className="text-muted-foreground">
                  <strong>Support:</strong> +91-11-XXXX-XXXX
                </p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-card border border-border rounded-xl p-6">
              <Clock className="w-10 h-10 text-warning mb-4" />
              <h3 className="font-semibold mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM IST</p>
                <p><strong>Saturday:</strong> 9:00 AM - 1:00 PM IST</p>
                <p><strong>Sunday:</strong> Closed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Live Chat Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get instant help from our support team
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
              Start Chat
            </button>
          </div>

          <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6 text-center">
            <HelpCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Help Center</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse FAQs and documentation
            </p>
            <button className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90">
              Visit Help Center
            </button>
          </div>

          <div className="bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-xl p-6 text-center">
            <Building2 className="w-12 h-12 text-info mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Request Demo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              See the platform in action
            </p>
            <button className="px-4 py-2 bg-info text-info-foreground rounded-lg text-sm font-medium hover:bg-info/90">
              Book Demo
            </button>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}