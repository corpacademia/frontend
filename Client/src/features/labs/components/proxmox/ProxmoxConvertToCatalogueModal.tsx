import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertCircle, Calendar, Loader, Check, Clock } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface ProxmoxConvertToCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  vmId: string;
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
  software: string[];
  catalogueType: CatalogueType;
  level: string;
  category: string;
  price: string;
}

interface CleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hours: number) => void;
}

const CleanupModal: React.FC<CleanupModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [hours, setHours] = useState(1);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (hours < 1) {
      setError('Please enter at least 1 hour');
      return;
    }
    onConfirm(hours);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001]">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Cleanup Configuration</GradientText>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cleanup Duration (hours)
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary-400" />
              <input
                type="number"
                min="1"
                value={hours}
                onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
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

          <div className="flex justify-end space-x-4">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const initialFormData: FormData = {
  catalogueName: '',
  organizationId: '',
  software: [''],
  catalogueType: 'private',
  level: '',
  category: '',
  price: '',
};

export const ProxmoxConvertToCatalogueModal: React.FC<ProxmoxConvertToCatalogueModalProps> = ({
  isOpen,
  onClose,
  vmId,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [software, setSoftware] = useState<string[]>(['']);
  const [Org_details, setOrg_details] = useState<org | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [admin, setAdmin] = useState<any>({});

  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        if (admin?.role === 'orgsuperadmin') {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${admin.org_id}`);
          if (response.data.success) {
            const orgAdmins = response.data.data.filter((user: any) => user.role === 'orgadmin');
            setOrganizations(orgAdmins.map((admin: any) => ({
              id: admin.id,
              name: `${admin.name} (${admin.email})`
            })));
          }
        } else {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
          if (response.data.success) {
            setOrganizations(response.data.data.map((org: org) => ({
              id: org.id,
              name: org.organization_name
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    if (isOpen && admin?.id) {
      fetchOrganizations();
    }
  }, [isOpen, admin]);

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

  const handleCleanup = (hours: number) => {
    console.log('Cleanup initiated for', hours, 'hours');
  };

  const validateForm = (): boolean => {
    if (!formData.catalogueName) {
      setError('Catalogue name is required');
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
      const updateCatalogueDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateCatalogueDetails`, {
        catalogueName: formData.catalogueName,
        software: software.filter(s => s.trim() !== ''),
        catalogueType: formData.catalogueType,
        labId: vmId,
        level: formData.level,
        category: formData.category,
        price: formData.price,
      });

      if (formData.organizationId && updateCatalogueDetails.data.success) {
        let org_details = null;
        if (admin.role !== 'orgsuperadmin') {
          org_details = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
            org_id: formData.organizationId
          });

          if (!org_details.data.success) {
            throw new Error('Failed to fetch organization details');
          }
          setOrg_details(org_details.data.data);
        }

        const batchAssignmentPayload: any = {
          lab_id: vmId,
          admin_id: admin.role === 'orgsuperadmin' ? formData.organizationId : org_details?.data.data.org_admin,
          org_id: admin.role === 'orgsuperadmin' ? admin.org_id : org_details?.data.data.id,
          configured_by: admin?.id
        };

        const batch = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/batchAssignment`, batchAssignmentPayload);

        if (batch?.data.success) {
          const updateLabConfig = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateConfigOfLabs`, {
            lab_id: vmId,
            admin_id: admin?.id,
            config_details: formData
          });

          if (updateLabConfig.data.success) {
            setSuccess('Successfully converted to catalogue');
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 2000);
          } else {
            throw new Error('Failed to update lab configuration');
          }
        } else {
          throw new Error(batch?.data?.error || batch?.data?.message || 'Failed to create batch assignment');
        }
      } else if (updateCatalogueDetails.data.success) {
        setSuccess('Successfully converted to catalogue');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Failed to convert to catalogue');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to convert to catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-2xl max-h-[90vh] transform overflow-hidden rounded-xl bg-dark-200 p-4 sm:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold">
              <GradientText>Convert to Catalogue</GradientText>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6 overflow-y-auto flex-1 pr-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Catalogue Name
              </label>
              <input
                type="text"
                name="catalogueName"
                value={formData.catalogueName}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {admin?.role === 'orgsuperadmin' ? 'Assign to Org Admin' : 'Organization'}
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm sm:text-base"
                >
                  <option value="">
                    {admin?.role === 'orgsuperadmin' ? 'Select an org admin' : 'Select an organization'}
                  </option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
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
                  className="w-full px-3 sm:px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm sm:text-base"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm sm:text-base"
                >
                  <option value="">Select Level</option>
                  <option value="Foundation">Foundation</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm sm:text-base"
                >
                  <option value="">Select Category</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="Devops">Devops</option>
                  <option value="Security">Security</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Development">Development</option>
                  <option value="Networking">Networking</option>
                  <option value="Database">Database</option>
                </select>
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
                      className="flex-1 px-3 sm:px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none text-sm sm:text-base"
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
              <div className="p-3 sm:p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span className="text-sm text-red-200">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 sm:p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-emerald-200">{success}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 flex-shrink-0 pt-4 border-t border-primary-500/10">
              <button
                onClick={() => setIsCleanupModalOpen(true)}
                className="btn-secondary w-full sm:w-auto text-sm sm:text-base"
              >
                Cleanup
              </button>
              <button
                onClick={onClose}
                className="btn-secondary w-full sm:w-auto text-sm sm:text-base"
              >
                <GradientText>Cancel</GradientText>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary w-full sm:w-auto text-sm sm:text-base"
              >
                <GradientText>
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Converting...
                    </span>
                  ) : (
                    'Create Catalogue'
                  )}
                </GradientText>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        onConfirm={handleCleanup}
      />
    </div>
  );
};