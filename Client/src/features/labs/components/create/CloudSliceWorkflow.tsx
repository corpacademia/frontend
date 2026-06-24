import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { PlatformSelector } from './steps/PlatformSelector';
import { CloudProviderSelector } from './steps/CloudProviderSelector';
import { CloudSliceConfig } from './steps/CloudSliceConfig';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { DocumentUploader } from './steps/DocumentUploader';
import { ReviewAndSubmit } from './steps/ReviewAndSubmit';
import { ChevronLeft, ChevronRight, Building2, Globe, Loader, Check } from 'lucide-react';
import { useAuthStore } from '../../../../store/authStore';
import { useCloudCredentialsStore, CloudCredential } from '../../../../store/cloudCredentialsStore';

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
  const { user: authUser } = useAuthStore();
  const { globalCredentials, orgCredentials, isLoading: credsLoading, fetchGlobalCredentials, fetchOrgCredentials } = useCloudCredentialsStore();
  const [selectedCred, setSelectedCred] = useState<CloudCredential | null>(null);
  const [selectedSource, setSelectedSource] = useState<'org' | 'global'>('org');


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
      breadcrumbs.push({ label: 'Select Account', step: 6 });
    }

    breadcrumbs.push({ 
      label: 'Review & Submit', 
      step: labDetails?.isModular ? 5 : 7 
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
                    Select Lab Credentials
                  </label>
                  <select
                    value={selectedCloudId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCloudId(val);
                      if (!val) {
                        setSelectedCloudType('global');
                      } else {
                        setSelectedCloudType('organization');
                      }
                    }}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">GoLab Cloud (Default)</option>
                    {organizationClouds.filter((c: any) =>
                      !config.cloudProvider || c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase()
                    ).length > 0 && (
                      <optgroup label="Organization Credentials">
                        {organizationClouds
                          .filter((c: any) =>
                            !config.cloudProvider || c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase()
                          )
                          .map((cloud: any) => (
                            <option key={cloud.id} value={cloud.id}>
                              {cloud.name} ({cloud.provider?.toUpperCase()})
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>
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
        // Credential picker — non-modular labs only
        if (!labDetails?.isModular) {
          const cloudGlobal = globalCredentials.filter(c =>
            !c.org_id && (config.cloudProvider ? c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase() : true)
          );
          const cloudOrg = orgCredentials.filter(c =>
            config.cloudProvider ? c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase() : true
          );
          return (
            <div className="space-y-5">
              <div className="flex items-center space-x-4">
                <button onClick={handlePrevious} className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-white">Select Cloud Account</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Choose the account to provision your cloud slice on</p>
                </div>
              </div>
              {credsLoading ? (
                <div className="flex justify-center py-8"><Loader className="h-6 w-6 text-primary-400 animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {authUser?.role === 'superadmin' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-4 w-4 text-amber-400" />
                        <h4 className="text-sm font-medium text-gray-300">Global Credentials</h4>
                      </div>
                      {cloudGlobal.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-primary-500/20 rounded-lg">No global credentials configured.</p>
                      ) : (
                        <div className="space-y-2">
                          {cloudGlobal.map(cred => (
                            <button key={cred.id} onClick={() => { setSelectedCred(cred); setSelectedSource('global'); }}
                              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedCred?.id === cred.id ? 'border-primary-500/60 bg-primary-500/10' : 'border-primary-500/20 bg-dark-300/40 hover:border-primary-500/40'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-amber-500/10"><Globe className="h-4 w-4 text-amber-400" /></div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                    <p className="text-xs text-gray-400 uppercase">{cred.provider}</p>
                                  </div>
                                </div>
                                {selectedCred?.id === cred.id && <Check className="h-4 w-4 text-primary-400" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {(authUser?.role === 'orgsuperadmin' || authUser?.role === 'labadmin') && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4 text-primary-400" />
                          <h4 className="text-sm font-medium text-gray-300">Organization's Credentials</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300">Free</span>
                        </div>
                        {cloudOrg.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-primary-500/20 rounded-lg">No org credentials. Add them in Cloud Settings.</p>
                        ) : (
                          <div className="space-y-2">
                            {cloudOrg.map(cred => (
                              <button key={cred.id} onClick={() => { setSelectedCred(cred); setSelectedSource('org'); }}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedCred?.id === cred.id ? 'border-primary-500/60 bg-primary-500/10' : 'border-primary-500/20 bg-dark-300/40 hover:border-primary-500/40'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary-500/10"><Building2 className="h-4 w-4 text-primary-400" /></div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                      <p className="text-xs text-gray-400 uppercase">{cred.provider}</p>
                                    </div>
                                  </div>
                                  {selectedCred?.id === cred.id && <Check className="h-4 w-4 text-primary-400" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-primary-500/20" />
                        <span className="text-xs text-gray-500">or use GoLab Cloud</span>
                        <div className="flex-1 h-px bg-primary-500/20" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="h-4 w-4 text-amber-400" />
                          <h4 className="text-sm font-medium text-gray-300">GoLab Global Credentials</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300">⚡ Paid</span>
                        </div>
                        {cloudGlobal.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-amber-500/20 rounded-lg">No GoLab global credentials available.</p>
                        ) : (
                          <div className="space-y-2">
                            {cloudGlobal.map(cred => (
                              <button key={cred.id} onClick={() => { setSelectedCred(cred); setSelectedSource('global'); }}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedCred?.id === cred.id ? 'border-amber-500/60 bg-amber-500/10' : 'border-amber-500/20 bg-dark-300/40 hover:border-amber-500/40'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10"><Globe className="h-4 w-4 text-amber-400" /></div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                      <p className="text-xs text-gray-400 uppercase">{cred.provider}</p>
                                    </div>
                                  </div>
                                  {selectedCred?.id === cred.id && <Check className="h-4 w-4 text-amber-400" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-primary-500/10">
                <button onClick={handlePrevious}
                  className="flex items-center space-x-2 px-6 py-2 bg-dark-400/50 hover:bg-dark-300/50 text-gray-300 rounded-lg transition-colors">
                  <ChevronLeft className="h-4 w-4" /><span>Back</span>
                </button>
                <button onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white rounded-lg transition-all">
                  Continue to Review
                </button>
              </div>
            </div>
          );
        }
        return null;

      case 7:
        // Review & Submit — non-modular labs
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
        cloudCredentials: selectedCred || { type: 'global' }
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
        // const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(user);
        
          try {
            const cloudsResponse = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_credentials/organization/${user?.org_id}`
            );
            if (cloudsResponse.data.success) {
              setOrganizationClouds(cloudsResponse.data.credentials || []);
            }
          } catch (err) {
            console.error('Error fetching organization clouds:', err);
          }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }
    getUserDetails();
    // Fetch cloud credentials for credential picker
    if (authUser?.role === 'superadmin') {
      fetchGlobalCredentials();
    } else if (authUser?.org_id) {
      fetchGlobalCredentials();
      fetchOrgCredentials(authUser.org_id);
    }
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