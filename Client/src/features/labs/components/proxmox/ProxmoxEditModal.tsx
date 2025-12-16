import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertCircle, Check, Loader, Server, Cpu, HardDrive, Network, Calendar, FileText, Tag, Upload, Download, MemoryStick, Plus, Minus } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { useProxmoxConfigStore } from '../../../../store/proxmoxConfigStore';

interface ProxmoxEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  vm: {
    labid: string;
    title: string;
    description: string;
    cpu: number;
    ram: number;
    storage: number;
    node?: string;
    vmid?: string;
    vmname?:string;
    templateId?: string;
    startdate: string;
    enddate: string;
    isoimage?: string;
    nicmodel?: string;
    networkBridge?: string;
    firewall?: boolean;
    boot?: boolean;
    storagetype?:string;
    username?: string;
    password?: string;
  };
  onSuccess: () => void;
}

export const ProxmoxEditModal: React.FC<ProxmoxEditModalProps> = ({
  isOpen,
  onClose,
  vm,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'resources' | 'network' | 'documents'>('basic');
  const [formData, setFormData] = useState({
    title: vm.title || '',
    description: vm.description || '',
    cpu: vm.cpu || 2,
    ram: vm.ram || 4,
    storage: vm.storage || 50,
    node: vm.node || '',
    isoimage: vm.isoimage || '',
    nicModel: vm.nicmodel || '',
    networkBridge: vm.networkbridge || '',
    firewall: vm.firewall || false,
    boot: vm.boot || false,
    startDate: vm.startdate || '',
    endDate: vm.enddate || '',
    storagetype: vm.storagetype || '',
    username: vm.username || '',
    password: vm.password || '',
  });
  const [selectedStorage, setSelectedStorage] = useState(vm.storagetype);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const { 
    storages, 
    isos, 
    networkBridges, 
    nicModels, 
    isLoading: isLoadingConfig,
    fetchStorages, 
    fetchISOs, 
    fetchNetworkBridges,
    clearData 
  } = useProxmoxConfigStore();

  useEffect(() => {
    if (vm) {
      // Extract filename from ISO image if it contains storage prefix
      const isoFileName = vm.isoimage ? (vm.isoimage.match(/[^/]+$/)?.[0] || vm.isoimage) : '';
      
      setFormData({
        title: vm.title || '',
        description: vm.description || '',
        cpu: vm.cpu || 2,
        ram: vm.ram || 4,
        storage: vm.storage || 50,
        node: vm.node || '',
        isoimage: isoFileName,
        nicModel: vm.nicmodel || '',
        networkBridge: vm.networkbridge || '',
        firewall: vm.firewall || false,
        boot: vm.boot || false,
        startDate: vm.startdate || '',
        endDate: vm.enddate || '',
        storagetype: vm.storagetype || '',
        username: vm.username || '',
        password: vm.password || '',
      });
      
      // Set the initial storage if available
      if (vm.storagetype) {
        setSelectedStorage(vm.storagetype);
      }
    }
  }, [vm]);
  useEffect(() => {
    if (isOpen && vm.node) {
      fetchStorages(vm.node);
      fetchNetworkBridges(vm.node);
    }
    
    // return () => {
    //   if (!isOpen) {
    //     clearData();
    //   }
    // };
  }, [isOpen, vm.node]);

  useEffect(() => {
    if (selectedStorage && vm.node) {
      fetchISOs(vm.node, selectedStorage);
    }
  }, [selectedStorage, vm.node]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateProxmoxLab`, {
        labId: vm.labid,
        vmid:vm.vmid,
        title: formData.title,
        description: formData.description,
        cpu: formData.cpu,
        ram: formData.ram,
        storage: formData.storage,
        storageType:formData.storagetype,
        node: formData.node,
        isoimage: formData.isoimage,
        nicModel: formData.nicModel,
        networkBridge: formData.networkBridge,
        firewall: formData.firewall,
        boot: formData.boot,
        startDate: formData.startDate,
        endDate: formData.endDate,
        username: formData.username,
        password: formData.password
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update VM');
      }

      setNotification({ type: 'success', message: 'VM updated successfully' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update VM'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'resources', label: 'Resources', icon: Server },
    { id: 'network', label: 'Network', icon: Network }
  ];
  const modalContent = (
    <div className="fixed inset-0 left-0 right-0 top-0 bottom-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-2 sm:p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-dark-300/50">
          <h2 className="text-xl sm:text-2xl font-semibold">
            <GradientText>Edit Proxmox VM Configuration</GradientText>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-300/50 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-orange-500 text-orange-400 bg-orange-500/5'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      VM Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      placeholder="Enter VM title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Storage
                    </label>
                    <select
                      value={selectedStorage}
                      onChange={(e) => {
                        setSelectedStorage(e.target.value);
                        handleInputChange('isoimage', '');
                      }}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      disabled={isLoadingConfig}
                    >
                      <option value="">Select Storage</option>
                      {storages.map((storage) => (
                        <option key={storage.id} value={storage.storage}>
                          {storage.storage} ({storage.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ISO Image
                    </label>
                    <select
                      value={formData?.isoimage}
                      onChange={(e) => handleInputChange('isoimage', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      disabled={!selectedStorage || isLoadingConfig}
                    >
                      <option value="">Select ISO Image</option>
                      {isos.map((iso) => (
                        <option key={iso.volid} value= {(iso.volid).match(/[^/]+$/)[0]}>
                           {(iso.volid).match(/[^/]+$/)[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                             text-gray-300 focus:border-orange-500/40 focus:outline-none resize-vertical"
                    placeholder="Enter VM description"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Proxmox Node
                    </label>
                    <input
                      type="text"
                      value={formData.node}
                      onChange={(e) => handleInputChange('node', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      placeholder="e.g., pve"
                      disabled
                      title='Read-only'
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      VM ID
                    </label>
                    <input
                      type="text"
                      value={vm.vmid || 'N/A'}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      disabled
                      title='Read-only'
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate && new Date(formData.startDate).toISOString().slice(0, 16)}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate && new Date(formData.endDate).toISOString().slice(0, 16)}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-dark-300/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">CPU Cores</span>
                      <Cpu className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleInputChange('cpu', Math.max(1, formData.cpu - 1))}
                        className="p-1 rounded bg-dark-400 hover:bg-dark-300 text-red-400"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-2xl font-semibold text-gray-200 min-w-[3rem] text-center">
                        {formData.cpu}
                      </span>
                      <button
                        onClick={() => handleInputChange('cpu', formData.cpu + 1)}
                        className="p-1 rounded bg-dark-400 hover:bg-dark-300 text-emerald-400"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-dark-300/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">RAM (GB)</span>
                      <MemoryStick className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleInputChange('ram', Math.max(1, formData.ram - 1))}
                        className="p-1 rounded bg-dark-400 hover:bg-dark-300 text-red-400"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-2xl font-semibold text-gray-200 min-w-[3rem] text-center">
                        {formData.ram}
                      </span>
                      <button
                        onClick={() => handleInputChange('ram', formData.ram + 1)}
                        className="p-1 rounded bg-dark-400 hover:bg-dark-300 text-emerald-400"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-dark-300/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Storage (GB)</span>
                      <HardDrive className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleInputChange('storage', Math.max(50, formData.storage - 50))}
                        className="p-1 rounded bg-dark-400 hover:bg-dark-300 text-red-400"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-2xl font-semibold text-gray-200 min-w-[3rem] text-center">
                        {formData.storage}
                      </span>
                      <button
                        onClick={() => handleInputChange('storage', formData.storage + 50)}
                        className="p-1 rounded bg-dark-400 hover:bg-dark-300 text-emerald-400"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Network Tab */}
            {activeTab === 'network' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Network Bridge
                    </label>
                    <select
                      value={formData.networkBridge}
                      onChange={(e) => handleInputChange('networkBridge', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                      disabled={isLoadingConfig}
                    >
                      <option value="">Select Network Bridge</option>
                      {networkBridges.map((bridge) => (
                        <option key={bridge.id} value={bridge.iface}>
                          {bridge.iface} ({bridge.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      NIC Model
                    </label>
                    <select
                      value={formData.nicModel}
                      onChange={(e) => handleInputChange('nicModel', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-orange-500/20 rounded-lg
                               text-gray-300 focus:border-orange-500/40 focus:outline-none"
                    >
                      <option value="">Select NIC Model</option>
                      {nicModels.map((nic) => (
                        <option key={nic.id} value={nic.id}>
                          {nic.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-dark-300/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="firewall"
                      checked={formData.firewall}
                      onChange={(e) => handleInputChange('firewall', e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-dark-400 border-orange-500/20 rounded
                               focus:ring-orange-500 focus:ring-2"
                    />
                    <label htmlFor="firewall" className="text-sm text-gray-300">
                      Enable Firewall
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-dark-300/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="boot"
                      checked={formData.boot}
                      onChange={(e) => handleInputChange('boot', e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-dark-400 border-orange-500/20 rounded
                               focus:ring-orange-500 focus:ring-2"
                    />
                    <label htmlFor="boot" className="text-sm text-gray-300">
                      Start at Boot
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notification */}
            {notification && (
              <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/20'
                  : 'bg-red-500/20 border border-red-500/20'
              }`}>
                {notification.type === 'success' ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span className={`text-sm ${
                  notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
                }`}>
                  {notification.message}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 p-4 sm:p-6 border-t border-dark-300/50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto btn-primary bg-emerald-500 hover:bg-emerald-600"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Updating...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};