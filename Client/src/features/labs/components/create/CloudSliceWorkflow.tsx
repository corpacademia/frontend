import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { PlatformSelector } from './steps/PlatformSelector';
import { CloudProviderSelector } from './steps/CloudProviderSelector';
import { CloudSliceConfig } from './steps/CloudSliceConfig';
import { LabDetailsInput } from './steps/LabDetailsInput';
import { DocumentUploader } from './steps/DocumentUploader';
import { ReviewAndSubmit } from './steps/ReviewAndSubmit';
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
  const [documents, setDocuments] = useState<File[]>([]);
  const [userGuides, setUserGuides] = useState<File[]>([]);


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

  const getSteps = () => {
    const baseSteps = [
      { id: 1, title: 'Lab Type', component: 'type' },
      { id: 2, title: 'Basic Details', component: 'details' },
      { id: 3, title: 'Configuration', component: 'config' }
    ];

    if (!labDetails?.isModular) { // Use optional chaining here
      baseSteps.push({ id: 4, title: 'Documents', component: 'documents' });
    }

    baseSteps.push({ 
      id: labDetails?.isModular ? 4 : 5, // Use optional chaining here
      title: 'Review & Submit', 
      component: 'review' 
    });

    return baseSteps;
  };

  const steps = getSteps();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDocumentsChange = (docs: File[]) => {
    setDocuments(docs);
  };

  const handleUserGuidesChange = (guides: File[]) => {
    setUserGuides(guides);
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
            onNext={handleNext} // Pass handleNext here
          />
        ) : null;
      case 5: // This case handles the Documents step
        if (!labDetails?.isModular) {
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Lab Documents</h2>
                  <p className="text-gray-400">Upload documents and user guides for your lab</p>
                </div>
              </div>

              <DocumentUploader
                onDocumentsChange={handleDocumentsChange}
                onUserGuidesChange={handleUserGuidesChange}
                onNext={handleNext}
              />

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="btn-secondary"
                >
                  Previous
                </button>
              </div>
            </div>
          );
        } else {
          // If modular, skip the document step and go to review
          handleNext(); // Automatically advance if modular
          return null; // Or render a loading indicator/placeholder
        }
      case 6: // This case handles the Review & Submit step
        return (
          <ReviewAndSubmit
            data={labData} // This should be the combined data from all steps
            documents={documents}
            userGuides={userGuides}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
          />
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    // Combine all data
    const completeLabData = {
      ...labDetails,
      ...config,
      ...labData, // labData might contain other fields like isModular
      documents: documents,
      userGuides: userGuides
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/create`, completeLabData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Lab created successfully:', response.data);
      // Redirect or show success message
    } catch (error) {
      console.error('Error creating lab:', error);
      // Show error message
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