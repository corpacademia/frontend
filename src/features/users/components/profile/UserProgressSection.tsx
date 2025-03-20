import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { BookOpen, Award, Brain, Clock } from 'lucide-react';
import { useUserProgress } from '../../hooks/useUserProgress';

interface UserProgressSectionProps {
  userId: string;
}

export const UserProgressSection: React.FC<UserProgressSectionProps> = ({ userId }) => {
  const { progress, isLoading } = useUserProgress(userId);

  if (isLoading) return <div>Loading progress...</div>;

  const stats = [
    {
      icon: BookOpen,
      label: 'Labs Completed',
      value: progress.completedLabs,
      total: progress.totalLabs,
    },
    {
      icon: Award,
      label: 'Assessments Passed',
      value: progress.passedAssessments,
      total: progress.totalAssessments,
    },
    {
      icon: Brain,
      label: 'Skills Mastered',
      value: progress.masteredSkills,
      total: progress.totalSkills,
    },
    {
      icon: Clock,
      label: 'Learning Hours',
      value: progress.learningHours,
      suffix: 'hrs',
    },
  ];

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-semibold mb-6">
        <GradientText>Learning Progress</GradientText>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="p-4 bg-dark-300/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <stat.icon className="h-5 w-5 text-primary-400" />
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-semibold text-gray-200">
                {stat.value}
              </span>
              {stat.total && (
                <span className="text-sm text-gray-400 mb-1">
                  / {stat.total}
                </span>
              )}
              {stat.suffix && (
                <span className="text-sm text-gray-400 mb-1">
                  {stat.suffix}
                </span>
              )}
            </div>
            {stat.total && (
              <div className="mt-2 h-1 bg-dark-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                  style={{ width: `${(stat.value / stat.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};