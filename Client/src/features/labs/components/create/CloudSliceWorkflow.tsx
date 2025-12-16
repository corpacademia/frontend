import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { PlatformSelector } from './steps/PlatformSelector';
import { CloudProviderSelector } from './steps/CloudProviderSelector';
import { CloudSliceConfig } from './steps/CloudSliceConfig';
import { BasicInfoStep } from './steps/BasicInfoStep';
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
    isModular?: boolean;
  } | null>(null);
  const [awsServices, setAwsServices] = useState<AwsService[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [userGuides, setUserGuides] = useState<File[]>([]);
  const [labData, setLabData] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [selectedCloudType, setSelectedCloudType] = useState<'global' | 'organization'>('global');
  const [selectedCloudId, setSelectedCloudId] = useState<string>('');
  const [organizationClouds, setOrganizationClouds] = useState<any[]>([]);


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

  const handleLabDetails = (details: { title: string; description: string; duration: number; isModular?: boolean }) => {
    setLabDetails(details);
    setLabData(prev => ({ ...prev, ...details }));
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

    if (!labDetails?.isModular) {
      breadcrumbs.push({ label: 'Documents', step: 5 });
    }

    breadcrumbs.push({ 
      label: 'Review & Submit', 
      step: labDetails?.isModular ? 5 : 6 
    });

    return breadcrumbs.slice(0, step + 1);
  };

  const handleNavigate = (targetStep: number) => {
    if (targetStep === 0) {
      onBack();
    } else if (targetStep < step) {
      setStep(targetStep);
    }
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
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
        return <BasicInfoStep onNext={handleLabDetails} type="cloudslice"/>;
      case 2:
        return <PlatformSelector onSelect={(platform) => updateConfig({ platform })} />;
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Select Cloud Provider
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cloud Type
                  </label>
                  <select
                    value={selectedCloudType}
                    onChange={(e) => handleCloudTypeChange(e.target.value as 'global' | 'organization')}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="global">Global Cloud (GoLab Cloud)</option>
                    {organizationClouds.length > 0 && (
                      <option value="organization">Organization Cloud</option>
                    )}
                  </select>
                </div>
                {config.cloudProvider && getFilteredCloudsByProvider().length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Cloud Configuration
                    </label>
                    <select
                      value={selectedCloudId}
                      onChange={(e) => setSelectedCloudId(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Use GoLab Cloud (Default)</option>
                      {getFilteredCloudsByProvider().map((cloud: any) => (
                        <option key={cloud.id} value={cloud.id}>
                          {cloud.name} ({cloud.provider.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {config.cloudProvider && getFilteredCloudsByProvider().length === 0 && selectedCloudType === 'organization' && (
                  <div className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                    <p className="text-sm text-yellow-200">
                      No organization clouds configured for {config.cloudProvider?.toUpperCase()}. Using GoLab Cloud.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <CloudProviderSelector 
              onSelect={(provider) => {
                updateConfig({ cloudProvider: provider });
                (window as any).resetCloudSelection = () => {
                  setSelectedCloudId('');
                  setSelectedCloudType('global');
                };
              }} 
            />
          </div>
        );
      case 4:
        return labDetails ? (
          <CloudSliceConfig 
            onBack={() => setStep(3)}
            labDetails={labDetails}
            awsServiceCategories = {awsServices}
            onNext={() => {
              // Store config data and move to next step
              setLabData(prev => ({ ...prev, ...config }));
              handleNext();
            }}
          />
        ) : null;
      case 5:
        // Documents step - only show for non-modular labs
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
          // For modular labs, this step should not be reached due to direct navigation
          return null;
        }
      case 6:
        // Review step for non-modular labs only
        return (
          <ReviewAndSubmit
            data={{ ...labDetails, ...config, ...labData }}
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
    try {
      const selectedCloud = selectedCloudId 
        ? organizationClouds.find((cloud: any) => cloud.id === selectedCloudId)
        : null;

      // Combine all data
      const completeLabData = {
        ...labDetails,
        ...config,
        ...labData,
        documents: documents,
        userGuides: userGuides,
        cloudCredentials: selectedCloud || { type: 'global' }
      };

      // For modular labs, navigate to modules creation page
      if (labDetails?.isModular) {
        // Store lab config in sessionStorage for the modules page
        sessionStorage.setItem('labConfig', JSON.stringify(completeLabData));
        // Navigate to CreateModulesPage with lab config
        window.location.href = `/dashboard/labs/create-modules?labType=cloudslice`;
        return;
      }

      // For non-modular labs, create the lab directly
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/create`, completeLabData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data.success) {
        console.log('Lab created successfully:', response.data);
        // Redirect or show success message
        onBack(); // Go back to lab list
      } else {
        throw new Error(response.data.message || 'Failed to create lab');
      }
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

  const handleCloudTypeChange = (type: 'global' | 'organization') => {
    setSelectedCloudType(type);
    setSelectedCloudId('');
  };

  const getFilteredCloudsByProvider = () => {
    if (!config.cloudProvider) return [];
    return organizationClouds.filter(
      (cloud: any) => cloud.provider.toLowerCase() === config.cloudProvider.toLowerCase()
    );
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

    const getUserDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(response.data.user);
        
        if (response.data.user?.org_id) {
          try {
            const cloudsResponse = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_credentials/organization/${response.data.user.org_id}`
            );
            if (cloudsResponse.data.success) {
              setOrganizationClouds(cloudsResponse.data.credentials || []);
            }
          } catch (err) {
            console.error('Error fetching organization clouds:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }
    getUserDetails();
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