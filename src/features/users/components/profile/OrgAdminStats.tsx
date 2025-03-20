import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Users, BookOpen, CreditCard, Building2 } from 'lucide-react';
import { useOrgAdminStats } from '../../hooks/useOrgAdminStats';

interface OrgAdminStatsProps {
  userId: string;
}

export const OrgAdminStats: React.FC<OrgAdminStatsProps> = ({ userId }) => {
  const { stats, isLoading } = useOrgAdminStats(userId);

  if (isLoading) return <div>Loading stats...</div>;

  const metrics = [
    {
      icon: Users,
      label: 'Team Members',
      value: stats.teamMembers,
      total: stats.totalSeats,
    },
    {
      icon: BookOpen,
      label: 'Active Labs',
      value: stats.activeLabs,
      total: stats.totalLabs,
    },
    {
      icon: Building2,
      label: 'Departments',
      value: stats.departments,
    },
    {
      icon: CreditCard,
      label: 'Monthly Usage',
      value: `$${stats.monthlyUsage.toLocaleString()}`,
      trend: {
        value: stats.usageChange,
        isPositive: stats.usageChange > 0
      }
    },
  ];

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-semibold mb-6">
        <GradientText>Organization Overview</GradientText>
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
            </div>
            {metric.trend && (
              <p className={`text-sm mt-1 ${
                metric.trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {metric.trend.isPositive ? '↑' : '↓'} {Math.abs(metric.trend.value)}%
              </p>
            )}
            {metric.total && (
              <div className="mt-2 h-1 bg-dark-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                  style={{ width: `${(Number(metric.value) / metric.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};