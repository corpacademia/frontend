import React, { useState } from 'react';
import { PlatformSelector } from './steps/PlatformSelector';
import { CloudProviderSelector } from './steps/CloudProviderSelector';
import { VMSizeSelector } from './steps/VMSizeSelector';
import { AIRecommendations } from './steps/AIRecommendations';
import { DeploymentStatus } from './steps/DeploymentStatus';
import { LabDetailsInput } from './steps/LabDetailsInput';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SingleVMWorkflowProps {
  onBack: () => void;
}

export const SingleVMWorkflow: React.FC<SingleVMWorkflowProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    duration: 60,
    platform: '',
    cloudProvider: '',
    vmSize: null,
    region: '',
  });

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setStep(prev => prev + 1);
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Lab Types', step: 0 },
      { label: 'Lab Details', step: 1 },
      { label: 'Platform Selection', step: 2 },
    ];

    if (step >= 3 && config.platform === 'cloud') {
      breadcrumbs.push({ label: 'Cloud Provider', step: 3 });
    }

    if (step >= 4) {
      breadcrumbs.push({ label: 'VM Configuration', step: 4 });
    }

    if (step >= 5) {
      breadcrumbs.push({ label: 'AI Recommendations', step: 5 });
    }

    if (step >= 6) {
      breadcrumbs.push({ label: 'Deployment', step: 6 });
    }

    return breadcrumbs.slice(0, step + 1);
  };

  const handleNavigate = (targetStep: number) => {
    if (targetStep === 0) {
      onBack();
    } else if (targetStep < step) {
      setStep(targetStep);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap gap-2 text-gray-400">
        {getBreadcrumbs().map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            <button
              onClick={() => handleNavigate(item.step)}
              className={`flex items-center ${
                item.step < step 
                  ? 'text-primary-400 hover:text-primary-300' 
                  : 'text-gray-300'
              } transition-colors`}
            >
              {item.step === 0 && <ChevronLeft className="h-4 w-4 mr-1" />}
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <LabDetailsInput 
          onNext={(details) => updateConfig(details)} 
        />
      )}
      {step === 2 && (
        <PlatformSelector 
          onSelect={(platform) => updateConfig({ platform })} 
        />
      )}
      {step === 3 && config.platform === 'cloud' && (
        <CloudProviderSelector 
          onSelect={(provider) => updateConfig({ cloudProvider: provider })} 
        />
      )}
      {step === 4 && (
        <VMSizeSelector 
          onSelect={(size) => updateConfig({ vmSize: size })} 
        />
      )}
      {step === 5 && (
        <AIRecommendations 
          config={config} 
          onConfirm={(region) => updateConfig({ region })} 
        />
      )}
      {step === 6 && <DeploymentStatus config={config} />}
    </div>
  );
};