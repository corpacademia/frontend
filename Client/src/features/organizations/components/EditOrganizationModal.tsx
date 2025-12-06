
import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, Globe, AlertCircle, Check, Loader, Upload } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: any;
  onSuccess?: () => void;
}

export const EditOrganizationModal: React.FC<EditOrganizationModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSuccess
}) => {
  const initialFormData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    type: 'enterprise',
    status: 'active',
    orgId: '',
    branding_primary_color: '#0c8ee7',
    branding_secondary_color: '#8257fe',
    theme_mode: 'dark' as 'dark' | 'light'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

    //to extract the file path of logo
    const getUploadedFilePath = (fullPath: string) => {
      const normalizedPath = fullPath.replace(/\\/g, "/"); // Convert \ to /
      const uploadIndex = normalizedPath.indexOf("uploads/");

      if (uploadIndex === -1) return null; // If "uploads/" not found, return null

      return normalizedPath.substring(uploadIndex + 8); // Extract everything after "uploads/"
    };

  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (!isOpen || !organization?.id) return;

      setIsLoading(true);
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
          org_id: organization.id
        });

        if (response.data.success) {
          const orgData = response.data.data;
          setFormData({
            name: orgData.organization_name || '',
            email: orgData.org_email || '',
            phone: orgData.phone_number || '',
            address: orgData.address || '',
            website: orgData.website_url || '',
            type: orgData.org_type || 'enterprise',
            status: orgData.status || 'active',
            orgId: orgData.org_id || '',
            branding_primary_color: orgData.branding_primary_color || '#0c8ee7',
            branding_secondary_color: orgData.branding_secondary_color || '#8257fe',
            theme_mode: orgData.theme_mode || 'dark'
          });

          if (orgData.logo) {
            setLogoPreview(`http://localhost:3004/uploads/${getUploadedFilePath(organization.logo)}`);
   }
        }
      } catch (err) {
        console.error('Failed to fetch organization details:', err);
        setError('Failed to load organization details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgDetails();
  }, [isOpen, organization?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

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

      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('organization_name', formData.name);
      formDataToSend.append('org_email', formData.email);
      formDataToSend.append('phone_number', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('org_type', formData.type);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('org_id', formData.orgId);
      formDataToSend.append('branding_primary_color', formData.branding_primary_color);
      formDataToSend.append('branding_secondary_color', formData.branding_secondary_color);
      formDataToSend.append('theme_mode', formData.theme_mode);


      if (logo) {
        formDataToSend.append('logo', logo);
      }
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]); // Logs all form data entries
      }
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/updateOrganization/${organization.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Organization updated successfully');
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to update organization');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setError(null);
    setSuccess(null);
    setLogo(null);
    setLogoPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-dark-200 rounded-lg p-4 sm:p-6 flex items-center space-x-3">
          <Loader className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-primary-400" />
          <span className="text-sm sm:text-base text-gray-200">Loading organization details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-primary-500/20 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold">
            <GradientText>Edit Organization</GradientText>
          </h2>
          <button 
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-4 sm:py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                    className="w-full pl-8 sm:pl-9 pr-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    required
                  />
                  <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
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
                  className="w-full px-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-9 pr-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    required
                  />
                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
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
                    className="w-full pl-8 sm:pl-9 pr-3 py-2 text-sm sm:text-base bg-dark-400/70 border border-primary-500/30 rounded-lg
                             text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none"
                  />
                  <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-1">
                  Website
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-9 pr-3 py-2 text-sm sm:text-base bg-dark-400/70 border border-primary-500/30 rounded-lg
                             text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none"
                  />
                  <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
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
                  className="w-full px-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="enterprise">Enterprise</option>
                  <option value="education">Education</option>
                  <option value="training">Training</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
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
                  className="w-full px-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="branding_primary_color"
                    value={formData.branding_primary_color}
                    onChange={handleChange}
                    className="h-9 sm:h-10 w-12 sm:w-16 rounded border border-primary-500/20 bg-dark-400/50 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="branding_primary_color"
                    value={formData.branding_primary_color}
                    onChange={handleChange}
                    placeholder="#0c8ee7"
                    className="flex-1 px-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used for primary UI elements</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Secondary Brand Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="branding_secondary_color"
                    value={formData.branding_secondary_color}
                    onChange={handleChange}
                    className="h-9 sm:h-10 w-12 sm:w-16 rounded border border-primary-500/20 bg-dark-400/50 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="branding_secondary_color"
                    value={formData.branding_secondary_color}
                    onChange={handleChange}
                    placeholder="#8257fe"
                    className="flex-1 px-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used for accents and highlights</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Organization Logo
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-lg border border-primary-500/20"
                      />
                    ) : (
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-dark-400/50 border border-primary-500/20 flex items-center justify-center">
                        <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="btn-secondary inline-block cursor-pointer text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4"
                    >
                      Choose Logo
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      Recommended: 200x200px. Max: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Theme Mode
                </label>
                <select
                  name="theme_mode"
                  value={formData.theme_mode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 sm:p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-red-200">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 sm:p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-emerald-200">{success}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 p-4 sm:p-6 border-t border-primary-500/20 flex-shrink-0">
          <GradientText>
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary w-full sm:w-auto text-sm sm:text-base"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </GradientText>
          <GradientText>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto text-sm sm:text-base"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </span>
              ) : (
                'Update Organization'
              )}
            </button>
          </GradientText>
        </div>
      </div>
    </div>
  );
};
