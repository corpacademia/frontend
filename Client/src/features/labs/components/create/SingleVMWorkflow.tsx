import React, { useState, useRef, useEffect } from 'react';
import { PlatformSelector } from './steps/PlatformSelector';
import { CloudProviderSelector } from './steps/CloudProviderSelector';
import { VMSizeSelector } from './steps/VMSizeSelector';
import { AIRecommendations } from './steps/AIRecommendations';
import { DeploymentStatus } from './steps/DeploymentStatus';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { DocumentUploader } from './steps/DocumentUploader';
import { DatacenterConfig } from './steps/DatacenterConfig';
import { ProxmoxConfig } from './steps/ProxmoxConfig';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import axios from 'axios';
import { GuacamoleConfig } from './GuacamoleConfig';
import { GradientText } from '../../../../components/ui/GradientText';

interface SingleVMWorkflowProps {
  onBack: () => void;
}

export const SingleVMWorkflow: React.FC<SingleVMWorkflowProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>({});
  const [selectedCloudType, setSelectedCloudType] = useState<'global' | 'organization'>('global');
  const [organizationClouds, setOrganizationClouds] = useState<any[]>([]);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    duration: 60,
    platform: '',
    cloudProvider: '',
    cloudType: 'global',
    vmSize: null,
    region: '',
    documents: [] as File[],
    userGuides: [] as File[],
    datacenter: {
      numberOfUsers: 1,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      protocol: 'rdp',
      users: [{ ip: '', port: '3389', username: '', password: '' }]
    },
    guacamole: {
      name: '',
      url: ''
    },
    proxmox: {
      vmId: '',
      name: '',
      description: '',
      node: '',
      storage: '',
      storageSize: 50,
      iso: '',
      isoType: '',
      isoVersion: '',
      cores: 1,
      memoryMB: 512,
      networkBridge: '',
      onBoot: false
    }
  });
  useEffect(() => {
    const getUserDetails = async () => {  
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(response.data.user);
        
        // Fetch organization cloud settings if user belongs to an organization
        if (response.data.user?.org_id) {
          try {
            const cloudResponse = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_ms/organization-clouds/${response.data.user.org_id}`
            );
            if (cloudResponse.data.success) {
              setOrganizationClouds(cloudResponse.data.clouds || []);
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
  }, []);

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates, cloudType: selectedCloudType }));
    setStep(prev => prev + 1);
  };

  const handleCloudTypeChange = (type: 'global' | 'organization') => {
    setSelectedCloudType(type);
    setConfig(prev => ({ ...prev, cloudType: type }));
  };
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Lab Types', step: 0 },
      { label: 'Lab Details', step: 1 },
      { label: 'Platform Selection', step: 2 },
    ];

    if (step >= 3) {
      if (config.platform === 'cloud') {
        breadcrumbs.push({ label: 'Cloud Provider', step: 3 });
      } else if (config.platform === 'datacenter') {
        breadcrumbs.push({ label: 'Datacenter Config', step: 3 });
      } else if (config.platform === 'proxmox') {
        breadcrumbs.push({ label: 'Proxmox Config', step: 3 });
      }
    }

    if (step >= 4) {
      if (config.platform === 'cloud') {
        breadcrumbs.push({ label: 'VM Configuration', step: 4 });
      } else if (config.platform === 'datacenter') {
        breadcrumbs.push({ label: 'Documents', step: 4 });
      } else if (config.platform === 'proxmox') {
        breadcrumbs.push({ label: 'Documents', step: 4 });
      } else {
        breadcrumbs.push({ label: 'VM Configuration', step: 4 });
      }
    }

    if (step >= 5) {
      if (config.platform === 'cloud') {
        breadcrumbs.push({ label: 'Documents', step: 5 });
      } else if (config.platform === 'datacenter') {
        breadcrumbs.push({ label: 'AI Recommendations', step: 5 });
      } else if (config.platform === 'proxmox') {
        breadcrumbs.push({ label: 'AI Recommendations', step: 5 });
      } else {
        breadcrumbs.push({ label: 'Documents', step: 5 });
      }
    }

    if (step >= 6) {
      if (config.platform === 'cloud') {
        breadcrumbs.push({ label: 'AI Recommendations', step: 6 });
      } else if (config.platform === 'datacenter') {
        breadcrumbs.push({ label: 'Deployment', step: 6 });
      } else if (config.platform === 'proxmox') {
        breadcrumbs.push({ label: 'Deployment', step: 6 });
      } else {
        breadcrumbs.push({ label: 'AI Recommendations', step: 6 });
      }
    }

    if (step >= 7) {
      if (config.platform === 'cloud' || config.platform === 'hybrid') {
        breadcrumbs.push({ label: 'Deployment', step: 7 });
      }
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

  const handleDocumentsChange = (documents: File[]) => {
    setConfig(prev => ({ ...prev, documents }));
  };

  const handleUserGuidesChange = (userGuides: File[]) => {
    setConfig(prev => ({ ...prev, userGuides }));
  };

  const handleDatacenterConfigChange = (datacenterConfig: typeof config.datacenter) => {
    setConfig(prev => ({ ...prev, datacenter: datacenterConfig }));
    setStep(prev => prev + 1);
  };

  const handleProxmoxConfigChange = (proxmoxConfig: typeof config.proxmox) => {
    setConfig(prev => ({ ...prev, proxmox: proxmoxConfig }));
    setStep(prev => prev + 1);
  };

  const handleDocumentUploadNext = async () => {
    if (config.platform === 'datacenter') {
      setIsLoading(true);
      const data = JSON.parse(localStorage.getItem("formData") || "{}");
      try {
        // Make API call for datacenter platform
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/createSingleVmDatacenterLab`, {
          data:data,
          user:user.id
        });

        if (response.data.success) {
          // Navigate to cloud VMs page on success
          window.location.href = '/dashboard/labs/cloud-vms';
          return;
        } else {
          return;
        }
      } catch (error) {
        const raw = localStorage.getItem('formData');

         if (raw) {
         const parsed = JSON.parse(raw);
        delete parsed.labGuides;
        delete parsed.userGuides;
       localStorage.setItem('formData', JSON.stringify(parsed));
      }

        console.error('Error configuring datacenter:', error);
        return;
      } finally {
        setIsLoading(false);
      }
    } else if (config.platform === 'proxmox') {
      setIsLoading(true);
      const data = JSON.parse(localStorage.getItem("formData") || "{}");
      try {
        console.log(data)
        // Make API call for Proxmox platform
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/createSingleVmProxmoxLab`, {
          data: data,
          user: user.id
        });

        if (response.data.success) {
          // Navigate to cloud VMs page on success
          window.location.href = '/dashboard/labs/cloud-vms';
          return;
        } else {
          return;
        }
      } catch (error) {
        const raw = localStorage.getItem('formData');

        if (raw) {
          const parsed = JSON.parse(raw);
          delete parsed.labGuides;
          delete parsed.userGuides;
          localStorage.setItem('formData', JSON.stringify(parsed));
        }

        console.error('Error configuring Proxmox:', error);
        return;
      } finally {
        setIsLoading(false);
      }
    } else {
      // For other platforms, just go to next step
      setStep(prev => prev + 1);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <BasicInfoStep 
            onNext={(details) => updateConfig(details)} 
            type="single-vm"
          />
        );
      case 2:
        return (
          <PlatformSelector 
            onSelect={(platform) => updateConfig({ platform })} 
          />
        );
      case 3:
        if (config.platform === 'cloud') {
          return (
            <div className="space-y-6">
              {/* Cloud Selection Dropdown */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold mb-4">
                  <GradientText>Select Cloud Provider</GradientText>
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
                  {selectedCloudType === 'organization' && organizationClouds.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
                      <p className="text-sm text-gray-400 mb-2">Available Organization Clouds:</p>
                      <ul className="space-y-2">
                        {organizationClouds.map((cloud: any, index: number) => (
                          <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                            {cloud.provider} - {cloud.name || 'Default'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <CloudProviderSelector 
                onSelect={(provider) => updateConfig({ cloudProvider: provider })} 
              />
            </div>
          );
        } else if (config.platform === 'datacenter') {
          return (
            <div className="space-y-6">
              {/* Cloud Selection Dropdown */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold mb-4">
                  <GradientText>Select Cloud Provider</GradientText>
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
                  {selectedCloudType === 'organization' && organizationClouds.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
                      <p className="text-sm text-gray-400 mb-2">Available Organization Clouds:</p>
                      <ul className="space-y-2">
                        {organizationClouds.map((cloud: any, index: number) => (
                          <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                            {cloud.provider} - {cloud.name || 'Default'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <DatacenterConfig
                config={config.datacenter}
                onChange={handleDatacenterConfigChange}
              />
            </div>
          );
        } else if (config.platform === 'proxmox') {
          return (
            <div className="space-y-6">
              {/* Cloud Selection Dropdown */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold mb-4">
                  <GradientText>Select Cloud Provider</GradientText>
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
                  {selectedCloudType === 'organization' && organizationClouds.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
                      <p className="text-sm text-gray-400 mb-2">Available Organization Clouds:</p>
                      <ul className="space-y-2">
                        {organizationClouds.map((cloud: any, index: number) => (
                          <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                            {cloud.provider} - {cloud.name || 'Default'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <ProxmoxConfig
                config={config.proxmox}
                onChange={handleProxmoxConfigChange}
              />
            </div>
          );
        } else {
          return (
            <VMSizeSelector 
              onSelect={(size) => updateConfig({ vmSize: size })} 
            />
          );
        }
      case 4:
        if (config.platform === 'cloud') {
          return (
            <VMSizeSelector 
              onSelect={(size) => updateConfig({ vmSize: size })} 
            />
          );
        } else if (config.platform === 'datacenter') {
          return (
            <DocumentUploader
              onDocumentsChange={handleDocumentsChange}
              onUserGuidesChange={handleUserGuidesChange}
              onNext={handleDocumentUploadNext}
            />
          );
        } else if (config.platform === 'proxmox') {
          return (
            <DocumentUploader
              onDocumentsChange={handleDocumentsChange}
              onUserGuidesChange={handleUserGuidesChange}
              onNext={handleDocumentUploadNext}
            />
          );
        } else {
          return (
            <DocumentUploader
              onDocumentsChange={handleDocumentsChange}
              onUserGuidesChange={handleUserGuidesChange}
              onNext={() => setStep(prev => prev + 1)}
            />
          );
        }
      case 5:
        if (config.platform === 'cloud') {
          return (
            <DocumentUploader
              onDocumentsChange={handleDocumentsChange}
              onUserGuidesChange={handleUserGuidesChange}
              onNext={() => setStep(prev => prev + 1)}
            />
          );
        } else if (config.platform === 'datacenter') {
          return (
            <AIRecommendations 
              config={config} 
              onConfirm={(region, responseData) => {
                const lab_id = responseData?.lab_id;
                updateConfig({ region, lab_id: lab_id });
              }}
            />
          );
        } else if (config.platform === 'proxmox') {
          return (
            <AIRecommendations 
              config={config} 
              onConfirm={(region, responseData) => {
                const lab_id = responseData?.lab_id;
                updateConfig({ region, lab_id: lab_id });
              }}
            />
          );
        } else {
          return (
            <AIRecommendations 
              config={config} 
              onConfirm={(region, responseData) => {
                const lab_id = responseData?.lab_id;
                updateConfig({ region, lab_id: lab_id });
              }}
            />
          );
        }
      case 6:
        if (config.platform === 'cloud') {
          return (
            <AIRecommendations 
              config={config} 
              onConfirm={(region, responseData) => {
                const lab_id = responseData?.lab_id;
                updateConfig({ region, lab_id: lab_id });
              }}
            />
          );
        } else if (config.platform === 'datacenter') {
          return <DeploymentStatus config={config} />;
        } else if (config.platform === 'proxmox') {
          return <DeploymentStatus config={config} />;
        } else {
          return <DeploymentStatus config={config} />;
        }
      case 7:
        return <DeploymentStatus config={config} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    const loadingMessage = config.platform === 'proxmox' 
      ? 'Processing Proxmox configuration...' 
      : 'Processing datacenter configuration...';
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-primary-400 animate-spin mb-4" />
        <p className="text-lg text-gray-300">{loadingMessage}</p>
        <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
      </div>
    );
  }

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