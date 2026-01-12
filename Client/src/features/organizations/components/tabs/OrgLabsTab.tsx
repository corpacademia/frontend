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
  Users,
  Play,
  Plus
} from 'lucide-react';
import axios from 'axios';
import { GradientText } from '../../../../components/ui/GradientText';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/authStore';

interface AssignedLab {
  id: string;
  lab_id: string;
  title: string;
  org_id: string;
  assigned_by: string;
  startdate: string;
  enddate: string;
  type: string;
  created_at: string;
}

interface UserLab {
  id: string;
  user_id: string;
  name: string;
  role?: string;
  title: string;
  launched_at: string;
  status: string;
  launched?: boolean;
  protocol?: string;
  ip?: string;
  port?: string;
  username?: string;
  password?: string;
}

interface OrgLabsTabProps {
  orgId: string;
}

interface EditLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: AssignedLab | null;
  onSuccess: () => void;
  orgId: string | null
}

interface UserLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: AssignedLab | null;
  orgId: string;
  onShowCloudSliceModal: (userLab: any) => void;
}

interface VMClusterUserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: any;
  organizationId: string;
}

interface AddLabToOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess: () => void;
}

const AddLabToOrgModal: React.FC<AddLabToOrgModalProps> = ({ isOpen, onClose, orgId, onSuccess }) => {
  const [availableLabs, setAvailableLabs] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [startdate, setStartDate] = useState('');
  const [starttime, setStartTime] = useState('');
  const [enddate, setEndDate] = useState('');
  const [endtime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchAvailableLabs();
      // Set default dates
      const now = new Date();
      const endDateTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      setStartDate(now.toLocaleDateString('en-CA'));
      setStartTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setEndDate(endDateTime.toLocaleDateString('en-CA'));
      setEndTime(endDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [isOpen]);

  const fetchAvailableLabs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabs`);
      if (response.data.success) {
        setAvailableLabs(response.data.data);
      }
    } catch (err) {
      setError('Failed to load available labs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLab) {
      setError('Please select a lab');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const startDateTime = new Date(`${startdate}T${starttime}`);
      const endDateTime = new Date(`${enddate}T${endtime}`);

      if (endDateTime <= startDateTime) {
        throw new Error('End date must be after start date');
      }

      const lab = availableLabs.find(l => l.lab_id === selectedLab || l.labid === selectedLab);

      if (!lab) {
        throw new Error('Selected lab not found');
      }
      let org_details = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
        org_id: orgId
      });

      if (!org_details.data.success) {
        throw new Error('Failed to fetch organization details');
      }

      let response;

      if (lab?.type === 'cloudslice') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/cloudSliceOrgAssignment`, {
          sliceId: lab?.labid,
          organizationId: orgId,
          userId: user?.id,
          startDate: startDateTime.toISOString(),
          admin_id: org_details.data.data.org_admin,
          endDate: endDateTime || lab?.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (lab?.type === 'singlevm-datacenter') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/singleVMDatacenterLabOrgAssignment`, {
          labId: lab?.labid,
          orgId: orgId,
          assignedBy: user?.id,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime || lab?.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (lab?.type === 'vm-cluster') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/assignToOrganization`, {
          labId: lab?.labid,
          orgId: orgId,
          assignedBy: user?.id,
          startDate: startDateTime.toISOString(),
          admin_id: org_details.data.data.org_admin,
          endDate: endDateTime || lab?.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (lab?.type === 'singlevm-proxmox') {

        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignLabToOrg`, {
          labId: lab?.labid,
          orgId: orgId,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime || lab?.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_by: user?.id,
          user_id: org_details.data.data.org_admin,
          userName: org_details?.data?.data?.organization_name || ''
        });
      } else {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/batchAssignment`, {
          lab_id: lab?.labid,
          admin_id: org_details.data.data.org_admin,
          org_id: orgId,
          configured_by: user?.id,
          enddate: endDateTime || lab?.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      if (response?.data?.success) {
        setSuccess('Lab assigned to organization successfully');
        setTimeout(() => {
          onSuccess();
          onClose();
          resetForm();
        }, 1500);
      } else {
        throw new Error(response?.data?.message || 'Failed to assign lab to organization');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign lab to organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedLab('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setError(null);
    setSuccess(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-md">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              Add Lab to Organization
            </h3>
            <button onClick={() => { onClose(); resetForm(); }} className="p-2 hover:bg-dark-300 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Lab
              </label>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 text-primary-400 animate-spin" />
                </div>
              ) : (
                <select
                  value={selectedLab}
                  onChange={(e) => {
                    const labId = e.target.value;
                    setSelectedLab(labId);

                    const selected = availableLabs.find(
                      lab => lab.labid === labId || lab.lab_id === labId
                    );

                    if (selected) {
                      // DATE
                      setStartDate(selected.startdate?.slice(0, 10) || '');
                      setEndDate(selected.enddate?.slice(0, 10) || '');

                      // TIME
                      setStartTime(selected.starttime?.slice(0, 5) || '');
                      setEndTime(selected.endtime?.slice(0, 5) || '');
                    }
                  }}

                  className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">Select a lab</option>
                  {availableLabs.map((lab) => (
                    <option key={lab?.lab_id || lab.labid} value={lab.labid}>
                      {lab.title} ({lab.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date & Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={startdate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={starttime}
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
                    value={enddate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={endtime}
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
                onClick={() => { onClose(); resetForm(); }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-dark-400/50 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedLab}
                className="flex-1 px-4 py-2.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Add Lab</span>
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

const EditLabModal: React.FC<EditLabModalProps> = ({ isOpen, onClose, lab, orgId, onSuccess }) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (lab) {
      const start = new Date(lab.startdate);
      const end = new Date(lab.enddate);

      setStartDate(start.toLocaleDateString('en-CA')); // YYYY-MM-DD
      setStartTime(start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

      setEndDate(end.toLocaleDateString('en-CA'));
      setEndTime(end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
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
      // return;
      let response;
      if (lab.type === 'cloudslice') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateUserCloudSliceTimes`, {

          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          labId: lab?.lab_id,
          identifier: orgId,
          type: "org"
        });
      }
      else if (lab.type === 'singlevm-datacenter') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVMDatacenterLabTime`, {

          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          labId: lab?.lab_id,
          identifier: orgId,
          type: "org"
        });
      }

      else if (lab.type === 'singlevm') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateOrgLabAssignment`, {
          assignmentId: lab.id,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString()
        });
      } else if (lab.type === 'vmcluster-datacenter') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateUserLabTimingsOfVMClusterDatacenter`, {
          labId: lab?.lab_id || lab?.labid,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          identifier: orgId,
          type: "org"
        });
      } else if (lab.type === 'singlevm-proxmox') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVMOrgLabTime`, {
          labId: lab?.lab_id || lab?.labid,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          identifier: orgId,
          type: "org"
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
            <p className="text-gray-200 font-medium text-sm">{lab.title}</p>
            <p className="text-xs text-gray-400 mt-1">Lab Type: {lab.type}</p>
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

const UserLabsModal: React.FC<UserLabsModalProps> = ({ isOpen, onClose, lab, orgId, onShowCloudSliceModal }) => {
  const [userLabs, setUserLabs] = useState<UserLab[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const navigate = useNavigate();

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
      let response;
      if (lab.type === 'cloudslice') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgCloudSliceUserInstances/${orgId}/${lab.lab_id}`
        );
      }
      else if (lab.type === 'singlevm-datacenter') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgsingleVmDatacenterUserInstances/${orgId}/${lab.lab_id}`
        );
      }
      else if (lab.type === 'vmcluster-datacenter') {
        response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgVMClusterDatacenterLabs/${orgId}/${lab.lab_id}`)
      }
      else if (lab.type === 'singlevm-aws') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgSingleVmUserInstances/${orgId}/${lab.lab_id}`
        );
      } else if (lab.type === 'singlevm-proxmox') {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgProxmoxUserInstances/${orgId}/${lab.lab_id}`
        );
      }

      if (response?.data.success) {
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

  // Group user labs by role
  const groupedByRole = userLabs.reduce((acc, userLab) => {
    const role = userLab.role || 'user';
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(userLab);
    return acc;
  }, {} as Record<string, UserLab[]>);

  const roleOrder = ['orgsuperadmin', 'labadmin', 'trainer', 'user'];
  const roleLabels = {
    orgsuperadmin: 'Organization Super Admins',
    labadmin: 'Lab Admins',
    trainer: 'Trainers',
    user: 'Users'
  };

  const handleDeleteUserLab = async (userLab: any) => {
    setDeletingId(userLab?.labid || userLab?.lab_id);
    setError(null);
    setSuccess(null);
    try {
      let response;
      if (lab?.type === 'cloudslice') {
        if (userLab?.role === 'user') {
          if(userLab?.username){
          const deleteIam = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deleteIamAccount`,{
                    userName:userLab?.username
                  })}
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteUserCloudSlice`, {
            labId: userLab?.labid || userLab?.lab_id,
            userId: userLab.user_id,
            purchased: false
          }
          );
        }

      }
      else if (lab?.type === 'singlevm-datacenter') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteSingleVmDatacenterUserAssignment`, {
          labId: lab?.lab_id || lab?.labid,
          userId: userLab?.user_id || userLab?.userid
        })
      }
      else if (lab.type === 'vmcluster-datacenter') {

        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteClusterLab`, {
          labId: lab?.lab_id || lab?.labid,
          orgId: orgId,
          userId: userLab?.user_id || userLab?.userid
        })
      }
      else if (lab.type === 'singlevm') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteUserLabInstance/${userLabId}`
        );
      } else if (lab.type === 'singlevm-proxmox') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteUserProxmoxInstance/${userLabId}`
        );
      }

      if (response?.data.success) {
        setUserLabs(prev => prev.filter(ul => ul.user_id !== userLab?.user_id));
        groupedByRole[userLab]
        setSuccess('User lab deleted successfully');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error(response?.data.message || 'Failed to delete user lab');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user lab');
      setTimeout(() => setError(null), 2000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLaunchConnect = async (userLab: UserLab) => {
    setLaunchingId(userLab?.id || userLab?.user_id);
    setError(null);

    try {
      if (lab?.type === 'cloudslice') {
        if (userLab?.role === 'user') {
          if (userLab?.modules === 'without-modules') {
            // Call createIamUser only if the lab is not already launched
            if (!userLab.launched) {
              const createIamUser = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
                userName: userLab.name,
                services: userLab.services,
                role: userLab?.role,
                labid: userLab.labid,
                user_id: userLab.user_id,
                purchased: userLab?.purchased || false
              });

              if (createIamUser.data.success) {
                const updateUserLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`, {
                  status: 'active',
                  launched: true,
                  labId: userLab.labid,
                  userId: userLab.user_id,
                  purchased: userLab?.purchased || false
                })

              }
            }

          } else { // It's a module-based lab
            if (!userLab.launched) {
              const updateUserLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`, {
                status: 'active',
                launched: true,
                labId: userLab.labid,
                userId: userLab.user_id,
                purchased: userLab?.purchased || false
              })
            }

          }
        }
        else {
          if (!userLab.launched) {
            if (userLab?.modules === 'without-modules') {
              const createIamAccount = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
                userName: userLab?.name,
                services: userLab?.services,
                role: userLab?.role,
                labid: userLab?.labid || userLab?.lab_id,
                orgid: userLab?.orgid || userLab?.org_id,
                purchased: userLab?.purchased || false
              });

              if (!createIamAccount.data.success) {
                throw new Error(createIamAccount.data.message || 'Failed to create IAM user');
              }

              const updateLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`, {
                labId: userLab?.labid || userLab?.lab_id,
                orgId: userLab?.orgid,
                status: 'active',
                launched: true,
              });

              if (!updateLabStatus.data.success) {
                throw new Error(updateLabStatus.data.message || 'Failed to update lab status');
              }

            } 
            else {
              const updateOrg =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`, {
              labId: userLab?.labid || userLab?.lab_id,
              orgId: userLab?.orgid,
              status: 'active',
              launched: true,
            });
               if(!updateOrg?.data?.success){
                throw new Error(updateOrg?.data?.message || 'Failed to update the lab status')
               }
               navigate(`/dashboard/labs/cloud-slices/${userLab?.labid}/modules`,{
                state:{
                  user:userLab
                }}
              ); 
             
          }
          }
           navigate(`/dashboard/labs/cloud-slices/${userLab?.labid}/modules`,{
            state:{
              user:userLab
            }}
           );     
         }
        fetchUserLabs();
        // For cloudslice, show modal with credentials
        onShowCloudSliceModal(userLabs.find(lab => lab.id === userLab.id));
      }

      else if (lab?.type === 'singlevm-aws') {
        // AWS Single VM handling - same logic as CloudVMCard and CloudVMAssessmentCard
        try {
          // Check if instance is assigned to this user
          const cloudinstanceDetails = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`,
            {
              user_id: userLab?.user_id,
              lab_id: userLab?.labid || userLab?.lab_id,
            }
          );

          // If no instance assigned, launch a new one
          if (!cloudinstanceDetails.data.success) {
            const ami = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiinformation`,
              { lab_id: userLab?.labid || userLab?.lab_id }
            );

            if (!ami.data.success) {
              throw new Error('Failed to retrieve AMI details');
            }

            // Launch new instance
            const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/launchInstance`,
              {
                name: userLab?.name,
                ami_id: ami.data.result.ami_id,
                user_id: userLab?.user_id,
                lab_id: userLab?.labid || userLab?.lab_id,
                instance_type: userLab?.instance || lab?.instance,
                start_date: userLab?.startdate ? new Date(userLab.startdate).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
                end_date: userLab?.enddate ? new Date(userLab.enddate).toISOString().slice(0, 19).replace('T', ' ') : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
              }
            );

            if (response.data.success) {
              setSuccess('Instance launched successfully. Please wait for it to start...');
              fetchUserLabs();
            }
            return;
          }

          // Instance exists, check if it's already started
          const checkInstanceAlreadyStarted = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/checkisstarted`,
            {
              type: 'user',
              id: cloudinstanceDetails?.data.data.instance_id,
            }
          );

          // If instance hasn't been started before
          if (checkInstanceAlreadyStarted.data.isStarted === false) {
            const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`,
              {
                os_name: userLab?.os || lab?.os,
                instance_id: cloudinstanceDetails?.data.data.instance_id,
                hostname: cloudinstanceDetails?.data.data.public_ip,
                password: cloudinstanceDetails?.data.data.password,
                buttonState: 'Start Lab'
              }
            );

            if (response.data.response.success && response.data.response.result) {
              // Update instance state in database
              await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,
                {
                  lab_id: userLab?.labid || userLab?.lab_id,
                  user_id: userLab?.user_id,
                  state: true,
                  isStarted: false,
                  type: 'org'
                }
              );

              // Parse connection details
              const Data = JSON.parse(response.data.response.result);
              const userName = Data.username;
              const protocol = Data.protocol;
              const port = Data.port;

              // Get Guacamole URL
              const resp = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
                {
                  protocol: protocol,
                  hostname: cloudinstanceDetails?.data?.data.public_ip,
                  port: port,
                  username: userName,
                  password: cloudinstanceDetails?.data.data.password,
                }
              );

              if (resp.data.success) {
                const wsPath = resp.data.wsPath;
                const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
                const hostPort = `${window.location.hostname}:${3002}`;
                const wsUrl = `${wsProtocol}://${hostPort}${wsPath}`;

                navigate(`/dashboard/labs/vm-session/${userLab?.labid || userLab?.lab_id}`, {
                  state: {
                    guacUrl: wsUrl,
                    vmTitle: userLab?.title || lab?.title,
                    doc: userLab?.labguide || lab?.labguide
                  }
                });
              }
            }
          } 
          else {
            // Instance has been started before, need to restart it
            const restart = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/restart_instance`,
              {
                instance_id: cloudinstanceDetails?.data.data.instance_id,
                user_type: 'user'
              }
            );

            if (restart.data.success) {
              // Get updated instance details after restart
              const cloudInstanceDetailsNew = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`,
                {
                  user_id: userLab?.user_id,
                  lab_id: userLab?.labid || userLab?.lab_id,
                }
              );

              if (cloudInstanceDetailsNew.data.success) {
                const response = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`,
                  {
                    os_name: userLab?.os || lab?.os,
                    instance_id: cloudInstanceDetailsNew?.data.data.instance_id,
                    hostname: cloudInstanceDetailsNew?.data.data.public_ip,
                    password: cloudInstanceDetailsNew?.data.data.password,
                    buttonState: 'Start Lab'
                  }
                );

                if (response.data.success) {
                  // Update database that the instance is started
                  await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,
                    {
                      lab_id: userLab?.labid || userLab?.lab_id,
                      user_id: userLab?.user_id,
                      state: true,
                      isStarted: true,
                      type: 'org'
                    }
                  );

                  // Parse connection details
                  const Data = JSON.parse(response.data.response.result);
                  const userName = Data.username;
                  const protocol = Data.protocol;
                  const port = Data.port;

                  // Get Guacamole URL
                  const resp = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
                    {
                      protocol: protocol,
                      hostname: cloudInstanceDetailsNew?.data?.data?.public_ip,
                      port: port,
                      username: userName,
                      password: cloudInstanceDetailsNew?.data?.data?.password,
                    }
                  );

                  if (resp.data.success) {
                    const wsPath = resp.data.wsPath;
                    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
                    const hostPort = `${window.location.hostname}:${3002}`;
                    const wsUrl = `${wsProtocol}://${hostPort}${wsPath}`;

                    navigate(`/dashboard/labs/vm-session/${userLab?.labid || userLab?.lab_id}`, {
                      state: {
                        guacUrl: wsUrl,
                        vmTitle: userLab?.title || lab?.title,
                        doc: userLab?.labguide || lab?.labguide
                      }
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('AWS VM launch error:', error);
          throw new Error(error?.response?.data?.message || 'Failed to launch AWS VM');
        }
      }

      else if (lab?.type === 'singlevm-proxmox') {
        console.log(userLab)
        if (!userLab?.islaunched) {
          setIsLoading(true);
          if (userLab?.role === 'user') {
            const launchVM = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchUserVm`, {
              node: userLab?.node,
              labid: userLab?.labid,
              name: userLab?.vmname,
              userid: userLab?.user_id,
              type: 'user',
              purchased: userLab?.purchased ? true : false,
            });
          }
          else {
            const launchVM = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchVM`, {
              node: userLab.node,
              labid: userLab.labid,
              name: userLab.vmname,
              cores: userLab.cpu,
              memory: userLab.ram,
              storageType: userLab.storagetype,
              storage: userLab.storage,
              nicModel: userLab.nicmodel,
              networkBridge: userLab.networkbridge,
              firewall: userLab.firewall,
              boot: userLab.boot,
              template: userLab?.template_id,
              type: 'org',
              userid: userLab?.user_id,
              vmdetails_id: userLab?.vmdetails_id
            })
          }
          fetchUserLabs();
        }
        else {
          if (userLab?.role === 'user') {
            const startResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/startVM`, {
              lab_id: userLab?.labid,
              vmid: userLab?.vmid,
              node: userLab?.node,
              type: 'user',
              userid: userLab?.user_id,
              purchased: userLab?.purchased ? true : false,
            });

            if (startResponse.data.success) {
              const backData = startResponse.data.data;
              const resp = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
                {
                  protocol: backData.protocol,
                  hostname: backData.hostname,
                  port: backData.port,
                  username: userLab?.username,
                  password: userLab?.password,
                }
              );

              if (resp.data.success) {
                const wsPath = resp.data.wsPath; // e.g. /rdp?token=...
                // Build full ws url for guacamole-common-js
                const protocol = window.location.protocol === "https:" ? "wss" : "ws";
                const hostPort = `${window.location.hostname}:${3002}`; // adapt if backend on different port
                const wsUrl = `${protocol}://${hostPort}${wsPath}`;
                navigate(`/dashboard/labs/vm-session/${userLab?.labid}`, {
                  state: {
                    guacUrl: wsUrl,
                    vmTitle: userLab?.title,
                    doc: userLab?.userguide
                  }
                });
              }
            } else {
              throw new Error(startResponse.data.message || 'Failed to start VM');
            }
          }
          else {
            const startResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/startVM`, {
              lab_id: userLab?.labid,
              vmid: userLab?.vmid,
              node: userLab?.node,
              type: 'org',
              userid: userLab?.user_id,
              purchased: userLab?.purchased ? true : false,
            });

            if (startResponse.data.success) {
              const backData = startResponse.data.data;
              const resp = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
                {
                  protocol: backData.protocol,
                  hostname: backData.hostname,
                  port: backData.port,
                  username: userLab?.username,
                  password: userLab?.password,
                }
              );

              if (resp.data.success) {
                const wsPath = resp.data.wsPath; // e.g. /rdp?token=...
                // Build full ws url for guacamole-common-js
                const protocol = window.location.protocol === "https:" ? "wss" : "ws";
                const hostPort = `${window.location.hostname}:${3002}`; // adapt if backend on different port
                const wsUrl = `${protocol}://${hostPort}${wsPath}`;
                navigate(`/dashboard/labs/vm-session/${userLab?.labid}`, {
                  state: {
                    guacUrl: wsUrl,
                    vmTitle: userLab?.title,
                    doc: userLab?.labguide
                  }
                });
              }
            } else {
              throw new Error(startResponse.data.message || 'Failed to start VM');
            }
          }
        }

      }
      else {
        const credsResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getDatacenterLabCreds`,
          { labId: lab?.lab_id || lab?.labid }
        );
        if (userLab?.role === 'labadmin' || userLab?.role === 'orgsuperadmin') {
          navigate(`/dashboard/labs/vm-session/${lab.lab_id}`, {
            state: {
              guacUrl: null,
              vmTitle: lab?.title,
              vmId: lab?.lab_id || lab?.labid,
              doc: lab?.labguide,
              credentials: credsResponse?.data.success ? credsResponse?.data.data : null,
              isGroupConnection: true
            }
          });
        }
        else {
          const creds = credsResponse?.data.success ? credsResponse?.data.data.find((data: any) => data.assigned_to === userLab.user_id) : null;

          const resp = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
            {
              protocol: creds.protocol || 'RDP',
              hostname: creds.ip,
              port: creds.port,
              username: creds.username,
              password: creds.password,
            }
          );

          if (resp.data.success) {
            const wsPath = resp.data.wsPath;
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const hostPort = `${window.location.hostname}:3002`;
            const wsUrl = `${protocol}://${hostPort}${wsPath}`;

            navigate(`/dashboard/labs/vm-session/${lab.lab_id}`, {
              state: {
                guacUrl: wsUrl,
                vmTitle: lab.title,
                vmId: lab.lab_id,
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
      setIsLoading(false);
    }
  };
  if (!isOpen || !lab) return null;
  console.log(groupedByRole)
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
            <p className="text-gray-200 font-medium text-sm">{lab.title}</p>
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
                                User ID: {userLab.user_id || userLab.userid || userLab.admin_id}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Launched: {new Date(userLab.startdate).toLocaleString()}
                              </p>
                              <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${userLab.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                {userLab.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              {lab?.type !== 'vmcluster-datacenter' && (
                                <button
                                  onClick={() => handleLaunchConnect(userLab)}
                                  disabled={launchingId === userLab.id}
                                  className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                  title={userLab.launched ? 'Connect' : 'Launch'}
                                >
                                  {launchingId === userLab.id ? (
                                    <Loader className="h-4 w-4 text-primary-400 animate-spin" />
                                  ) : userLab?.isstarted || userLab?.launched || userLab?.islaunched  ? (
                                    <LinkIcon className="h-4 w-4 text-primary-400" />
                                  ) : (
                                    <Play className="h-4 w-4 text-primary-400" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUserLab(userLab)}
                                disabled={deletingId === (userLab?.labid || userLab?.lab_id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete User Lab"
                              >
                                {deletingId === (userLab?.labid || userLab?.lab_id) ? (
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

const VMClusterUserListModal: React.FC<VMClusterUserListModalProps> = ({ isOpen, onClose, lab, organizationId }) => {
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgVMClusterDatacenterLabs/${organizationId}/${lab.lab_id}`)

      if (response.data.success) {
        // Assuming response.data.data contains an object with vms, grpCreds, userCredGrps, and users
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

  const handleConnectGroup = (vmid: string, usersInGroup: any) => {
    navigate(`/dashboard/labs/vm-session/${lab?.labid || lab?.lab_id}`, {
      state: {
        guacUrl: null,
        vmTitle: lab.title,
        vmId: lab.labid,
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
      // Delete all users in the group
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
    // Find group_id from grpCreds where cred_id matches vmid
    const grpCred = users?.grpCreds?.find((gc: any) => gc.cred_id === user.id);
    const groupId = grpCred?.group_id;
    // Find assigned user from userCredGrps where id matches group_id
    const assignedUserCredGrp = users?.userCredGrps?.find((ucg: any) => ucg.id === groupId);
    const assignedUserId = assignedUserCredGrp?.userassigned;
    const assignedUserName = users?.userData?.find((user) => user?.user_id === assignedUserId)?.name || 'Not Assigned';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }

    acc[groupKey].push({
      ...user,
      vmData,
      assignedUserName,
      user_id: assignedUserId
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
          <div className={`mb-4 p-3 rounded-lg border ${notification.type === 'success'
              ? 'bg-emerald-900/20 border-emerald-500/20'
              : 'bg-red-900/20 border-red-500/20'
            }`}>
            <p className={`text-sm ${notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'
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
  const { user } = useAuthStore();
  const [assignedLabs, setAssignedLabs] = useState<AssignedLab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLab, setSelectedLab] = useState<AssignedLab | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserLabsModalOpen, setIsUserLabsModalOpen] = useState(false);
  const [userListModal, setUserListModal] = useState<any>(null);
  const [deletingLab, setDeletingLab] = useState<AssignedLab | null>(null);
  const [cloudSliceModal, setCloudSliceModal] = useState<any>(null);
  const [isAddLabModalOpen, setIsAddLabModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedLabs();
  }, [orgId]);
  useEffect(() => {
    // Fetch organizations when component mounts
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
        if (response.data.success) {
          setOrganizations(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    fetchOrganizations();
  }, []);
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
    setDeletingId(lab.lab_id);
    setError(null);
    setSuccess(null);
    try {
      let response;
      if (lab.type === 'cloudslice') {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/orgAdminDeleteCloudSlice/${lab.lab_id}`, {
          orgId
        }
        );
      }
      else if (lab.type === 'singlevm-datacenter') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteAssignedSingleVMDatacenterLab`, {
          labId: lab?.lab_id || lab?.labid,
          orgId
        })
      }

      else if (lab.type === 'singlevm-aws') {
        response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/delete/${lab.lab_id}`
        );
      } else if (lab.type === 'vmcluster-datacenter') {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteFromOrganization`, {
          labId: lab?.lab_id || lab?.labid,
          orgId,
          adminId: organizations?.find((org) => org.id === orgId)?.org_admin
        }
        );
      } else if (lab.type === 'singlevm-proxmox') {
        const labData = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgProxmoxUserInstances/${orgId}/${lab.lab_id}`
        );
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteOrgAssignedLab`, {
          labId: lab?.lab_id || lab?.labid,
          orgId,
          adminId: labData.data.data[0]?.user_id,
          node: labData.data.data[0]?.node,
          vmid: labData.data.data[0]?.vmid
        }
        );
      }

      if (response?.data?.success) {
        setAssignedLabs(prev => prev.filter(l => l.labid || l.lab_id !== lab?.labid || lab?.lab_id));
        setSuccess('Lab assignment deleted successfully');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error(response?.data?.message || 'Failed to delete lab assignment');
      }
    } catch (err: any) {
      console.log(err)
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

  const handleDeleteLab = (assignmentId: string) => {
    const labToDelete = assignedLabs.find(l => l.lab_id === assignmentId);
    if (labToDelete) {
      handleDelete(labToDelete);
      setDeletingLab(null);
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
        {user?.role === 'superadmin' && (
          <button
            onClick={() => setIsAddLabModalOpen(true)}
            className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg transition-colors flex items-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lab to Organization</span>
          </button>
        )}
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
                      <div className="font-medium text-gray-200">{lab.title}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                        {lab.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-400">
                        {new Date(lab.startdate).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-400">
                        {new Date(lab.enddate).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            if (lab.type === 'vmcluster-datacenter') {
                              setUserListModal(lab);
                            } else {
                              handleViewUserLabs(lab);
                            }
                          }}
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
        orgId={orgId}
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
        onShowCloudSliceModal={setCloudSliceModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteLabModal
        isOpen={!!deletingLab}
        onClose={() => setDeletingLab(null)}
        onConfirm={() => deletingLab && handleDeleteLab(deletingLab.lab_id || deletingLab?.labid)}
        labTitle={deletingLab?.title || ''}
        isDeleting={deletingId === deletingLab?.id}
      />

      {/* CloudSlice Credentials Modal */}
      {cloudSliceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>AWS CloudSlice Credentials</GradientText>
              </h2>
              <button
                onClick={() => setCloudSliceModal(null)}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <div className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300">
                  {cloudSliceModal.username || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                <div className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 font-mono">
                  {cloudSliceModal.password || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">AWS Console</label>
                <a
                  href="https://console.aws.amazon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/20 rounded-lg text-primary-300 transition-colors text-center"
                >
                  Open AWS Console
                </a>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setCloudSliceModal(null)}
                className="px-4 py-2 bg-dark-400/50 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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

      {/* Add Lab to Organization Modal */}
      <AddLabToOrgModal
        isOpen={isAddLabModalOpen}
        onClose={() => setIsAddLabModalOpen(false)}
        orgId={orgId}
        onSuccess={fetchAssignedLabs}
      />
    </div>
  );
};