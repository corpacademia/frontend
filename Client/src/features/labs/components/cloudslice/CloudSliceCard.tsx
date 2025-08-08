import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Plus, 
  Check, 
  AlertCircle, 
  X, 
  Cpu, 
  Hash,
  FileCode,
  HardDrive,
  Server,
  UserPlus,
  Loader,
  Pencil, 
  Trash2,
  Tag,
  Play,
  Square,
  Users,
  BookOpen,
  List,
  Calendar,
  MapPin,
  Shield
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { ConvertToCatalogueModal } from './ConvertToCatalogueModal';
import { EditModal } from './EditModal';
import { DeleteModal } from './DeleteModal';
import axios from 'axios';

interface CloudSlice {
  id: string;
  labid: string;
  title: string;
  description: string;
  provider: 'aws' | 'azure' | 'gcp' | 'oracle' | 'ibm' | 'alibaba';
  region: string;
  services: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  startdate: string;
  enddate: string;
  cleanupPolicy: string;
  credits: number;
  modules: 'without-modules' | 'with-modules';
  createdby?: string;
  accounttype?: 'iam' | 'organization';
}
interface orgStatus{
  labid:string;
  orgid:string,
  assigned_at:string;
  assigned_by:string;
  status:'pending' | 'active' | 'inactive'
}

interface CloudSliceCardProps {
  slice: CloudSlice;
  onEdit: (slice: CloudSlice) => void;
  onDelete: (sliceId: string) => void;
  isSelected?: boolean;
  onSelect?: (sliceId: string) => void;
  userRole:string;
  orgStatus:orgStatus;
  onAssignUsers?: (slice: CloudSlice) => void;
}

export const CloudSliceCard: React.FC<CloudSliceCardProps> = ({ 
  slice,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  userRole,
  orgStatus,
  onAssignUsers
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const getOrgLabStatus = (labId) => {
    return orgStatus.find(org => org.labid === labId);
  }

const canEditContent = () => {
    return user?.role === 'superadmin' || user?.role === 'orgsuperadmin';
  };

  const handleLaunch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLaunching(true);
    setNotification(null);
    if(user.role === 'superadmin' || user.role === 'orgsuperadmin') {
      try {
        // Always fetch lab details first
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${slice.labid}`);

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch lab details');
        }

        // If already launched, skip creation and status update
        if (slice.launched) {
          const targetPath = slice.modules === 'without-modules'
            ? `/dashboard/labs/cloud-slices/${slice.labid}/lab`
            : `/dashboard/labs/cloud-slices/${slice.labid}/modules`;
          window.location.href = targetPath;
          return;
        }

        // If not launched, create IAM user and update lab status
        if (slice.modules === 'without-modules') {
          const createIamAccount = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
            userName: user.name,
            services: slice.services,
            role:user.role,
            labid:slice.labid,
            purchased:slice?.purchased
          });

          if (!createIamAccount.data.success) {
            throw new Error(createIamAccount.data.message || 'Failed to create IAM user');
          }

          const updateLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatus`, {
            labId: slice.labid,
            createdBy: slice.createdby,
            status: 'active',
            launched: true
          });

          if (!updateLabStatus.data.success) {
            throw new Error(updateLabStatus.data.message || 'Failed to update lab status');
          }

          window.location.href = `/dashboard/labs/cloud-slices/${slice.labid}/lab`;
        } else {
          const updateLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatus`, {
            labId: slice.labid,
            createdBy: slice.createdby,
            status: 'active',
            launched: true
          });

          if (!updateLabStatus.data.success) {
            throw new Error(updateLabStatus.data.message || 'Failed to update lab status');
          }
          window.location.href = `/dashboard/labs/cloud-slices/${slice.labid}/modules`;
        }

      } catch (error: any) {
        setNotification({ 
          type: 'error', 
          message: error.response?.data?.message || error.message || 'Failed to launch cloud slice' 
        });
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } finally {
        setIsLaunching(false);
      }
    }

    else{
      try {
        // Always fetch lab details first
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${slice.labid}`);

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch lab details');
        }
        //get the organization assigned lab status
        // If already launched, skip creation and status update
        if (getOrgLabStatus(slice.labid).launched) {
          const targetPath = slice.modules === 'without-modules'
            ? `/dashboard/labs/cloud-slices/${slice.labid}/lab`
            : `/dashboard/labs/cloud-slices/${slice.labid}/modules`;
          window.location.href = targetPath;
          return;
        }

        // If not launched, create IAM user and update lab status
        if (slice.modules === 'without-modules') {
          const createIamAccount = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
            userName: user.name,
            services: slice.services,
            role:user.role,
            labid:slice.labid,
            orgid:user.org_id,
            purchased:slice?.purchased || false
          });

          if (!createIamAccount.data.success) {
            throw new Error(createIamAccount.data.message || 'Failed to create IAM user');
          }

          const updateLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`, {
            labId: slice.labid,
            orgId:getOrgLabStatus(slice.labid).orgid,
            status: 'active',
            launched: true,
          });

          if (!updateLabStatus.data.success) {
            throw new Error(updateLabStatus.data.message || 'Failed to update lab status');
          }

          window.location.href = `/dashboard/labs/cloud-slices/${slice.labid}/lab`;
        } else {
          const updateLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`, {
            labId: slice.labid,
            orgId:getOrgLabStatus(slice.labid).orgid,
            status: 'active',
            launched: true,
          });

          if (!updateLabStatus.data.success) {
            throw new Error(updateLabStatus.data.message || 'Failed to update lab status');
          }
          window.location.href = `/dashboard/labs/cloud-slices/${slice.labid}/modules`;
        }

      } catch (error: any) {
        setNotification({ 
          type: 'error', 
          message: error.response?.data?.message || error.message || 'Failed to launch cloud slice' 
        });
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } finally {
        setIsLaunching(false);
      }
    }

  };

  function formatDateTime(dateString) {
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

  // Fixed the checkbox selection handler to properly stop propagation
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(slice.id);
    }
  };

  // Get the appropriate icon based on lab type
  const getLabTypeIcon = () => {
    if (slice.modules === 'without-modules') {
      return <Server className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />;
    } else {
      return <List className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />;
    }
  };

  // Get the appropriate icon for account type
  const getAccountTypeIcon = () => {
    if (slice.accounttype === 'organization') {
      return <Users className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />;
    } else {
      return <Shield className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />;
    }
  };

  // Check if the user is an orgadmin and not the creator of this slice
  const isOrgAdminNotCreator = user?.role === 'orgadmin' && slice.createdby && slice.createdby !== user.id;
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    setIsDeleting(true);

    try {
      // Use different API endpoint if user is orgadmin and not creator
      const creds = orgStatus?.find((cred: any) => cred.labid === slice.labid);
      if (isOrgAdminNotCreator) {
        if(creds?.username != null) {
        const deleteIam = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deleteIamAccount`,{
          userName:creds?.username
        })
      }
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/orgAdminDeleteCloudSlice/${slice.id}`, {
          orgId: user.org_id
        });
        if (response?.data.success) {
          setNotification({
        type: 'success',
        message: response?.data?.message || 'Successfully deleted cloud slice'
      });
      setTimeout(() => setNotification(null), 3000);
       //refresh the window
      window.location.reload();
          // onDelete(slice.labid);
        } else {
          throw new Error(response?.data.message || 'Failed to delete cloud slice');
        }
      } else {
        // Regular delete
        onDelete(slice.labid);
      }
    } catch (error: any) {
      console.error('Failed to delete cloud slice:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete cloud slice'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[240px] overflow-hidden rounded-xl border border-primary-500/10 
                    hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
                    hover:translate-y-[-2px] group relative">
        {notification && (
          <div className={`absolute top-2 right-2 px-3 py-1 rounded-lg flex items-center space-x-1 z-50 ${
            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {notification.type === 'success' ? (
              <Check className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            <span className="text-xs">{notification.message}</span>
          </div>
        )}

        <div className="p-3 flex flex-col h-full">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex items-start">
              {onSelect && (
                <div className="flex-shrink-0 mt-1 mr-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={handleCheckboxClick}
                    className="form-checkbox h-4 w-4 text-primary-500 rounded border-gray-500/20"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-semibold mb-1 truncate">
                  <GradientText>{slice.title}</GradientText>
                </h3>
                <p className="text-xs text-gray-400 line-clamp-1">{slice.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {!isOrgAdminNotCreator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(slice);
                  }}
                  className="p-1.5 hover:bg-dark-300/50 rounded-lg transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-primary-400" />
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 hover:bg-dark-300/50 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                userRole === 'superadmin' || userRole === 'orgsuperadmin' ? slice.status : getOrgLabStatus(slice.labid).status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                userRole === 'superadmin' || userRole === 'orgsuperadmin' ? slice.status : getOrgLabStatus(slice.labid).status === 'pending' ? 'bg-red-500/20 text-red-300' :
                userRole === 'superadmin' || userRole === 'orgsuperadmin' ? slice.status : getOrgLabStatus(slice.labid).status === 'inactive' ? 'bg-gray-500/20 text-gray-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>
                {userRole === 'superadmin' || userRole === 'orgsuperadmin' ? slice.status : getOrgLabStatus(slice.labid).status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center text-xs text-gray-400">
              <Cloud className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />
              <span className="truncate">{slice.provider.toUpperCase()}</span>
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <MapPin className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />
              <span className="truncate">{slice.region}</span>
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Calendar className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />
              <span className="truncate">Start: {formatDateTime(slice.startdate)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Calendar className="h-3.5 w-3.5 mr-1 text-primary-400 flex-shrink-0" />
              <span className="truncate">End: {formatDateTime(slice.enddate)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center text-xs text-gray-400 mb-2 gap-2">
            <div className="flex items-center">
              {getLabTypeIcon()}
              <span className="truncate">
                {slice.modules === 'with-modules' ? 'Modular Lab' : 'Standard Lab'}
              </span>
            </div>

            <div className="flex items-center">
              {getAccountTypeIcon()}
              <span className="truncate">
                {slice.accounttype === 'organization' ? 'Organization Account' : 'IAM Account'}
              </span>
              {slice.accounttype === 'organization' && (
                <span className="ml-1 px-1 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                  15 max
                </span>
              )}
            </div>
          </div>

          <div className="mb-2 overflow-y-auto max-h-[60px]">
            <h4 className="text-xs font-medium text-gray-400 mb-1">Services:</h4>
            <div className="flex flex-wrap gap-1.5">
              {slice.services.map((service, index) => (
                <span key={index} className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300 
                                          inline-block max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-primary-500/10">
            <div className="flex space-x-2">
              <button
                onClick={handleLaunch}
                disabled={isLaunching}
                className="flex-1 h-8 px-3 rounded-lg text-xs font-medium
                       bg-gradient-to-r from-primary-500 to-secondary-500
                       hover:from-primary-400 hover:to-secondary-400
                       transform hover:scale-105 transition-all duration-300
                       text-white shadow-lg shadow-primary-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center"
              >
             {isLaunching ? (
  <Loader className="animate-spin h-3.5 w-3.5" />
) : (
  <>
    {userRole === 'superadmin' || userRole === 'orgsuperadmin' ? (
      slice.launched ? (
        <>
          <Square className="h-3.5 w-3.5 mr-1.5" />
          Go to Lab
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Launch Lab
        </>
      )
    ) : getOrgLabStatus(slice.labid).launched ? (
      <>
        <Square className="h-3.5 w-3.5 mr-1.5" />
        Go to Lab
      </>
    ) : (
      <>
        <Play className="h-3.5 w-3.5 mr-1.5" />
        Launch Lab
      </>
    )}
  </>
)}

              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAssignUsers) {
                    onAssignUsers(slice);
                  } else {
                    setIsConvertModalOpen(true);
                  }
                }}
                className="flex-1 h-8 px-3 rounded-lg text-xs font-medium
                       bg-dark-400/80 hover:bg-dark-300/80
                       border border-primary-500/20 hover:border-primary-500/30
                       text-primary-300
                       flex items-center justify-center"
              >
                {onAssignUsers ? (
                  <>
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Assign Users
                  </>
                ) : (
                  <>
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    Convert to Catalogue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                <GradientText>Confirm Deletion</GradientText>
              </h2>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{slice.title}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn-primary bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isConvertModalOpen && (
        <ConvertToCatalogueModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          sliceId={slice.labid}
        />
      )}
    </>
  );
};