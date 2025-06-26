import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface ConvertToCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  sliceId: string;
}

export const ConvertToCatalogueModal: React.FC<ConvertToCatalogueModalProps> = ({
  isOpen,
  onClose,
  sliceId
}) => {
  const [organization, setOrganization] = useState('');
  const [isPublic, setIsPublic] = useState('no');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/organization_ms/organizations');
        if (response.data.success) {
          setOrganizations(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!organization) {
      setError('Please select an organization');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user_profile = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      const response = await axios.post('http://localhost:3000/api/v1/cloud_slice_ms/cloudSliceOrgAssignment', {
        sliceId,
        organizationId: organization,
        userId: user_profile.data.user.id,
        isPublic: isPublic === 'yes'
      });

      if (response.data.success) {
        setSuccess('Cloud slice converted to catalogue successfully');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to convert to catalogue');
      }
    } catch (err: any) {
      console.log(err)
      setError(err.response?.data?.message || 'Failed to convert to catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-dark-200 rounded-lg w-full max-w-md p-6 z-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              <GradientText>Convert to Catalogue</GradientText>
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
                Organization
              </label>
              <select
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              >
                <option value="">Select an organization</option>
                <option value="none">None</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.organization_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Make Public
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isPublic"
                    value="yes"
                    checked={isPublic === 'yes'}
                    onChange={() => setIsPublic('yes')}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isPublic"
                    value="no"
                    checked={isPublic === 'no'}
                    onChange={() => setIsPublic('no')}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">No</span>
                </label>
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

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
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
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};