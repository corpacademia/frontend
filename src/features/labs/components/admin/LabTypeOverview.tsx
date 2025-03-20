import React from 'react';
import { LabType } from '../../types';
import { 
  Users, 
  Clock, 
  Activity,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface LabTypeMetrics {
  activeUsers: number;
  averageUsage: number;
  uptime: number;
  incidents: number;
  costTrend: number;
}

interface LabTypeOverviewProps {
  type: LabType;
  metrics: LabTypeMetrics;
}

export const LabTypeOverview: React.FC<LabTypeOverviewProps> = ({
  type,
  metrics
}) => {
  return (
    <div className="glass-panel">
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Users</span>
            <Users className="h-4 w-4 text-primary-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {metrics.activeUsers}
          </p>
        </div>

        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Usage</span>
            <Activity className="h-4 w-4 text-accent-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {metrics.averageUsage}%
          </p>
        </div>

        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Uptime</span>
            <Clock className="h-4 w-4 text-secondary-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {metrics.uptime}%
          </p>
        </div>

        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Incidents</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {metrics.incidents}
          </p>
        </div>

        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Cost Trend</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {metrics.costTrend}%
          </p>
        </div>
      </div>
    </div>
  );
};