import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  Heart,
  Building2,
  GraduationCap,
  Car,
  Home,
  Droplet,
  Briefcase,
  Tractor,
  Scale,
  X,
  TrendingUp,
  Calendar,
  AlignLeft,
  AlertTriangle
} from 'lucide-react';
import { ALL_SERVICE_TEMPLATES, TEMPLATES_BY_CATEGORY } from '../data/serviceTemplates';

const CATEGORY_ICONS: Record<string, any> = {
  'Civil Records': FileText,
  'Health & Welfare': Heart,
  'Education': GraduationCap,
  'Transport': Car,
  'Property & Land': Home,
  'Revenue': Building2,
  'Utilities': Droplet,
  'Municipal': Building2,
  'Business & Commerce': Briefcase,
  'Agriculture': Tractor,
  'Food & Civil Supplies': FileText,
  'Grievances': Scale,
};

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'sla', label: 'Fastest SLA' },
  { value: 'fields', label: 'Simplest (Fewer Fields)' },
];

export default function TemplateBrowser() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const categories = Object.keys(TEMPLATES_BY_CATEGORY);
  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = TEMPLATES_BY_CATEGORY[cat]?.length ?? 0;
      return acc;
    }, {} as Record<string, number>);
  }, [categories]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = ALL_SERVICE_TEMPLATES;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.targetAudience.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return a.name.localeCompare(b.name);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sla':
          const aDays = parseInt(a.sla.split(' ')[0] ?? '999') || 999;
          const bDays = parseInt(b.sla.split(' ')[0] ?? '999') || 999;
          return aDays - bDays;
        case 'fields':
          return a.fields.length - b.fields.length;
        default:
          return 0;
      }
    });

    return sorted;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleUseTemplate = (templateId: string) => {
    navigate(`/tenant/service/create?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-2">Template Library</h1>
            <p className="text-muted-foreground">
              Browse {ALL_SERVICE_TEMPLATES.length} production-ready service templates covering the complete citizen lifecycle
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-8">
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Categories</h3>
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-primary hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {categories.map(category => {
                      const Icon = CATEGORY_ICONS[category] || FileText;
                      const isActive = selectedCategory === category;
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(isActive ? null : category)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="truncate">{category}</span>
                          </span>
                          <span className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {categoryCounts[category]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Templates</span>
                      <span className="font-semibold">{ALL_SERVICE_TEMPLATES.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Popular</span>
                      <span className="font-semibold">{ALL_SERVICE_TEMPLATES.filter(t => t.popular).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories</span>
                      <span className="font-semibold">{categories.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </button>
                <div className="text-sm text-muted-foreground">
                  {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
                  {selectedCategory && ` in ${selectedCategory}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Popular Templates Section - Only show if no filters active */}
            {!selectedCategory && !searchQuery && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Popular Templates</h2>
                  <span className="text-sm text-muted-foreground">Most requested services</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {ALL_SERVICE_TEMPLATES.filter(t => t.popular).slice(0, 4).map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleUseTemplate(template.id)}
                      className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl hover:border-primary/50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {template.category} • SLA: {template.sla}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Template Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => {
                  const CategoryIcon = CATEGORY_ICONS[template.category] || FileText;
                  return (
                    <div
                      key={template.id}
                      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all group"
                    >
                      {/* Card Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CategoryIcon className="w-6 h-6 text-primary" />
                          </div>
                          {template.popular && (
                            <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Popular
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {template.description}
                        </p>

                        {/* Category Badge */}
                        <span className="inline-block px-2 py-1 bg-muted text-muted-foreground rounded text-xs mb-4">
                          {template.category}
                        </span>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="w-4 h-4" />
                            <span>{template.fields.length} fields</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4" />
                            <span>{template.documents.length} docs</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>SLA: {template.sla}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{template.estimatedApplicationTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-4 bg-muted/30 border-t border-border">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewTemplate(template)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                          >
                            <AlignLeft className="w-4 h-4" />
                            Details
                          </button>
                          <button
                            onClick={() => handleUseTemplate(template.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            Use Template
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const Icon = CATEGORY_ICONS[previewTemplate.category] || FileText;
                    return <Icon className="w-6 h-6 text-primary" />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">{previewTemplate.name}</h2>
                    {previewTemplate.popular && (
                      <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{previewTemplate.category}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Processing Time</span>
                  </div>
                  <p className="text-lg font-semibold">SLA: {previewTemplate.sla}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Application Time</span>
                  </div>
                  <p className="text-lg font-semibold">{previewTemplate.estimatedApplicationTime}</p>
                </div>
              </div>

              {/* Target Audience */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">Target Audience:</span>
                  <span className="text-sm text-muted-foreground">{previewTemplate.targetAudience}</span>
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Form Fields ({previewTemplate.fields.length})
                </h3>
                <div className="space-y-2">
                  {previewTemplate.fields.slice(0, 8).map((field: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{field.label}</span>
                          {field.required && (
                            <span className="text-xs text-destructive">*</span>
                          )}
                          {field.prefillable && (
                            <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs">
                              Auto-fill
                            </span>
                          )}
                        </div>
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground uppercase">{field.type}</span>
                    </div>
                  ))}
                  {previewTemplate.fields.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      + {previewTemplate.fields.length - 8} more fields
                    </p>
                  )}
                </div>
              </div>

              {/* Documents Required */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Documents Required ({previewTemplate.documents.length})
                </h3>
                <div className="space-y-2">
                  {previewTemplate.documents.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{doc.name}</span>
                          {doc.digilockerType && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                              DigiLocker
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {doc.acceptedFormats?.join(', ')} • Max {doc.maxSizeMB}MB
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility Rules */}
              {previewTemplate.eligibilityRules && previewTemplate.eligibilityRules.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Eligibility Requirements ({previewTemplate.eligibilityRules.length})
                  </h3>
                  <div className="space-y-2">
                    {previewTemplate.eligibilityRules.map((rule: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Use This Template
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
