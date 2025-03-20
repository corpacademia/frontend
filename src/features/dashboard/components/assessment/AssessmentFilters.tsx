import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

interface AssessmentFilterUpdate {
  key: string;
  value: string;
}

interface AssessmentFiltersProps {
  onFilterChange: (update: AssessmentFilterUpdate) => void;
  filters: { [key: string]: string };
  setFilters: (filters: { [key: string]: string }) => void;
}

export const AssessmentFilters: React.FC<AssessmentFiltersProps> = ({
  onFilterChange,
  filters,
  setFilters
}) => {
  return (
    <div className="glass-panel mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search assessments..."
            value={filters.search}
            onChange={(e) => onFilterChange({ key: 'search', value: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ key: 'status', value: e.target.value })}
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <button 
            onClick={() => setFilters({ search: '', status: '', dateRange: '' })}
            className="btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>

          <button className="btn-secondary">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </button>
        </div>
      </div>
    </div>
  );
};