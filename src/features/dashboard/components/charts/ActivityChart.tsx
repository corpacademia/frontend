import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Activity } from 'lucide-react';

export const ActivityChart: React.FC = () => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          <GradientText>Platform Activity</GradientText>
        </h2>
        <Activity className="h-5 w-5 text-primary-400" />
      </div>
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-400">Activity chart visualization will be implemented here</p>
      </div>
    </div>
  );
};