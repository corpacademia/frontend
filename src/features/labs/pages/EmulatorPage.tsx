import React from 'react';
import { EmulatorFilters } from '../components/emulator/EmulatorFilters';
import { EmulatorList } from '../components/emulator/EmulatorList';
import { EmulatorProvisionForm } from '../components/emulator/EmulatorProvisionForm';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus } from 'lucide-react';

export const EmulatorPage: React.FC = () => {
  const [isProvisioning, setIsProvisioning] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Network Emulation Labs</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Virtual network and security lab environments
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setIsProvisioning(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Environment
        </button>
      </div>

      <EmulatorFilters />
      <EmulatorList />

      {isProvisioning && (
        <EmulatorProvisionForm onClose={() => setIsProvisioning(false)} />
      )}
    </div>
  );
};