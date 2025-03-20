import React from 'react';
import { LabCard } from '../LabCard';
import { useLabs } from '../../hooks/useLabs';

export const LabCatalogueGrid: React.FC = () => {
  const { labs, isLoading } = useLabs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel animate-pulse border border-primary-500/10 rounded-xl p-4 sm:p-6">
            <div className="h-32 bg-dark-300/50 rounded-lg mb-4"></div>
            <div className="h-4 bg-dark-300/50 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-dark-300/50 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
      {labs.map(lab => (
        <div key={lab.id} 
          className="glass-panel border border-primary-500/10 hover:border-primary-500/30 
                   rounded-xl p-4 sm:p-6 transition-all duration-300 
                   hover:shadow-lg hover:shadow-primary-500/10 
                   hover:translate-y-[-2px]">
          <LabCard lab={lab} />
        </div>
      ))}
    </div>
  );
};