import React from 'react';
import { useNavigate } from 'react-router-dom'
import { ClusterList } from '../components/cluster/ClusterList';
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
          className="btn-primary"
          onClick={() => navigate('/dashboard/labs/create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Cluster
        </button>
      </div>

      <ClusterList />
    </div>
  );
};