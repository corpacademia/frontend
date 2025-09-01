
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader, HardDrive, Plus, Minus, Calendar, FileText, Tag, Server, Cpu, Memory, Upload, Download, MemoryStick } from 'lucide-react';
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
    labguide?: string;
    userguide?: string;
    startdate?: string;
    enddate?: string;
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
  const [activeTab, setActiveTab] = useState<'basic' | 'resources' | 'software' | 'documents'>('basic');
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
    software: vm?.software || [],
    labGuide: vm?.labguide || '',
    userGuide: vm?.userguide || '',
    startDate: vm?.startdate || '',
    endDate: vm?.enddate || ''
  });
  const [newSoftware, setNewSoftware] = useState('');
  const [labGuideFile, setLabGuideFile] = useState<File | null>(null);
  const [userGuideFile, setUserGuideFile] = useState<File | null>(null);
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
        software: vm.software || [],
        labGuide: vm.labguide || '',
        userGuide: vm.userguide || '',
        startDate: vm.startdate || '',
        endDate: vm.enddate || ''
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

  const handleLabGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLabGuideFile(e.target.files[0]);
    }
  };

  const handleUserGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserGuideFile(e.target.files[0]);
    }
  };

  const extractFileName = (filePath: string) => {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
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
        // Create FormData for file uploads
        const updateFormData = new FormData();
        updateFormData.append('labId', lab_id);
        updateFormData.append('title', formData.title);
        updateFormData.append('description', formData.description);
        updateFormData.append('cpu', formData.cpu.toString());
        updateFormData.append('ram', formData.ram.toString());
        updateFormData.append('os', formData.os);
        updateFormData.append('provider', formData.provider);
        updateFormData.append('instance', formData.instance);
        updateFormData.append('software', JSON.stringify(formData.software));
        updateFormData.append('startDate', formData.startDate);
        updateFormData.append('endDate', formData.endDate);
        
        // Always include existing file references if available
        if (formData.labGuide) {
          updateFormData.append('existingLabGuide', formData.labGuide);
        }
        if (formData.userGuide) {
          updateFormData.append('existingUserGuide', formData.userGuide);
        }

        // Append new files if selected
        if (labGuideFile) {
          updateFormData.append('labGuide', labGuideFile);
        }
        if (userGuideFile) {
          updateFormData.append('userGuide', userGuideFile);
        }

        const updateResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVMAwsLab`, updateFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
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
    { id: 'software', label: 'Software', icon: Tag },
    { id: 'documents', label: 'Documents', icon: Upload }
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
                      <option value="aws">AWS</option>
                      <option value="azure">Azure</option>
                      <option value="gcp">Google Cloud</option>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={ formData.startDate && new Date(formData.startDate).toISOString().slice(0, 16)}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={ formData.endDate && new Date(formData.endDate).toISOString().slice(0, 16)}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
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

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                {/* Lab Guide and User Guide Upload */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lab Guide
                    </label>
                    <div className="flex flex-col space-y-2">
                      {formData.labGuide && formData.labGuide.map((filepath)=>(
                        <div className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">
                            {extractFileName(filepath)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/uploads/${extractFileName(filepath)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-primary-500/10 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4 text-primary-400" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, labGuide: ''})}
                              className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id="labGuide"
                          onChange={handleLabGuideChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                        />
                        <label
                          htmlFor="labGuide"
                          className="flex-1 px-4 py-3 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 cursor-pointer hover:bg-dark-400 transition-colors
                                   flex items-center justify-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {labGuideFile ? labGuideFile.name : "Upload New Lab Guide"}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      User Guide
                    </label>
                    <div className="flex flex-col space-y-2">
                      {formData.userGuide && formData.userGuide.map((filepath) => (
                        <div className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">
                            {extractFileName(filepath)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/uploads/${extractFileName(filepath)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-primary-500/10 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4 text-primary-400" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, userGuide: ''})}
                              className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id="userGuide"
                          onChange={handleUserGuideChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                        />
                        <label
                          htmlFor="userGuide"
                          className="flex-1 px-4 py-3 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 cursor-pointer hover:bg-dark-400 transition-colors
                                   flex items-center justify-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {userGuideFile ? userGuideFile.name : "Upload New User Guide"}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Guidelines */}
                <div className="p-4 bg-dark-300/30 rounded-lg border border-primary-500/10">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Upload Guidelines</h3>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Supported formats: PDF, DOC, DOCX, TXT</li>
                    <li>• Maximum file size: 10MB per file</li>
                    <li>• Lab Guide: Instructions for lab setup and configuration</li>
                    <li>• User Guide: Step-by-step instructions for users</li>
                  </ul>
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
