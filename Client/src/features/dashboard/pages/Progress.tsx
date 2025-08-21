
import React from 'react';
import { BarChart3, Calendar, Trophy } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

export const Progress: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <GradientText>Progress</GradientText>
        </h1>
        <p className="text-gray-400">Track your learning progress and achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <BarChart3 className="h-12 w-12 text-primary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
          <p className="text-gray-400">Detailed analytics of your learning journey</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Calendar className="h-12 w-12 text-secondary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Timeline</h3>
          <p className="text-gray-400">View your progress timeline and milestones</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Trophy className="h-12 w-12 text-accent-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Achievements</h3>
          <p className="text-gray-400">Celebrate your accomplishments and badges</p>
        </div>
      </div>
    </div>
  );
};
