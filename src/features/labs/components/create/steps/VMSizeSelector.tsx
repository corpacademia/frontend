import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, Database, Server, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';
import axios from 'axios';

interface VMSizeConfig {
  cpu: number;
  ram: number;
  storage: number;
  os?: string;
  snapshotType?: 'snapshot' | 'hibernate';
}

interface VMSizeSelectorProps {
  onSelect: (config: VMSizeConfig) => void;
}

interface OSVersion {
  name: string;
  version: string;
}

function convertToOSCategories(data) {
  const osCategories = {};
  
  data.forEach(({ category, name }) => {
    if (!osCategories[category]) {
      osCategories[category] = [];
    }
     osCategories[category].push({ name: name, version:name });
  });
  
  return osCategories;
}

const recommendedInstances = [
  {
    type: 't3.large',
    cpu: 2,
    ram: 8,
    storage: 50,
    description: 'Balanced performance for general workloads'
  },
  {
    type: 't3.xlarge',
    cpu: 4,
    ram: 16,
    storage: 100,
    description: 'Enhanced performance for memory-intensive applications'
  },
  {
    type: 'c6i.large',
    cpu: 2,
    ram: 4,
    storage: 50,
    description: 'Compute-optimized for CPU-intensive workloads'
  }
];

export const VMSizeSelector: React.FC<VMSizeSelectorProps> = ({ onSelect }) => {
  const [config, setConfig] = useState<VMSizeConfig>({
    cpu: 2,
    ram: 2,
    storage: 50,
    os: '',
    snapshotType: undefined
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [osCategories, setOsCategories] = useState<undefined>(undefined);
  const [isProcess, setIsprocess] = useState(false);

  useEffect(() => {
    const osList = async () => {
      const getOs = await axios.get('http://localhost:3000/api/v1/lab_ms/getOs');
      if(getOs.data.success) {
        setOsCategories(convertToOSCategories(getOs.data.data));
        setIsprocess(true);
      }
    };
    osList();
  }, []);

  const handleSubmit = () => {
    if (!selectedVersion) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onSelect(config);
    const storedData = JSON.parse(localStorage.getItem('formData') || '{}');
    const updatedData = { ...storedData, config };
    localStorage.setItem('formData', JSON.stringify(updatedData));
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedVersion('');
    setConfig(prev => ({ ...prev, os: category }));
    setShowError(false);
  };

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    setConfig(prev => ({ ...prev, os_version: version }));
    setShowError(false);
  };

  const handleInstanceSelect = (instance: typeof recommendedInstances[0]) => {
    setConfig(prev => ({
      ...prev,
      cpu: instance.cpu,
      ram: instance.ram,
      storage: instance.storage
    }));
  };

  const handleSnapshotTypeChange = (type: 'snapshot' | 'hibernate') => {
    setConfig(prev => ({
      ...prev,
      snapshotType: type
    }));
  };

  if(!isProcess) {
    return <>Loading...</>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>Configure Lab Environment</GradientText>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Section - Configuration */}
        <div className="glass-panel space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Operating System Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none
                         focus:ring-2 focus:ring-primary-500/20 transition-colors
                         ${showError && !selectedCategory ? 'border-red-500/50' : 'border-primary-500/20'}`}
              >
                <option value="">Select OS Category</option>
                {Object.keys(osCategories).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operating System Version
                </label>
                <select
                  value={selectedVersion}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none
                           focus:ring-2 focus:ring-primary-500/20 transition-colors
                           ${showError && !selectedVersion ? 'border-red-500/50' : 'border-primary-500/20'}`}
                >
                  <option value="">Select Version</option>
                  {osCategories[selectedCategory as keyof typeof osCategories].map(os => (
                    <option key={os.version} value={os.version}>{os.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Snapshot Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="snapshotType"
                    value="snapshot"
                    checked={config.snapshotType === 'snapshot'}
                    onChange={() => handleSnapshotTypeChange('snapshot')}
                    className="form-radio h-4 w-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Snapshot</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="snapshot"
                    value="hibernate"
                    checked={config.snapshotType === 'hibernate'}
                    onChange={() => handleSnapshotTypeChange('hibernate')}
                    className="form-radio h-4 w-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Hibernate</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center text-gray-300 mb-2">
                <Cpu className="h-4 w-4 mr-2" />
                CPU Cores
              </label>
              <input
                type="range"
                min="1"
                max="16"
                value={config.cpu}
                onChange={(e) => setConfig(prev => ({ ...prev, cpu: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>{config.cpu} Cores</span>
                <span>16 Cores max</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-gray-300 mb-2">
                <Database className="h-4 w-4 mr-2" />
                Memory (RAM)
              </label>
              <input
                type="range"
                min="2"
                max="64"
                step="2"
                value={config.ram}
                onChange={(e) => setConfig(prev => ({ ...prev, ram: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>{config.ram} GB</span>
                <span>64 GB max</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-gray-300 mb-2">
                <HardDrive className="h-4 w-4 mr-2" />
                Storage
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={config.storage}
                onChange={(e) => setConfig(prev => ({ ...prev, storage: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>{config.storage} GB</span>
                <span>1000 GB max</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - AI Recommendations */}
        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-4">
            <GradientText>AI Recommended Instances</GradientText>
          </h3>
          <div className="space-y-4">
            {recommendedInstances.map((instance, index) => (
              <div
                key={index}
                className="p-4 bg-dark-300/50 rounded-lg border border-primary-500/20 
                         hover:border-primary-500/40 transition-all cursor-pointer"
                onClick={() => handleInstanceSelect(instance)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-200">{instance.type}</h4>
                    <p className="text-sm text-gray-400">{instance.description}</p>
                  </div>
                  <Server className="h-5 w-5 text-primary-400" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm text-gray-400">
                  <div>
                    <span className="block text-gray-500">CPU</span>
                    <span>{instance.cpu} Cores</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">RAM</span>
                    <span>{instance.ram} GB</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Storage</span>
                    <span>{instance.storage} GB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Updated Apply Configuration Button Section */}
      <div className="flex flex-col items-center space-y-4">
        {showError && !selectedVersion && (
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>Please select an operating system before continuing</span>
          </div>
        )}
        <button
          onClick={handleSubmit}
          className="px-8 py-3 text-base font-semibold rounded-lg
                   bg-gradient-to-r from-primary-500 to-secondary-500
                   hover:from-primary-400 hover:to-secondary-400
                   text-white shadow-lg shadow-primary-500/20
                   transform hover:scale-105 transition-all duration-300
                   min-w-[200px] focus:outline-none focus:ring-2 
                   focus:ring-primary-500/50 focus:ring-offset-2 
                   focus:ring-offset-dark-300"
        >
          Apply Configuration
        </button>
      </div>
    </div>
  );
};