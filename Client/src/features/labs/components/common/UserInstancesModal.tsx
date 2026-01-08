
import React, { useState, useEffect } from 'react';
import {
  X,
  Loader,
  AlertCircle,
  Check,
  Trash2,
  LinkIcon,
  Play,
  Users
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/authStore';

interface UserInstancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: any;
  orgId?: string;
  labType: 'cloudslice' | 'singlevm-datacenter' | 'vmcluster-datacenter' | 'singlevm-proxmox' | 'singlevm-aws';
}

export const UserInstancesModal: React.FC<UserInstancesModalProps> = ({
  isOpen,
  onClose,
  lab,
  orgId,
  labType
}) => {
  const [userInstances, setUserInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && lab) {
      fetchUserInstances();
    }
  }, [isOpen, lab]);

  const fetchUserInstances = async () => {
    if (!lab) return;

    setIsLoading(true);
    setError(null);
    try {
      console.log(labType)
      let response;
      const effectiveOrgId = orgId || user?.org_id || 'superadmin';
      const labId = lab.lab_id || lab.labid;
      if (labType === 'cloudslice') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgCloudSliceUserInstances/${effectiveOrgId}/${labId}`
        );
        
      }
      else if(labType === 'singlevm-aws'){
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgSingleVmUserInstances/${effectiveOrgId}/${labId}`
       );
        }
       else if (labType === 'singlevm-datacenter') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgsingleVmDatacenterUserInstances/${effectiveOrgId}/${labId}`
        );
      } else if (labType === 'vmcluster-datacenter') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgVMClusterDatacenterLabs/${effectiveOrgId}/${labId}`
        );
      } else if (labType === 'singlevm-proxmox') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgProxmoxUserInstances/${effectiveOrgId}/${labId}`
        );
      }

      if (response?.data.success) {
        setUserInstances(response.data.data);
      } else {
        throw new Error('Failed to fetch user instances');
      }
    } catch (err) {
      setError('Failed to load user instances');
      setUserInstances([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUserInstance = async (userInstance: any) => {
    setDeletingId(userInstance.id);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      const labId = lab.lab_id || lab.labid;

      if (labType === 'cloudslice') {
        if (userInstance.role === 'user') {
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteUserCloudSlice`,
            {
              labId: userInstance.labid || userInstance.lab_id,
              userId: userInstance.user_id,
              purchased: false
            }
          );
        }
      } else if (labType === 'singlevm-datacenter') {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteSingleVmDatacenterUserAssignment`,
          {
            labId: labId,
            userId: userInstance.user_id || userInstance.userid
          }
        );
      } else if (labType === 'vmcluster-datacenter') {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteClusterLab`,
          {
            labId: labId,
            orgId: orgId || user?.org_id,
            userId: userInstance.user_id || userInstance.userid
          }
        );
      } else if (labType === 'singlevm-proxmox') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteUserProxmoxInstance/${userInstance.id}`
        );
      }

      if (response?.data.success) {
        setUserInstances(prev => prev.filter(u => u.id !== userInstance.id));
        setSuccess('User instance deleted successfully');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error(response?.data.message || 'Failed to delete user instance');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user instance');
      setTimeout(() => setError(null), 2000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLaunchConnect = async (userInstance: any) => {
    setLaunchingId(userInstance.id);
    setError(null);

    try {
      const labId = lab.lab_id || lab.labid;

      if (labType === 'cloudslice') {
        if (userInstance?.role === 'user') {
          if (userInstance?.modules === 'without-modules') {
            if (!userInstance.launched) {
              const createIamUser = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`,
                {
                  userName: userInstance.name,
                  services: userInstance.services,
                  role: userInstance.role,
                  labid: userInstance.labid,
                  user_id: userInstance.user_id,
                  purchased: userInstance?.purchased || false
                }
              );

              if (createIamUser.data.success) {
                await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`,
                  {
                    status: 'active',
                    launched: true,
                    labId: userInstance.labid,
                    userId: userInstance.user_id,
                    purchased: userInstance?.purchased || false
                  }
                );
              }
            }
          } else {
            if (!userInstance.launched) {
              await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`,
                {
                  status: 'active',
                  launched: true,
                  labId: userInstance.labid,
                  userId: userInstance.user_id,
                  purchased: userInstance?.purchased || false
                }
              );
            }
          }
        } else {
          if (!userInstance.launched) {
            if (userInstance?.modules === 'without-modules') {
              const createIamAccount = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`,
                {
                  userName: userInstance?.name,
                  services: userInstance?.services,
                  role: userInstance?.role,
                  labid: userInstance?.labid || userInstance?.lab_id,
                  orgid: userInstance?.orgid || userInstance?.org_id,
                  purchased: userInstance?.purchased || false
                }
              );

              if (!createIamAccount.data.success) {
                throw new Error(createIamAccount.data.message || 'Failed to create IAM user');
              }

              await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`,
                {
                  labId: userInstance?.labid || userInstance?.lab_id,
                  orgId: userInstance?.orgid,
                  status: 'active',
                  launched: true
                }
              );
            } else {
              await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`,
                {
                  labId: userInstance?.labid || userInstance?.lab_id,
                  orgId: userInstance?.orgid,
                  status: 'active',
                  launched: true
                }
              );
            }
          }
        }
        fetchUserInstances();
        // Show CloudSlice modal with credentials
        setSuccess('CloudSlice instance launched successfully');
        setTimeout(() => setSuccess(null), 2000);
      } else if (labType === 'singlevm-proxmox') {
        if (!userInstance?.islaunched) {
          if (userInstance?.role === 'user') {
            await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchUserVm`,
              {
                node: userInstance?.node,
                labid: userInstance?.labid,
                name: userInstance?.vmname,
                userid: userInstance?.user_id,
                type: 'user',
                purchased: userInstance?.purchased ? true : false
              }
            );
          } else {
            await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchVM`,
              {
                node: userInstance.node,
                labid: userInstance.labid,
                name: userInstance.vmname,
                cores: userInstance.cpu,
                memory: userInstance.ram,
                storageType: userInstance.storagetype,
                storage: userInstance.storage,
                nicModel: userInstance.nicmodel,
                networkBridge: userInstance.networkbridge,
                firewall: userInstance.firewall,
                boot: userInstance.boot,
                template: userInstance?.template_id,
                type: 'org',
                userid: userInstance?.user_id,
                vmdetails_id: userInstance?.vmdetails_id
              }
            );
          }
          fetchUserInstances();
        } else {
          const startResponse = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/startVM`,
            {
              lab_id: userInstance?.labid,
              vmid: userInstance?.vmid,
              node: userInstance?.node,
              type: userInstance?.role === 'user' ? 'user' : 'org',
              userid: userInstance?.user_id,
              purchased: userInstance?.purchased ? true : false
            }
          );

          if (startResponse.data.success) {
            const backData = startResponse.data.data;
            const resp = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
              {
                protocol: backData.protocol,
                hostname: backData.hostname,
                port: backData.port,
                username: userInstance?.username,
                password: userInstance?.password
              }
            );

            if (resp.data.success) {
              const wsPath = resp.data.wsPath;
              const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
              const hostPort = `${window.location.hostname}:3002`;
              const wsUrl = `${protocol}://${hostPort}${wsPath}`;
              navigate(`/dashboard/labs/vm-session/${userInstance?.labid}`, {
                state: {
                  guacUrl: wsUrl,
                  vmTitle: userInstance?.title,
                  doc: userInstance?.userguide
                }
              });
            }
          }
        }
      } else if (labType === 'singlevm-datacenter') {
        const credsResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getDatacenterLabCreds`,
          { labId: labId }
        );

        if (userInstance?.role === 'labadmin' || userInstance?.role === 'orgsuperadmin') {
          navigate(`/dashboard/labs/vm-session/${labId}`, {
            state: {
              guacUrl: null,
              vmTitle: lab?.title,
              vmId: labId,
              doc: lab?.labguide,
              credentials: credsResponse?.data.success ? credsResponse?.data.data : null,
              isGroupConnection: true
            }
          });
        } else {
          const creds = credsResponse?.data.success
            ? credsResponse?.data.data.find((data: any) => data.assigned_to === userInstance.user_id)
            : null;

          if (!creds) {
            throw new Error('Credentials not found for this user');
          }

          const resp = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
            {
              protocol: creds.protocol || 'RDP',
              hostname: creds.ip,
              port: creds.port,
              username: creds.username,
              password: creds.password
            }
          );

          if (resp.data.success) {
            const wsPath = resp.data.wsPath;
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const hostPort = `${window.location.hostname}:3002`;
            const wsUrl = `${protocol}://${hostPort}${wsPath}`;

            navigate(`/dashboard/labs/vm-session/${labId}`, {
              state: {
                guacUrl: wsUrl,
                vmTitle: lab.title,
                vmId: labId,
                doc: lab?.userguide,
                credentials: [creds]
              }
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to launch/connect');
      setTimeout(() => setError(null), 2000);
    } finally {
      setLaunchingId(null);
    }
  };

  if (!isOpen || !lab) return null;

  // Group instances by role
  const groupedByRole = userInstances.reduce((acc, userLab) => {
    const role = userLab.role || 'user';
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(userLab);
    return acc;
  }, {} as Record<string, any[]>);

  const roleOrder = ['orgsuperadmin', 'labadmin', 'trainer', 'user'];
  const roleLabels = {
    orgsuperadmin: 'Organization Super Admins',
    labadmin: 'Lab Admins',
    trainer: 'Trainers',
    user: 'Users'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              User Instances - {lab.title}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm flex items-start">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                <span className="text-emerald-200 text-xs sm:text-sm">{success}</span>
              </div>
            </div>
          )}

          <div className="overflow-y-auto max-h-[70vh]">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-primary-400 animate-spin" />
              </div>
            ) : userInstances.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No user instances found
              </div>
            ) : (
              <div className="space-y-6">
                {roleOrder.map((role) => {
                  const labsForRole = groupedByRole[role];
                  if (!labsForRole || labsForRole.length === 0) return null;

                  return (
                    <div key={role} className="space-y-3">
                      <div className="flex items-center space-x-2 pb-2 border-b border-primary-500/20">
                        <Users className="h-4 w-4 text-primary-400" />
                        <h4 className="text-sm font-semibold text-primary-300">
                          {roleLabels[role]} ({labsForRole.length})
                        </h4>
                      </div>
                      {labsForRole.map((userLab) => (
                        <div
                          key={userLab.id}
                          className="bg-dark-400/50 rounded-lg p-3 sm:p-4 border border-primary-500/20 hover:border-primary-500/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-200 font-medium text-sm truncate">
                                {userLab.name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                User ID: {userLab.user_id || userLab.userid}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Launched: {new Date(userLab.startdate).toLocaleString()}
                              </p>
                              <span
                                className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  userLab.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-gray-500/20 text-gray-300'
                                }`}
                              >
                                {userLab.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              {labType !== 'vmcluster-datacenter' && (
                                <button
                                  onClick={() => handleLaunchConnect(userLab)}
                                  disabled={launchingId === userLab.id}
                                  className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                  title={userLab.launched ? 'Connect' : 'Launch'}
                                >
                                  {launchingId === userLab.id ? (
                                    <Loader className="h-4 w-4 text-primary-400 animate-spin" />
                                  ) : userLab?.launched || userLab?.islaunched ? (
                                    <LinkIcon className="h-4 w-4 text-primary-400" />
                                  ) : (
                                    <Play className="h-4 w-4 text-primary-400" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUserInstance(userLab)}
                                disabled={deletingId === userLab.id}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete User Instance"
                              >
                                {deletingId === userLab.id ? (
                                  <Loader className="h-4 w-4 text-red-400 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-primary-500/10">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-dark-400/50 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
