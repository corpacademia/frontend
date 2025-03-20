import React from 'react';
import { CatalogueCard } from './CatalogueCard';
import { UserCatalogueCard } from './UserCatalogueCard';
import { Lab } from '../../types';
import { useAuthStore } from '../../../../store/authStore';

interface CatalogueGridProps {
  labs: Lab[];
  isLoading?: boolean;
}

export const CatalogueGrid: React.FC<CatalogueGridProps> = ({ labs, isLoading }) => {
  const { user } = useAuthStore();
  const isUser = user?.role === 'user';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-[320px] bg-dark-300/50 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {labs.map(lab => (
        isUser ? (
          <UserCatalogueCard key={lab.id} lab={lab} />
        ) : (
          <CatalogueCard key={lab.id} lab={lab} />
        )
      ))}
    </div>
  );
};