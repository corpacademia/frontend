import React from 'react';
import { Filter, Search } from 'lucide-react';

interface LabFiltersProps {
  onFilterChange: (filters: any) => void;
  onSearch: (query: string) => void;
}

export const LabFilters: React.FC<LabFiltersProps> = ({ onFilterChange, onSearch }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search labs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            onChange={(e) => onSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <select className="pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="">All Types</option>
            <option value="catalogue">Catalogue</option>
            <option value="cloud-vm">Cloud VM</option>
            <option value="dedicated-vm">Dedicated VM</option>
            <option value="cluster">Cluster</option>
            <option value="cloud-slice">Cloud Slice</option>
            <option value="emulator">Emulator</option>
            <option value="hardware">Hardware</option>
            <option value="demo">Demo</option>
          </select>
          
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
}