import React, { useState } from 'react';
import { X, Pencil, Link as LinkIcon, Power, Eye, EyeOff } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Array<{
    id: string;
    username: string;
    password: string;
    ip: string;
    port: string;
    protocol?: string;
    disabled?: boolean;
  }>;
  vmId: string;
  vmTitle: string;
  vm:any;
  onEditUser: (user: any) => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({ 
  isOpen, 
  onClose, 
  users: initialUsers, 
  vmId, 
  vmTitle,
  vm,
  onEditUser
}) => {
  const [users, setUsers] = useState<Array<any>>(initialUsers);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [disablingUser, setDisablingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  // Fetch current user to check permissions
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleDisable = async (userId: string) => {
    setDisablingUser(userId);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVmDatacenterLabCreds`, {
          id:userId,
          disable:true
      });
      
      
      if (response.data.success) {
        // Update the state to reflect the change
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, disabled: true } : user
          )
        );
        
        setSuccess('User disabled successfully');
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response?.data.message || 'Failed to disable user');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while disabling the user');
    } finally {
      setDisablingUser(null);
    }
  };

  const handleEnable = async (userId: string) => {
    setDisablingUser(userId);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVmDatacenterLabCreds`, {
          id:userId,
          disable:false
      });
      
      
      if (response.data.success) {
        // Update the state to reflect the change
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, disabled: false } : user
          )
        );
        
        setSuccess('User enabled successfully');
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response?.data.message || 'Failed to enable user');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while enabling the user');
    } finally {
      setDisablingUser(null);
    }
  };

  // Function to connect to VM with JWT token
  const handleConnectToVM = async (user: any) => {
    try {
      // First, get JWT token
      const tokenResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/connectToDatacenterVm`, {
        Protocol: user.protocol || 'RDP',
        VmId:user.id,
        Ip: user.ip,
        userName: user.username,
        password: user.password,
        port: user.port,
        
      });
      if (tokenResponse.data.success && tokenResponse.data.token) {
        // Then connect to VM using the token
        const guacUrl = `${vm?.guacamole_url}?token=${tokenResponse.data.token.result}`;
          navigate(`/dashboard/labs/vm-session/${vmId}`, {
            state: { 
              guacUrl,
              vmTitle: vm.title,
              vmId: vmId,
              doc:vm.labguide,
              credentials:Array.isArray(user) ? user : [user]
            }
          });
      } else {
        throw new Error('Failed to get connection token');
      }
    } catch (error: any) {
      console.error('Error connecting to VM:', error);
      setError(error.message || 'Failed to connect to VM');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Check if current user can edit content
  const canEditContent = () => {
    if (!currentUser || !vmId) return false;
    // Check if the VM was created by the current user
    return vm.user_id === currentUser.id;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-dark-200 rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>User List - {vmTitle}</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        {users.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400">No users available for this VM</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                  <th className="pb-4 pl-4">Username</th>
                  <th className="pb-4">Password</th>
                  <th className="pb-4">IP Address</th>
                  <th className="pb-4">Port</th>
                  <th className="pb-4">Protocol</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-primary-500/10">
                    <td className="py-4 pl-4">
                      <div className="font-medium text-gray-300">{user.username}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-gray-300">
                          {showPasswords[user.id] ? user.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="p-1 hover:bg-dark-300/50 rounded-lg transition-colors"
                        >
                          {showPasswords[user.id] ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-mono text-gray-300">{user.ip}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-mono text-gray-300">{user.port}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-mono text-gray-300">{user.protocol || 'RDP'}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        {canEditContent() && (
                          <button
                            onClick={() => onEditUser(user)}
                            className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-primary-400" />
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                          onClick={() => handleConnectToVM(user)}
                        >
                          <LinkIcon className="h-4 w-4 text-primary-400" />
                        </button>
                        {canEditContent() && (
                          <button
                            className={`p-2 rounded-lg transition-colors ${user.disabled ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10'}`}
                            onClick={() => user.disabled ? handleEnable(user.id) : handleDisable(user.id)}
                          >
                            <Power className={`h-4 w-4 ${disablingUser === user.id ? 'animate-pulse' : ''} ${user.disabled ? 'text-green-400' : 'text-red-400'}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};