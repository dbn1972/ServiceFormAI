import { ChevronDown, Search, HelpCircle, BookOpen, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'account', label: 'Account & Login', icon: BookOpen },
    { id: 'applications', label: 'Applications', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: BookOpen },
    { id: 'security', label: 'Security & Privacy', icon: BookOpen },
    { id: 'digilocker', label: 'DigiLocker', icon: BookOpen },
  ];

  const faqs = [
    {
      category: 'account',
      question: 'How do I create an account on ServiceFormAI OS?',
      answer: 'Click on "Sign Up" and provide your mobile number or email address. You\'ll receive an OTP for verification. After verifying, complete your profile with basic information. Optionally, you can link your DigiLocker account for instant document verification.',
    },
    {
      category: 'account',
      question: 'I forgot my password. How can I reset it?',
      answer: 'Click on "Forgot Password" on the login page. Enter your registered mobile number or email. You\'ll receive an OTP or reset link. Use it to create a new password. For additional security, you may be asked to verify your identity using DigiLocker.',
    },
    {
      category: 'digilocker',
      question: 'What is DigiLocker and why should I link it?',
      answer: 'DigiLocker is a government platform to store and share your verified documents digitally. By linking DigiLocker to ServiceFormAI OS, you can auto-fill application forms, verify documents instantly, and avoid uploading the same documents multiple times. It saves significant time and effort.',
    },
    {
      category: 'digilocker',
      question: 'Is it safe to link my DigiLocker account?',
      answer: 'Yes, absolutely. ServiceFormAI OS uses government-approved APIs to securely access your DigiLocker documents. We never store your DigiLocker password, and you can revoke access anytime from your consent dashboard. All data transfers are encrypted using bank-level security.',
    },
    {
      category: 'applications',
      question: 'How do I check my application status?',
      answer: 'Log in to your dashboard and go to "My Applications". You\'ll see real-time status updates for all your submitted applications. You can also track detailed progress, view officer comments, and receive notifications via SMS and email.',
    },
    {
      category: 'applications',
      question: 'What does "Deficiency" status mean?',
      answer: 'A "Deficiency" status means the reviewing officer has found some missing or incorrect information in your application. Check the deficiency details in your application page. Upload the required documents or corrections, and resubmit. The officer will review it again.',
    },
    {
      category: 'applications',
      question: 'Can I edit my application after submission?',
      answer: 'No, you cannot edit an application once submitted. However, if there\'s an error, you can withdraw the application and submit a new one. Alternatively, if the officer raises a deficiency, you can provide corrections during the deficiency resolution process.',
    },
    {
      category: 'applications',
      question: 'How long does it take to process applications?',
      answer: 'Processing times vary by service and department. Most services are processed within 7-30 days. You can see the estimated processing time on each service detail page. SLA timelines are strictly monitored, and you\'ll be notified if there are delays.',
    },
    {
      category: 'payments',
      question: 'Which payment methods are accepted?',
      answer: 'We accept UPI, Credit/Debit Cards, Net Banking, and popular digital wallets (Paytm, PhonePe, Amazon Pay, etc.). All payments are processed through the Government of India Payment Gateway for maximum security.',
    },
    {
      category: 'payments',
      question: 'My payment was deducted but application shows pending. What should I do?',
      answer: 'Sometimes there\'s a delay in payment confirmation. Wait for 30 minutes and refresh your dashboard. If the issue persists, contact support with your transaction ID. We\'ll verify with the payment gateway and update your application status within 24 hours.',
    },
    {
      category: 'payments',
      question: 'Can I get a refund if my application is rejected?',
      answer: 'Service fees are generally non-refundable. However, if the rejection was due to a system error or departmental mistake, you may be eligible for a refund. Contact the department through the grievance system to request a review.',
    },
    {
      category: 'security',
      question: 'How is my personal data protected?',
      answer: 'We use AES-256 encryption for data at rest and TLS 1.3 for data in transit. All servers are located in India and comply with government data localization norms. We are SOC 2 Type II certified and undergo regular security audits. Your data is never shared without explicit consent.',
    },
    {
      category: 'security',
      question: 'Can I control who accesses my data?',
      answer: 'Yes! Visit the Consent Management page to see all departments that have access to your data. You can revoke consent anytime, set auto-expiry periods, and download access logs. Note that revoking consent may affect pending applications with that department.',
    },
    {
      category: 'security',
      question: 'What should I do if I suspect unauthorized access to my account?',
      answer: 'Immediately change your password and enable two-factor authentication (2FA). Check your recent activity log in Settings. If you see suspicious activity, contact support immediately at security@serviceformai.gov.in. We\'ll help secure your account and investigate the issue.',
    },
  ];

  const filteredFAQs = category === 'all' ? faqs : faqs.filter(faq => faq.category === category);

  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to common questions about ServiceFormAI OS
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for answers..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-accent transition-colors"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 text-center">
          <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to assist you
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
              Live Chat Support
            </button>
            <button className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent">
              Submit a Ticket
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Email: <a href="#" className="text-primary hover:underline">support@serviceformai.gov.in</a>
          </p>
          <p className="mt-1">
            Helpline: <strong>1800-XXX-XXXX</strong> (9 AM - 6 PM IST, Mon-Sat)
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}