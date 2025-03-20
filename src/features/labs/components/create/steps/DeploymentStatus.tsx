import React, { useState, useEffect } from 'react';
import { Terminal, Check, Loader, XCircle } from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';

interface DeploymentStatusProps {
  config: any;
}

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({ config }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 'EC2', label: 'Terraform Setup'},
    { id: 'Terraform ', label: 'Terraform Initialization' },
    { id: 'Terrafrom Apply', label: 'Terrafrom Applying' },
    { id: 'complete', label: 'Setup Complete' }
  ];

  useEffect(() => {
    // Simulate deployment progress
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>Deploying Lab Environment</GradientText>
      </h2>

      <div className="glass-panel">
        <div className="flex items-center space-x-2 mb-6">
          <Terminal className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-200">
            Deployment Progress
          </h3>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            const isFuture = index > currentStep;

            return (
              <div 
                key={step.id}
                className={`flex items-center space-x-3 p-4 rounded-lg ${
                  isActive ? 'bg-primary-500/10 border border-primary-500/20' :
                  isComplete ? 'bg-dark-300/50' : 'bg-dark-300/30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isComplete ? 'bg-emerald-500/20 text-emerald-400' :
                  isActive ? 'bg-primary-500/20 text-primary-400' :
                  'bg-dark-400/50 text-gray-500'
                }`}>
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <span className={`flex-1 ${
                  isFuture ? 'text-gray-500' : 'text-gray-200'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};