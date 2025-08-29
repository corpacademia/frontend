
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader, HardDrive, Plus, Minus, Calendar, FileText, Tag, Server, Cpu, Memory } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStorage: number;
  assessmentId: string;
  lab_id: string;
  onSuccess: () => void;
  vm?: {
    title?: string;
    description?: string;
    cpu?: number;
    ram?: number;
    os?: string;
    provider?: string;
    instance?: string;
    software?: string[];
  };
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  currentStorage,
  assessmentId,
  lab_id,
  onSuccess,
  vm
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'resources' | 'software'>('basic');
  const [formData, setFormData] = useState({
    title: vm?.title || '',
    description: vm?.description || '',
    cpu: vm?.cpu || 2,
    ram: vm?.ram || 4,
    storage: currentStorage,
    storageChange: 0,
    os: vm?.os || '',
    provider: vm?.provider || '',
    instance: vm?.instance || '',
    software: vm?.software || []
  });
  const [newSoftware, setNewSoftware] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (vm) {
      setFormData(prev => ({
        ...prev,
        title: vm.title || '',
        description: vm.description || '',
        cpu: vm.cpu || 2,
        ram: vm.ram || 4,
        os: vm.os || '',
        provider: vm.provider || '',
        instance: vm.instance || '',
        software: vm.software || []
      }));
    }
  }, [vm]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSoftware = () => {
    if (newSoftware.trim() && !formData.software.includes(newSoftware.trim())) {
      setFormData(prev => ({
        ...prev,
        software: [...prev.software, newSoftware.trim()]
      }));
      setNewSoftware('');
    }
  };

  const handleRemoveSoftware = (index: number) => {
    setFormData(prev => ({
      ...prev,
      software: prev.software.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setNotification(null);
    
    try {
      // Handle storage update if changed
      if (formData.storageChange !== 0) {
        const storageResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/updateAssessmentStorage/`, {
          new_volume_size: currentStorage + formData.storageChange,
          instance_id: assessmentId,
          lab_id: lab_id,
        });

        if (!storageResponse.data.success) {
          throw new Error(storageResponse.data.message || 'Failed to update storage');
        }
      }

      // Handle other field updates (you can implement this API endpoint)
      if (vm) {
        const updateResponse = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/updateLab/${lab_id}`, {
          title: formData.title,
          description: formData.description,
          cpu: formData.cpu,
          ram: formData.ram,
          os: formData.os,
          provider: formData.provider,
          instance: formData.instance,
          software: formData.software
        });

        if (!updateResponse.data.success) {
          throw new Error(updateResponse.data.message || 'Failed to update lab details');
        }
      }

      setNotification({ type: 'success', message: 'Lab updated successfully' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update lab'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'resources', label: 'Resources', icon: Server },
    { id: 'software', label: 'Software', icon: Tag }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-dark-300/50">
          <h2 className="text-xl sm:text-2xl font-semibold">
            <GradientText>Edit Lab Configuration</GradientText>
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
                    ? 'border-b-2 border-primary-500 text-primary-400 bg-primary-500/5'
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
                      Lab Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      placeholder="Enter lab title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Operating System
                    </label>
                    <input
                      type="text"
                      value={formData.os}
                      onChange={(e) => handleInputChange('os', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      placeholder="e.g., Ubuntu 20.04"
                    />
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
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none resize-vertical"
                    placeholder="Enter lab description"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cloud Provider
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) => handleInputChange('provider', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    >
                      <option value="">Select Provider</option>
                      <option value="AWS">AWS</option>
                      <option value="Azure">Azure</option>
                      <option value="GCP">Google Cloud</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Instance Type
                    </label>
                    <input
                      type="text"
                      value={formData.instance}
                      onChange={(e) => handleInputChange('instance', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      placeholder="e.g., t3.medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                {/* Current Resources Display */}
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
                      <Memory className="h-5 w-5 text-purple-400" />
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
                    <p className="text-2xl font-semibold text-gray-200">{currentStorage}</p>
                  </div>
                </div>

                {/* Storage Modification */}
                <div className="p-4 bg-dark-300/30 rounded-lg border border-primary-500/20">
                  <h3 className="text-lg font-medium text-gray-200 mb-4">Additional Storage</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      value={formData.storageChange}
                      onChange={(e) => handleInputChange('storageChange', Number(e.target.value))}
                      className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none text-center"
                      placeholder="Additional GB"
                    />
                    <button
                      onClick={() => handleInputChange('storageChange', formData.storageChange + 10)}
                      className="px-4 py-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 text-emerald-400 transition-colors"
                    >
                      +10 GB
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 text-center mt-2">
                    New Total: {currentStorage + formData.storageChange} GB
                  </p>
                </div>
              </div>
            )}

            {/* Software Tab */}
            {activeTab === 'software' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add Software Package
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSoftware}
                      onChange={(e) => setNewSoftware(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSoftware()}
                      className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      placeholder="Enter software name"
                    />
                    <button
                      onClick={handleAddSoftware}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Installed Software</h3>
                  {formData.software.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No software packages added</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {formData.software.map((software, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg"
                        >
                          <span className="text-gray-300 text-sm truncate flex-1">{software}</span>
                          <button
                            onClick={() => handleRemoveSoftware(index)}
                            className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
};
