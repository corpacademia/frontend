import React from 'react';

interface TechnologyBadgeProps {
  name: string;
}

export const TechnologyBadge: React.FC<TechnologyBadgeProps> = ({ name }) => {
  return (
    <span className="px-2 py-1 text-xs font-medium bg-dark-300/50 
                   text-primary-300 rounded-full hover:bg-dark-300 
                   transition-colors cursor-default">
      {name}
    </span>
  );
};