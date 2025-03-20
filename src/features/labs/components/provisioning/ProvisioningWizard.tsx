import React, { useState } from 'react';
import { LabType } from '../../types';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  Settings, 
  Server, 
  Network, 
  CreditCard,
  ChevronRight,
  Check 
} from 'lucide-react';

interface ProvisioningWizardProps {
  type: LabType;
  onComplete: (config: any) => void;
  onCancel: () => void;
}

const steps = [
  { id: 'config', label: 'Configuration', icon: Settings },
  { id: 'resources', label: 'Resources', icon: Server },
  { id: 'network', label: 'Networking', icon: Network },
  { id: 'review', label: 'Review', icon: CreditCard }
];

export const ProvisioningWizard: React.FC<ProvisioningWizardProps> = ({
  type,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState('config');
  const [config, setConfig] = useState({});

  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    } else {
      onComplete(config);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-4xl p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold">
            <GradientText>Provision New Lab Environment</GradientText>
          </h2>
        </div>

        <div className="flex mb-8">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className="flex items-center"
            >
              <div className={`flex items-center ${
                currentStep === step.id 
                  ? 'text-primary-400' 
                  : 'text-gray-500'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step.id 
                    ? 'bg-primary-500/20 border-2 border-primary-500' 
                    : 'bg-dark-300'
                }`}>
                  {step.icon && <step.icon className="h-4 w-4" />}
                </div>
                <span className="ml-2 text-sm font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-4 text-gray-600" />
              )}
            </div>
          ))}
        </div>

        <div className="mb-8">
          {/* Step content goes here */}
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={handleNext}
            className="btn-primary"
          >
            {currentStep === 'review' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 mr-2" />
                Next
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};