/**
 * White-Label & Branding Settings
 * Complete customization for government departments
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Eye,
  Copy,
  Check,
  Save,
  Sparkles,
  Shield,
  Code,
  Share2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from '../utils/toast';
import { validateFile } from '../utils/errorHandling';
import { FileAPI } from '../services/api';
import { producerService } from '../services/api/producer.service';

interface WhiteLabelConfig {
  logo?: string;
  departmentName: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  customDomain: string;
  supportEmail: string;
  helpline: string;
  officeAddress: string;
}

export default function WhiteLabelSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [domainVerified, setDomainVerified] = useState(true);

  const [config, setConfig] = useState<WhiteLabelConfig>({
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Emblem_of_Maharashtra.svg/200px-Emblem_of_Maharashtra.svg.png',
    departmentName: 'State Welfare Department',
    tagline: 'Empowering Citizens of Maharashtra',
    colors: {
      primary: '#0066CC',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#F9FAFB',
    },
    customDomain: 'services.maharashtra.gov.in',
    supportEmail: 'support@maharashtra.gov.in',
    helpline: '1800-XXX-XXXX',
    officeAddress: 'Mantralaya, Mumbai - 400032, Maharashtra, India',
  });

  // Load existing settings from API on mount
  useEffect(() => {
    producerService.getTenantSettings().then((data: any) => {
      if (!data) return;
      setConfig(prev => ({
        ...prev,
        logo: data.logo ?? prev.logo,
        departmentName: data.name ?? prev.departmentName,
        colors: {
          primary: data.primaryColor ?? prev.colors.primary,
          secondary: data.secondaryColor ?? prev.colors.secondary,
          accent: prev.colors.accent,
          background: prev.colors.background,
        },
        customDomain: data.customDomain ?? prev.customDomain,
      }));
    }).catch(() => undefined);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.copied();
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy', { description: 'Please try again' });
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, {
      maxSizeMB: 2,
      allowedTypes: ['image/png', 'image/svg+xml', 'image/jpeg'],
      allowedExtensions: ['png', 'svg', 'jpg', 'jpeg'],
    });

    if (!validation.valid) {
      toast.error('Invalid logo file', { description: validation.error });
      return;
    }

    setUploadingLogo(true);
    setUploadProgress(0);

    try {
      const result = await FileAPI.upload(file, {
        onProgress: setUploadProgress,
        maxSizeMB: 2,
        allowedTypes: ['image/png', 'image/svg+xml', 'image/jpeg'],
      });

      if (result.success) {
        setConfig(prev => ({ ...prev, logo: result.data.url }));
        toast.success('Logo uploaded successfully');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast.error('Failed to upload logo', {
        description: error.message || 'Please try again',
      });
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVerifyDomain = async () => {
    if (!config.customDomain) {
      toast.error('Please enter a custom domain');
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(config.customDomain)) {
      toast.error('Invalid domain format', {
        description: 'Please enter a valid domain name',
      });
      return;
    }

    setVerifyingDomain(true);

    try {
      // Simulate domain verification (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, this would call: await API.verifyDomain(config.customDomain);
      setDomainVerified(true);
      toast.success('Domain verified successfully', {
        description: 'Your custom domain is now active',
      });
    } catch (error: any) {
      setDomainVerified(false);
      toast.error('Domain verification failed', {
        description: error.message || 'Please check your DNS settings',
      });
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!config.departmentName) {
      toast.error('Department name is required');
      return;
    }

    if (!config.supportEmail) {
      toast.error('Support email is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.supportEmail)) {
      toast.error('Invalid email format', {
        description: 'Please enter a valid email address',
      });
      return;
    }

    setSaving(true);

    try {
      await producerService.updateTenantSettings({
        name: config.departmentName,
        logo: config.logo,
        primaryColor: config.colors.primary,
        secondaryColor: config.colors.secondary,
        customDomain: config.customDomain,
      });

      toast.success('Settings saved successfully', {
        description: 'Your white-label configuration has been updated',
      });
    } catch (error: any) {
      toast.error('Failed to save settings', {
        description: error.message || 'Please try again or contact support',
      });
    } finally {
      setSaving(false);
    }
  };

  const embedCode = `<iframe
  src="https://services.maharashtra.gov.in/embed/scholarship-application"
  width="100%"
  height="600"
  frameborder="0"
  title="Scholarship Application"
></iframe>`;

  const shareableLink = 'https://services.maharashtra.gov.in/s/scholarship-2026';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">White-Label & Branding</h1>
              <p className="text-sm text-muted-foreground">
                Customize your portal with your department's branding
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo & Brand Identity */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Logo & Brand Identity</h2>

              <div className="space-y-6">
                {/* Department Logo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Department Logo</label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-muted/30 relative">
                      {uploadingLogo ? (
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" aria-hidden="true" />
                          <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                        </div>
                      ) : (
                        <img
                          src={config.logo}
                          alt="Department Logo"
                          className="w-20 h-20 object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/svg+xml,image/jpeg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload New Logo
                          </>
                        )}
                      </button>
                      <p className="text-xs text-muted-foreground mb-2">
                        Recommended: 512x512px, PNG or SVG format
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max file size: 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Department Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Department Name</label>
                  <input
                    type="text"
                    value={config.departmentName}
                    onChange={(e) => setConfig(prev => ({ ...prev, departmentName: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tagline (Optional)</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => setConfig(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Your department tagline"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Color Theme */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Color Theme</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#0066CC"
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      defaultValue="#0066CC"
                      className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#10B981"
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      defaultValue="#10B981"
                      className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#F59E0B"
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      defaultValue="#F59E0B"
                      className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#F9FAFB"
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      defaultValue="#F9FAFB"
                      className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Color Preview</p>
                <div className="flex gap-2">
                  <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: '#0066CC' }} />
                  <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: '#10B981' }} />
                  <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: '#F59E0B' }} />
                  <div className="w-16 h-16 rounded-lg border border-border" style={{ backgroundColor: '#F9FAFB' }} />
                </div>
              </div>
            </div>

            {/* Custom Domain */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Custom Domain</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Custom Domain</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.customDomain}
                      onChange={(e) => setConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                      placeholder="services.yourdepartment.gov.in"
                      className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={handleVerifyDomain}
                      disabled={verifyingDomain}
                      className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifyingDomain ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          Verifying...
                        </span>
                      ) : (
                        'Verify Domain'
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Point your domain's CNAME record to: <code className="font-mono bg-muted px-1 py-0.5 rounded">portal.serviceformai.gov.in</code>
                  </p>
                </div>

                {domainVerified ? (
                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-2 text-success mb-2">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Domain Verified</span>
                    </div>
                    <p className="text-xs text-success/80">
                      Your custom domain is active and SSL certificate is valid
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                    <div className="flex items-center gap-2 text-warning mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Domain Not Verified</span>
                    </div>
                    <p className="text-xs text-warning/80">
                      Please update your DNS settings and verify your domain
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Contact Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Support Email</label>
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => setConfig(prev => ({ ...prev, supportEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Helpline Number</label>
                  <input
                    type="tel"
                    value={config.helpline}
                    onChange={(e) => setConfig(prev => ({ ...prev, helpline: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Office Address</label>
                  <textarea
                    rows={3}
                    value={config.officeAddress}
                    onChange={(e) => setConfig(prev => ({ ...prev, officeAddress: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Embeddable Widget */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Embeddable Widget</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Embed Code</label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {embedCode}
                    </pre>
                    <button
                      onClick={() => handleCopy(embedCode, 'embed')}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 flex items-center gap-1"
                    >
                      {copied === 'embed' ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Embed this service form on your existing website or mobile app
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Shareable Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareableLink}
                      readOnly
                      className="flex-1 px-4 py-3 border border-border rounded-lg bg-muted/30"
                    />
                    <button
                      onClick={() => handleCopy(shareableLink, 'link')}
                      className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2"
                    >
                      {copied === 'link' ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this link on social media, WhatsApp, or embed in emails
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-success text-success-foreground rounded-lg font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save White-Label Settings
                </>
              )}
            </button>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="bg-card border border-border rounded-xl p-6 sticky top-8">
              <h3 className="font-semibold mb-4">Live Preview</h3>

              {/* Portal Preview */}
              <div className="border-2 border-border rounded-lg overflow-hidden mb-4">
                <div className="bg-primary p-4 flex items-center gap-3">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Emblem_of_Maharashtra.svg/200px-Emblem_of_Maharashtra.svg.png"
                    alt="Logo"
                    className="w-8 h-8 bg-white rounded p-1"
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">State Welfare Department</p>
                    <p className="text-white/80 text-xs">Empowering Citizens of Maharashtra</p>
                  </div>
                </div>
                <div className="p-4 bg-[#F9FAFB]">
                  <div className="bg-white p-3 rounded-lg mb-2">
                    <p className="text-sm font-medium">Scholarship Application</p>
                    <p className="text-xs text-muted-foreground">Apply for state merit scholarship</p>
                  </div>
                  <button className="w-full py-2 bg-[#0066CC] text-white rounded-lg text-sm font-medium">
                    Apply Now
                  </button>
                </div>
              </div>

              <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                Full Preview
              </button>
            </div>

            {/* Quick Links */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>

              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Share Portal</span>
                </button>
                <button className="w-full px-4 py-2 text-left border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                  <Code className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Developer Docs</span>
                </button>
                <button className="w-full px-4 py-2 text-left border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">SSL Certificate</span>
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">White-Label Features</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Custom domain & SSL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Branded emails</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Embeddable widgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Remove "Powered by"</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Custom color theme</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
