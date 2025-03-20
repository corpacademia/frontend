import React, { useState } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { LabTypeSelector } from '../components/create/LabTypeSelector';
import { SingleVMWorkflow } from '../components/create/SingleVMWorkflow';
import { LabType } from '../types';

export const CreateLabEnvironment: React.FC = () => {
  const [selectedType, setSelectedType] = useState<LabType | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Create Lab Environment</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Configure and provision new lab environments
          </p>
        </div>
      </div>

      {!selectedType ? (
        <LabTypeSelector onSelect={setSelectedType} />
      ) : (
        <>
          {selectedType === 'single-vm' && (
            <SingleVMWorkflow onBack={() => setSelectedType(null)} />
          )}
          {/* Add other workflow components for different lab types */}
        </>
      )}
    </div>
  );
};