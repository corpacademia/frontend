
import React from 'react';
import { BookOpen, Target, TrendingUp } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

export const LearningPath: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <GradientText>Learning Path</GradientText>
        </h1>
        <p className="text-gray-400">Track your progress and follow personalized learning paths</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Target className="h-12 w-12 text-primary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Set Goals</h3>
          <p className="text-gray-400">Define your learning objectives and milestones</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <BookOpen className="h-12 w-12 text-secondary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Curated Content</h3>
          <p className="text-gray-400">Access specially selected labs and courses</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <TrendingUp className="h-12 w-12 text-accent-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Track Progress</h3>
          <p className="text-gray-400">Monitor your advancement and achievements</p>
        </div>
      </div>
    </div>
  );
};
