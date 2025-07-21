
import React, { useState } from 'react';
import { X, Pencil, LinkIcon as ConnectIcon, Power, Eye, EyeOff, Check, AlertCircle, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface VM {
  id: string;
  vmName: string;
  username: string;
  password: string;
  ip: string;
  port: string;
  protocol: string;
  disabled?: boolean;
  vmid: string;
}

interface User {
  id: string;
  username: string;
  vms: VM[];
}

interface ClusterUserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  vmId: string;
  vmTitle: string;
  vm: any;
}

interface EditVMModalProps {
  isOpen: boolean;
  onClose: () => void;
  vm: VM;
  onSave: (vmData: VM) => Promise<void>;
}

const EditVMModal: React.FC<EditVMModalProps> = ({
  isOpen,
  onClose,
  vm,
  onSave,
}) => {
  const [formData, setFormData] = useState<VM>({
    id: vm?.id || '',
    vmName: vm?.vmData.vmname || '',
    username: vm?.username || '',
    password: vm?.password || '',
    ip: vm?.ip || '',
    port: vm?.port || '',
    protocol: vm?.vmData.protocol || 'rdp',
    disabled: vm?.disabled || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      await onSave(formData);
      setNotification({ type: 'success', message: 'VM updated successfully' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update VM' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-dark-200 rounded-lg w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            <GradientText>Edit VM Credentials</GradientText>
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {notification && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/20' 
              : 'bg-red-500/20 border border-red-500/20'
          }`}>
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span className={`text-sm ${
              notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {notification.message}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">VM Name</label>
            <input
              type="text"
              name="vmName"
              value={formData.vmName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
              // disabled={isSubmitting}
              disabled={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">Password</label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">IP Address</label>
            <input
              type="text"
              name="ip"
              value={formData.ip}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
            <input
              type="text"
              name="port"
              value={formData.port}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Protocol</label>
            <select
              name="protocol"
              value={formData.protocol}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              disabled={true}
            >
              <option value="rdp">RDP</option>
              <option value="ssh">SSH</option>
              <option value="vnc">VNC</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
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
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ClusterUserListModal: React.FC<ClusterUserListModalProps> = ({ 
  isOpen, 
  onClose, 
  users: initialUsers, 
  vmId, 
  vmTitle,
  vm
}) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [processingVm, setProcessingVm] = useState<string | null>(null);
  const [editingVm, setEditingVm] = useState<VM | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();

  
  // Group users by unique vmid
 const groupedUsers = users.reduce((acc, user) => {
  const groupKey = user.usergroup || 'Unknown Group';
  const vmData = vm.vms.find(vmItem => vmItem.vmid === user.vmid);

  if (!acc[groupKey]) {
    acc[groupKey] = [];
  }

  acc[groupKey].push({
    ...user,
    vmData,
  });

  return acc;
}, {} as Record<string, Array<any>>);


  const togglePasswordVisibility = (vmId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [vmId]: !prev[vmId]
    }));
  };

  const returnProtocol = (vmId)=>{
       const protocol = vm.vms.find((vm)=>vm.vmid === vmId);
       return protocol?.protocol || 'rdp';
  }

  const handleToggleDisable = async (vmData: VM) => {
    setProcessingVm(vmData.id);
    setNotification(null);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateClusterVmCredentials`, {
        id: vmData.id,
        disable: !vmData.disabled
      });
      
      if (response.data.success) {
        // Update the state to reflect the change
        setUsers(prevUsers =>
             prevUsers.map(user =>
            user.id === vmData.id
          ? { ...user, disabled: !user.disabled  }
           : user
         )
        );
      setNotification({ 
          type: 'success', 
          message: `VM ${!vmData.disabled ? 'disabled' : 'enabled'} successfully` 
        });
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        throw new Error(response?.data.message || 'Failed to update VM status');
      }
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.message || 'An error occurred while updating VM status' 
      });
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } finally {
      setProcessingVm(null);
    }
  };

  const handleConnectToVM = async (vmData: VM) => {
    try {
      // First, get JWT token
      const tokenResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/connectToDatacenterVm`, {
        Protocol: vmData.vmData?.protocol || 'rdp',
        VmId: vmData.id,
        Ip: vmData.ip,
        userName: vmData.username,
        password: vmData.password,
        port: vmData.port,
      });
      
      if (tokenResponse.data.success && tokenResponse.data.token) {
        // Then connect to VM using the token
        const guacUrl = `${vm.lab?.guacamole_url}?token=${tokenResponse.data.token.result}`;
        navigate(`/dashboard/labs/vm-session/${vmId}`, {
          state: { 
            guacUrl,
            vmTitle: vm.title,
            vmId: vmId,
            doc: vm.lab.labguide,
            credentials: [vmData]
          }
        });
      } else {
        throw new Error('Failed to get connection token');
      }
    } catch (error: any) {
      console.error('Error connecting to VM:', error);
      setNotification({ 
        type: 'error', 
        message: error.message || 'Failed to connect to VM' 
      });
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  const handleConnectGroup = (vmid: string, usersInGroup: any[]) => {
    // Navigate to VM session page with all credentials from this group
    navigate(`/dashboard/labs/vm-session/${vmId}`, {
      state: { 
        guacUrl: null, // Will be set when user selects a specific VM
        vmTitle: vm.title,
        vmId: vmId,
        doc: vm.lab.labguide,
        credentials: usersInGroup,
        isGroupConnection: true
      }
    });
  };

  const handleSaveVM = async (vmData: VM) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/editClusterVmCredentials`, {
        id: vmData.id,
        vmName: vmData.vmName,
        username: vmData.username,
        password: vmData.password,
        ip: vmData.ip,
        port: vmData.port,
        protocol: vmData.protocol
      });
      if (response.data.success) {
        // Update the user in the local state
        setUsers(prevUsers => 
             prevUsers.map(user =>
             user.id === response.data.data.id ? response.data.data : user
           )
      );

        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update VM');
      }
    } catch (error) {
      console.error('Error updating VM:', error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="bg-dark-200 rounded-lg w-full max-w-6xl p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              <GradientText>Cluster User List - {vmTitle}</GradientText>
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {notification && (
            <div className={`mb-4 p-3 rounded-lg border ${
              notification.type === 'success' 
                ? 'bg-emerald-900/20 border-emerald-500/20' 
                : 'bg-red-900/20 border-red-500/20'
            }`}>
              <p className={`text-sm ${
                notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {notification.message}
              </p>
            </div>
          )}

          {Object.keys(groupedUsers).length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-400">No users available for this cluster</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedUsers).map(([vmid, usersInGroup]) => (
                <div key={vmid} className="bg-dark-300/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary-300">
                       {vmid} ({usersInGroup.length} user{usersInGroup.length !== 1 ? 's' : ''})
                    </h3>
                    <button
                      onClick={() => handleConnectGroup(vmid, usersInGroup)}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium text-sm transition-colors flex items-center space-x-2"
                    >
                      <ConnectIcon className="h-4 w-4" />
                      <span>Connect Group</span>
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                          <th className="pb-3">VM Name</th>
                          <th className="pb-3">Username</th>
                          <th className="pb-3">Password</th>
                          <th className="pb-3">IP Address</th>
                          <th className="pb-3">Port</th>
                          <th className="pb-3">Protocol</th>
                          <th className="pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersInGroup.map((userWithVm) => (
                          <tr key={`${userWithVm.id}-${userWithVm.vmData.id}`} className="border-b border-primary-500/10">
                            <td className="py-3">
                              <div className="font-medium text-gray-300">{userWithVm.vmData.vmname}</div>
                            </td>
                            <td className="py-3">
                              <div className="font-medium text-gray-300">{userWithVm.username}</div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-gray-300">
                                  {showPasswords[userWithVm.id] ? userWithVm.password : '••••••••'}
                                </span>
                                <button
                                  onClick={() => togglePasswordVisibility(userWithVm.id)}
                                  className="p-1 hover:bg-dark-300/50 rounded-lg transition-colors"
                                >
                                  {showPasswords[userWithVm.id] ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="font-mono text-gray-300">{userWithVm.ip}</div>
                            </td>
                            <td className="py-3">
                              <div className="font-mono text-gray-300">{userWithVm.port}</div>
                            </td>
                            <td className="py-3">
                              <div className="font-mono text-gray-300">{returnProtocol(userWithVm.vmid)}</div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingVm(userWithVm)}
                                  className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                  title="Edit VM"
                                >
                                  <Pencil className="h-4 w-4 text-primary-400" />
                                </button>
                                <button
                                  className={`p-2 rounded-lg transition-colors ${userWithVm.disabled ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10'}`}
                                  onClick={() => handleToggleDisable(userWithVm)}
                                  disabled={processingVm === userWithVm.id}
                                  title={userWithVm.disabled ? 'Enable VM' : 'Disable VM'}
                                >
                                  <Power className={`h-4 w-4 ${processingVm === userWithVm.id ? 'animate-pulse' : ''} ${userWithVm.disabled ? 'text-green-400' : 'text-red-400'}`} />
                                </button>
                                <button
                                  className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                  onClick={() => handleConnectToVM(userWithVm)}
                                  title="Connect to VM"
                                >
                                  <ConnectIcon className="h-4 w-4 text-primary-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingVm && (
        <EditVMModal
          isOpen={!!editingVm}
          onClose={() => setEditingVm(null)}
          vm={editingVm}
          onSave={handleSaveVM}
        />
      )}
    </>
  );
};
