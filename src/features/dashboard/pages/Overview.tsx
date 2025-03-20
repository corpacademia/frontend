import React from 'react';
import { useAuthStore } from '../../../store/authStore';
import { GradientText } from '../../../components/ui/GradientText';
import { StatCard } from '../components/stats/StatCard';
import { ActivityChart } from '../components/charts/ActivityChart';
import { RecentOrganizations } from '../components/tables/RecentOrganizations';
import { RecentUsers } from '../components/tables/RecentUsers';
import { Building2, Users, BookOpen, Brain, Cloud } from 'lucide-react';

export const Overview: React.FC = () => {
  const { user } = useAuthStore();

  const stats = [
    { 
      label: 'Organizations', 
      value: '24', 
      icon: Building2, 
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 12, isPositive: true }
    },
    { 
      label: 'Total Users', 
      value: '2.4k', 
      icon: Users, 
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 8, isPositive: true }
    },
    { 
      label: 'Active Labs', 
      value: '156', 
      icon: BookOpen, 
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 24, isPositive: true }
    },
    { 
      label: 'Cloud Resources', 
      value: '1.2k', 
      icon: Cloud, 
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 5, isPositive: false }
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">
        Welcome back, <GradientText>{user?.name}</GradientText>!
      </h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        <RecentOrganizations />
      </div>

      <RecentUsers />
    </div>
  );
};