import { BookOpen, FileText, Video, MessageCircle, Mail, Phone, Search, User, Wallet, Shield, Settings, ArrowRight, HelpCircle } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function HelpCenter() {
  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Everything you need to know about using ServiceFormAI OS
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documentation, guides, and tutorials..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: FileText,
              title: 'Documentation',
              desc: 'Detailed guides and references',
              color: 'primary',
            },
            {
              icon: Video,
              title: 'Video Tutorials',
              desc: 'Learn through step-by-step videos',
              color: 'success',
            },
            {
              icon: MessageCircle,
              title: 'Community Forum',
              desc: 'Ask questions and share tips',
              color: 'info',
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br from-${item.color}/10 to-${item.color}/5 border border-${item.color}/20 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer`}
              >
                <Icon className={`w-12 h-12 text-${item.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Popular Topics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Popular Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: User,
                title: 'Getting Started',
                articles: [
                  'How to create an account',
                  'Linking your DigiLocker',
                  'Completing your profile',
                  'Understanding the dashboard',
                ],
              },
              {
                icon: FileText,
                title: 'Applications',
                articles: [
                  'How to apply for a service',
                  'Tracking application status',
                  'Resolving deficiencies',
                  'Downloading certificates',
                ],
              },
              {
                icon: Wallet,
                title: 'DigiLocker Integration',
                articles: [
                  'What is DigiLocker?',
                  'Auto-filling forms with DigiLocker',
                  'Managing document access',
                  'Security and privacy',
                ],
              },
              {
                icon: Shield,
                title: 'Security & Privacy',
                articles: [
                  'How your data is protected',
                  'Managing consent settings',
                  'Enabling two-factor authentication',
                  'Understanding data sharing',
                ],
              },
              {
                icon: Settings,
                title: 'Account Settings',
                articles: [
                  'Changing your password',
                  'Updating contact information',
                  'Notification preferences',
                  'Deleting your account',
                ],
              },
              {
                icon: HelpCircle,
                title: 'Troubleshooting',
                articles: [
                  'Payment issues',
                  'Login problems',
                  'Document upload errors',
                  'Browser compatibility',
                ],
              },
            ].map((topic, index) => {
              const Icon = topic.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{topic.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {topic.articles.map((article, i) => (
                      <li key={i}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center justify-between group"
                        >
                          <span>{article}</span>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Video Tutorials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Video Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Platform Overview', duration: '5:30', views: '12.4K' },
              { title: 'Applying for Services', duration: '8:15', views: '8.2K' },
              { title: 'DigiLocker Integration', duration: '6:45', views: '15.1K' },
            ].map((video, index) => (
              <div key={index} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Video className="w-12 h-12 text-primary" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{video.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{video.duration}</span>
                    <span>•</span>
                    <span>{video.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Can't find what you're looking for?</h2>
            <p className="text-lg opacity-90 mb-8">
              Our support team is here to help you
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <MessageCircle className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-sm opacity-90 mb-4">Get instant help</p>
                <button className="text-sm font-medium hover:underline">Start Chat →</button>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <Mail className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-sm opacity-90 mb-4">Response in 24 hours</p>
                <button className="text-sm font-medium hover:underline">Send Email →</button>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <Phone className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-sm opacity-90 mb-4">Mon-Sat, 9AM-6PM</p>
                <button className="text-sm font-medium hover:underline">1800-XXX-XXXX</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}