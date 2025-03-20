import React, { useState } from 'react';
import { X, Upload, AlertCircle, Check, Loader, Users } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  passingMarks: number;
  instructions: string;
  assignedUsers: string[];
  attachments?: File[];
}

export const AddAssessmentModal: React.FC<AddAssessmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    passingMarks: 60,
    instructions: '',
    assignedUsers: []
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes (5MB limit per file)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Some files exceed the 5MB size limit');
      return;
    }

    setAttachments(prev => [...prev, ...files]);
    setError(null);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return false;
    }
    if (formData.passingMarks < 0 || formData.passingMarks > 100) {
      setError('Passing marks must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formDataToSend.append(key + '[]', v));
        } else {
          formDataToSend.append(key, value);
        }
      });

      attachments.forEach(file => {
        formDataToSend.append('attachments[]', file);
      });

      const response = await axios.post('/api/assessments', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Assessment created successfully');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to create assessment');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            <GradientText>Create Assessment</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-6 pr-2">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
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
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Passing Marks (%)
              </label>
              <input
                type="number"
                name="passingMarks"
                value={formData.passingMarks}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assign Users
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none
                           flex items-center justify-between"
                >
                  <span>
                    {formData.assignedUsers.length 
                      ? `${formData.assignedUsers.length} users selected` 
                      : 'Select users'}
                  </span>
                  <Users className="h-5 w-5 text-gray-400" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-dark-200 border border-primary-500/20 rounded-lg shadow-lg">
                    <div className="max-h-48 overflow-y-auto p-2">
                      {users.map(user => (
                        <label 
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-dark-300/50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedUsers.includes(user.id)}
                            onChange={(e) => {
                              const newUsers = e.target.checked
                                ? [...formData.assignedUsers, user.id]
                                : formData.assignedUsers.filter(id => id !== user.id);
                              setFormData(prev => ({ ...prev, assignedUsers: newUsers }));
                            }}
                            className="form-checkbox h-4 w-4 text-primary-500 rounded border-gray-500/20"
                          />
                          <span className="text-gray-300">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attachments
              </label>
              <div className="space-y-4">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-dark-400/50 border-2 border-primary-500/20 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary-500/40 focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-6 h-6 text-primary-400" />
                    <span className="text-sm text- Continuing with the AddAssessmentModal.tsx file content exactly where we left off:

gray-400">
                      Drop files here or click to browse
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-dark-300/50 rounded-lg"
                      >
                        <span className="text-sm text-gray-300 truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-red-500/20 rounded-lg"
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

            {success && (
              <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-200">{success}</span>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-primary-500/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Creating...
              </span>
            ) : (
              'Create Assessment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};