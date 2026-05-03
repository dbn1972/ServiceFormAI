import {
  Search,
  SlidersHorizontal,
  Clock,
  IndianRupee,
  MapPin,
  Building2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { consumerService } from '../services/api/index';
import { useApi } from '../shared/hooks';
import type { TenantService } from '../shared/types';
import { formatters } from '../utils/validation';

type SearchCard = {
  id: string;
  name: string;
  department: string;
  location: string;
  fee: string;
  time: string;
  desc: string;
  category: string;
};

const fallbackResults: SearchCard[] = [
  {
    id: 'result-scholarship',
    name: 'State Merit Scholarship',
    department: 'Education Department',
    location: 'Maharashtra',
    fee: 'Free',
    time: '7-10 days',
    desc: 'Financial assistance for meritorious students from economically disadvantaged backgrounds.',
    category: 'Scholarships',
  },
  {
    id: 'result-post-matric',
    name: 'Post Matric Scholarship for SC/ST',
    department: 'Social Welfare Department',
    location: 'Maharashtra',
    fee: 'Free',
    time: '15-20 days',
    desc: 'Scholarship for SC/ST students pursuing post-matriculation studies.',
    category: 'Scholarships',
  },
  {
    id: 'result-central-sector',
    name: 'Central Sector Scholarship Scheme',
    department: 'Ministry of Education',
    location: 'Central Government',
    fee: 'Free',
    time: '10-15 days',
    desc: 'Merit-based scholarship for students from low-income families.',
    category: 'Scholarships',
  },
];

export default function SearchResults() {
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('scholarship');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Scholarships']);
  const { data, loading, error, execute } = useApi<SearchCard[]>();

  useEffect(() => {
    void execute(async () => {
      const primaryCategory = selectedCategories[0];
      const response = await consumerService.getServices(
        {
          search: query.trim() || undefined,
          category: primaryCategory && primaryCategory !== 'All' ? primaryCategory : undefined,
        },
        { limit: 50 }
      );

      return response.data.map(mapServiceToSearchCard);
    });
  }, [execute, query, selectedCategories]);

  const results = data && data.length > 0 ? data : filterFallbackResults(fallbackResults, query, selectedCategories);
  const activeFilters = selectedCategories.filter(Boolean);

  const visibleResults = useMemo(() => results.slice(0, 8), [results]);

  return (
    <div className="min-h-full bg-background">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for services, schemes, documents..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-lg"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-border rounded-xl font-medium hover:bg-accent"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold">Filters</h2>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-primary hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Service Type</h3>
                <div className="space-y-2">
                  {['Scholarships', 'Certificates', 'Licenses', 'Benefits', 'Grievances', 'Utilities'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border"
                        checked={selectedCategories.includes(type)}
                        onChange={() => {
                          setSelectedCategories((current) =>
                            current.includes(type)
                              ? current.filter((value) => value !== type)
                              : [...current, type]
                          );
                        }}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Live Search Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Search is now powered by the backend service catalog. Category filters currently use the first selected category for API narrowing.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Search Results</h2>
                <p className="text-sm text-muted-foreground">
                  Found <strong>{results.length} services</strong> matching &quot;{query || 'all services'}&quot;
                </p>
              </div>
              <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Most Relevant</option>
                <option>Recently Added</option>
                <option>Processing Time</option>
                <option>Alphabetical</option>
              </select>
            </div>

            {loading && (
              <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                Loading live search results...
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-foreground">
                Live search is unavailable right now. Showing curated fallback results instead.
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {activeFilters.map((filter) => (
                <span key={filter} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                  {filter}
                  <button
                    onClick={() => setSelectedCategories((current) => current.filter((value) => value !== filter))}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="space-y-4">
              {visibleResults.map((service) => (
                <div
                  key={service.id}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{service.name}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {service.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {service.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{service.desc}</p>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="w-4 h-4 text-success" />
                          <span className="font-medium">{service.fee}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-info" />
                          <span className="font-medium">{service.time}</span>
                        </div>
                      </div>
                    </div>

                    <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 whitespace-nowrap">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing 1-{visibleResults.length} of {results.length} results
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50">
                  Previous
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">
                  1
                </button>
                <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapServiceToSearchCard(service: TenantService): SearchCard {
  return {
    id: service.id,
    name: service.name,
    department: service.tenant?.name || 'Government Department',
    location: 'India',
    fee: typeof service.fees === 'number' ? formatters.amount(service.fees) : 'Fee varies',
    time:
      typeof service.slaDays === 'number'
        ? `${service.slaDays} day${service.slaDays === 1 ? '' : 's'}`
        : 'Processing time varies',
    desc: service.description || 'Detailed service information becomes available after opening the service flow.',
    category: service.category || 'Services',
  };
}

function filterFallbackResults(results: SearchCard[], query: string, categories: string[]) {
  const normalizedQuery = query.trim().toLowerCase();

  return results.filter((result) => {
    const matchesCategory = categories.length === 0 || categories.includes(result.category);
    const matchesQuery =
      !normalizedQuery ||
      [result.name, result.department, result.category, result.desc]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
