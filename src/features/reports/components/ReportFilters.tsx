import React from 'react';
import { Search, Calendar, Download } from 'lucide-react';
import { ReportFilter, ReportType, DateRange } from '../types';

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilter) => void;
  availableTypes: ReportType[];
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  onFilterChange, 
  availableTypes 
}) => {
  const [filters, setFilters] = React.useState<ReportFilter>({
    type: 'user',
    dateRange: 'month'
  });

  const handleFilterChange = (key: keyof ReportFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="glass-panel mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search in reports..."
            className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
          >
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Reports
              </option>
            ))}
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          <button className="btn-secondary">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </button>

          <button className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};