
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Server, HardDrive, Cpu, Memory, Network, Power } from 'lucide-react';
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
  storage: string;
  storageSize: number;
  iso: string;
  cpuModel: string;
  cores: number;
  memoryMB: number;
  networkBridge: string;
  onBoot: boolean;
}

interface BackendData {
  storages: Array<{ id: string; name: string; type: string }>;
  isos: Array<{ id: string; name: string; size: string }>;
  cpuModels: Array<{ id: string; name: string; features: string[] }>;
  networkBridges: Array<{ id: string; name: string; type: string }>;
}

export const ProxmoxConfig: React.FC<ProxmoxConfigProps> = ({ config, onChange }) => {
  const [backendData, setBackendData] = useState<BackendData>({
    storages: [],
    isos: [],
    cpuModels: [],
    networkBridges: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProxmoxData();
  }, []);

  useEffect(() => {
    // Auto-fill VM ID when component mounts
    if (!config.vmId) {
      fetchVMId();
    }
  }, []);

  const fetchProxmoxData = async () => {
    try {
      setLoading(true);
      // Fetch all Proxmox configuration data
      const [storageRes, isoRes, cpuRes, networkRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox/storages`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox/isos`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox/cpu-models`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox/network-bridges`)
      ]);

      setBackendData({
        storages: storageRes.data.storages || [],
        isos: isoRes.data.isos || [],
        cpuModels: cpuRes.data.cpuModels || [],
        networkBridges: networkRes.data.networkBridges || []
      });
    } catch (err) {
      console.error('Error fetching Proxmox data:', err);
      setError('Failed to load Proxmox configuration data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVMId = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox/next-vm-id`);
      if (response.data.vmId) {
        updateConfig('vmId', response.data.vmId);
      }
    } catch (err) {
      console.error('Error fetching VM ID:', err);
    }
  };

  const updateConfig = (field: keyof ProxmoxConfigData, value: any) => {
    const updatedConfig = { ...config, [field]: value };
    onChange(updatedConfig);
  };

  const adjustStorageSize = (increment: boolean) => {
    const currentSize = config.storageSize || 50;
    const newSize = increment ? currentSize + 50 : Math.max(50, currentSize - 50);
    updateConfig('storageSize', newSize);
  };

  const adjustMemory = (increment: boolean) => {
    const currentMemory = config.memoryMB || 512;
    const newMemory = increment ? currentMemory + 32 : Math.max(32, currentMemory - 32);
    updateConfig('memoryMB', newMemory);
  };

  const getFilteredIsos = () => {
    if (!config.storage) return backendData.isos;
    return backendData.isos.filter(iso => iso.id.includes(config.storage));
  };

  const handleSubmit = () => {
    // Validate required fields
    const requiredFields = ['name', 'storage', 'iso', 'cpuModel', 'networkBridge'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Store config and proceed to next step
    const formData = JSON.parse(localStorage.getItem('formData') || '{}');
    localStorage.setItem('formData', JSON.stringify({
      ...formData,
      proxmoxConfig: config
    }));

    // Trigger next step
    onChange(config);
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
        {/* VM ID */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-200">VM Identity</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                VM ID
              </label>
              <input
                type="text"
                value={config.vmId || ''}
                readOnly
                className="w-full px-4 py-2 bg-dark-400/30 border border-primary-500/20 rounded-lg
                         text-gray-400 cursor-not-allowed"
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
                value={config.name || ''}
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
                value={config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none resize-none"
                placeholder="Enter VM description"
              />
            </div>
          </div>
        </div>

        {/* Storage Configuration */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-200">Storage</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Storage <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={config.storage || ''}
                  onChange={(e) => updateConfig('storage', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                >
                  <option value="">Select storage</option>
                  {backendData.storages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name} ({storage.type})
                    </option>
                  ))}
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
                    {config.storageSize || 50} GB
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
                ISO Image <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={config.iso || ''}
                  onChange={(e) => updateConfig('iso', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                  disabled={!config.storage}
                >
                  <option value="">Select ISO image</option>
                  {getFilteredIsos().map((iso) => (
                    <option key={iso.id} value={iso.id}>
                      {iso.name} ({iso.size})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {!config.storage && (
                <p className="text-xs text-gray-500 mt-1">Select storage first to view available ISOs</p>
              )}
            </div>
          </div>
        </div>

        {/* CPU Configuration */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <Cpu className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-200">CPU</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CPU Model <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={config.cpuModel || ''}
                  onChange={(e) => updateConfig('cpuModel', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                >
                  <option value="">Select CPU model</option>
                  {backendData.cpuModels.map((cpu) => (
                    <option key={cpu.id} value={cpu.id}>
                      {cpu.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cores
              </label>
              <input
                type="number"
                min="1"
                max="32"
                value={config.cores || 1}
                onChange={(e) => updateConfig('cores', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                placeholder="Number of CPU cores"
              />
            </div>
          </div>
        </div>

        {/* Memory & Network */}
        <div className="glass-panel space-y-4">
          <div className="flex items-center space-x-3">
            <Memory className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-200">Memory & Network</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Memory (MB)
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => adjustMemory(false)}
                  className="p-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 hover:bg-dark-400/70 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-medium text-gray-200">
                    {config.memoryMB || 512} MB
                  </span>
                </div>
                <button
                  onClick={() => adjustMemory(true)}
                  className="p-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 hover:bg-dark-400/70 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Memory adjusts in increments of 32 MB</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Network Bridge <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={config.networkBridge || ''}
                  onChange={(e) => updateConfig('networkBridge', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
                >
                  <option value="">Select network bridge</option>
                  {backendData.networkBridges.map((bridge) => (
                    <option key={bridge.id} value={bridge.id}>
                      {bridge.name} ({bridge.type})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

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
                  checked={config.onBoot || false}
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
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn-secondary"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary"
        >
          Next: Documents
        </button>
      </div>
    </div>
  );
};
