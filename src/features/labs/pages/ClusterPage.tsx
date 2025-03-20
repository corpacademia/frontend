import React from 'react';
import { ClusterFilters } from '../components/cluster/ClusterFilters';
import { ClusterList } from '../components/cluster/ClusterList';
import { ClusterProvisionForm } from '../components/cluster/ClusterProvisionForm';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus } from 'lucide-react';

export const ClusterPage: React.FC = () => {
  const [isProvisioning, setIsProvisioning] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Clustered Lab Environments</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Multi-VM lab environments with consistent networking
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setIsProvisioning(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Cluster
        </button>
      </div>

      <ClusterFilters />
      <ClusterList />

      {isProvisioning && (
        <ClusterProvisionForm onClose={() => setIsProvisioning(false)} />
      )}
    </div>
  );
};