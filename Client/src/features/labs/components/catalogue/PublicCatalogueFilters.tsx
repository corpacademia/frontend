
import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

interface PublicCatalogueFiltersProps {
  onFilterChange: (filters: any) => void;
  filters: {
    search: string;
    category: string;
    brand: string;
    level: string;
    duration: string;
  };
}

export const PublicCatalogueFilters: React.FC<PublicCatalogueFiltersProps> = ({
  onFilterChange,
  filters
}) => {
  const handleInputChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const categories = [
    'Cloud Computing',
    'DevOps',
    'Security',
    'AI/ML',
    'Development',
    'Networking',
    'Database'
  ];

  const brands = [
    'Microsoft',
    'AWS',
    'Google Cloud',
    'DevOps Institute',
    'Learning Tree',
    'Cisco',
    'Oracle'
  ];

  const levels = [
    'Foundation',
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ];

  const durations = [
    '1-2 days',
    '3-5 days',
    '1 week',
    '2+ weeks'
  ];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Labs..."
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-400/30 border border-primary-500/20 rounded-lg 
                     text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
          />
        </div>

        {/* Filter Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Product Category</label>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 bg-dark-400/30 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Select some options</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-dark-400 text-white">
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Brands</label>
            <div className="relative">
              <select
                value={filters.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-4 py-3 bg-dark-400/30 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Select some options</option>
                {brands.map(brand => (
                  <option key={brand} value={brand} className="bg-dark-400 text-white">
                    {brand}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Course Level</label>
            <div className="relative">
              <select
                value={filters.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-4 py-3 bg-dark-400/30 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level} className="bg-dark-400 text-white">
                    {level}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Duration</label>
            <div className="relative">
              <select
                value={filters.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full px-4 py-3 bg-dark-400/30 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Any Duration</option>
                {durations.map(duration => (
                  <option key={duration} value={duration} className="bg-dark-400 text-white">
                    {duration}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (value && key !== 'search') {
              return (
                <span key={key} className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm flex items-center">
                  {value}
                  <button
                    onClick={() => handleInputChange(key, '')}
                    className="ml-2 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </span>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};
