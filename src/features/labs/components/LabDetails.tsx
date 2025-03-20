import React from 'react';
import { BookOpen } from 'lucide-react';
import { Lab } from '../types/assignLab';

interface LabDetailsProps {
  lab: Lab;
}

export const LabDetails: React.FC<LabDetailsProps> = ({ lab }) => {
  return (
    <div className="p-4 bg-dark-300/50 rounded-lg">
      <div className="flex items-center space-x-3 mb-2">
        <BookOpen className="h-5 w-5 text-primary-400" />
        <h3 className="font-medium text-gray-200">{lab.title}</h3>
      </div>
      <p className="text-sm text-gray-400 mb-2">{lab.description}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {lab.technologies.map(tech => (
          <span 
            key={tech}
            className="px-2 py-1 text-xs font-medium rounded-full
                     bg-primary-500/20 text-primary-300"
          >
            {tech}
          </span>
        ))}
      </div>
      <div className="text-sm text-gray-400">
        Recommended duration: {lab.duration} minutes
      </div>
    </div>
  );
};