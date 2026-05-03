import { User, MapPin, FileText, Calendar, Languages } from 'lucide-react';

export default function DataVariations() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Variations & Edge Cases</h1>
          <p className="text-muted-foreground">Real-world content diversity, edge cases, and overflow handling</p>
        </div>

        {/* Long Names & Text Overflow */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Long Names & Text Overflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Name Variations</h3>
              <div className="space-y-4">
                {[
                  { name: "Ananya Sharma", label: "Standard" },
                  { name: "Dr. Thiruvananthapuram Venkataraman Subramanian", label: "Very Long South Indian" },
                  { name: "Md. Abdul Kalam Azad Chowdhury", label: "Long Bengali with Prefix" },
                  { name: "राजेश कुमार वर्मा", label: "Hindi Script" },
                ].map((user, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Address Overflow</h3>
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">
                        Flat No. 402, Building C, Sai Krupa Residency, Plot No. 23/A, Sector 18, Near Municipal Market, Behind State Bank, Kharghar, Navi Mumbai, Maharashtra - 410210
                      </p>
                    </div>
                  </div>
                  <button className="text-xs text-primary hover:underline">Show full address</button>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm">123 Main St, Delhi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Profiles - Real Diversity */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Diverse User Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Profile */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    PS
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">Priya Subramaniam</h4>
                    <p className="text-xs text-muted-foreground">Age 19 • Student</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Education</p>
                  <p className="font-medium">B.Tech Computer Science, 2nd Year</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Annual Income</p>
                  <p className="font-medium">₹2,40,000 (Family)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Services Applied</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Scholarship</span>
                    <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">Library Card</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Farmer Profile */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    RY
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">रामप्रसाद यादव</h4>
                    <p className="text-xs text-muted-foreground">Age 52 • किसान (Farmer)</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Land Holding</p>
                  <p className="font-medium">3.5 acres</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="font-medium">Village Rampur, Dist. Sitapur, UP</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Services Applied</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">PM-KISAN</span>
                    <span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs">Crop Insurance</span>
                    <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">Soil Card</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Senior Citizen Profile */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    MN
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">Mrs. Meena Nair</h4>
                    <p className="text-xs text-muted-foreground">Age 68 • Retired Teacher</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pension</p>
                  <p className="font-medium">₹18,000/month</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Health Status</p>
                  <p className="font-medium">Senior Citizen Card Holder</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Services Applied</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Health Card</span>
                    <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">Bus Pass</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Missing & Incomplete Data */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Missing & Incomplete Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Partial Profile</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <span className="text-sm font-medium">Anil Kumar</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-xs text-warning italic">Not provided</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">+91 98765 43210</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Date of Birth</span>
                  <span className="text-xs text-warning italic">Not provided</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-medium text-right">Delhi</span>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Document Gaps</h3>
              <div className="space-y-3">
                {[
                  { name: "Aadhaar Card", status: "verified", available: true },
                  { name: "PAN Card", status: "missing", available: false },
                  { name: "Income Certificate", status: "expired", available: false },
                  { name: "Caste Certificate", status: "verified", available: true },
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{doc.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      doc.status === 'verified' ? 'bg-success/10 text-success' :
                      doc.status === 'expired' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Language Mixed Content */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Multi-Language in Same Screen</h2>
          <div className="border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Application Summary - Mixed Scripts</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Applicant Name</p>
                  <p className="font-medium">முத்துசாமி கருப்பையா</p>
                  <p className="text-xs text-muted-foreground mt-1">(Tamil Script)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Father's Name</p>
                  <p className="font-medium">কৃষ্ণ চন্দ্র দাস</p>
                  <p className="text-xs text-muted-foreground mt-1">(Bengali Script)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Service Name</p>
                  <p className="font-medium">Birth Certificate / जन्म प्रमाण पत्र</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Application Date</p>
                  <p className="font-medium">25 April 2026</p>
                </div>
              </div>
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-2">Address</p>
                <p className="text-sm">ಮನೆ ಸಂಖ್ಯೆ 45, ಎಂ.ಜಿ. ರಸ್ತೆ, ಬೆಂಗಳೂರು - 560001</p>
                <p className="text-xs text-muted-foreground mt-1">(Kannada Script - Bangalore address)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Characters & Formatting */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Special Characters & Edge Case Formatting</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Name Variations</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">With Prefix</p>
                  <p className="font-medium">Dr. (Mrs.) Lakshmi Iyer Ph.D.</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Hyphens & Apostrophes</p>
                  <p className="font-medium">Mary O'Brien-D'Souza</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Special Characters</p>
                  <p className="font-medium">José María García-López</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Single Name</p>
                  <p className="font-medium">Madonna</p>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Date & Time Formats</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Standard Format</p>
                  </div>
                  <p className="font-medium">25 April 2026, 2:30 PM</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Relative Time</p>
                  </div>
                  <p className="font-medium">2 hours ago</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Deadline Format</p>
                  </div>
                  <p className="font-medium text-destructive">Due in 3 days</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Legacy Format</p>
                  </div>
                  <p className="font-medium">01/12/2025 (DD/MM/YYYY)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extreme Cases */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Extreme Edge Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-warning/30 bg-warning/5 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <Languages className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Zero Documents</h4>
                  <p className="text-xs text-muted-foreground">New user, no DigiLocker docs</p>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <p><strong>Scenario:</strong> First-time digital user</p>
                <p><strong>Handling:</strong> Manual upload flow, CSC assistance option</p>
              </div>
            </div>

            <div className="border border-warning/30 bg-warning/5 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <FileText className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">100+ Applications</h4>
                  <p className="text-xs text-muted-foreground">Power user with history</p>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <p><strong>Scenario:</strong> Multi-year active user</p>
                <p><strong>Handling:</strong> Pagination, filtering, archive system</p>
              </div>
            </div>

            <div className="border border-warning/30 bg-warning/5 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <User className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">No Internet History</h4>
                  <p className="text-xs text-muted-foreground">Offline-first scenario</p>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <p><strong>Scenario:</strong> Rural area, intermittent connectivity</p>
                <p><strong>Handling:</strong> Offline drafts, sync queue, CSC mode</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
