import React, { useState } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { LabTypeSelector } from '../components/create/LabTypeSelector';
import { SingleVMWorkflow } from '../components/create/SingleVMWorkflow';
import { CloudSliceWorkflow } from '../components/create/CloudSliceWorkflow';
import { LabType } from '../types';

export const CreateLabEnvironment: React.FC = () => {
  const [selectedType, setSelectedType] = useState<LabType | null>(null);

  const renderWorkflow = () => {
    if (!selectedType) {
      return <LabTypeSelector onSelect={setSelectedType} />;
    }

    switch (selectedType) {
      case 'single-vm':
        return (
          <SingleVMWorkflow 
            onBack={() => setSelectedType(null)}
          />
        );
      case 'cloud-slice':
        return (
          <CloudSliceWorkflow 
            onBack={() => setSelectedType(null)}
          />
        );
      default:
        return null;
    }
  };

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

      {renderWorkflow()}
    </div>
  );
};