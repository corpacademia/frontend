import React from 'react';
import { useNavigate } from 'react-router-dom'
import { ClusterList } from '../components/cluster/ClusterList';
import { ProxmoxClusterList } from '../components/proxmox/ProxmoxClusterList';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus } from 'lucide-react';

export const ClusterPage: React.FC = () => {
  const [isProvisioning, setIsProvisioning] = React.useState(false);
  const navigate = useNavigate();
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
          className="btn-primary text-gray-200"
          onClick={() => navigate('/dashboard/labs/create')}
        >
          <Plus className="h-4 w-4 mr-2 text-gray-200" />
          New Cluster
        </button>
      </div>

      <ClusterList />

      <div className="mt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold">
            <GradientText>Proxmox VM Cluster Labs</GradientText>
          </h2>
          <p className="mt-1 text-gray-400">
            Multi-VM Proxmox environments — each user gets their own set of cloned VMs
          </p>
        </div>
        <ProxmoxClusterList />
      </div>
    </div>
  );
};