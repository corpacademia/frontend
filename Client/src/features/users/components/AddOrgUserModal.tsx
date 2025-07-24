import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

interface AddOrgUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  adminDetails: any;
  orgId:any;
}

export const AddOrgUserModal: React.FC<AddOrgUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminDetails,
  orgId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear any previous error when user starts typing
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const orgDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
        org_id: orgId})
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/addOrganizationUser`, {
        ...formData,
        admin_id: adminDetails.id,
        organization: orgDetails.data.data.organization,
        org_id: orgId,
        organization_type: orgDetails.data.data.organization_type
      });

      if (response.data.success) {
        setSuccess('Team member added successfully');
        setTimeout(() => {
          resetForm();
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        throw new Error(response.data.error || 'Failed to add team member');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to add team member';
      
      // Handle specific error cases
      if (err.response?.data?.message) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 409) {
        errorMessage = 'Email already exists';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid input data';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to add team members';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-dark-200 flex justify-between items-center p-6 border-b border-primary-500/10">
          <h2 className="text-xl font-semibold">
            <GradientText>Add Team Member</GradientText>
          </h2>
          <button 
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isSubmitting}
            >
              <option value="user">User</option>
              <option value="trainer">Trainer</option>
              <option value="orgadmin">Admin</option>
              <option value="orgsuperadmin">Organization Super Admin</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg animate-fade-in">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg animate-fade-in">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-200">{success}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <GradientText>
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
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
              className="btn-primary min-w-[100px]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Adding...
                </span>
              ) : (
                'Add Member'
              )}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};