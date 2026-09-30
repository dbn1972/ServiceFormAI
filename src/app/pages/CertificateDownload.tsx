import { Download, Share2, Printer, CheckCircle, Shield, FileText, Calendar, QrCode, ExternalLink, Mail, Award, ChevronRight, Eye, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { consumerService } from '../services/api/consumer.service';

export default function CertificateDownload() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<Awaited<ReturnType<typeof consumerService.getApplicationOutput>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Application ID is missing.');
      return;
    }
    void consumerService.getApplicationOutput(id)
      .then(setOutput)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Certificate output is unavailable.'));
  }, [id]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output.certificate_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error || !output) {
    return (
      <div className="min-h-full bg-muted/30 flex items-center justify-center p-8">
        <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center">
          {!error && <p className="text-muted-foreground">Loading issued certificate...</p>}
          {error && <p className="text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  const certificateNumber = output.certificate_number;
  const issuedDate = new Date(output.issued_at).toLocaleDateString('en-IN');

  return (
    <div className="min-h-full bg-muted/30">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-success/10 to-success/5 border-b border-success/20">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-success rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">Certificate Ready for Download</h1>
              <p className="text-foreground mb-4">
                Your issued certificate is available for download. This output is tied to the approved application and its immutable service release.
              </p>
              <div className="flex flex-wrap gap-3">
                {output.download_url ? <a href={output.download_url} download className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Certificate ({output.format})
                </a> : <button disabled className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 opacity-50" title="The certificate artifact is not available yet">
                  <Download className="w-5 h-5" />
                  Certificate artifact pending
                </button>}
                <button className="px-6 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted/50 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </button>
                <button className="px-4 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted/50">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="px-4 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted/50">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Certificate Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Certificate Preview Card */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-primary/5 to-info/5 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Issued Government Certificate</h2>
                      <p className="text-sm text-muted-foreground">Application {id}</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
                    Verified
                  </span>
                </div>
              </div>

              {/* Certificate Document Preview */}
              <div className="p-8 bg-white">
                <div className="border-4 border-primary/20 rounded-lg p-8 bg-gradient-to-br from-white to-primary/5">
                  {/* Government Header */}
                  <div className="text-center mb-8 pb-6 border-b-2 border-primary/20">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-1">Issued application output</h3>
                    <p className="text-sm text-gray-600">Tenant authority metadata unavailable</p>
                    <p className="text-xs text-gray-500 mt-2">Verified application output</p>
                  </div>

                  {/* Certificate Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      Certificate output
                    </h2>
                    <p className="text-sm text-gray-600">This is to certify that</p>
                  </div>

                  {/* Recipient Details */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ borderBottom: '2px solid #1e40af', display: 'inline-block', paddingBottom: '4px' }}>
                      Certificate holder
                    </h3>
                    <p className="text-sm text-gray-600 mt-4">
                      has been issued the certificate recorded against this approved application.
                    </p>
                  </div>

                  {/* Scholarship Details */}
                  <div className="bg-primary/5 rounded-lg p-6 mb-8">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Certificate Number</p>
                        <p className="font-semibold text-gray-900">{certificateNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Format</p>
                        <p className="font-semibold text-gray-900">{output.format}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Issued</p>
                        <p className="font-semibold text-gray-900">{issuedDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Status</p>
                        <p className="font-semibold text-gray-900">{output.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 mt-12">
                    <div className="text-center">
                      <div className="h-12 mb-2"></div>
                      <div className="border-t-2 border-gray-300 pt-2">
                        <p className="text-sm font-semibold text-gray-900">Competent authority</p>
                        <p className="text-xs text-gray-600">Recorded in the application workflow</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600">Verification code: {output.verification_code}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      This metadata record confirms an issued application output. Artifact verification will be available when storage is provisioned.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Issued on: {issuedDate} | Verification: {output.verification_code}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Certificate Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Document Type</h3>
                    <p className="text-sm text-muted-foreground">Application output</p>
                    <p className="text-xs text-muted-foreground mt-1">{output.format} artifact status: {output.storage_key ? 'available' : 'pending'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Status</h3>
                    <p className="text-sm text-muted-foreground">{output.status}</p>
                    <p className="text-xs text-muted-foreground mt-1">{issuedDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Security</h3>
                    <p className="text-sm text-muted-foreground">Application-scoped access</p>
                    <p className="text-xs text-muted-foreground mt-1">Verification code recorded</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Validity</h3>
                    <p className="text-sm text-muted-foreground">1 year</p>
                    <p className="text-xs text-muted-foreground mt-1">Renewable annually</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Download Options</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Standard PDF (Recommended)</h3>
                      <p className="text-sm text-muted-foreground">High quality, 2.4 MB</p>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-info" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Print-Ready PDF</h3>
                      <p className="text-sm text-muted-foreground">300 DPI, 5.8 MB</p>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Printer className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Add to DigiLocker</h3>
                      <p className="text-sm text-muted-foreground">Save to your digital wallet</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Now
                </button>
                <button className="w-full py-2.5 px-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Certificate
                </button>
                <button className="w-full py-2.5 px-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Link
                </button>
                <button className="w-full py-2.5 px-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Certificate Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Certificate Number</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium font-mono">{certificateNumber}</p>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-muted rounded transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
                  <p className="text-sm font-medium">April 27, 2026</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valid Until</p>
                  <p className="text-sm font-medium">May 31, 2027</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Issued By</p>
                  <p className="text-sm font-medium">Department of Education</p>
                  <p className="text-xs text-muted-foreground">Government of Karnataka</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">File Size</p>
                  <p className="text-sm font-medium">2.4 MB (PDF)</p>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-success" />
                <h3 className="font-semibold">Verification</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This certificate is digitally signed and can be verified online.
              </p>
              <button className="w-full py-2.5 px-4 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted/50 flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Verify Certificate
              </button>
            </div>

            {/* Next Steps */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Next Steps</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <p className="text-muted-foreground">Download and save the certificate securely</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <p className="text-muted-foreground">Add to your DigiLocker wallet</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <p className="text-muted-foreground">Submit to your educational institution</p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-muted/50 border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support team for assistance with your certificate.
              </p>
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-4 h-4" />
                Visit Help Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
