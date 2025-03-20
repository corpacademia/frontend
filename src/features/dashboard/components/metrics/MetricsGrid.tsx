import React from 'react';
import { Users, BookOpen, Cloud, CreditCard } from 'lucide-react';
import { StatCard } from '../stats/StatCard';

export const MetricsGrid: React.FC = () => {
  const metrics = [
    {
      label: 'Total Users',
      value: '2,547',
      icon: Users,
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 12, isPositive: true },
      details: {
        individuals: 1850,
        trainers: 420,
        institutes: 180,
        enterprises: 97
      }
    },
    {
      label: 'Active Labs',
      value: '1,284',
      icon: BookOpen,
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 8, isPositive: true },
      details: {
        created: 2456,
        accessed: 1843,
        completed: 1284
      }
    },
    {
      label: 'Cloud Usage',
      value: '$45.2K',
      icon: Cloud,
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 5, isPositive: false },
      details: {
        aws: 15600,
        azure: 18400,
        gcp: 11200
      }
    },
    {
      label: 'Monthly Revenue',
      value: '$128.5K',
      icon: CreditCard,
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 15, isPositive: true },
      details: {
        subscriptions: 98500,
        labs: 22000,
        cloud: 8000
      }
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