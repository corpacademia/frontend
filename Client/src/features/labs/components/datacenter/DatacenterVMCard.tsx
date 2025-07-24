import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../../store/authStore';
import { 
  BeakerIcon, 
  BookOpenIcon, 
  UserIcon, 
  LayoutDashboardIcon,
  GraduationCapIcon,
  AwardIcon,
  CloudIcon,
  LinkIcon
} from 'lucide-react';
import { 
  Server, 
  Users, 
  Calendar, 
  Clock, 
  Pencil, 
  Trash2, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  Loader,
  Power,
  Eye,
  EyeOff,
  FileText,
  Upload,
  Download
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { UserListModal } from './UserListModal';
import { EditUserModal } from './EditUserModal';
import { ConvertToCatalogueModal } from '../cloudvm/ConvertToCatalogueModal';
import { AssignUsersModal } from '../catalogue/AssignUsersModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';

interface DatacenterVM {
  id: string;
  title: string;
  description: string;
  platform: string;
  protocol: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'pending';
  users: Array<{
    id: string;
    username: string;
    password: string;
    ip: string;
    port: string;
  }>;
  software?: string[];
  labguide?: string;
  userguide?: string;
}

interface DatacenterVMCardProps {
  vm: DatacenterVM;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  vmTitle: string;
}

interface UserCredential {
  id?: string;
  username: string;
  password: string;
  ip: string;
  port: string;
  protocol: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  vmTitle
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-dark-200 rounded-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Confirm Deletion</GradientText>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">{vmTitle}</span>? This
            action cannot be undone.
          </p>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="btn-primary bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                'Delete VM'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export const DatacenterVMCard: React.FC<DatacenterVMCardProps> = ({ vm }) => {
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullStartDate, setShowFullStartDate] = useState(false);
  const [showFullEndDate, setShowFullEndDate] = useState(false);
  const [vmUsers, setVmUsers] = useState<Array<any>>(vm.userscredentials || []);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [software, setSoftware] = useState<string[]>(vm.software || []);
  // Edit lab modal states
  const [isEditLabModalOpen, setIsEditLabModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: vm.title,
    description: vm.description || '',
    startDate: new Date(vm.startdate),
    endDate: new Date(vm.enddate),
    credentials: [] as UserCredential[],
    software: vm.software || [],
    labGuide: vm.labguide || '',
    userGuide: vm.userguide || ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editNotification, setEditNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [labGuideFile, setLabGuideFile] = useState<File | null>(null);
  const [userGuideFile, setUserGuideFile] = useState<File | null>(null);

  function formatDate(dateString:string) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    let hours = date.getHours();
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12; // Convert 0 to 12 for 12AM
    hours = `${hours}`.padStart(1, '0');

    return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
  }

  // Fetch current user details
  useEffect(() => {
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

  // Initialize edit form data with user credentials
  useEffect(() => {
    if (vm.userscredentials && vm.userscredentials.length > 0) {
      setEditFormData(prev => ({
        ...prev,
        credentials: vm.userscredentials.map(cred => ({
          id: cred.id,
          username: cred.username,
          password: cred.password,
          ip: cred.ip,
          port: cred.port,
          protocol: cred.protocol || 'RDP'
        }))
      }));
    } else {
      // Add a default empty credential if none exist
      setEditFormData(prev => ({
        ...prev,
        credentials: [{
          username: '',
          password: '',
          ip: '',
          port: '',
          protocol: 'RDP'
        }]
      }));
    }
  }, [vm.userscredentials]);

  const handleCredentialChange = (index: number, field: keyof UserCredential, value: string) => {
    const updatedCredentials = [...editFormData.credentials];
    updatedCredentials[index] = {
      ...updatedCredentials[index],
      [field]: value
    };
    setEditFormData({
      ...editFormData,
      credentials: updatedCredentials
    });
  };

  const handleAddCredential = () => {
    setEditFormData({
      ...editFormData,
      credentials: [
        ...editFormData.credentials,
        {
          id: uuidv4(),
          username: '',
          password: '',
          ip: '',
          port: '',
          protocol: 'RDP'
        }
      ]
    });
  };

  const handleRemoveCredential = (index: number) => {
    if (editFormData.credentials.length <= 1) return;

    const updatedCredentials = [...editFormData.credentials];
    updatedCredentials.splice(index, 1);
    setEditFormData({
      ...editFormData,
      credentials: updatedCredentials
    });
  };

  const handleSoftwareChange = (index: number, value: string) => {
    const updatedSoftware = [...editFormData.software];
    updatedSoftware[index] = value;
    setEditFormData({
      ...editFormData,
      software: updatedSoftware
    });
  };

  const handleAddSoftware = () => {
    setEditFormData({
      ...editFormData,
      software: [...editFormData.software, '']
    });
  };

  const handleRemoveSoftware = (index: number) => {
    const updatedSoftware = [...editFormData.software];
    updatedSoftware.splice(index, 1);
    setEditFormData({
      ...editFormData,
      software: updatedSoftware
    });
  };

  const handleLabGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLabGuideFile(e.target.files[0]);
    }
  };

  const handleUserGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserGuideFile(e.target.files[0]);
    }
  };

  const handleEditLabSubmit = async () => {
    setIsEditing(true);
    setEditNotification(null);

    try {
      // Format dates for API
      const formattedStartDate = formatDate(editFormData.startDate);
      const formattedEndDate = formatDate(editFormData.endDate);

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('labId', vm.lab_id);
      formData.append('title', editFormData.title);
      formData.append('description', editFormData.description);
      formData.append('startDate', formattedStartDate);
      formData.append('endDate', formattedEndDate);
      const software = editFormData.software.filter(s => s.trim() !== '');
      formData.append('software', JSON.stringify(software));
      formData.append('credentials', JSON.stringify(editFormData.credentials));

    // Always include existing file references if available
if (editFormData.labGuide) {
  formData.append('existingLabGuide', editFormData.labGuide); // string, e.g., filename or path
}
if (editFormData.userGuide) {
  formData.append('existingUserGuide', editFormData.userGuide); // same
}

// Append new file if selected (optional overwrite or addition)
if (labGuideFile) {
  formData.append('labGuide', labGuideFile); // actual file
}
if (userGuideFile) {
  formData.append('userGuide', userGuideFile); // actual file
}

      // Update lab details
      const labResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVmDatacenterLab`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!labResponse.data.success) {
        throw new Error(labResponse.data.message || 'Failed to update lab details');
      }
      // Update or create user credentials
      // for (const cred of editFormData.credentials) {
      //   if (cred.id) {
      //     // Update existing credential
      //     await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/editSingleVmDatacenterCreds`, {
      //       labId: vm.lab_id,
      //       id: cred.id,
      //       username: cred.username,
      //       password: cred.password,
      //       protocol: cred.protocol,
      //       ip: cred.ip,
      //       port: cred.port
      //     });
      //   } else if (cred.username && cred.password && cred.ip && cred.port) {
      //     // Create new credential only if all required fields are filled
      //     await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/addSingleVmDatacenterCreds`, {
      //       labId: vm.lab_id,
      //       username: cred.username,
      //       password: cred.password,
      //       protocol: cred.protocol,
      //       ip: cred.ip,
      //       port: cred.port
      //     });
      //   }
      // }

      setEditNotification({ type: 'success', message: 'Lab updated successfully' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setEditNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update lab'
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleConvertToCatalogue = async () => {
    setIsConvertModalOpen(true);
  };

  const handleAssignUsers = () => {
    setIsAssignModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    // Only allow editing if the current user created the VM
    if (canEditContent()) {
      setSelectedUser(user);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/editSingleVmDatacenterCreds`, {
        labId: vm.lab_id,
        id: userData.id,
        username: userData.username,
        password: userData.password,
        protocol: userData.protocol,
        ip: userData.ip,
        port: userData.port
      });

      if (response.data.success) {
        // Update the user in the local state
        setVmUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userData.id ? { ...user, ...userData } : user
          )
        );

        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteSingleVMDatacenterLab/${vm.lab_id}`);

      if (response.data.success) {
        setNotification({ type: 'success', message: 'VM deleted successfully' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete VM');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete VM'
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // For users who can't edit content (not the creator)
  const handleUserDelete = async () => {
    setIsDeleting(true);
    try {
      // Different API endpoint for users who didn't create the VM
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteAssignedSingleVMDatacenterLab`,{
        labId:vm.lab_id,
        orgId:currentUser.org_id
      });

      if (response.data.success) {
        setNotification({ type: 'success', message: 'VM deleted successfully' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete VM');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete VM'
      });
      setTimeout(()=>{
        setNotification(null)
      },2000)
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Extract filename from path
function extractFileName(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

  // Check if current user can edit content
  const canEditContent = () => {
    return currentUser?.role === 'superadmin' || currentUser?.role === 'orgsuperadmin';
  };

  return (
    <>
      <div className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-secondary-500/10 
                    hover:border-secondary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/10 
                    hover:translate-y-[-2px] group relative">
        {notification && (
          <div className={`absolute top-2 right-2 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {notification.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">
                <GradientText>{vm.title}</GradientText>
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">{vm.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              {canEditContent() && (
                <button
                  onClick={() => setIsEditLabModalOpen(true)}
                  className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                >
                  <Pencil className="h-4 w-4 text-primary-400" />
                </button>
              )}
              {canEditContent() && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              )}
              {!canEditContent() && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              )}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                vm.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                vm.status === 'inactive' ? 'bg-red-500/20 text-red-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>
                {vm.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center text-sm text-gray-400">
              <Server className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">{vm.platform}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <LinkIcon className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">{vm.protocol}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span 
                className={`${showFullStartDate ? '' : 'truncate'} cursor-pointer`}
                onClick={() => setShowFullStartDate(!showFullStartDate)}
                title={showFullStartDate ? "Click to collapse" : "Click to expand"}
              >
                Start: {formatDate(vm?.startdate)}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span 
                className={`${showFullEndDate ? '' : 'truncate'} cursor-pointer`}
                onClick={() => setShowFullEndDate(!showFullEndDate)}
                title={showFullEndDate ? "Click to collapse" : "Click to expand"}
              >
                End: {formatDate(vm?.enddate)}
              </span>
            </div>
          </div>

          {/* Software Section - with fixed height and scrolling */}
          {vm.software && vm.software.length > 0 && (
            <div className="mb-3 max-h-[60px] overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Software:</h4>
              <div className="flex flex-wrap gap-2">
                {vm.software.map((sw, index) => (
                  <span key={index} className="px-2 py-1 text-xs font-medium rounded-full bg-secondary-500/20 text-secondary-300">
                    {sw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-secondary-500/10 flex flex-col space-y-2">
            <button
              onClick={() => setIsUserListModalOpen(true)}
              className="w-full h-9 px-4 rounded-lg text-sm font-medium
                       bg-dark-400/80 hover:bg-dark-300/80
                       border border-secondary-500/20 hover:border-secondary-500/30
                       text-secondary-300
                       flex items-center justify-center"
            >
              <Users className="h-4 w-4 mr-2" />
              User List
            </button>

            {canEditContent() ? (
              <button
                onClick={handleConvertToCatalogue}
                disabled={isConverting}
                className="w-full h-9 px-4 rounded-lg text-sm font-medium
                         bg-gradient-to-r from-secondary-500 to-accent-500
                         hover:from-secondary-400 hover:to-accent-400
                         transform hover:scale-105 transition-all duration-300
                         text-white shadow-lg shadow-secondary-500/20
                         flex items-center justify-center"
              >
                {isConverting ? (
                  <Loader className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Convert to Catalogue
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleAssignUsers}
                className="w-full h-9 px-4 rounded-lg text-sm font-medium
                         bg-gradient-to-r from-secondary-500 to-accent-500
                         hover:from-secondary-400 hover:to-accent-400
                         transform hover:scale-105 transition-all duration-300
                         text-white shadow-lg shadow-secondary-500/20
                         flex items-center justify-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Assign Lab
              </button>
            )}
          </div>
        </div>
      </div>

      {isUserListModalOpen && (
        <UserListModal
          isOpen={isUserListModalOpen}
          onClose={() => setIsUserListModalOpen(false)}
          users={vmUsers}
          vmId={vm.lab_id}
          vmTitle={vm.title}
          vm={vm}
          onEditUser={handleEditUser}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          vmId={vm?.lab_id}
          vm={vm}
          onSave={async (userData) => {
            try {
              await handleSaveUser(userData);
              setSelectedUser(null);
            } catch (error) {
              console.error('Error updating user:', error);
              throw error;
            }
          }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={canEditContent() ? handleDelete : handleUserDelete}
        isDeleting={isDeleting}
        vmTitle={vm.title}
      />

      <ConvertToCatalogueModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        vmId={vm?.lab_id}
        isDatacenterVM={true}
      />

      <AssignUsersModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        lab={vm}
        type="datacenter"
      />

      {/* Edit Lab Modal */}
      {isEditLabModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>Edit Lab</GradientText>
              </h2>
              <button 
                onClick={() => setIsEditLabModalOpen(false)}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {editNotification && (
              <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
                editNotification.type === 'success' 
                  ? 'bg-emerald-500/20 border border-emerald-500/20' 
                  : 'bg-red-500/20 border border-red-500/20'
              }`}>
                {editNotification.type === 'success' ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span className={`text-sm ${
                  editNotification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
                }`}>
                  {editNotification.message}
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lab Title
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date & Time
                  </label>
                  <DatePicker
                    selected={editFormData.startDate}
                    onChange={(date: Date) => setEditFormData({...editFormData, startDate: date})}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date & Time
                  </label>
                  <DatePicker
                    selected={editFormData.endDate}
                    onChange={(date: Date) => setEditFormData({...editFormData, endDate: date})}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Software Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Software
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSoftware}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Software
                  </button>
                </div>

                {editFormData.software.map((sw, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={sw}
                      onChange={(e) => handleSoftwareChange(index, e.target.value)}
                      placeholder="Enter software name"
                      className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSoftware(index)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Lab Guide and User Guide Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lab Guide
                  </label>
                  <div className="flex flex-col space-y-2">
                    {vm.labguide && editFormData.labGuide.map((labguide)=>(
                      (
                      <div className="flex items-center justify-between p-2 bg-dark-300/50 rounded-lg">
                        <span className="text-sm text-gray-300 truncate">{extractFileName(labguide)}</span>
                        <div className="flex items-center space-x-1">
                          <a 
                            href={`${import.meta.env.VITE_BACKEND_URL}/${extractFileName(labguide)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-primary-500/10 rounded-lg"
                          >
                            <Download className="h-4 w-4 text-primary-400" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEditFormData({...editFormData, labGuide: []})}
                            className="p-1 hover:bg-red-500/10 rounded-lg"
                          >
                            <X className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="labGuide"
                        onChange={handleLabGuideChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <label
                        htmlFor="labGuide"
                        className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 cursor-pointer hover:bg-dark-400 transition-colors
                                 flex items-center justify-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {labGuideFile ? labGuideFile.name : 'Upload New Lab Guide'}
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    User Guide
                  </label>
                  <div className="flex flex-col space-y-2">
                    {vm.userguide && editFormData.userGuide.map((userguide)=>(
                      (
                      <div className="flex items-center justify-between p-2 bg-dark-300/50 rounded-lg">
                        <span className="text-sm text-gray-300 truncate">{extractFileName(userguide)}</span>
                        <div className="flex items-center space-x-1">
                          <a 
                            href={`${import.meta.env.VITE_BACKEND_URL}/${extractFileName(userguide)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-primary-500/10 rounded-lg"
                          >
                            <Download className="h-4 w-4 text-primary-400" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEditFormData({...editFormData, userGuide: []})}
                            className="p-1 hover:bg-red-500/10 rounded-lg"
                          >
                            <X className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )
                    )) }
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="userGuide"
                        onChange={handleUserGuideChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <label
                        htmlFor="userGuide"
                        className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 cursor-pointer hover:bg-dark-400 transition-colors
                                 flex items-center justify-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {userGuideFile ? userGuideFile.name : 'Upload New User Guide'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    User Credentials
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCredential}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Credential
                  </button>
                </div>

                {editFormData.credentials.map((cred, index) => (
                  <div key={index} className="p-4 bg-dark-300/50 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-300">Credential {index + 1}</h4>
                      {editFormData.credentials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCredential(index)}
                          className="p-1 hover:bg-red-500/10 rounded-lg text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Username</label>
                        <input
                          type="text"
                          value={cred.username}
                          onChange={(e) => handleCredentialChange(index, 'username', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 focus:border-primary-500/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Password</label>
                        <input
                          type="text"
                          value={cred.password}
                          onChange={(e) => handleCredentialChange(index, 'password', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 focus:border-primary-500/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">IP Address</label>
                        <input
                          type="text"
                          value={cred.ip}
                          onChange={(e) => handleCredentialChange(index, 'ip', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 focus:border-primary-500/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Port</label>
                        <input
                          type="text"
                          value={cred.port}
                          onChange={(e) => handleCredentialChange(index, 'port', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 focus:border-primary-500/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Protocol</label>
                        <select
                          value={cred.protocol || 'RDP'}
                          onChange={(e) => handleCredentialChange(index, 'protocol', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 focus:border-primary-500/40 focus:outline-none"
                        >
                          <option value="RDP">RDP</option>
                          <option value="SSH">SSH</option>
                          <option value="VNC">VNC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsEditLabModalOpen(false)}
                className="btn-secondary"
                disabled={isEditing}
              >
                Cancel
              </button>
              <button
                onClick={handleEditLabSubmit}
                disabled={isEditing}
                className="btn-primary"
              >
                {isEditing ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};