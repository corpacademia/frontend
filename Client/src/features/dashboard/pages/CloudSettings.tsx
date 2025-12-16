
import React, { useState, useEffect } from 'react';
import { Cloud, Plus, Trash2, Edit2, Eye, EyeOff, Loader, Check, X } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';

interface CloudCredential {
  id: string;
  provider: string;
  name: string;
  credentials: any;
  org_id?: string;
  created_at: string;
  updated_at: string;
}

export const CloudSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [credentials, setCredentials] = useState<CloudCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<CloudCredential | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider: 'aws',
    name: '',
    credentials: {
      aws: { access_key: '', secret_key: '', region: '' },
      azure: { subscription_id: '', tenant_id: '', client_id: '', client_secret: '' },
      gcp: { project_id: '', credentials_json: '' },
      datacenter: { api_url: '', username: '', password: '' },
      proxmox: { api_url: '', token: '', secret_key: '', node: '' }
    }
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const endpoint = user?.role === 'superadmin' 
        ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_ms/global-clouds`
        : `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_ms/organization-clouds/${user?.org_id}`;
      
      const response = await axios.get(endpoint);
      if (response.data.success) {
        setCredentials(response.data.clouds || []);
      }
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError('Failed to load cloud credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredential = async () => {
    try {
      const payload = {
        provider: formData.provider,
        name: formData.name,
        credentials: formData.credentials[formData.provider],
        org_id: user?.role === 'orgsuperadmin' ? user?.org_id : undefined
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_ms/add-cloud`,
        payload
      );

      if (response.data.success) {
        setSuccess('Cloud credentials added successfully');
        setIsAddModalOpen(false);
        fetchCredentials();
        resetForm();
      }
    } catch (err) {
      setError('Failed to add cloud credentials');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this cloud credential?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_ms/delete-cloud/${id}`
      );

      if (response.data.success) {
        setSuccess('Cloud credentials deleted successfully');
        fetchCredentials();
      }
    } catch (err) {
      setError('Failed to delete cloud credentials');
    }
  };

  const resetForm = () => {
    setFormData({
      provider: 'aws',
      name: '',
      credentials: {
        aws: { access_key: '', secret_key: '', region: '' },
        azure: { subscription_id: '', tenant_id: '', client_id: '', client_secret: '' },
        gcp: { project_id: '', credentials_json: '' },
        datacenter: { api_url: '', username: '', password: '' },
        proxmox: { api_url: '', token: '', secret_key: '', node: '' }
      }
    });
  };

  const renderCredentialForm = () => {
    const provider = formData.provider;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
            <option value="datacenter">Datacenter</option>
            <option value="proxmox">Proxmox</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Production AWS"
          />
        </div>

        {provider === 'aws' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Access Key</label>
              <input
                type="text"
                value={formData.credentials.aws.access_key}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    aws: { ...formData.credentials.aws, access_key: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Secret Key</label>
              <input
                type="password"
                value={formData.credentials.aws.secret_key}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    aws: { ...formData.credentials.aws, secret_key: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
              <input
                type="text"
                value={formData.credentials.aws.region}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    aws: { ...formData.credentials.aws, region: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="us-east-1"
              />
            </div>
          </>
        )}

        {provider === 'proxmox' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">API URL</label>
              <input
                type="text"
                value={formData.credentials.proxmox.api_url}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    proxmox: { ...formData.credentials.proxmox, api_url: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token</label>
              <input
                type="text"
                value={formData.credentials.proxmox.token}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    proxmox: { ...formData.credentials.proxmox, token: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Secret Key</label>
              <input
                type="password"
                value={formData.credentials.proxmox.secret_key}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    proxmox: { ...formData.credentials.proxmox, secret_key: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">
            <GradientText>Cloud Settings</GradientText>
          </h1>
          <p className="text-gray-400">Manage cloud provider credentials</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Cloud Credential
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 text-primary-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <div key={credential.id} className="glass-panel">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-500/10">
                    <Cloud className="h-6 w-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200">{credential.name}</h3>
                    <p className="text-sm text-gray-400 capitalize">{credential.provider}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCredential(credential.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Added: {new Date(credential.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              <GradientText>Add Cloud Credential</GradientText>
            </h2>
            {renderCredentialForm()}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredential}
                className="btn-primary"
              >
                Add Credential
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-200">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/20 border border-red-500/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center space-x-2">
            <X className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
