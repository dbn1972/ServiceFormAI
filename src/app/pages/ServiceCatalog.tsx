import {
  Search,
  Filter,
  GraduationCap,
  FileText,
  Droplet,
  Lightbulb,
  Building,
  Users,
  ChevronRight,
  Star,
  Clock,
  IndianRupee,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consumerService } from '../services/api/index';
import { useApi } from '../shared/hooks';
import type { TenantService } from '../shared/types';
import { formatters } from '../utils/validation';

type CatalogCard = {
  id: string;
  name: string;
  department: string;
  category: string;
  description: string;
  feesLabel: string;
  processingLabel: string;
  featured: boolean;
  icon: typeof FileText;
  color: string;
};

const categoryOptions = [
  { label: 'All Services', value: '' },
  { label: 'Scholarships', value: 'Scholarships' },
  { label: 'Certificates', value: 'Certificates' },
  { label: 'Licenses', value: 'Licenses' },
  { label: 'Grievances', value: 'Grievances' },
  { label: 'Utilities', value: 'Utilities' },
  { label: 'Benefits', value: 'Benefits' },
];

const fallbackServices: CatalogCard[] = [
  {
    id: 'service-scholarship',
    name: 'State Merit Scholarship',
    department: 'State Welfare',
    category: 'Scholarships',
    description: 'Financial support for high-performing students from economically weaker backgrounds.',
    feesLabel: 'Free',
    processingLabel: '7-10 days',
    featured: true,
    icon: GraduationCap,
    color: 'primary',
  },
  {
    id: 'service-income-certificate',
    name: 'Income Certificate',
    department: 'Revenue Department',
    category: 'Certificates',
    description: 'Get an official certificate for income-based eligibility across schemes and benefits.',
    feesLabel: formatters.amount(50),
    processingLabel: '3-5 days',
    featured: true,
    icon: FileText,
    color: 'info',
  },
  {
    id: 'service-trade-license',
    name: 'Trade License',
    department: 'Municipal Corporation',
    category: 'Licenses',
    description: 'Apply for a new trade license or renew an existing business operating permit.',
    feesLabel: formatters.amount(500),
    processingLabel: '10-15 days',
    featured: true,
    icon: Building,
    color: 'success',
  },
  {
    id: 'service-birth-certificate',
    name: 'Birth Certificate',
    department: 'Municipal Corporation',
    category: 'Certificates',
    description: 'Request a digital or printed copy of a registered birth certificate.',
    feesLabel: formatters.amount(30),
    processingLabel: '2-3 days',
    featured: false,
    icon: FileText,
    color: 'primary',
  },
  {
    id: 'service-water-connection',
    name: 'Water Connection',
    department: 'Municipal Utilities',
    category: 'Utilities',
    description: 'Apply for a new domestic water connection with address and ownership verification.',
    feesLabel: formatters.amount(1200),
    processingLabel: '14-21 days',
    featured: false,
    icon: Droplet,
    color: 'consent',
  },
  {
    id: 'service-streetlight-complaint',
    name: 'Streetlight Complaint',
    department: 'Public Works',
    category: 'Grievances',
    description: 'Register a faulty streetlight complaint and track the repair status.',
    feesLabel: 'Free',
    processingLabel: '1-2 days',
    featured: false,
    icon: Lightbulb,
    color: 'warning',
  },
  {
    id: 'service-pension-scheme',
    name: 'Pension Scheme',
    department: 'Social Welfare',
    category: 'Benefits',
    description: 'Access pension-related benefits, onboarding support, and renewal submissions.',
    feesLabel: 'Free',
    processingLabel: '7-12 days',
    featured: false,
    icon: Users,
    color: 'success',
  },
];

export default function ServiceCatalog() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { data, loading, error, execute } = useApi<CatalogCard[]>();

  useEffect(() => {
    void execute(async () => {
      const response = await consumerService.getServices(
        {
          search: query.trim() || undefined,
          category: selectedCategory || undefined,
        },
        { limit: 50 }
      );

      return response.data.map(mapServiceToCard);
    });
  }, [execute, query, selectedCategory]);

  const services = data && data.length > 0 ? data : filterFallbackServices(fallbackServices, query, selectedCategory);
  const hasLiveServices = Boolean(data && data.length > 0);

  const featuredServices = useMemo(
    () => services.filter((service) => service.featured).slice(0, 3),
    [services]
  );

  const nonFeaturedServices = useMemo(
    () => services.filter((service) => !featuredServices.some((featured) => featured.id === service.id)),
    [services, featuredServices]
  );

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Service Catalog</h1>
          <p className="text-muted-foreground mb-6">Browse all available services, schemes, and benefits</p>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search services by name, category, or department..."
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="px-6 py-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Live Search
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {categoryOptions.map((category) => (
            <button
              key={category.label}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Loading live services from the backend catalog...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-foreground">
            Live catalog data is unavailable right now. Showing the curated fallback catalog instead.
          </div>
        )}

        {featuredServices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Featured Services</h2>
              <button className="text-sm text-primary hover:underline">View all →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <div key={service.id} className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${service.color}/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <service.icon className={`w-6 h-6 text-${service.color}`} />
                    </div>
                    <span className="flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-1 rounded-full font-medium">
                      <Star className="w-3 h-3" />
                      Popular
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{service.department}</p>
                  <p className="text-xs text-muted-foreground mb-4">{service.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasLiveServices) navigate(`/services/${encodeURIComponent(service.id)}`);
                    }}
                    disabled={!hasLiveServices}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    Learn more
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Services</h2>
            <p className="text-sm text-muted-foreground">{services.length} services available</p>
          </div>

          {services.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <h3 className="text-lg font-semibold mb-2">No services matched your search</h3>
              <p className="text-sm text-muted-foreground">Try a different keyword or switch back to All Services.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nonFeaturedServices.length > 0 ? nonFeaturedServices.map((service) => (
                <div key={service.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 bg-${service.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <service.icon className={`w-5 h-5 text-${service.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.department}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <IndianRupee className="w-4 h-4 text-success" />
                      {service.feesLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4 text-info" />
                      {service.processingLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{service.category}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasLiveServices) navigate(`/applications/new?serviceId=${encodeURIComponent(service.id)}`);
                      }}
                      disabled={!hasLiveServices}
                      className="text-primary font-medium hover:underline"
                    >
                      Apply →
                    </button>
                  </div>
                </div>
              )) : featuredServices.map((service) => (
                <div key={service.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 bg-${service.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <service.icon className={`w-5 h-5 text-${service.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.department}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <IndianRupee className="w-4 h-4 text-success" />
                      {service.feesLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4 text-info" />
                      {service.processingLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{service.category}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasLiveServices) navigate(`/applications/new?serviceId=${encodeURIComponent(service.id)}`);
                      }}
                      disabled={!hasLiveServices}
                      className="text-primary font-medium hover:underline"
                    >
                      Apply →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapServiceToCard(service: TenantService): CatalogCard {
  const normalizedCategory = service.category || 'Services';
  const color = getColorForCategory(normalizedCategory);
  const icon = getIconForCategory(normalizedCategory);

  return {
    id: service.id,
    name: service.name,
    department: service.tenant?.name || 'Government Department',
    category: normalizedCategory,
    description: service.description || 'Service details are available after opening the application flow.',
    feesLabel: typeof service.fees === 'number' ? formatters.amount(service.fees) : 'Fee varies',
    processingLabel:
      typeof service.slaDays === 'number'
        ? `${service.slaDays} day${service.slaDays === 1 ? '' : 's'}`
        : 'Processing time varies',
    featured: ['Scholarships', 'Certificates', 'Licenses'].includes(normalizedCategory),
    icon,
    color,
  };
}

function filterFallbackServices(services: CatalogCard[], query: string, category: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return services.filter((service) => {
    const matchesCategory = !category || service.category === category;
    const matchesQuery =
      !normalizedQuery ||
      [service.name, service.department, service.category, service.description]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

function getIconForCategory(category: string) {
  switch (category.toLowerCase()) {
    case 'scholarships':
      return GraduationCap;
    case 'certificates':
      return FileText;
    case 'utilities':
      return Droplet;
    case 'grievances':
      return Lightbulb;
    case 'benefits':
      return Users;
    case 'licenses':
      return Building;
    default:
      return FileText;
  }
}

function getColorForCategory(category: string) {
  switch (category.toLowerCase()) {
    case 'scholarships':
      return 'primary';
    case 'certificates':
      return 'info';
    case 'utilities':
      return 'consent';
    case 'grievances':
      return 'warning';
    case 'benefits':
      return 'success';
    case 'licenses':
      return 'grievance';
    default:
      return 'primary';
  }
}
