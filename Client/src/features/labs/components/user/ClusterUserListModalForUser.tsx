
import React, { useEffect, useState } from 'react';
import { X, LinkIcon as ConnectIcon, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
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

interface ClusterUserListModalForUserProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  vmId: string;
  vmTitle: string;
  vm: any;
}

export const ClusterUserListModalForUser: React.FC<ClusterUserListModalForUserProps> = ({ 
  isOpen, 
  onClose, 
  users: initialUsers, 
  vmId, 
  vmTitle,
  vm
}) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [userData,setUserData] = useState<any>(null);
  const navigate = useNavigate();

 useEffect(()=>{
   const fetchUserProfile = async () => {
     const userProfile = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
     setUserData(userProfile.data.user);
   };
   fetchUserProfile();
 },[])
  // Group users by unique vmid
  const groupedUsers = users.reduce((acc, user) => {
    const groupKey = user.usergroup || 'Unknown Group';
    const vmData = vm.vms?.find(vmItem => vmItem.vmid === user.vmid);

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

  const returnProtocol = (vmId) => {
    const protocol = vm.vms?.find((vm) => vm.vmid === vmId);
    return protocol?.protocol || 'rdp';
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
        const updateStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateUserVMClusterDatacenterStatus`,{
          labId:vm?.lab?.labid,
          userId:userData.id,
          status:'started'
        });

        // Then connect to VM using the token
        const guacUrl = `${vm.lab?.guacamole_url}?token=${tokenResponse.data.token.result}`;
        navigate(`/dashboard/labs/vm-session/${vmId}`, {
          state: { 
            guacUrl,
            vmTitle: vm.title,
            vmId: vmId,
            doc: vm.lab?.labguide,
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

  const handleConnectGroup = async (vmid: string, usersInGroup: any[]) => {
    const updateStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateUserVMClusterDatacenterStatus`,{
          labId:vm?.lab?.labid,
          userId:userData.id,
          status:'started'
        });
    
    
    // Navigate to VM session page with all credentials from this group
    navigate(`/dashboard/labs/vm-session/${vmId}`, {
      state: { 
        guacUrl: null, // Will be set when user selects a specific VM
        vmTitle: vm.title,
        vmId: vmId,
        doc: vm.lab?.labguide,
        credentials: usersInGroup,
        isGroupConnection: true
      }
    });
  };

  if (!isOpen) return null;

  return (
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
                        <tr key={`${userWithVm.id}-${userWithVm.vmData?.id}`} className="border-b border-primary-500/10">
                          <td className="py-3">
                            <div className="font-medium text-gray-300">{userWithVm.vmData?.vmname}</div>
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
  );
};
