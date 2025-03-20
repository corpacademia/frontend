import React from 'react';
import { ActivityItem } from '../../types';
import { UserPlus, AlertCircle, ShoppingCart, Clock } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'signup':
        return <UserPlus className="h-5 w-5 text-primary-400" />;
      case 'approval':
        return <Clock className="h-5 w-5 text-secondary-400" />;
      case 'purchase':
        return <ShoppingCart className="h-5 w-5 text-accent-400" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusBadge = (status?: ActivityItem['status']) => {
    if (!status) return null;
    
    const styles = {
      pending: 'bg-secondary-500/20 text-secondary-300',
      completed: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-display font-bold mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
        Recent Activity
      </h2>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 rounded-lg bg-dark-300/50 hover:bg-dark-300 transition-colors"
          >
            <div className="flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">{activity.title}</p>
                {getStatusBadge(activity.status)}
              </div>
              <p className="text-sm text-gray-400 mt-1">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};