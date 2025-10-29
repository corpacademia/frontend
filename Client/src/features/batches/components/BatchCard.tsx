import React from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

interface BatchCardProps {
  batch: {
    id: string;
    name: string;
    description?: string;
    user_count: number;
    lab_count: number;
    trainer_count?: number;
    startdate?: string;
    enddate?: string;
  };
  onClick: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  selectionMode?: boolean;
}

export const BatchCard: React.FC<BatchCardProps> = ({ 
  batch, 
  onClick, 
  onDelete, 
  isSelected = false,
  onToggleSelect,
  selectionMode = false
}) => {
  const isActive = batch.enddate ? new Date(batch.enddate) >= new Date() : true;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(e);
    } else if (!selectionMode) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`glass-panel hover:border-primary-500/40 transition-all duration-300 cursor-pointer group relative ${
        isSelected ? 'border-primary-500 bg-primary-500/10' : ''
      }`}
    >
      {selectionMode && onToggleSelect && (
        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(e as any);
            }}
            className="w-5 h-5 rounded border-2 border-primary-500 bg-dark-400 
                       checked:bg-primary-500 checked:border-primary-500 cursor-pointer
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
          />
        </div>
      )}

      {onDelete && !selectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg 
                     transition-colors opacity-0 group-hover:opacity-100 z-10"
          title="Delete Batch"
        >
          <Trash2 className="h-4 w-4 text-red-400" />
        </button>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary-400 transition-colors pr-10">
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

        {/* Trainers */}
        {(batch.trainer_count !== undefined && batch.trainer_count > 0) && (
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <TrendingUp className="h-4 w-4 text-accent-400" />
            <span>
              {batch.trainer_count} {batch.trainer_count === 1 ? 'Trainer' : 'Trainers'}
            </span>
          </div>
        )}

        {/* Date Range */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-primary-500/10">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(batch.startdate)}</span>
          </div>
          <span>→</span>
          <span>{formatDate(batch.enddate)}</span>
        </div>
      </div>
    </div>
  );
};