import React from 'react';
import { CloudProvider } from '../../types';

interface CloudProviderUsageProps {
  providers: CloudProvider[];
}

export const CloudProviderUsage: React.FC<CloudProviderUsageProps> = ({ providers }) => {
  return (
    <div className="glass-panel">
      <h2 className="text-xl font-display font-bold mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
        Cloud Provider Usage
      </h2>
      
      <div className="space-y-6">
        {providers.map((provider) => (
          <div key={provider.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-300">
                  {provider.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({provider.resourceCount} resources)
                </span>
              </div>
              <span className="text-sm font-medium text-primary-400">
                ${provider.cost.toLocaleString()}
              </span>
            </div>
            
            <div className="relative h-2 bg-dark-400 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                style={{ width: `${provider.utilizationPercentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
              <div>
                <span className="block text-gray-400">CPU Usage</span>
                <span>{provider.metrics.cpu}%</span>
              </div>
              <div>
                <span className="block text-gray-400">Memory</span>
                <span>{provider.metrics.memory}%</span>
              </div>
              <div>
                <span className="block text-gray-400">Storage</span>
                <span>{provider.metrics.storage}TB</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};