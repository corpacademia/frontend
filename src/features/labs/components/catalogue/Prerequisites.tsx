import React from 'react';

interface PrerequisitesProps {
  prerequisites: string[];
}

export const Prerequisites: React.FC<PrerequisitesProps> = ({ prerequisites }) => {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-400 mb-2">Prerequisites:</p>
      <div className="flex flex-wrap gap-2">
        {prerequisites.map((prereq) => (
          <span key={prereq} 
            className="px-2 py-1 text-xs bg-dark-300/50 text-gray-300 
                     rounded-full truncate max-w-[180px]">
            {prereq}
          </span>
        ))}
      </div>
    </div>
  );
};