import React from 'react';
import { Building2, Users, BookOpen, CreditCard } from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';

interface OrganizationStatsProps {
  stats: {
    totalOrganizations: number;
    activeUsers: number;
    totalLabs: number;
    monthlyRevenue: number;
  };
}

export const OrganizationStats: React.FC<OrganizationStatsProps> = ({ stats }) => {
  const metrics = [
    {
      label: 'Total Organizations',
      value: stats.totalOrganizations,
      icon: Building2,
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 12, isPositive: true }
    },
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: Users,
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 8, isPositive: true }
    },
    {
      label: 'Total Labs',
      value: stats.totalLabs,
      icon: BookOpen,
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 15, isPositive: true }
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 10, isPositive: true }
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