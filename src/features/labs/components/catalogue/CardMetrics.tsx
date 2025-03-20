import React from 'react';
import { Clock, Tag, BookOpen } from 'lucide-react';

interface CardMetricsProps {
  duration: number;
  type: string;
  prerequisitesCount: number;
}

export const CardMetrics: React.FC<CardMetricsProps> = ({
  duration,
  type,
  prerequisitesCount
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
      <div className="flex items-center text-sm text-gray-400">
        <Clock className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
        <span className="truncate">{duration} mins</span>
      </div>
      <div className="flex items-center text-sm text-gray-400">
        <Tag className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
        <span className="truncate">{type}</span>
      </div>
      <div className="flex items-center text-sm text-gray-400">
        <BookOpen className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
        <span className="truncate">{prerequisitesCount} Prerequisites</span>
      </div>
    </div>
  );
};