
import React from 'react';
import { Cloud, Server, HardDrive } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

export const CloudUsage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <GradientText>Cloud Usage</GradientText>
        </h1>
        <p className="text-gray-400">Monitor your cloud resource usage and costs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Cloud className="h-12 w-12 text-primary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Cloud Resources</h3>
          <p className="text-gray-400">Overview of your cloud resource allocation</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Server className="h-12 w-12 text-secondary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Instance Usage</h3>
          <p className="text-gray-400">Track VM and container instance usage</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <HardDrive className="h-12 w-12 text-accent-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Storage Usage</h3>
          <p className="text-gray-400">Monitor storage consumption and costs</p>
        </div>
      </div>
    </div>
  );
};
