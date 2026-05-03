/**
 * Example Consumer Page - Service Catalog
 * Demonstrates how to use the new API service layer
 * This shows the pattern for migrating existing pages
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { consumerService } from '../../../services/api/consumer.service';
import { useApi } from '../../../shared/hooks';
import type { TenantService, ServiceFilters } from '../../../shared/types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Search, Filter } from 'lucide-react';

export default function ServiceCatalogExample() {
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    category: '',
    isPublished: true,
  });
  
  const { data, loading, error, execute } = useApi<{ data: TenantService[]; total: number }>();

  // Load services on mount and when filters change
  useEffect(() => {
    loadServices();
  }, [filters]);

  const loadServices = async () => {
    await execute(() => 
      consumerService.getServices(filters, { page: 1, limit: 20 })
    );
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
  };

  // handleCategoryFilter available for filter UI

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Service Catalog</h1>
        <p className="text-gray-600">Browse available government services</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading services...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          <p className="font-semibold">Error loading services</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Services Grid */}
      {data && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {data.total} services available
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {data.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No services found matching your criteria</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Service Card Component
function ServiceCard({ service }: { service: TenantService }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary">{service.category}</Badge>
          {service.isPublished && (
            <Badge variant="default" className="bg-green-500">Published</Badge>
          )}
        </div>
        <CardTitle className="text-xl">{service.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {service.tenant?.name || 'Government Service'}
          </span>
          <Link to={`/services/${service.id}`}>
            <Button size="sm">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
