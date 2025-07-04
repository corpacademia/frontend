import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Module } from '../../types/modules';
import axios from 'axios';

interface EditModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module | null;
  onSave: (module: Module) => void;
  labId: string;
}

export const EditModuleModal: React.FC<EditModuleModalProps> = ({ 
  isOpen, 
  onClose, 
  module, 
  onSave,
  labId
}) => {
  const [formData, setFormData] = useState<Module>({
    id: '',
    title: '',
    description: '',
    order: 1,
    totalduration: 60,
    exercises: [],
    labId: labId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (module) {
      setFormData({ ...module,labId: labId });
    } else if (isOpen) {
    } else {
      setFormData({
        id: module?.id || '',
        title: '',
        description: '',
        order: 1,
        totalduration: 60,
        exercises: [],
        labId: labId
      });
    }
  }, [module, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setApiError(null);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Module title is required');
      }

      // If it's an update operation
      if (module?.id) {
        try {
          const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateModule`, formData);
          
          if (response.data.success) {
            // Save module
            onSave(formData);
            onClose();
          } else {
            setApiError(response.data.message || 'Failed to update module');
          }
        } catch (err: any) {
          setApiError(err.response?.data?.message || 'An error occurred while updating the module');
        }
      } else {
        // For new modules
        try {
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/createModule`, formData);
          
          if (response.data.success) {
            // Save module with the ID from the response
            const savedModule = {
              ...formData,
              id: response.data.data.id || formData.id
            };
            onSave(savedModule);
            onClose();
          } else {
            setApiError(response.data.message || 'Failed to create module');
          }
        } catch (err: any) {
          setApiError(err.response?.data?.message || 'An error occurred while creating the module');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>{module ? 'Edit Module' : 'Add Module'}</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Module Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order
              </label>
              <input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                totalduration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalduration}
                onChange={(e) => setFormData({ ...formData, totalduration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
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

          {apiError && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{apiError}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <GradientText>
              <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            </GradientText>
            <GradientText>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </span>
              ) : (
                'Save Module'
              )}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};