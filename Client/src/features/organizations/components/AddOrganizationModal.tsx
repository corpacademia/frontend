import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, Globe, Upload, AlertCircle, Check, Loader } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  adminName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  type: 'training' | 'enterprise' | 'education';
  orgId: string;
  logo: File | null;
}

export const AddOrganizationModal: React.FC<AddOrganizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    adminName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    type: 'enterprise',
    orgId: '',
    logo: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [admin, setAdmin] = useState({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setFormData(prev => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.orgId.trim()) {
      setError('Organization ID is required');
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
      formDataToSend.append('organization_name', formData.name);
      formDataToSend.append('admin_name', formData.adminName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('org_type', formData.type);
      formDataToSend.append('org_id', formData.orgId);
      formDataToSend.append('admin_id', admin.id);
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/createOrganization`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Organization added successfully');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to add organization');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center p-4 border-b border-primary-500/10">
          <h2 className="text-xl font-semibold">
            <GradientText>Add Organization</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Organization Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-1.5 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
                <Building2 className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Organization ID
              </label>
              <input
                type="text"
                name="orgId"
                value={formData.orgId}
                onChange={handleChange}
                className="w-full px-3 py-1.5 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Admin Name
              </label>
              <input
                type="text"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                className="w-full px-3 py-1.5 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-1.5 bg-dark-400/70 border border-primary-500/30 rounded-lg
                           text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none"
                  required
                />
                <Mail className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-1.5 bg-dark-400/70 border border-primary-500/30 rounded-lg
                           text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none"
                />
                <Phone className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Website
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-1.5 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
                <Globe className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Organization Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-1.5 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              >
                <option value="enterprise">Enterprise</option>
                <option value="education">Education</option>
                <option value="training">Training</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-1.5 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Organization Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-16 object-cover rounded-lg border border-primary-500/20"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-dark-400/50 border border-primary-500/20 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="btn-secondary inline-block cursor-pointer text-sm py-1.5"
                  >
                    Choose Logo
                  </label>
                  <p className="mt-1 text-xs text-gray-400">
                    Recommended: 200x200px. Max: 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-200 text-sm">{success}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-primary-500/10">
          <GradientText>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 px-4 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            </GradientText>
            <GradientText>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Adding...
                </span>
              ) : (
                'Add Organization'
              )}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};