import React from 'react';
import { Search, Filter } from 'lucide-react';

interface LabCatalogueFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export const LabCatalogueFilters: React.FC<LabCatalogueFiltersProps> = ({ onFilterChange }) => {
  return (
    <div className="glass-panel">
      <div className="flex flex-col space-y-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search labs..."
            className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-4">
          <select className="flex-1 min-w-[150px] px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                          text-gray-300 focus:border-primary-500/40 focus:outline-none">
            <option value="">All Technologies</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="kubernetes">Kubernetes</option>
          </select>

          <select className="flex-1 min-w-[150px] px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                          text-gray-300 focus:border-primary-500/40 focus:outline-none">
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <button className="btn-secondary whitespace-nowrap">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
};