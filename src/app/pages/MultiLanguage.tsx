import { Globe, ChevronDown, GraduationCap, CheckCircle } from 'lucide-react';

export default function MultiLanguage() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Multi-Language Support</h1>
          <p className="text-muted-foreground">Experience in English, हिन्दी, मराठी, and more</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* English Version */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-primary/5 border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <span className="font-semibold">English</span>
              </div>
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2">
                Active
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">State Merit Scholarship</h4>
                    <p className="text-xs text-muted-foreground mb-2">You may be eligible</p>
                    <div className="flex items-center gap-2 text-xs text-success">
                      <CheckCircle className="w-3 h-3" />
                      <span>3 documents ready in DigiLocker</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  Check Eligibility
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Full Name</p>
                  <p className="text-muted-foreground">Ananya Sharma</p>
                  <p className="text-xs text-verified mt-1">Verified from DigiLocker · Editable</p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Date of Birth</p>
                  <p className="text-muted-foreground">15 March 2008</p>
                  <p className="text-xs text-verified mt-1">Verified from Aadhaar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hindi Version */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-info/5 border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-info" />
                <span className="font-semibold">हिन्दी (Hindi)</span>
              </div>
              <button className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm flex items-center gap-2">
                Switch
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">राज्य मेरिट छात्रवृत्ति</h4>
                    <p className="text-xs text-muted-foreground mb-2">आप पात्र हो सकते हैं</p>
                    <div className="flex items-center gap-2 text-xs text-success">
                      <CheckCircle className="w-3 h-3" />
                      <span>DigiLocker में 3 दस्तावेज़ तैयार हैं</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  पात्रता जांचें
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">पूरा नाम</p>
                  <p className="text-muted-foreground">आनन्या शर्मा</p>
                  <p className="text-xs text-verified mt-1">DigiLocker से सत्यापित · संपादन योग्य</p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">जन्म तिथि</p>
                  <p className="text-muted-foreground">15 मार्च 2008</p>
                  <p className="text-xs text-verified mt-1">आधार से सत्यापित</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Language Support Info */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { lang: 'English', code: 'EN', status: 'Complete' },
            { lang: 'हिन्दी', code: 'HI', status: 'Complete' },
            { lang: 'मराठी', code: 'MR', status: 'Complete' },
            { lang: 'தமிழ்', code: 'TA', status: 'Complete' },
            { lang: 'తెలుగు', code: 'TE', status: 'Complete' },
            { lang: 'ગુજરાતી', code: 'GU', status: 'Complete' },
            { lang: 'ಕನ್ನಡ', code: 'KN', status: 'Complete' },
            { lang: 'বাংলা', code: 'BN', status: 'Complete' },
          ].map((lang, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="font-semibold mb-1">{lang.lang}</p>
              <p className="text-xs text-muted-foreground mb-2">{lang.code}</p>
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                {lang.status}
              </span>
            </div>
          ))}
        </div>

        {/* Design Note */}
        <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
          <h3 className="font-semibold mb-3">Localization Strategy</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• All service manifests support multiple language variants</li>
            <li>• Form labels, instructions, and error messages are fully localized</li>
            <li>• Right-to-left (RTL) support planned for Urdu and Arabic</li>
            <li>• Citizen names and documents display in original script</li>
            <li>• Language preference saved in citizen profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
