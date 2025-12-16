import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Server, HardDrive, Cpu, Network, Power, MemoryStick } from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';
import axios from 'axios';

interface ProxmoxConfigProps {
  config: ProxmoxConfigData;
  onChange: (config: ProxmoxConfigData) => void;
}

interface ProxmoxConfigData {
  vmId: string;
  name: string;
  description: string;
  node: string;
  template: string;
  storage: string;
  storageSize: number;
  iso: string;
  isoType: string;
  isoVersion: string;
  cpuModel: string;
  cores: number;
  memoryMB: number;
  networkBridge: string;
  nicModel: string;
  onBoot: boolean;
  firewall: boolean;
  startDate: string;
  endDate: string;
  username?: string; // Added username
  password?: string; // Added password
}

interface BackendData {
  nodes: Array<{ id: string; name: string; cpuCores: number; memory: { free: number } }>;
  templates: Array<{ vmid: string; name: string; node: string; type: string }>;
  storages: Array<{ id: string; name: string; type: string; storage: string; total: number }>;
  isos: Array<{ content: string; volid: string; size: string; format?: string; version?: string; id?: string; storage?: string }>;
  cpuModels: Array<{ id: string; name: string; features: string[] }>;
  networkBridges: Array<{ id: string; name: string; type: string; iface: string }>;
}

export const ProxmoxConfig: React.FC<ProxmoxConfigProps> = ({ config, onChange }) => {
  const [localConfig, setLocalConfig] = useState<ProxmoxConfigData>(config);
  // State for ISO upload
  const [isUploadingIso, setIsUploadingIso] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Mock backend data - replace with actual API calls
  const [backendData, setBackendData] = useState<BackendData>({
    nodes: [],
    templates: [],
    storages: [],
    isos: [],
    cpuModels:[],
    networkBridges: []
  });
  console.log(backendData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProxmoxData();
  }, []);
  useEffect(() => {
    // Auto-fill VM ID when component mounts
    if (!localConfig.vmId) {
      fetchVMId();
    }
  }, []);

  // Update localConfig when the parent config changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const fetchProxmoxData = async () => {
  try {
    setLoading(true);

    // Step 1: Fetch nodes first
    const nodesRes = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/nodes`
    );

    const nodes = nodesRes?.data?.nodes || nodesRes?.data?.data || [];
    const firstNode = nodes?.[0]?.node || nodes?.[0]; // adjust based on your backend response

    if (!firstNode) {
      throw new Error("No nodes available");
    }

    // Step 2: Fetch dependent resources for the node
    const [templatesRes, storageRes, cpuRes, networkRes] = await Promise.all([
      axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/templates`, {
        NODE: firstNode,
      }),
      axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/storages`, {
        NODE: firstNode,
      }),
      axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/cpu-models`, {
        NODE: firstNode,
      }),
      axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/network-bridges`, {
        NODE: firstNode,
      }),
    ]);

    // Step 3: Update state
    setBackendData({
      nodes,
      templates: templatesRes?.data?.data || [],
      storages: storageRes?.data?.data || [],
      isos: [],
      cpuModels: cpuRes?.data?.data || [],
      networkBridges: networkRes?.data?.networkBridges || [],
    });
  } catch (err) {
    console.error("Error fetching Proxmox data:", err);
    setError("Failed to load Proxmox configuration data");
  } finally {
    setLoading(false);
  }
};


  const fetchVMId = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/next-vm-id`);
      if (response.data.data) {
        updateConfig('vmId', response.data.data);
      }
    } catch (err) {
      console.error('Error fetching VM ID:', err);
    }
  };

  const updateConfig = (field: keyof ProxmoxConfigData, value: any) => {
    const updatedConfig = { ...localConfig, [field]: value };
    setLocalConfig(updatedConfig);
  };

  const adjustStorageSize = (increment: boolean) => {
    const currentSize = localConfig.storageSize || 50;
    const newSize = increment ? currentSize + 50 : Math.max(50, currentSize - 50);
    updateConfig('storageSize', newSize);
  };

  const adjustMemory = (increment: boolean) => {
    const currentMemory = localConfig.memoryMB || 512;
    const newMemory = increment ? currentMemory + 32 : Math.max(32, currentMemory - 32);
    updateConfig('memoryMB', newMemory);
  };

  const getFilteredIsos = () => {
    return backendData.isos.filter(iso => (iso.volid).split(":")[0] === localConfig.storage);
  };

  // Function to fetch ISOs from backend
  const fetchISOs = async () => {
    if (!localConfig.storage || !localConfig.node) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/isos`, {
        storage: localConfig.storage,
        NODE: localConfig.node
      });
      setBackendData(prev => ({
        ...prev,
        isos: response.data.isos || []
      }));
    } catch (error) {
      console.error('Error fetching ISOs:', error);
    }
  };

  const fetchTemplates = async() =>{
    if(!localConfig.node) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/templates`, {
        NODE: localConfig.node
      });
      setBackendData(prev => ({
        ...prev,
        templates: response?.data?.data || [],
      }));
    } catch (error) {
      console.error("Error fetching templates:",error);
    }
  }

  const fetchStorages = async() =>{
    if(!localConfig.node) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/storages`, {
        NODE: localConfig.node
      });
      setBackendData(prev => ({
        ...prev,
        storages: response?.data?.data || [],
      }));
    } catch (error) {
      console.error("Error fetching storages:",error);
    }
  }

  // Handle ISO file upload
  const handleIsoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (should be .iso)
    if (!file.name.toLowerCase().endsWith('.iso')) {
      alert('Please select a valid ISO file');
      return;
    }

    setIsUploadingIso(true);
    setUploadProgress(0);

    try {

      const formData = new FormData();
      formData.append('iso', file);
      formData.append('node', localConfig.node);
      formData.append('storageName', localConfig.storage);

      const storageType = backendData.storages.find((storage)=>storage.storage === localConfig.storage)?.type
      formData.append('storageType',storageType)

        // Simulate upload progress
         const response = await axios.post(
    `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/upload-iso`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);

        // ✅ Trigger loading once the file is fully uploaded
        if (progressEvent.loaded === progressEvent.total) {
          setLoading(true);
        }
      },
    }
  );

      // Check if response is successful
      if (response.data.success || response.status === 200) {
        // Mock successful upload - add new ISO to the list
        const newIso = {
          content:'unknown',
          volid: file.name.replace('.iso', ''),
          size: `${(file.size / (1024 * 1024 * 1024)).toFixed(1)}GB`,
          storage: localConfig.storage,
          format: 'iso',
          version: 'Unknown'
        };
        setBackendData(prev => ({
          ...prev,
          isos: [...prev.isos, newIso]
        }));

        // Refetch ISOs to get updated list
        await fetchISOs();
      }

    } catch (error) {
      console.error('Error uploading ISO:', error);
      alert('Failed to upload ISO file');
    } finally {
      setIsUploadingIso(false);
      setUploadProgress(0);
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Fetch ISOs when node or storage changes
  useEffect(() => {
    if (localConfig.storage && localConfig.node) {
      fetchISOs();
    }
  }, [localConfig.storage, localConfig.node]);

  //fetch templates when node changes
  useEffect(()=>{
    if(localConfig.node){
      fetchTemplates();
    }
  },[localConfig.node])

  //fetch storages when node changes
  useEffect(()=>{
    if(localConfig.node){
      fetchStorages();
    }
  },[localConfig.node])

  const handleSubmit = () => {
    // Validate required fields
    const requiredFields = ['name', 'node', 'storage', 'iso', 'networkBridge'];
    const missingFields = requiredFields.filter(field => !localConfig[field as keyof ProxmoxConfigData]);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Store config and proceed to next step
    const formData = JSON.parse(localStorage.getItem('formData') || '{}');
    localStorage.setItem('formData', JSON.stringify({
      ...formData,
      proxmoxConfig: localConfig
    }));

    // Trigger next step by calling onChange with the current localConfig
    onChange(localConfig);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Proxmox configuration...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          <GradientText>Proxmox Configuration</GradientText>
        </h2>
        <p className="text-gray-400">
          Configure your Proxmox Virtual Environment settings
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Selection */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold">
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Node Selection
              </span>
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proxmox Node <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={localConfig.node || ''}
                onChange={(e) => updateConfig('node', e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
              >
                <option value="">Select node</option>
                {backendData.nodes.map((node) => (
                  <option key={node.id} value={node.node}>
                    {node.node} (CPU: {node.cpuCores}, RAM: {(node.memory.free)/(1024*1024)})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Select a node with sufficient resources</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Template
            </label>
            <div className="relative">
              <select
                value={localConfig.template || ''}
                onChange={(e) => updateConfig('template', e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                disabled={!localConfig.node}
              >
                <option value="">Select template (optional)</option>
                {backendData.templates.map((template) => (
                  <option key={template.vmid} value={template.vmid}>
                    {template.name} (VMID: {template.vmid})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {localConfig.node ? 'Select a template to clone from' : 'Select a node first to view available templates'}
            </p>
          </div>
        </div>

        {/* VM ID */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold">
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                VM Identity
              </span>
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                VM ID
              </label>
              <input
                type="text"
                value={localConfig.vmId || ''}
                onChange={(e) => updateConfig('vmId', e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 "
                // readOnly
                placeholder="Auto-generated"
              />
              <p className="text-xs text-gray-500 mt-1">Automatically assigned by system</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={localConfig.name || ''}
                onChange={(e) => updateConfig('name', e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                placeholder="Enter VM name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={localConfig.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none resize-none"
                placeholder="Enter VM description"
                rows={3}
              />
            </div>

            {/* Username and Password - Added here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={localConfig.username || ''}
                  onChange={(e) => updateConfig('username', e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={localConfig.password || ''}
                  onChange={(e) => updateConfig('password', e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={localConfig.startDate || ''}
                  onChange={(e) => updateConfig('startDate', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={localConfig.endDate || ''}
                  onChange={(e) => updateConfig('endDate', e.target.value)}
                  min={localConfig.startDate || new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Storage Configuration */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold">
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Storage
              </span>
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Storage <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={localConfig.storage || ''}
                  onChange={(e) => updateConfig('storage', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                >
                  <option value="">Select storage</option>
                  {backendData.storages.map(storage =>
                    storage.total > 0 ? (
                      <option key={storage.id} value={storage.storage}>
                        {storage.storage} ({storage.type})
                      </option>
                    ) : null
                  )}

                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Storage Size (GB)
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => adjustStorageSize(false)}
                  className="p-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 hover:bg-dark-400/70 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-medium text-gray-200">
                    {localConfig.storageSize || 50} GB
                  </span>
                </div>
                <button
                  onClick={() => adjustStorageSize(true)}
                  className="p-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 hover:bg-dark-400/70 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Size adjusts in increments of 50 GB</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ISO Configuration <span className="text-red-400">*</span>
              </label>

               {/* ISO Dropdown */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">ISO Image</label>
                <div className="relative">
                  <select
                    value={localConfig.iso || ''}
                    onChange={(e) => updateConfig('iso', e.target.value)}
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                    // disabled={!localConfig.node || !localConfig.storage || !localConfig.isoType || !localConfig.isoVersion}
                  >
                    <option value="">Select ISO image</option>
                    {getFilteredIsos()
                      .map((iso) => (
                        <option key={iso.id} value={iso.id}>
                          {(iso.volid).match(/[^/]+$/)[0]}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>





              {(!localConfig.node || !localConfig.storage) && (
                <p className="text-xs text-gray-500 mt-1">Select node and storage first to view available ISOs</p>
              )}
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload ISO File
                </label>
                <input
                  type="file"
                  accept=".iso"
                  onChange={handleIsoUpload}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none cursor-pointer"
                  disabled={isUploadingIso || !localConfig.node || !localConfig.storage}
                />
                {isUploadingIso && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="w-full bg-dark-400/50 rounded-full h-2.5">
                      <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-400">{uploadProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CPU Configuration */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <Cpu className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold">
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                CPU Configuration
              </span>
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CPU Cores *
            </label>
            <input
              type="number"
              min="1"
              max="64"
              value={localConfig.cores}
              onChange={(e) => updateConfig('cores', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              placeholder="Enter number of cores"
            />
          </div>
        </div>

        {/* Memory & Network */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <MemoryStick className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold">
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Memory & Network
              </span>
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Memory (MiB)
              </label>
              <input
                type="number"
                min="32"
                value={localConfig.memoryMB || 512}
                onChange={(e) => updateConfig('memoryMB', parseInt(e.target.value) || 512)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                placeholder="Enter memory in MiB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Network Bridge <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={localConfig.networkBridge || ''}
                  onChange={(e) => updateConfig('networkBridge', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                >
                  <option value="">Select network bridge</option>
                  {backendData.networkBridges.map((bridge) => (
                    <option key={bridge.id} value={bridge.iface}>
                      {bridge.iface} ({bridge.type})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NIC Model
              </label>
              <div className="relative">
                <select
                  value={localConfig.nicModel || ''}
                  onChange={(e) => updateConfig('nicModel', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                >
                  <option value="">Select NIC model</option>
                  {import.meta.env.VITE_NIC_MODELS?.split(',').map((model: string) => (
                    <option key={model.trim()} value={model.trim()}>
                      {model.trim()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Power className="h-4 w-4 text-primary-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Start on Boot
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.onBoot || false}
                    onChange={(e) => updateConfig('onBoot', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none rounded-full peer
                                peer-checked:after:translate-x-full peer-checked:after:border-white
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-primary-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Firewall
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.firewall || false}
                    onChange={(e) => updateConfig('firewall', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none rounded-full peer
                                peer-checked:after:translate-x-full peer-checked:after:border-white
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                   font-medium transition-colors focus:outline-none focus:ring-2
                   focus:ring-primary-500/20"
        >
          Continue to Documents
        </button>
      </div>
    </div>
  );
};