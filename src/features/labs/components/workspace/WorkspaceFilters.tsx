import React from 'react';
import { Search, Filter } from 'lucide-react';

interface WorkspaceFiltersProps {
  onFilterChange: (filters: any) => void;
}

export const WorkspaceFilters: React.FC<WorkspaceFiltersProps> = ({ onFilterChange }) => {
  return (
    <div className="glass-panel mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search workspaces..."
            className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none"
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
            onChange={(e) => onFilterChange({ type: e.target.value })}
          >
            <option value="">All Lab Types</option>
            <option value="single-vm">Single VM</option>
            <option value="dedicated-vm">Dedicated VM</option>
            <option value="vm-cluster">VM Cluster</option>
            <option value="cloud-slice">Cloud Slice</option>
            <option value="emulated">Emulated Environment</option>
            <option value="hybrid">Hybrid Lab</option>
          </select>

          <select
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
            onChange={(e) => onFilterChange({ level: e.target.value })}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
};