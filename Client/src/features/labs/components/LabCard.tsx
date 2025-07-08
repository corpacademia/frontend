` tags.

```
<replit_final_file>
import React from 'react';
import { Lab } from '../../../types';
import { Clock, Tag, BookOpen } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

interface LabCardProps {
  lab: Lab;
  onSelect?: (lab: Lab) => void;
}

export const LabCard: React.FC<LabCardProps> = ({ lab, onSelect }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            <GradientText>{lab.title}</GradientText>
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">{lab.description}</p>
        </div>
        <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
          lab.status === 'available' ? 'bg-primary-500/20 text-primary-300' :
          lab.status === 'in-progress' ? 'bg-accent-500/20 text-accent-300' :
          'bg-secondary-500/20 text-secondary-300'
        }`}>
          {lab.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-400 mb-4">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-primary-400 flex-shrink-0" />
          <span className="truncate">{lab.duration} mins</span>
        </div>
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-1 text-primary-400 flex-shrink-0" />
          <span className="truncate">{lab.type}</span>
        </div>
        <div className="flex items-center">
          <BookOpen className="h-4 w-4 mr-1 text-primary-400 flex-shrink-0" />
          <span className="truncate">
            {lab.prerequisites?.length || 0} Prerequisites
          </span>
        </div>
      </div>

      {lab.prerequisites && lab.prerequisites.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 mb-2">Prerequisites:</p>
          <div className="flex flex-wrap gap-2">
            {lab.prerequisites.map((prereq) => (
              <span key={prereq} 
                className="px-2 py-1 text-xs bg-dark-300/50 text-gray-300 
                         rounded-full truncate max-w-[200px]">
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex-grow">
        <div className="flex flex-wrap gap-2">
          {lab.technologies.map((tech) => (
            <span key={tech} 
              className="px-2 py-1 text-xs font-medium bg-dark-300/50 
                       text-primary-300 rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 
                    pt-4 border-t border-primary-500/10">
        <span className="text-lg font-bold order-2 sm:order-1">
          <GradientText>${lab.price}</GradientText>
        </span>
        <button 
          className="w-full sm:w-auto order-1 sm:order-2 relative overflow-hidden 
                   px-6 py-2 rounded-lg font-medium text-center
                   bg-gradient-to-r from-primary-500 to-secondary-500
                   hover:from-primary-400 hover:to-secondary-400
                   transform hover:scale-105 transition-all duration-300
                   shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30
                   before:absolute before:inset-0
                   before:bg-gradient-to-r before:from-transparent 
                   before:via-white/20 before:to-transparent
                   before:translate-x-[-200%] hover:before:animate-shimmer">
          start lab
        </button>
      </div>
    </div>
  );
};