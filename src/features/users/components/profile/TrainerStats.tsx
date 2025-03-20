import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Users, BookOpen, Award, Clock } from 'lucide-react';
import { useTrainerStats } from '../../hooks/useTrainerStats';

interface TrainerStatsProps {
  userId: string;
}

export const TrainerStats: React.FC<TrainerStatsProps> = ({ userId }) => {
  const { stats, isLoading } = useTrainerStats(userId);

  if (isLoading) return <div>Loading stats...</div>;

  const metrics = [
    {
      icon: Users,
      label: 'Active Students',
      value: stats.activeStudents,
      total: stats.totalStudents,
    },
    {
      icon: BookOpen,
      label: 'Labs Created',
      value: stats.labsCreated,
      total: stats.totalLabs,
    },
    {
      icon: Award,
      label: 'Assessments Created',
      value: stats.assessmentsCreated,
      total: stats.totalAssessments,
    },
    {
      icon: Clock,
      label: 'Training Hours',
      value: stats.trainingHours,
      suffix: 'hrs',
    },
  ];

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-semibold mb-6">
        <GradientText>Trainer Performance</GradientText>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map(metric => (
          <div key={metric.label} className="p-4 bg-dark-300/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">{metric.label}</span>
              <metric.icon className="h-5 w-5 text-primary-400" />
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-semibold text-gray-200">
                {metric.value}
              </span>
              {metric.total && (
                <span className="text-sm text-gray-400 mb-1">
                  / {metric.total}
                </span>
              )}
              {metric.suffix && (
                <span className="text-sm text-gray-400 mb-1">
                  {metric.suffix}
                </span>
              )}
            </div>
            {metric.total && (
              <div className="mt-2 h-1 bg-dark-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                  style={{ width: `${(metric.value / metric.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};