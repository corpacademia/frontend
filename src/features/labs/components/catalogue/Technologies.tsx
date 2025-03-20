import React from 'react';

interface TechnologiesProps {
  technologies: string[];
}

export const Technologies: React.FC<TechnologiesProps> = ({ technologies }) => {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        {technologies.map((tech) => (
          <span key={tech} 
            className="px-2 py-1 text-xs font-medium bg-dark-300/50 
                     text-primary-300 rounded-full">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};