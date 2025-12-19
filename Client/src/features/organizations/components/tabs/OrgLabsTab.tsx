import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Edit,
  Loader,
  AlertCircle,
  Check,
  X,
  Box,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  LinkIcon,
  Users
} from 'lucide-react';
import axios from 'axios';
import { GradientText } from '../../../../components/ui/GradientText';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';

interface AssignedLab {
  id: string;
  lab_id: string;
  lab_name: string;
  org_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string;
  lab_type: string;
  created_at: string;
}

interface UserLab {
  id: string;
  user_id: string;
  user_name: string;
  lab_name: string;
  launched_at: string;
  status: string;
}

interface OrgLabsTabProps {
  orgId: string;
}

interface EditLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: AssignedLab | null;
  onSuccess: () => void;
}

interface UserLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: AssignedLab | null;
  orgId: string;
}

interface VMClusterUserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: any;
  organizationId: string;
}

const EditLabModal: React.FC<EditLabModalProps> = ({ isOpen, onClose, lab, onSuccess }) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (lab) {
      const start = new Date(lab.start_date);
      const end = new Date(lab.end_date);

      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [lab]);

  const handleSubmit = async () => {
    if (!lab) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        throw new Error('End date must be after start date');
      }

      let response;

      if (lab.lab_type === 'cloudslice') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateOrgLabAssignment`, {
          assignmentId: lab.id,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString()
        });
      } else if (lab.lab_type === 'singlevm') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateOrgLabAssignment`, {
          assignmentId: lab.id,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString()
        });
      } else if (lab.lab_type === 'vmcluster') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateOrgLabAssignment`, {
          assignmentId: lab.id,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString()
        });
      } else if (lab.lab_type === 'singlevm-proxmox') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateProxmoxOrgLabAssignment`, {
          assignmentId: lab.id,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString()
        });
      }

      if (response?.data?.success) {
        setSuccess('Lab assignment updated successfully');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(response?.data?.message || 'Failed to update lab assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update lab assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !lab) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-md">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              Edit Lab Assignment
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-dark-400/50 rounded-lg border border-primary-500/20">
            <p className="text-gray-200 font-medium text-sm">{lab.lab_name}</p>
            <p className="text-xs text-gray-400 mt-1">Lab Type: {lab.lab_type}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date & Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm"
                  />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date & Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm"
                  />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm flex items-start">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  <span className="text-emerald-200 text-xs sm:text-sm">{success}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-dark-400/50 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <>
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserLabsModal: React.FC<UserLabsModalProps> = ({ isOpen, onClose, lab, orgId }) => {
  const [userLabs, setUserLabs] = useState<UserLab[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lab) {
      fetchUserLabs();
    }
  }, [isOpen, lab]);

  const fetchUserLabs = async () => {
    if (!lab) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgLabUserInstances/${orgId}/${lab.lab_id}`
      );

      if (response.data.success) {
        setUserLabs(response.data.data);
      } else {
        throw new Error('Failed to fetch user labs');
      }
    } catch (err) {
      setError('Failed to load user labs');
      setUserLabs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUserLab = async (userLabId: string) => {
    setDeletingId(userLabId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteUserLabInstance/${userLabId}`
      );

      if (response.data.success) {
        setUserLabs(prev => prev.filter(ul => ul.id !== userLabId));
        setSuccess('User lab deleted successfully');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error(response.data.message || 'Failed to delete user lab');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user lab');
      setTimeout(() => setError(null), 2000);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen || !lab) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              User Lab Instances
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-dark-400/50 rounded-lg border border-primary-500/20">
            <p className="text-gray-200 font-medium text-sm">{lab.lab_name}</p>
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

          <div className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-primary-400 animate-spin" />
              </div>
            ) : userLabs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No user labs found
              </div>
            ) : (
              <div className="space-y-3">
                {userLabs.map((userLab) => (
                  <div
                    key={userLab.id}
                    className="bg-dark-400/50 rounded-lg p-3 sm:p-4 border border-primary-500/20 hover:border-primary-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium text-sm truncate">
                          {userLab.user_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Launched: {new Date(userLab.launched_at).toLocaleString()}
                        </p>
                        <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                          userLab.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {userLab.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteUserLab(userLab.id)}
                        disabled={deletingId === userLab.id}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                        title="Delete User Lab"
                      >
                        {deletingId === userLab.id ? (
                          <Loader className="h-4 w-4 text-red-400 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
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

const VMClusterUserListModal: React.FC<VMClusterUserListModalProps> = ({ isOpen, onClose, lab, organizationId }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && lab) {
      fetchUsers();
    }
  }, [isOpen, lab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabUsers`,
        {
          labId: lab.labid,
          orgId: organizationId
        }
      );

      if (response.data.success) {
        setUsers(response.data.data || []);
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

        navigate(`/dashboard/labs/vm-session/${lab.labid}`, {
          state: {
            guacUrl: wsUrl,
            vmTitle: lab.title,
            vmId: lab.labid,
            doc: lab.labguide,
            credentials: [user]
          }
        });
      }
    } catch (error) {
      console.error('Error connecting to VM:', error);
    }
  };

  const handleConnectGroup = () => {
    navigate(`/dashboard/labs/vm-session/${lab.labid}`, {
      state: {
        guacUrl: null,
        vmTitle: lab.title,
        vmId: lab.labid,
        doc: lab.labguide,
        credentials: users,
        isGroupConnection: true
      }
    });
  };

  const groupedUsers = users.reduce((acc, user) => {
    const groupKey = user.usergroup || 'Unknown Group';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(user);
    return acc;
  }, {} as Record<string, any[]>);

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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 text-primary-400 animate-spin" />
          </div>
        ) : Object.keys(groupedUsers).length === 0 ? (
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
                    onClick={handleConnectGroup}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium text-sm transition-colors flex items-center space-x-2"
                  >
                    <LinkIcon className="h-4 w-4" />
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
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersInGroup.map((user) => (
                        <tr key={user.id} className="border-b border-primary-500/10">
                          <td className="py-3">
                            <div className="font-medium text-gray-300">{user.vmData?.vmname || 'N/A'}</div>
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
                            <button
                              onClick={() => handleConnectToVM(user)}
                              className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                              title="Connect to VM"
                            >
                              <LinkIcon className="h-4 w-4 text-primary-400" />
                            </button>
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

// Delete Lab Modal Component
const DeleteLabModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (labId: string) => void;
  labTitle: string;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, labTitle, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-dark-200 rounded-lg p-6 w-full max-w-md text-center">
        <h3 className="text-lg font-semibold text-white mb-4">
          Confirm Deletion
        </h3>
        <p className="text-gray-400 mb-6">
          Are you sure you want to delete the lab assignment "{labTitle}"?
          This action cannot be undone.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-dark-400/50 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(labTitle)} // Assuming labTitle is actually the lab ID for deletion
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const OrgLabsTab: React.FC<OrgLabsTabProps> = ({ orgId }) => {
  const [assignedLabs, setAssignedLabs] = useState<AssignedLab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLab, setSelectedLab] = useState<AssignedLab | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserLabsModalOpen, setIsUserLabsModalOpen] = useState(false);
  const [podModalLab, setPodModalLab] = useState<any>(null);
  const [userListModal, setUserListModal] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedLabs();
  }, [orgId]);

  const fetchAssignedLabs = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgAssignedLabs/${orgId}`
      );

      if (response.data.success) {
        setAssignedLabs(response.data.data);
      } else {
        throw new Error('Failed to fetch assigned labs');
      }
    } catch (err) {
      setError('Failed to load assigned labs');
      setAssignedLabs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (lab: AssignedLab) => {
    setDeletingId(lab.id);
    setError(null);
    setSuccess(null);

    try {
      let response;

      if (lab.lab_type === 'cloudslice') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteOrgLabAssignment/${lab.id}`
        );
      } else if (lab.lab_type === 'singlevm') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteOrgLabAssignment/${lab.id}`
        );
      } else if (lab.lab_type === 'vmcluster') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteOrgLabAssignment/${lab.id}`
        );
      } else if (lab.lab_type === 'singlevm-proxmox') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteProxmoxOrgLabAssignment/${lab.id}`
        );
      }

      if (response?.data?.success) {
        setAssignedLabs(prev => prev.filter(l => l.id !== lab.id));
        setSuccess('Lab assignment deleted successfully');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error(response?.data?.message || 'Failed to delete lab assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete lab assignment');
      setTimeout(() => setError(null), 2000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (lab: AssignedLab) => {
    setSelectedLab(lab);
    setIsEditModalOpen(true);
  };

  const handleViewUserLabs = (lab: AssignedLab) => {
    setSelectedLab(lab);
    setIsUserLabsModalOpen(true);
  };

  const handleDeleteLab = (labId: string) => {
    const labToDelete = assignedLabs.find(l => l.id === labId);
    if (labToDelete) {
      handleDelete(labToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          <GradientText>Assigned Labs</GradientText>
        </h2>
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

      <div className="glass-panel p-0">
        <div className="overflow-x-auto">
          {assignedLabs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No labs assigned to this organization
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-400 border-b border-primary-500/10">
                  <th className="py-4 px-6">Lab Name</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Start Date</th>
                  <th className="py-4 px-6">End Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedLabs.map((lab) => (
                  <tr
                    key={lab.id}
                    className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-200">{lab.lab_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                        {lab.lab_type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-400">
                        {new Date(lab.start_date).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-400">
                        {new Date(lab.end_date).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewUserLabs(lab)}
                          className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                          title="View User Labs"
                        >
                          <Box className="h-4 w-4 text-primary-400" />
                        </button>
                        <button
                          onClick={() => handleEdit(lab)}
                          className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit Assignment"
                        >
                          <Edit className="h-4 w-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (lab.lab_type === 'vmcluster') {
                              setUserListModal(lab);
                            } else {
                              setPodModalLab(lab);
                            }
                          }}
                          className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                          title={lab.lab_type === 'vmcluster' ? 'View Users' : 'View Pods'}
                        >
                          <Users className="h-4 w-4 text-primary-400" />
                        </button>
                        <button
                          onClick={() => setDeletingLab(lab)}
                          disabled={deletingId === lab.id}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Assignment"
                        >
                          {deletingId === lab.id ? (
                            <Loader className="h-4 w-4 text-red-400 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <EditLabModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLab(null);
        }}
        lab={selectedLab}
        onSuccess={fetchAssignedLabs}
      />

      <UserLabsModal
        isOpen={isUserLabsModalOpen}
        onClose={() => {
          setIsUserLabsModalOpen(false);
          setSelectedLab(null);
        }}
        lab={selectedLab}
        orgId={orgId}
      />

      {/* Delete Confirmation Modal */}
      {deletingLab && (
        <DeleteLabModal
          isOpen={!!deletingLab}
          onClose={() => setDeletingLab(null)}
          onConfirm={handleDeleteLab}
          labTitle={deletingLab.lab_name}
          isDeleting={deletingId === deletingLab.id}
        />
      )}

      {/* VMCluster User List Modal */}
      {userListModal && (
        <VMClusterUserListModal
          isOpen={!!userListModal}
          onClose={() => setUserListModal(null)}
          lab={userListModal}
          organizationId={orgId}
        />
      )}
    </div>
  );
};