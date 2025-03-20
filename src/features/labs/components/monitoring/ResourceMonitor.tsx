import React from 'react';
import { 
  Cpu, 
  HardDrive, 
  Activity,
  Network,
  AlertTriangle 
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  alerts: {
    level: 'warning' | 'critical';
    message: string;
  }[];
}

interface ResourceMonitorProps {
  instanceId: string;
  metrics: ResourceMetrics;
}

export const ResourceMonitor: React.FC<ResourceMonitorProps> = ({
  instanceId,
  metrics
}) => {
  return (
    <div className="glass-panel space-y-6">
      <h2 className="text-lg font-semibold">
        <GradientText>Resource Monitor</GradientText>
      </h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">CPU Usage</span>
            <Cpu className="h-4 w-4 text-primary-400" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-gray-200">
              {metrics.cpu}%
            </p>
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics.cpu}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Memory</span>
            <Activity className="h-4 w-4 text-secondary-400" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-gray-200">
              {metrics.memory}%
            </p>
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics.memory}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Disk I/O</span>
            <HardDrive className="h-4 w-4 text-accent-400" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-gray-200">
              {metrics.disk}%
            </p>
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics.disk}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Network</span>
            <Network className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">In:</span>
              <span className="text-gray-300">{metrics.network.in} MB/s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Out:</span>
              <span className="text-gray-300">{metrics.network.out} MB/s</span>
            </div>
          </div>
        </div>
      </div>

      {metrics.alerts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Active Alerts</span>
          </div>
          <div className="space-y-2">
            {metrics.alerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  alert.level === 'critical' 
                    ? 'bg-red-500/10 border border-red-500/20' 
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                <p className={`text-sm ${
                  alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};