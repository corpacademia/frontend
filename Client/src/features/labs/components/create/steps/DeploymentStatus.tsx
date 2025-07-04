import React, { useState, useEffect } from 'react';
import { Terminal, Check, Loader, XCircle } from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../../store/authStore';
import axios from 'axios';

interface DeploymentStatusProps {
  config: any;
}

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({ config }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const steps = [
    { id: 'EC2', label: 'Terraform Setup' },
    { id: 'Terraform', label: 'Terraform Initialization' },
    { id: 'Terraform Apply', label: 'Terraform Applying' },
    { id: 'complete', label: 'Setup Complete' }
  ];
  // Function to check script execution status
  const fetchProgress = async () => {
    try {
      const data = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/labprogress`,{
        lab_id: config.lab_id,
      });
      let step =0;
      if (data.data.data.step1) step = 1;
      if (data.data.data.step2) step = 2;
      if (data.data.data.step3) step = 3;
      
      setCurrentStep(step);
      // If all steps are complete, set isComplete to true
      if (step === 3) {
        setIsComplete(true);
        // Navigate to the appropriate Cloud VMs page after a short delay
        setTimeout(() => {
          const route = user?.role === 'superadmin' 
            ? '/dashboard/labs/cloud-vms' 
            : '/dashboard/labs/cloud-vms';
          navigate(route);
        }, 2000);
      }
    } catch (err) {
      setError('Failed to fetch deployment progress.');
    }
  };

  // Poll API every 3 seconds to update progress
  useEffect(() => {
    const interval = setInterval(fetchProgress, 3000);
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

        {isComplete && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-200">
                Deployment completed successfully! Redirecting to Cloud VMs page...
              </span>
            </div>
          </div>
        )}

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