import React from 'react';
import { Users, BookOpen, Cloud, CreditCard, Brain, Building2, Zap } from 'lucide-react';
import { DashboardMetrics } from '../../types';

interface MetricsOverviewProps {
  metrics: DashboardMetrics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Users',
      value: metrics.users.total.toLocaleString(),
      change: '+12%',
      icon: Users,
      details: [
        { label: 'Trainers', value: metrics.users.trainers },
        { label: 'Institutes', value: metrics.users.institutes },
        { label: 'Enterprises', value: metrics.users.enterprises }
      ]
    },
    {
      title: 'Active Labs',
      value: metrics.labs.active.toLocaleString(),
      change: '+8%',
      icon: BookOpen,
      details: [
        { label: 'Total', value: metrics.labs.total },
        { label: 'Completed', value: metrics.labs.completed }
      ]
    },
    {
      title: 'Cloud Usage',
      value: `$${metrics.cloud.usage.toLocaleString()}`,
      change: '-5%',
      icon: Cloud,
      details: [
        { label: 'Budget', value: `$${metrics.cloud.budget}` },
        { label: 'Savings', value: `$${metrics.cloud.savings}` }
      ]
    },
    {
      title: 'Monthly Revenue',
      value: `$${metrics.revenue.monthly.toLocaleString()}`,
      change: '+15%',
      icon: CreditCard,
      details: [
        { label: 'Annual', value: `$${metrics.revenue.annual}` },
        { label: 'Growth', value: `${metrics.revenue.growth}%` }
      ]
    }
  ];

  return (
    <div className="dashboard-grid">
      {cards.map((card) => (
        <div key={card.title} className="data-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{card.title}</p>
              <p className="stat-value mt-2">{card.value}</p>
              <span className={`inline-flex items-center text-sm mt-1 ${
                card.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
              }`}>
                {card.change}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary-500/10 to-secondary-500/10 group-hover:from-primary-500/20 group-hover:to-secondary-500/20 transition-colors">
              <card.icon className="h-6 w-6 text-primary-400 group-hover:text-primary-300 transition-colors" />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            {card.details.map((detail) => (
              <div key={detail.label} className="text-sm">
                <p className="text-gray-500">{detail.label}</p>
                <p className="font-medium text-gray-300">{detail.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};