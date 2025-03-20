import React from 'react';
import { Search, Filter } from 'lucide-react';

interface CatalogueFilterUpdate {
  key: string; // Restrict key to valid filter fields
  value: string; // The value associated with the key
}


interface CatalogueFiltersProps {
  onFilterChange: (update: CatalogueFilterUpdate) => void;
  setFilters: (filters: { [key: string]: string }) => void; // Function to update filters
  filters: { [key: string]: string }; // Current filters passed from the parent
}

export const LabCatalogueFilters: React.FC<CatalogueFiltersProps> = ({ onFilterChange ,setFilters,filters }) => {
      
  const handleInputChange=(key: string, value: string)=>{
      onFilterChange({key,value})
  }
  
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
            onChange={(e)=>{handleInputChange('search',e.target.value)}}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-4">
          <select className="flex-1 min-w-[150px] px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                          text-gray-300 focus:border-primary-500/40 focus:outline-none"
                          onChange={(e)=>{handleInputChange('technology',e.target.value)}}
                          >
            <option value="">All Technologies</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="kubernetes">Kubernetes</option>
          </select>

          <select className="flex-1 min-w-[150px] px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                          text-gray-300 focus:border-primary-500/40 focus:outline-none"
                          onChange={(e)=>{handleInputChange('level',e.target.value)}}
                          >
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