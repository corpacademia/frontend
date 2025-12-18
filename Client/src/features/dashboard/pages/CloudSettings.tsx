
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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<CloudCredential | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const endpoint = user?.role === 'superadmin' 
        ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/global-clouds`
        : `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/organization-clouds/${user?.org_id}`;
      
      const response = await axios.get(endpoint);
      if (response.data.success) {
        setCredentials(response.data.data || []);
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
      setIsAdding(true);
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
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateCredential = async () => {
    if (!selectedCredential) return;

    try {
      setIsUpdating(true);
      const payload = {
        provider: formData.provider,
        name: formData.name,
        credentials: formData.credentials[formData.provider],
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/editCredentials/${selectedCredential.id}`,
        payload
      );

      if (response.data.success) {
        setSuccess('Cloud credentials updated successfully');
        setIsEditModalOpen(false);
        setSelectedCredential(null);
        fetchCredentials();
        resetForm();
      }
    } catch (err) {
      setError('Failed to update cloud credentials');
    } finally {
      setIsUpdating(false);
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

  const handleViewDetails = (credential: CloudCredential) => {
    setSelectedCredential(credential);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = async(credential: CloudCredential) => {
    setSelectedCredential(credential);
    
    
    setFormData({
      provider: credential.provider,
      name: credential.name,
      credentials: {
        ...formData.credentials,
        [credential.provider]: credential.credentials
      }
    });
    setIsEditModalOpen(true);
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

  const togglePasswordVisibility = (key: string) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderCredentialForm = (isEdit: boolean = false) => {
    const provider = formData.provider;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            disabled={isEdit}
            className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {provider === 'azure' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subscription ID</label>
              <input
                type="text"
                value={formData.credentials.azure.subscription_id}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    azure: { ...formData.credentials.azure, subscription_id: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tenant ID</label>
              <input
                type="text"
                value={formData.credentials.azure.tenant_id}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    azure: { ...formData.credentials.azure, tenant_id: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client ID</label>
              <input
                type="text"
                value={formData.credentials.azure.client_id}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    azure: { ...formData.credentials.azure, client_id: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client Secret</label>
              <input
                type="password"
                value={formData.credentials.azure.client_secret}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    azure: { ...formData.credentials.azure, client_secret: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </>
        )}

        {provider === 'gcp' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project ID</label>
              <input
                type="text"
                value={formData.credentials.gcp.project_id}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    gcp: { ...formData.credentials.gcp, project_id: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Credentials JSON</label>
              <textarea
                value={formData.credentials.gcp.credentials_json}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    gcp: { ...formData.credentials.gcp, credentials_json: e.target.value }
                  }
                })}
                rows={4}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Paste your GCP credentials JSON here"
              />
            </div>
          </>
        )}

        {provider === 'datacenter' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">API URL</label>
              <input
                type="text"
                value={formData.credentials.datacenter.api_url}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    datacenter: { ...formData.credentials.datacenter, api_url: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={formData.credentials.datacenter.username}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    datacenter: { ...formData.credentials.datacenter, username: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={formData.credentials.datacenter.password}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    datacenter: { ...formData.credentials.datacenter, password: e.target.value }
                  }
                })}
                className="w-full bg-dark-400/50 border border-primary-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Node</label>
              <input
                type="text"
                value={formData.credentials.proxmox.node}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    proxmox: { ...formData.credentials.proxmox, node: e.target.value }
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

  const renderCredentialDetails = (credential: CloudCredential) => {
    const creds = credential.credentials;
    const provider = credential.provider;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Provider</label>
            <p className="text-gray-300 capitalize">{provider}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <p className="text-gray-300">{credential.name}</p>
          </div>
        </div>

        <div className="border-t border-primary-500/20 pt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Credentials</h4>
          
          {provider === 'aws' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Access Key</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-300 flex-1 font-mono text-sm">{creds.access_key}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Secret Key</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-300 flex-1 font-mono text-sm">
                    {showPassword['secret_key'] ? creds.secret_key : '••••••••••••'}
                  </p>
                  <button
                    onClick={() => togglePasswordVisibility('secret_key')}
                    className="p-1 hover:bg-dark-300 rounded transition-colors"
                  >
                    {showPassword['secret_key'] ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Region</label>
                <p className="text-gray-300">{creds.region}</p>
              </div>
            </div>
          )}

          {provider === 'azure' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Subscription ID</label>
                <p className="text-gray-300 font-mono text-sm">{creds.subscription_id}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tenant ID</label>
                <p className="text-gray-300 font-mono text-sm">{creds.tenant_id}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Client ID</label>
                <p className="text-gray-300 font-mono text-sm">{creds.client_id}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Client Secret</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-300 flex-1 font-mono text-sm">
                    {showPassword['client_secret'] ? creds.client_secret : '••••••••••••'}
                  </p>
                  <button
                    onClick={() => togglePasswordVisibility('client_secret')}
                    className="p-1 hover:bg-dark-300 rounded transition-colors"
                  >
                    {showPassword['client_secret'] ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {provider === 'gcp' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Project ID</label>
                <p className="text-gray-300 font-mono text-sm">{creds.project_id}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Credentials JSON</label>
                <div className="flex items-center gap-2">
                  <pre className="text-gray-300 flex-1 font-mono text-xs bg-dark-400/30 p-2 rounded overflow-x-auto">
                    {showPassword['credentials_json'] ? creds.credentials_json : '••••••••••••'}
                  </pre>
                  <button
                    onClick={() => togglePasswordVisibility('credentials_json')}
                    className="p-1 hover:bg-dark-300 rounded transition-colors"
                  >
                    {showPassword['credentials_json'] ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {provider === 'datacenter' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">API URL</label>
                <p className="text-gray-300 font-mono text-sm">{creds.api_url}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Username</label>
                <p className="text-gray-300">{creds.username}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Password</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-300 flex-1 font-mono text-sm">
                    {showPassword['password'] ? creds.password : '••••••••••••'}
                  </p>
                  <button
                    onClick={() => togglePasswordVisibility('password')}
                    className="p-1 hover:bg-dark-300 rounded transition-colors"
                  >
                    {showPassword['password'] ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {provider === 'proxmox' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">API URL</label>
                <p className="text-gray-300 font-mono text-sm">{creds.api_url}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Token</label>
                <p className="text-gray-300 font-mono text-sm">{creds.token}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Secret Key</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-300 flex-1 font-mono text-sm">
                    {showPassword['proxmox_secret'] ? creds.secret_key : '••••••••••••'}
                  </p>
                  <button
                    onClick={() => togglePasswordVisibility('proxmox_secret')}
                    className="p-1 hover:bg-dark-300 rounded transition-colors"
                  >
                    {showPassword['proxmox_secret'] ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              {creds.node && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Node</label>
                  <p className="text-gray-300">{creds.node}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-primary-500/20 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <span className="block mb-1">Created</span>
              <span className="text-gray-300">{new Date(credential.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="block mb-1">Last Updated</span>
              <span className="text-gray-300">{new Date(credential.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
            <GradientText>Cloud Settings</GradientText>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Manage cloud provider credentials</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto text-gray-400"
        >
          <Plus className="h-5 w-5 text-gray-400" />
          Add Cloud Credential
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 text-primary-400 animate-spin" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-12">
          <Cloud className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No cloud credentials configured yet</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Your First Credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {credentials.map((credential) => (
            <div key={credential.id} className="glass-panel hover:border-primary-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-primary-500/10 flex-shrink-0">
                    <Cloud className="h-6 w-6 text-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-200 truncate">{credential.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 capitalize">{credential.provider}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => handleViewDetails(credential)}
                  className="flex-1 px-3 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">View</span>
                </button>
                <button
                  onClick={() => handleEditClick(credential)}
                  className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteCredential(credential.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-primary-500/10">
                Added: {new Date(credential.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-200 p-4 sm:p-6 border-b border-primary-500/20">
              <h2 className="text-xl font-semibold">
                <GradientText>Add Cloud Credential</GradientText>
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {renderCredentialForm()}
            </div>
            <div className="sticky bottom-0 bg-dark-200 p-4 sm:p-6 border-t border-primary-500/20 flex flex-col sm:flex-row justify-end gap-3">
              <GradientText>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="btn-secondary w-full sm:w-auto"
                disabled={isAdding}
              >
                Cancel
              </button>
              </GradientText>
              <GradientText>
              <button
                onClick={handleAddCredential}
                className="btn-primary flex items-center justify-center w-full sm:w-auto"
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Credential'
                )}
              </button>
              </GradientText>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedCredential && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-200 p-4 sm:p-6 border-b border-primary-500/20">
              <h2 className="text-xl font-semibold">
                <GradientText>Edit Cloud Credential</GradientText>
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {renderCredentialForm(true)}
            </div>
            <div className="sticky bottom-0 bg-dark-200 p-4 sm:p-6 border-t border-primary-500/20 flex flex-col sm:flex-row justify-end gap-3">
              <GradientText>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedCredential(null);
                  resetForm();
                }}
                className="btn-secondary w-full sm:w-auto"
                disabled={isUpdating}
              >
                Cancel
              </button>
              </GradientText>
              <GradientText>
              <button
                onClick={handleUpdateCredential}
                className="btn-primary flex items-center justify-center w-full sm:w-auto"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Credential'
                )}
              </button>
              </GradientText>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedCredential && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-200 p-4 sm:p-6 border-b border-primary-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  <GradientText>Credential Details</GradientText>
                </h2>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedCredential(null);
                    setShowPassword({});
                  }}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {renderCredentialDetails(selectedCredential)}
            </div>
            <div className="sticky bottom-0 bg-dark-200 p-4 sm:p-6 border-t border-primary-500/20 flex justify-end">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedCredential(null);
                  setShowPassword({});
                }}
                className="btn-secondary w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4 animate-fade-in z-50 max-w-md">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-200">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/20 border border-red-500/20 rounded-lg p-4 animate-fade-in z-50 max-w-md">
          <div className="flex items-center space-x-2">
            <X className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
