import React, { useState } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { LabTypeSelector } from '../components/create/LabTypeSelector';
import { SingleVMWorkflow } from '../components/create/SingleVMWorkflow';
import { CloudSliceWorkflow } from '../components/create/CloudSliceWorkflow';
import { VMClusterWorkflow } from '../components/create/VMClusterWorkflow';
import { LabType } from '../types';

export const CreateLabEnvironment: React.FC = () => {
  const [selectedType, setSelectedType] = useState<LabType | null>(null);

  const handleLabCreated = (labData: any) => {
    console.log('Lab created with Guacamole config:', labData);
    // Ensure Guacamole configuration is included in the lab data
    if (labData.guacamole) {
      console.log('Guacamole Name:', labData.guacamole.name);
      console.log('Guacamole URL:', labData.guacamole.url);
    }
    // Handle successful lab creation
    // Navigate to lab list or show success message
  };

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
      case 'vm-cluster':
        return (
          <VMClusterWorkflow
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