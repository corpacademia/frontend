import React, { useState, useRef } from 'react';
import { Calendar, Upload, X, Link as LinkIcon, AlertCircle, Check, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface CreateWorkspaceFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  user: any;
}

export const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({
  onSubmit,
  onCancel,
  user,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'single-vm',
    createdAt: new Date().toISOString().split('T')[0],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      files.forEach(file => {
        formDataToSend.append('files', file);
      });
      formDataToSend.append('user', user.id);
      formDataToSend.append('org_id', user.org_id); 
      await onSubmit(formDataToSend);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      setError('Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-6">
          <GradientText>Create Workspace</GradientText>
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lab Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lab Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
            required
          >
            <option value="single-vm">Single VM</option>
            <option value="dedicated-vm">Dedicated VM</option>
            <option value="vm-cluster">VM Cluster</option>
            <option value="cloud-slice">Cloud Slice</option>
            <option value="emulated">Emulated Environment</option>
            <option value="hybrid">Hybrid Lab</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Documents
          </label>
          <div 
            className="border-2 border-dashed border-primary-500/20 rounded-lg p-8"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-primary-400 mb-4" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                multiple
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-primary-400 hover:text-primary-300"
              >
                Upload files
              </label>
              <p className="mt-1 text-sm text-gray-400">
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Maximum file size: 50MB
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-dark-300/50 rounded-lg"
                >
                  <span className="text-sm text-gray-300 truncate">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-red-500/10 rounded-lg"
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Create Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.createdAt}
              onChange={(e) => setFormData(prev => ({ ...prev, createdAt: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6 border-t border-primary-500/10">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <Loader className="animate-spin h-4 w-4 mr-2" />
              Creating...
            </span>
          ) : (
            'Create Workspace'
          )}
        </button>
      </div>
    </form>
  );
};