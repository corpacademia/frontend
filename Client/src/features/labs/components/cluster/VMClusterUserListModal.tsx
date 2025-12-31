
import React, { useState, useEffect } from 'react';
import {
  X,
  Loader,
  AlertCircle,
  Eye,
  EyeOff,
  LinkIcon,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../../../components/ui/GradientText';

interface VMClusterUserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: any;
  organizationId: string;
}

export const VMClusterUserListModal: React.FC<VMClusterUserListModalProps> = ({ 
  isOpen, 
  onClose, 
  lab, 
  organizationId 
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && lab) {
      fetchUsers();
    }
  }, [isOpen, lab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgVMClusterDatacenterLabs/${organizationId}/${lab.lab_id || lab.labid}`
      );

      if (response.data.success) {
        setUsers(response.data.data[0] || { vms: [], grpCreds: [], userCredGrps: [], users: [] });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleConnectToVM = async (user: any) => {
    try {
      const resp = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
        {
          protocol: user.vmData?.protocol || 'RDP',
          hostname: user.ip,
          port: user.port,
          username: user.username,
          password: user.password,
        }
      );

      if (resp.data.success) {
        const wsPath = resp.data.wsPath;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const hostPort = `${window.location.hostname}:3002`;
        const wsUrl = `${protocol}://${hostPort}${wsPath}`;

        navigate(`/dashboard/labs/vm-session/${lab.labid || lab.lab_id}`, {
          state: {
            guacUrl: wsUrl,
            vmTitle: lab.title,
            vmId: lab.labid || lab.lab_id,
            doc: lab.labguide,
            credentials: [user]
          }
        });
      }
    } catch (error) {
      console.error('Error connecting to VM:', error);
    }
  };

  const handleConnectGroup = (vmid: string, usersInGroup: any) => {
    navigate(`/dashboard/labs/vm-session/${lab?.labid || lab?.lab_id}`, {
      state: {
        guacUrl: null,
        vmTitle: lab.title,
        vmId: lab.labid || lab.lab_id,
        doc: lab.labguide,
        credentials: usersInGroup,
        isGroupConnection: true
      }
    });
  };

  const handleDeleteGroup = async (groupKey: string, usersInGroup: any[]) => {
    setDeletingUserId(groupKey);
    setNotification(null);
    
    try {
      const deletePromises = usersInGroup.map(user => 
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteClusterLab`, {
          labId: lab?.lab_id || lab?.labid,
          orgId: organizationId,
          userId: user.user_id
        })
      );

      const results = await Promise.all(deletePromises);
      
      const allSuccessful = results.every(response => response.data.success);
      
      if (allSuccessful) {
        setNotification({ 
          type: 'success', 
          message: `Group "${groupKey}" deleted successfully` 
        });
        setTimeout(() => {
          setNotification(null);
          fetchUsers();
        }, 2000);
      } else {
        throw new Error('Failed to delete some users in the group');
      }
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.message || 'Failed to delete group' 
      });
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } finally {
      setDeletingUserId(null);
    }
  };

  const groupedUsers = users?.users?.reduce((acc, user) => {
    const groupKey = user.usergroup || 'Unknown Group';
    const vmData = users?.vms?.find(vmItem => vmItem.vmid === user.vmid);

    const grpCred = users?.grpCreds?.find((gc: any) => gc.cred_id === user.vmid);
    const groupId = grpCred?.group_id;

    const assignedUserCredGrp = users?.userCredGrps?.find((ucg: any) => ucg.id === groupId);
    const assignedUserName = assignedUserCredGrp?.user_name || 'Unknown User';

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }

    acc[groupKey].push({
      ...user,
      vmData,
      assignedUserName,
    });

    return acc;
  }, {} as Record<string, Array<any>>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-dark-200 rounded-lg w-full max-w-6xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Cluster User List - {lab.title}</GradientText>
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 text-primary-400 animate-spin" />
          </div>
        ) : Object.keys(groupedUsers || {}).length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400">No users available for this cluster</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedUsers).map(([groupKey, usersInGroup]) => (
              <div key={groupKey} className="bg-dark-300/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary-300">
                    {groupKey} ({usersInGroup.length} user{usersInGroup.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleConnectGroup(groupKey, usersInGroup)}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium text-sm transition-colors flex items-center space-x-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>Connect Group</span>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(groupKey, usersInGroup)}
                      disabled={deletingUserId === groupKey}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-medium text-sm transition-colors flex items-center space-x-2"
                      title="Delete Group"
                    >
                      {deletingUserId === groupKey ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Group</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                        <th className="pb-3">VM Name</th>
                        <th className="pb-3">Assigned User</th>
                        <th className="pb-3">Username</th>
                        <th className="pb-3">Password</th>
                        <th className="pb-3">IP Address</th>
                        <th className="pb-3">Port</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersInGroup.map((user) => (
                        <tr key={user.id} className="border-b border-primary-500/10">
                          <td className="py-3">
                            <div className="font-medium text-gray-300">{user.vmData?.vmname || 'N/A'}</div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-gray-300">{user.assignedUserName}</div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-gray-300">{user.username}</div>
                          </td>
                          <td className="py-3">
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
                          <td className="py-3">
                            <div className="font-mono text-gray-300">{user.ip}</div>
                          </td>
                          <td className="py-3">
                            <div className="font-mono text-gray-300">{user.port}</div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleConnectToVM(user)}
                                className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                title="Connect to VM"
                              >
                                <LinkIcon className="h-4 w-4 text-primary-400" />
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
