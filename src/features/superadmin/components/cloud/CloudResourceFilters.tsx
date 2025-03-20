import React from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

interface CloudResourceFiltersProps {
  onFilterChange: (filters: CloudResourceFilters) => void;
}

export interface CloudResourceFilters {
  organization?: string;
  provider?: string;
  resourceType?: string;
  utilizationRange?: [number, number];
  dateRange?: [Date, Date];
}

export const CloudResourceFilters: React.FC<CloudResourceFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = React.useState<CloudResourceFilters>({});

  const handleFilterChange = (key: keyof CloudResourceFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="glass-panel mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search organizations..."
            className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
            onChange={(e) => handleFilterChange('organization', e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
            onChange={(e) => handleFilterChange('provider', e.target.value)}
          >
            <option value="">All Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>

          <select
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
            onChange={(e) => handleFilterChange('resourceType', e.target.value)}
          >
            <option value="">All Resources</option>
            <option value="compute">Compute</option>
            <option value="storage">Storage</option>
            <option value="network">Network</option>
          </select>

          <button className="btn-secondary">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced Filters
          </button>
        </div>
      </div>
    </div>
  );
};