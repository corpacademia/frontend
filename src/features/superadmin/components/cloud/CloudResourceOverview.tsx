import React from 'react';
import { Cloud, Server, Database, Cpu } from 'lucide-react';
import { CloudMetrics } from '../../types';

interface CloudResourceOverviewProps {
  metrics: CloudMetrics;
}

export const CloudResourceOverview: React.FC<CloudResourceOverviewProps> = ({ metrics }) => {
  const resources = [
    {
      title: 'Total Resources',
      value: metrics.totalResources,
      icon: Cloud,
      change: '+5%',
      details: [
        { label: 'Active', value: metrics.activeResources },
        { label: 'Idle', value: metrics.idleResources }
      ]
    },
    {
      title: 'Compute Usage',
      value: `${metrics.compute.usage}%`,
      icon: Cpu,
      change: '+12%',
      details: [
        { label: 'vCPUs', value: metrics.compute.vcpus },
        { label: 'RAM', value: `${metrics.compute.ram}GB` }
      ]
    },
    {
      title: 'Storage Usage',
      value: `${metrics.storage.used}TB`,
      icon: Database,
      change: '-3%',
      details: [
        { label: 'Total', value: `${metrics.storage.total}TB` },
        { label: 'Available', value: `${metrics.storage.available}TB` }
      ]
    },
    {
      title: 'Network Usage',
      value: `${metrics.network.bandwidth}Gbps`,
      icon: Server,
      change: '+8%',
      details: [
        { label: 'Ingress', value: `${metrics.network.ingress}TB` },
        { label: 'Egress', value: `${metrics.network.egress}TB` }
      ]
    }
  ];

  return (
    <div className="dashboard-grid">
      {resources.map((resource) => (
        <div key={resource.title} className="data-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{resource.title}</p>
              <p className="stat-value mt-2">{resource.value}</p>
              <span className={`inline-flex items-center text-sm mt-1 ${
                resource.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
              }`}>
                {resource.change}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary-500/10 to-secondary-500/10 group-hover:from-primary-500/20 group-hover:to-secondary-500/20 transition-colors">
              <resource.icon className="h-6 w-6 text-primary-400 group-hover:text-primary-300 transition-colors" />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            {resource.details.map((detail) => (
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