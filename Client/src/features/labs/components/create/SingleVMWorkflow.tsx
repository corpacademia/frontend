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
import { ChevronLeft, ChevronRight, Loader, Building2, Globe, Check } from 'lucide-react';
import axios from 'axios';
import { GuacamoleConfig } from './GuacamoleConfig';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { useCloudCredentialsStore, CloudCredential } from '../../../../store/cloudCredentialsStore';

interface SingleVMWorkflowProps {
  onBack: () => void;
}

export const SingleVMWorkflow: React.FC<SingleVMWorkflowProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const {user} = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCloudType, setSelectedCloudType] = useState<'global' | 'organization'>('global');
  const [organizationClouds, setOrganizationClouds] = useState<any[]>([]);
  const [selectedCloudId, setSelectedCloudId] = useState<string>('');
  const [allClouds, setAllClouds] = useState<any[]>([]);
  const { globalCredentials, orgCredentials, isLoading: credsLoading, fetchGlobalCredentials, fetchOrgCredentials } = useCloudCredentialsStore();
  const [selectedCred, setSelectedCred] = useState<CloudCredential | null>(null);
  const [selectedSource, setSelectedSource] = useState<'org' | 'global'>('org');
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
    const fetchClouds = async () => {
      try {
        let orgResponse;
      if (user?.org_id) {
        
           orgResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/organization-clouds/${user.org_id}`
          );
          if (orgResponse.data.success) {
            setOrganizationClouds(orgResponse.data.data || []);
             setAllClouds(orgResponse.data.data || []);
          }
            } 
            else{
          const globalResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/global-clouds`
          );
          
          if (globalResponse.data.success) {
            setAllClouds(globalResponse.data.data);
          }
          }
      
       }catch (error) {
          console.error('Error fetching clouds:', error);
        }
      
    };

    fetchClouds();
    // Fetch proxmox credentials for credential picker step
    if (user?.role === 'superadmin') {
      fetchGlobalCredentials();
    } else if (user?.org_id) {
      fetchGlobalCredentials();
      fetchOrgCredentials(user.org_id);
    }
  }, [user?.org_id]);

  // useEffect(() => {
    // const getUserDetails = async () => {
    //   try {
    //     const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
    //     setUser(response.data.user);
    //   } catch (err) {
    //     console.error('Error fetching user profile:', err);
    //   }
    // }
    // getUserDetails();
    // setUser(user);
  // }, []);

  useEffect(() => {
    (window as any).getSelectedCloudCredentials = getSelectedCloudCredentials;
    (window as any).resetCloudSelection = () => {
      setSelectedCloudId('');
      setSelectedCloudType('global');
    };
    return () => {
      delete (window as any).getSelectedCloudCredentials;
      delete (window as any).resetCloudSelection;
    };
  }, [selectedCloudType, selectedCloudId, allClouds]);


  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates, cloudType: selectedCloudType }));
    setStep(prev => prev + 1);
  };

  const handleCloudTypeChange = (type: 'global' | 'organization') => {
    setSelectedCloudType(type);
    setSelectedCloudId('');
  };

  const getFilteredCloudsByProvider = () => {
    const providerMap: { [key: string]: string } = {
      'aws': 'aws',
      'azure': 'azure',
      'gcp': 'gcp'
    };

    const currentProvider = config.cloudProvider ? providerMap[config.cloudProvider.toLowerCase()] : '';

    if (!currentProvider) return [];

    if (selectedCloudType === 'global') {
      return allClouds.filter(cloud =>
        !cloud.org_id && cloud.provider?.toLowerCase() === currentProvider
      );
    } else {
      return organizationClouds.filter(cloud =>
        cloud.provider?.toLowerCase() === currentProvider
      );
    }
  };

  const getSelectedCloudCredentials = () => {
    if (!selectedCloudId) return null;
    const selectedCloud = allClouds.find(cloud => cloud.id === selectedCloudId);
    if (!selectedCloud) return null;
    return {
      cloud_id: selectedCloud.id,
      credentials: selectedCloud.credentials
    };
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
        breadcrumbs.push({ label: 'Select Account', step: 3 });
      }
    }

    if (step >= 4) {
      if (config.platform === 'cloud') {
        breadcrumbs.push({ label: 'VM Configuration', step: 4 });
      } else if (config.platform === 'datacenter') {
        breadcrumbs.push({ label: 'Documents', step: 4 });
      } else if (config.platform === 'proxmox') {
        breadcrumbs.push({ label: 'Proxmox Config', step: 4 });
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
        breadcrumbs.push({ label: 'Documents', step: 5 });
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
          user:user?.impersonating ? user?.impersonatedUserId : user?.id,
          cloud_credentials: getSelectedCloudCredentials()
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
        // Make API call for Proxmox platform;
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/createSingleVmProxmoxLab`, {
          data: data,
          user: user?.impersonating ? user?.impersonatedUserId : user?.id,
          cloud_credentials: selectedCred ? { cloud_id: selectedCred.id, credentials: selectedCred.credentials } : null
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
                          const isOrg = organizationClouds.some((c: any) => c.id === val);
                          setSelectedCloudType(isOrg ? 'organization' : 'global');
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
                      {allClouds.filter((c: any) =>
                        !c.org_id &&
                        (!config.cloudProvider || c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase())
                      ).length > 0 && (
                        <optgroup label="GoLab Global Credentials">
                          {allClouds
                            .filter((c: any) =>
                              !c.org_id &&
                              (!config.cloudProvider || c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase())
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
                  (window as any).resetCloudSelection();
                }}
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
                          const isOrg = organizationClouds.some((c: any) => c.id === val);
                          setSelectedCloudType(isOrg ? 'organization' : 'global');
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
                      {allClouds.filter((c: any) =>
                        !c.org_id &&
                        (!config.cloudProvider || c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase())
                      ).length > 0 && (
                        <optgroup label="GoLab Global Credentials">
                          {allClouds
                            .filter((c: any) =>
                              !c.org_id &&
                              (!config.cloudProvider || c.provider?.toLowerCase() === config.cloudProvider?.toLowerCase())
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
              <DatacenterConfig
                config={config.datacenter}
                onChange={handleDatacenterConfigChange}
              />
            </div>
          );
        } else if (config.platform === 'proxmox') {
          const proxmoxGlobal = globalCredentials.filter(c => c.provider === 'proxmox');
          const proxmoxOrg = orgCredentials.filter(c => c.provider === 'proxmox');
          return (
            <div className="space-y-5">
              <div className="flex items-center space-x-4">
                <button onClick={() => setStep(2)} className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-white">Select Proxmox Account</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Choose the account to deploy your lab on</p>
                </div>
              </div>
              {credsLoading ? (
                <div className="flex justify-center py-8"><Loader className="h-6 w-6 text-primary-400 animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {user?.role === 'superadmin' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-4 w-4 text-amber-400" />
                        <h4 className="text-sm font-medium text-gray-300">Global Proxmox Credentials</h4>
                      </div>
                      {proxmoxGlobal.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-primary-500/20 rounded-lg">No global Proxmox credentials configured.</p>
                      ) : (
                        <div className="space-y-2">
                          {proxmoxGlobal.map(cred => (
                            <button key={cred.id} onClick={() => { setSelectedCred(cred); setSelectedSource('global'); }}
                              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedCred?.id === cred.id ? 'border-primary-500/60 bg-primary-500/10' : 'border-primary-500/20 bg-dark-300/40 hover:border-primary-500/40'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-amber-500/10"><Globe className="h-4 w-4 text-amber-400" /></div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{cred.provider}</p>
                                    {cred.credentials?.api_url && <p className="text-xs text-gray-500 truncate mt-0.5">{cred.credentials.api_url}</p>}
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
                  {(user?.role === 'orgsuperadmin' || user?.role === 'labadmin') && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4 text-primary-400" />
                          <h4 className="text-sm font-medium text-gray-300">Organization's Credentials</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300">Free</span>
                        </div>
                        {proxmoxOrg.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-primary-500/20 rounded-lg">No org Proxmox credentials. Add them in Cloud Settings.</p>
                        ) : (
                          <div className="space-y-2">
                            {proxmoxOrg.map(cred => (
                              <button key={cred.id} onClick={() => { setSelectedCred(cred); setSelectedSource('org'); }}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedCred?.id === cred.id ? 'border-primary-500/60 bg-primary-500/10' : 'border-primary-500/20 bg-dark-300/40 hover:border-primary-500/40'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary-500/10"><Building2 className="h-4 w-4 text-primary-400" /></div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                      <p className="text-xs text-gray-400 capitalize">{cred.provider}</p>
                                      {cred.credentials?.api_url && <p className="text-xs text-gray-500 truncate mt-0.5">{cred.credentials.api_url}</p>}
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
                        {proxmoxGlobal.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-amber-500/20 rounded-lg">No GoLab global credentials available.</p>
                        ) : (
                          <div className="space-y-2">
                            {proxmoxGlobal.map(cred => (
                              <button key={cred.id} onClick={() => { setSelectedCred(cred); setSelectedSource('global'); }}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedCred?.id === cred.id ? 'border-amber-500/60 bg-amber-500/10' : 'border-amber-500/20 bg-dark-300/40 hover:border-amber-500/40'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10"><Globe className="h-4 w-4 text-amber-400" /></div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                      <p className="text-xs text-gray-400 capitalize">{cred.provider}</p>
                                      {cred.credentials?.api_url && <p className="text-xs text-gray-500 truncate mt-0.5">{cred.credentials.api_url}</p>}
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
                <button onClick={() => setStep(2)} className="flex items-center space-x-2 px-6 py-2 bg-dark-400/50 hover:bg-dark-300/50 text-gray-300 rounded-lg transition-colors">
                  <ChevronLeft className="h-4 w-4" /><span>Back</span>
                </button>
                <button onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white rounded-lg transition-all">
                  Next: Configure
                </button>
              </div>
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
            <ProxmoxConfig
              config={{...config.proxmox,credential:selectedCred}}
              onChange={handleProxmoxConfigChange}
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
            <DocumentUploader
              onDocumentsChange={handleDocumentsChange}
              onUserGuidesChange={handleUserGuidesChange}
              onNext={handleDocumentUploadNext}
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
      : config.platform === 'datacenter'
      ? 'Processing Datacenter configuration...'
      : 'Creating Lab...';

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