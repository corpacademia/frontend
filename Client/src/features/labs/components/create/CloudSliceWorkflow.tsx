import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { PlatformSelector } from './steps/PlatformSelector';
import { CloudProviderSelector } from './steps/CloudProviderSelector';
import { CloudSliceConfig } from './steps/CloudSliceConfig';
import { LabDetailsInput } from './steps/LabDetailsInput';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CloudSliceWorkflowProps {
  onBack: () => void;
}

interface Service {
  name: string;
  category: string;
  description: string;
  services_prefix:string;
}

interface AwsService {
  name: string;
  category: string;
  description: string;
  services_prefix:string;
}

interface CategorizedServices {
  [category: string]: AwsService[];
}

export const CloudSliceWorkflow: React.FC<CloudSliceWorkflowProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [labDetails, setLabDetails] = useState<{
    title: string;
    description: string;
    duration: number;
    platform?: string;
    cloudProvider?: string;
  } | null>(null);
  const [awsServices, setAwsServices] = useState<AwsService[]>([]);

  const [config, setConfig] = useState({
    platform: '',
    cloudProvider: '',
    region: '',
    services: [],
    duration: {
      start: '',
      end: ''
    },
    cleanupPolicy: '1'
  });

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    // Update labDetails with platform and provider information
    if (updates.platform || updates.cloudProvider) {
      setLabDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          platform: updates.platform || prev.platform,
          cloudProvider: updates.cloudProvider || prev.cloudProvider
        };
      });
    }
    
    setStep(prev => prev + 1);
  };

  const handleLabDetails = (details: { title: string; description: string; duration: number }) => {
    setLabDetails(details);
    setStep(prev => prev + 1);
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Lab Types', step: 0 },
      { label: 'Lab Details', step: 1 },
      { label: 'Platform Selection', step: 2 },
      { label: 'Cloud Provider', step: 3 },
      { label: 'Service Configuration', step: 4 }
    ];

    return breadcrumbs.slice(0, step + 1);
  };

  const handleNavigate = (targetStep: number) => {
    if (targetStep === 0) {
      onBack();
    } else if (targetStep < step) {
      setStep(targetStep);
    }
  };
  const renderStep = () => {
    switch (step) {
      case 1:
        return <LabDetailsInput onNext={handleLabDetails} type="cloudslice"/>;
      case 2:
        return <PlatformSelector onSelect={(platform) => updateConfig({ platform })} />;
      case 3:
        return <CloudProviderSelector onSelect={(provider) => updateConfig({ cloudProvider: provider })} />;
      case 4:
        return labDetails ? (
          <CloudSliceConfig 
            onBack={() => setStep(3)}
            labDetails={labDetails}
            awsServiceCategories = {awsServices}
          />
        ) : null;
      default:
        return null;
    }
  };

 //extract the aws services
 const extractAwsServices = async (awsServices: { services: string; description: string; category: string;services_prefix:string }[]): Promise<CategorizedServices> => {
  const servicess: CategorizedServices = {};
  awsServices.forEach(({ services, description, category ,services_prefix}) => {
    if (servicess[category]) {
      servicess[category].push({ name: services, category: category, description: description ,services_prefix:services_prefix});
    } else {
      servicess[category] = [{ name: services, category: category, description: description,services_prefix:services_prefix }];
    }
  });

  return servicess;
};

  useEffect(()=>{
    const getAwsServices = async () =>{
      try {
        const fetch = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getAwsServices`);
        const awsServiceCategories = await extractAwsServices(fetch.data.data);
    
        setAwsServices(awsServiceCategories);
      } catch (error) {
        console.log(error);
      }
    }
    getAwsServices();
  },[])

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

      {renderStep()}
    </div>
  );
};