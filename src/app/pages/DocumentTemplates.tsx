import { FileText, Download, Eye, Search, Filter, Star, File } from 'lucide-react';

export default function DocumentTemplates() {
  const templates = [
    { name: 'Affidavit Format', category: 'Legal', size: '245 KB', downloads: '12,453', format: 'PDF', popular: true },
    { name: 'Income Certificate Application', category: 'Revenue', size: '182 KB', downloads: '8,921', format: 'PDF', popular: true },
    { name: 'Address Proof Declaration', category: 'General', size: '156 KB', downloads: '15,234', format: 'PDF', popular: true },
    { name: 'NOC Format (Property)', category: 'Property', size: '198 KB', downloads: '6,743', format: 'PDF', popular: false },
    { name: 'Self Declaration Form', category: 'General', size: '134 KB', downloads: '9,876', format: 'PDF', popular: false },
    { name: 'Birth Certificate Application', category: 'Civil', size: '221 KB', downloads: '7,654', format: 'PDF', popular: false },
    { name: 'Caste Certificate Application', category: 'Revenue', size: '189 KB', downloads: '5,432', format: 'PDF', popular: false },
    { name: 'Domicile Certificate Form', category: 'Revenue', size: '167 KB', downloads: '4,321', format: 'PDF', popular: false },
  ];

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Document Templates Library</h1>
          <p className="text-muted-foreground">Download pre-filled forms and document templates</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select className="px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
              <option>All Categories</option>
              <option>Legal</option>
              <option>Revenue</option>
              <option>General</option>
              <option>Property</option>
              <option>Civil</option>
            </select>
            <button className="px-4 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Popular Templates */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-warning fill-warning" />
            <h2 className="text-xl font-semibold">Popular Templates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.filter(t => t.popular).map((template, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <span className="px-2.5 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                    Popular
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{template.name}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span>{template.category}</span>
                  <span>•</span>
                  <span>{template.size}</span>
                  <span>•</span>
                  <span>{template.downloads} downloads</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Templates */}
        <div>
          <h2 className="text-xl font-semibold mb-4">All Templates</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Template Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Format</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Size</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Downloads</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {templates.map((template, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{template.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-muted rounded-full text-xs font-medium">
                        {template.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{template.format}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{template.size}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{template.downloads}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Preview">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
