import React from 'react';
import { Clock } from 'lucide-react';

interface DurationInputProps {
  value: number;
  onChange: (duration: number) => void;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Duration (minutes)
      </label>
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-primary-400" />
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          placeholder="Enter duration in minutes"
          className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                   text-gray-300 focus:border-primary-500/40 focus:outline-none
                   focus:ring-2 focus:ring-primary-500/20 transition-colors"
        />
      </div>
    </div>
  );
};