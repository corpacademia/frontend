import React from 'react';
import { Users, GraduationCap, Building2, Activity } from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    trainers: number;
    organizations: number;
  };
}

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  const metrics = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 12, isPositive: true }
    },
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 8, isPositive: true }
    },
    {
      label: 'Trainers',
      value: stats.trainers,
      icon: GraduationCap,
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 15, isPositive: true }
    },
    {
      label: 'Organizations',
      value: stats.organizations,
      icon: Building2,
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 5, isPositive: true }
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <StatCard key={metric.label} {...metric} />
      ))}
    </div>
  );
};