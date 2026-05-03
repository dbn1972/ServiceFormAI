import { CheckCircle, XCircle, AlertTriangle, ZoomIn, ZoomOut, RotateCw, Download, FileText, Shield, User, Phone, Mail, MessageSquare, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api/base.service';
import { API_ENDPOINTS } from '../shared/config/api.config';

export default function DocumentVerificationInterface() {
  const { id } = useParams<{ id: string }>();
  const [currentDoc, setCurrentDoc] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [documents, setDocuments] = useState([
    { name: 'Aadhaar Card', type: 'ID Proof', status: 'pending' },
    { name: 'Passport Photo', type: 'Photograph', status: 'pending' },
    { name: 'Medical Certificate', type: 'Supporting Document', status: 'pending' },
    { name: 'Current DL Copy', type: 'Reference Document', status: 'pending' },
  ]);
  const [appId, setAppId] = useState('APP-2026-8901');

  useEffect(() => {
    if (!id) return;
    apiService.get<{ tracking_number?: string; documents?: Array<{ name: string; type: string; status: string }> }>(API_ENDPOINTS.producer.applicationById(id)).then((res) => {
      if (res.tracking_number) setAppId(res.tracking_number);
      if (res.documents && res.documents.length > 0) setDocuments(res.documents);
    }).catch(() => {});
  }, [id]);

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Document Verification</h1>
                <p className="text-sm text-muted-foreground">Application ID: {appId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-info/10 text-info rounded-lg text-sm font-medium">
                4 Documents to Review
              </div>
              <button className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80">
                Request More Info
              </button>
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                Complete Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1600px] mx-auto px-6 py-6">
          <div className="h-full grid grid-cols-12 gap-6">
            {/* Left Panel - Document Viewer */}
            <div className="col-span-8 flex flex-col gap-4">
              {/* Viewer Controls */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Document {currentDoc + 1} of {documents.length}:</span>
                    <span className="text-sm text-muted-foreground">{documents[currentDoc]?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium min-w-[4rem] text-center">{zoom}%</span>
                    <button
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-border mx-2"></div>
                    <button
                      onClick={() => setRotation((rotation + 90) % 360)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Rotate"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Viewer */}
              <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex items-center justify-center">
                <div
                  className="bg-white p-8 shadow-lg transition-transform"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  }}
                >
                  {/* Mock Aadhaar Card */}
                  <div className="w-[600px] h-[380px] border-2 border-gray-300 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-bold text-blue-900">Aadhaar</h3>
                          <p className="text-xs text-gray-600">Government of India</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Unique Identification Authority</p>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="mb-4">
                          <h2 className="text-2xl font-bold text-gray-900 mb-1">Ananya Sharma</h2>
                          <p className="text-sm text-gray-600">Date of Birth: 15/03/1995</p>
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="text-gray-700"><strong>Gender:</strong> Female</p>
                          <p className="text-gray-700"><strong>Address:</strong> 45, MG Road</p>
                          <p className="text-gray-700">Bangalore, Karnataka - 560001</p>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 border-t border-gray-300 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Aadhaar Number</p>
                          <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">XXXX XXXX 2847</p>
                        </div>
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <div className="text-xs text-center text-gray-500">QR<br/>Code</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Navigation */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentDoc(Math.max(0, currentDoc - 1))}
                    disabled={currentDoc === 0}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex gap-2">
                    {documents.map((_doc, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentDoc(index)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentDoc === index
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentDoc(Math.min(documents.length - 1, currentDoc + 1))}
                    disabled={currentDoc === documents.length - 1}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Verification Details */}
            <div className="col-span-4 flex flex-col gap-4 overflow-y-auto">
              {/* Application Details */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Application Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Service Type</p>
                    <p className="font-medium">Driving License Renewal</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Applicant Name</p>
                    <p className="font-medium">Ananya Sharma</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Application Date</p>
                    <p className="font-medium">April 20, 2026</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Priority</p>
                    <span className="px-2 py-1 bg-warning/10 text-warning rounded text-xs font-medium">
                      Medium
                    </span>
                  </div>
                </div>
              </div>

              {/* Document List */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Documents ({documents.length})</h2>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDoc(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        currentDoc === index
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          currentDoc === index ? 'bg-primary/20' : 'bg-background'
                        }`}>
                          <FileText className={`w-4 h-4 ${currentDoc === index ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Verification Checklist</h2>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border" />
                    <div>
                      <p className="text-sm font-medium">Document is clear and legible</p>
                      <p className="text-xs text-muted-foreground">All text and images are readable</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border" />
                    <div>
                      <p className="text-sm font-medium">Information matches application</p>
                      <p className="text-xs text-muted-foreground">Name, DOB, address verified</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border" />
                    <div>
                      <p className="text-sm font-medium">Document is not expired</p>
                      <p className="text-xs text-muted-foreground">Valid as per current date</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border" />
                    <div>
                      <p className="text-sm font-medium">No signs of tampering</p>
                      <p className="text-xs text-muted-foreground">Document appears authentic</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border" />
                    <div>
                      <p className="text-sm font-medium">Digital signature verified</p>
                      <p className="text-xs text-muted-foreground">QR code/watermark authentic</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Verification Action */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Verification Decision</h2>
                
                <div className="space-y-3 mb-4">
                  <button className="w-full py-3 px-4 bg-success/10 text-success border-2 border-success/20 rounded-lg font-medium hover:bg-success/20 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Verify Document
                  </button>
                  <button className="w-full py-3 px-4 bg-warning/10 text-warning border-2 border-warning/20 rounded-lg font-medium hover:bg-warning/20 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Request Clarification
                  </button>
                  <button className="w-full py-3 px-4 bg-destructive/10 text-destructive border-2 border-destructive/20 rounded-lg font-medium hover:bg-destructive/20 flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Reject Document
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verification Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add any observations or comments..."
                    className="w-full min-h-[100px] px-3 py-2 bg-input-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* AI Assistance */}
              <div className="bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-5 h-5 text-info" />
                  <h3 className="font-semibold">AI Assistance</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  AI verification suggests: <strong className="text-success">Document appears valid</strong>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Text is clear and readable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>No tampering detected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Information matches database</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <span>Manual review recommended for signature</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Confidence: 92% • Last updated: 2 seconds ago
                </p>
              </div>

              {/* Applicant Contact */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Applicant Contact</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">+91 98765 43210</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">ananya.sharma@email.com</p>
                    </div>
                  </div>
                  <button className="w-full mt-3 py-2 px-4 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
