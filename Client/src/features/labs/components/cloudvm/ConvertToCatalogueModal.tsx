import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertCircle, Calendar, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface ConvertToCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  vmId: string;
  amiId?: string;
}

interface Organization {
  id: string;
  name: string;
}

interface org {
  id: string;
  organization_name: string;
  org_id: string;
  org_admin: string;
  org_type: string;
}

type CatalogueType = 'private' | 'public';

interface FormData {
  catalogueName: string;
  organizationId: string;
  numberOfInstances: number;
  numberOfDays: number;
  expiresIn: string;
  software: string[];
  catalogueType: CatalogueType;
}

const initialFormData: FormData = {
  catalogueName: '',
  organizationId: '',
  numberOfInstances: 1,
  numberOfDays: 1,
  expiresIn: '',
  software: [''],
  catalogueType: 'private'
};

export const ConvertToCatalogueModal: React.FC<ConvertToCatalogueModalProps> = ({
  isOpen,
  onClose,
  vmId,
  amiId
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [software, setSoftware] = useState<string[]>(['']);
  const [Org_details, setOrg_details] = useState<org | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const admin = JSON.parse(localStorage.getItem('auth') || '{}').result || {};

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/organizations');
        if (response.data.success) {
          setOrganizations(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      }
    };

    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setSoftware(['']);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSoftware = () => {
    setSoftware([...software, '']);
  };

  const handleRemoveSoftware = (index: number) => {
    setSoftware(software.filter((_, i) => i !== index));
  };

  const handleSoftwareChange = (index: number, value: string) => {
    const newSoftware = [...software];
    newSoftware[index] = value;
    setSoftware(newSoftware);
  };

  const validateForm = (): boolean => {
    if (!formData.catalogueName) {
      setError('Catalogue name is required');
      return false;
    }
    if (!formData.organizationId) {
      setError('Organization is required');
      return false;
    }
    if (formData.numberOfInstances < 1) {
      setError('Number of instances must be at least 1');
      return false;
    }
    if (formData.numberOfDays < 1) {
      setError('Number of days must be at least 1');
      return false;
    }
    if (!formData.expiresIn) {
      setError('Expiration date is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const org_details = await axios.post('http://localhost:3000/api/v1/getOrgDetails', {
        org_id: formData.organizationId
      });

      if (org_details.data.success) {
        setOrg_details(org_details.data.data);

        const batch = await axios.post('http://localhost:3000/api/v1/batchAssignment', {
          lab_id: vmId,
          admin_id: org_details.data.data.org_admin,
          org_id: org_details.data.data.id,
          config_details: formData,
          configured_by: admin.id,
          software: software.filter(s => s.trim() !== ''),
        });

        if (batch.data.success) {
          const updateLabConfig = await axios.post('http://localhost:3000/api/v1/updateConfigOfLabs', {
            lab_id: vmId,
            admin_id: admin.id,
            config_details: formData
          });

          if (updateLabConfig.data.success) {
            setSuccess('Successfully converted to catalogue');
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            throw new Error('Failed to update lab configuration');
          }
        } else {
          throw new Error(batch.data.message || 'Failed to create batch assignment');
        }
      } else {
        throw new Error('Failed to fetch organization details');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to convert to catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setSoftware(['']);
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-dark-200 p-6 text-left shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              <GradientText>Convert to Catalogue</GradientText>
            </h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Catalogue Name
              </label>
              <input
                type="text"
                name="catalogueName"
                value={formData.catalogueName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">Select an organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.organization_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catalogue Type
                </label>
                <select
                  name="catalogueType"
                  value={formData.catalogueType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Instances
                </label>
                <input
                  type="number"
                  name="numberOfInstances"
                  min="1"
                  value={formData.numberOfInstances}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  name="numberOfDays"
                  min="1"
                  value={formData.numberOfDays}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expires In
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="expiresIn"
                  value={formData.expiresIn}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Software
              </label>
              <div className="space-y-2">
                {software.map((s, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={s}
                      onChange={(e) => handleSoftwareChange(index, e.target.value)}
                      placeholder="Enter software name"
                      className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                    {software.length > 1 && (
                      <button
                        onClick={() => handleRemoveSoftware(index)}
                        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Minus className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddSoftware}
                  className="flex items-center text-sm text-primary-400 hover:text-primary-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Software
                </button>
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

            <div className="flex justify-end space-x-4">
              <button
                onClick={handleClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Converting...
                  </span>
                ) : (
                  'Create Catalogue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};