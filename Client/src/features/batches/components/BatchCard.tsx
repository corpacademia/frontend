
import React from 'react';
import { Users, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

interface BatchCardProps {
  batch: {
    id: string;
    name: string;
    description?: string;
    user_count: number;
    lab_count: number;
    trainer_name?: string;
    start_date?: string;
    end_date?: string;
  };
  onClick: () => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch, onClick }) => {
  const isActive = batch.end_date ? new Date(batch.end_date) >= new Date() : true;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      onClick={onClick}
      className="glass-panel hover:border-primary-500/40 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary-400 transition-colors">
            <GradientText>{batch.name}</GradientText>
          </h3>
          {batch.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{batch.description}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {isActive ? 'Active' : 'Completed'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 p-2 bg-dark-400/30 rounded-lg">
            <Users className="h-4 w-4 text-primary-400" />
            <div>
              <p className="text-xs text-gray-400">Students</p>
              <p className="text-sm font-semibold text-white">{batch.user_count || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-dark-400/30 rounded-lg">
            <BookOpen className="h-4 w-4 text-secondary-400" />
            <div>
              <p className="text-xs text-gray-400">Labs</p>
              <p className="text-sm font-semibold text-white">{batch.lab_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Trainer */}
        {batch.trainer_name && (
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <TrendingUp className="h-4 w-4 text-accent-400" />
            <span>Trainer: {batch.trainer_name}</span>
          </div>
        )}

        {/* Date Range */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-primary-500/10">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(batch.start_date)}</span>
          </div>
          <span>→</span>
          <span>{formatDate(batch.end_date)}</span>
        </div>
      </div>
    </div>
  );
};
