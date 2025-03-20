import React from 'react';
import { CloudSliceFilters } from '../components/cloudslice/CloudSliceFilters';
import { CloudSliceList } from '../components/cloudslice/CloudSliceList';
import { CloudSliceProvisionForm } from '../components/cloudslice/CloudSliceProvisionForm';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus } from 'lucide-react';

export const CloudSlicePage: React.FC = () => {
  const [isProvisioning, setIsProvisioning] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Cloud Slice Environments</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Managed cloud accounts with AI-optimized resource allocation
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setIsProvisioning(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Cloud Slice
        </button>
      </div>

      <CloudSliceFilters />
      <CloudSliceList />

      {isProvisioning && (
        <CloudSliceProvisionForm onClose={() => setIsProvisioning(false)} />
      )}
    </div>
  );
};