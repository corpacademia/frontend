import React from 'react';
import { UserPlus, Award, ShoppingCart } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

interface Activity {
  id: string;
  type: 'signup' | 'approval' | 'purchase';
  title: string;
  description: string;
  timestamp: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'signup',
    title: 'New Enterprise Registration',
    description: 'TechCorp Solutions registered as an enterprise customer',
    timestamp: '5 minutes ago'
  },
  {
    id: '2',
    type: 'approval',
    title: 'Trainer Approval Pending',
    description: 'John Doe requested trainer status upgrade',
    timestamp: '15 minutes ago'
  },
  {
    id: '3',
    type: 'purchase',
    title: 'Bulk Lab Purchase',
    description: 'EduTech Institute purchased 50 lab licenses',
    timestamp: '1 hour ago'
  }
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'signup':
      return <UserPlus className="h-5 w-5 text-primary-400" />;
    case 'approval':
      return <Award className="h-5 w-5 text-accent-400" />;
    case 'purchase':
      return <ShoppingCart className="h-5 w-5 text-secondary-400" />;
  }
};

export const RecentActivity: React.FC = () => {
  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold mb-6">
        <GradientText>Recent Activity</GradientText>
      </h2>
      <div className="space-y-4">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 rounded-lg bg-dark-300/50 hover:bg-dark-300 transition-colors"
          >
            {getActivityIcon(activity.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">{activity.title}</p>
              <p className="text-sm text-gray-400">{activity.description}</p>
            </div>
            <span className="text-xs text-gray-500">{activity.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};