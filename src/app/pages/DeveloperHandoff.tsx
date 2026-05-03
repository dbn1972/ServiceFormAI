import { Code, Package, FileCode, Terminal, Layers, Zap, Database, Lock, Cloud, Shield } from 'lucide-react';

export default function DeveloperHandoff() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Developer Handoff Documentation</h1>
          <p className="text-muted-foreground">Technical specifications, code snippets, and API integration guide</p>
        </div>

        {/* Tech Stack */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Technology Stack</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'React 18.3.1', icon: Code, description: 'UI library with hooks and concurrent features' },
              { name: 'TypeScript 5.x', icon: FileCode, description: 'Type-safe JavaScript development' },
              { name: 'Tailwind CSS v4', icon: Layers, description: 'Utility-first CSS framework' },
              { name: 'Lucide React', icon: Package, description: 'Icon library (20px default)' },
              { name: 'Vite 6.x', icon: Zap, description: 'Build tool and dev server' },
              { name: 'pnpm', icon: Terminal, description: 'Package manager' },
            ].map((tech, index) => {
              const Icon = tech.icon;
              return (
                <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{tech.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{tech.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Installation */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Installation & Setup</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">1. Install Dependencies</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-400"># Clone the repository</p>
                <p>git clone https://github.com/yourorg/serviceformai-os.git</p>
                <p className="mt-2 text-gray-400"># Install dependencies</p>
                <p>pnpm install</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">2. Environment Variables</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-400"># .env.local</p>
                <p className="text-green-400">VITE_API_BASE_URL</p>=https://api.serviceformai.gov.in
                <p className="text-green-400 mt-1">VITE_DIGILOCKER_CLIENT_ID</p>=your_digilocker_client_id
                <p className="text-green-400 mt-1">VITE_DIGILOCKER_REDIRECT_URI</p>=https://yourapp.com/callback
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">3. Run Development Server</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <p>pnpm dev</p>
                <p className="mt-2 text-gray-400"># Server runs on http://localhost:5173</p>
              </div>
            </div>
          </div>
        </div>

        {/* Component Patterns */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Component Patterns</h2>

          <div className="space-y-6">
            {/* Button Component */}
            <div>
              <h3 className="font-semibold mb-3">Primary Button</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Example:</p>
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Submit Application
                  </button>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Code:</p>
                  <div className="bg-gray-950 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                    <pre>{`<button className="px-6 py-3
  bg-primary text-primary-foreground
  rounded-lg font-medium
  hover:bg-primary/90
  transition-colors">
  Submit Application
</button>`}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div>
              <h3 className="font-semibold mb-3">Input Field</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Example:</p>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Code:</p>
                  <div className="bg-gray-950 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                    <pre>{`<input
  type="text"
  placeholder="Enter your name"
  className="w-full px-4 py-3
    bg-input-background border border-border
    rounded-lg
    focus:outline-none focus:ring-2
    focus:ring-ring"
/>`}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Card */}
            <div>
              <h3 className="font-semibold mb-3">Card Component</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Example:</p>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h4 className="font-semibold mb-2">Card Title</h4>
                    <p className="text-sm text-muted-foreground">Card content goes here</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Code:</p>
                  <div className="bg-gray-950 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                    <pre>{`<div className="bg-card border border-border
  rounded-xl p-6">
  <h4 className="font-semibold mb-2">
    Card Title
  </h4>
  <p className="text-sm text-muted-foreground">
    Card content
  </p>
</div>`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">API Integration</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Base Configuration</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  async get(endpoint: string) {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${getToken()}\`
      }
    });
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${getToken()}\`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Example: Submit Application</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`// Submit application
const submitApplication = async (applicationData) => {
  try {
    const result = await api.post('/applications', {
      serviceId: applicationData.serviceId,
      citizenId: applicationData.citizenId,
      documents: applicationData.documents,
      formData: applicationData.formData
    });

    return { success: true, applicationId: result.id };
  } catch (error) {
    console.error('Application submission failed:', error);
    return { success: false, error: error.message };
  }
};`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* DigiLocker Integration */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">DigiLocker Integration</h2>

          <div className="space-y-6">
            <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-sm">
                <strong>Important:</strong> DigiLocker requires OAuth 2.0 authentication. Register your app at{' '}
                <a href="https://digilocker.gov.in" className="text-primary hover:underline">https://digilocker.gov.in</a> to get client credentials.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">OAuth Flow</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`// 1. Initiate OAuth flow
const initiateDigiLockerAuth = () => {
  const clientId = import.meta.env.VITE_DIGILOCKER_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_DIGILOCKER_REDIRECT_URI;
  const authUrl = \`https://digilocker.gov.in/public/oauth2/1/authorize?
    response_type=code&
    client_id=\${clientId}&
    redirect_uri=\${redirectUri}&
    state=\${generateState()}\`;

  window.location.href = authUrl;
};

// 2. Handle callback
const handleDigiLockerCallback = async (code: string) => {
  const response = await api.post('/auth/digilocker/callback', { code });
  localStorage.setItem('digilocker_token', response.access_token);
};

// 3. Fetch documents
const getDigiLockerDocuments = async () => {
  const token = localStorage.getItem('digilocker_token');
  const docs = await api.get('/digilocker/documents', {
    headers: { 'X-DigiLocker-Token': token }
  });
  return docs;
};`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Service Manifest Protocol */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Service Manifest Protocol</h2>

          <div className="space-y-6">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm">
                <strong>Core Product IP:</strong> The Service Manifest Protocol is the core innovation that enables federated service delivery. Each service is defined by a machine-readable manifest.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Manifest Structure</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`{
  "serviceId": "scholarship-merit-state-2026",
  "name": "State Merit Scholarship",
  "description": "Merit-based financial aid for students",
  "tenant": "state-education-dept",
  "level": "state",
  "eligibility": {
    "age": { "min": 18, "max": 25 },
    "income": { "max": 300000 },
    "education": { "minQualification": "class-12" }
  },
  "requiredDocuments": [
    { "type": "aadhaar", "source": "digilocker" },
    { "type": "income-certificate", "maxAge": 6 },
    { "type": "marksheet", "source": "digilocker" }
  ],
  "formFields": [
    { "id": "fullName", "type": "text", "prefill": "digilocker.name" },
    { "id": "mobile", "type": "tel", "required": true },
    { "id": "bankAccount", "type": "text", "pattern": "^[0-9]{9,18}$" }
  ],
  "workflow": {
    "autoApprove": true,
    "approvalConditions": {
      "allDocumentsVerified": true,
      "eligibilityMet": true
    },
    "sla": { "days": 7 }
  }
}`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Manifest Validation</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`const validateManifest = (manifest) => {
  // Check eligibility
  const meetsEligibility = (citizen) => {
    const { age, income } = manifest.eligibility;
    return citizen.age >= age.min &&
           citizen.age <= age.max &&
           citizen.income <= income.max;
  };

  // Check documents
  const hasRequiredDocuments = (citizenDocs) => {
    return manifest.requiredDocuments.every(reqDoc =>
      citizenDocs.some(doc =>
        doc.type === reqDoc.type &&
        doc.verified === true
      )
    );
  };

  return { meetsEligibility, hasRequiredDocuments };
};`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Deployment</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Build for Production</h3>
              <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-400"># Build optimized production bundle</p>
                <p>pnpm build</p>
                <p className="mt-2 text-gray-400"># Output: dist/</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Environment Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-semibold mb-2">Development</h4>
                  <p className="text-xs font-mono text-muted-foreground">localhost:5173</p>
                  <p className="text-xs text-muted-foreground mt-2">Hot reload, source maps</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-semibold mb-2">Staging</h4>
                  <p className="text-xs font-mono text-muted-foreground">staging.serviceformai.gov.in</p>
                  <p className="text-xs text-muted-foreground mt-2">QA testing, mock APIs</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-semibold mb-2">Production</h4>
                  <p className="text-xs font-mono text-muted-foreground">serviceformai.gov.in</p>
                  <p className="text-xs text-muted-foreground mt-2">Optimized, CDN cached</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Security Best Practices</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <Lock className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Authentication</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• JWT tokens with 15-min expiry</li>
                  <li>• Refresh tokens stored in httpOnly cookies</li>
                  <li>• OAuth 2.0 for third-party integrations</li>
                </ul>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <Shield className="w-6 h-6 text-success mb-2" />
                <h3 className="font-semibold mb-2">Data Protection</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Encrypt PII at rest (AES-256)</li>
                  <li>• TLS 1.3 for all API calls</li>
                  <li>• No sensitive data in localStorage</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <Database className="w-6 h-6 text-info mb-2" />
                <h3 className="font-semibold mb-2">Input Validation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sanitize all user inputs</li>
                  <li>• Validate on client AND server</li>
                  <li>• Use parameterized queries (prevent SQL injection)</li>
                </ul>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <Cloud className="w-6 h-6 text-warning mb-2" />
                <h3 className="font-semibold mb-2">CORS & CSP</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Whitelist trusted origins only</li>
                  <li>• Content Security Policy headers</li>
                  <li>• No inline scripts or eval()</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
