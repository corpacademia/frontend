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
  Shield,
  LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { ConvertToCatalogueModal } from './ConvertToCatalogueModal';
import { EditModal } from './EditModal';
import { DeleteModal } from './DeleteModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  status:'active' | 'inactive' | 'pending' | 'expired';
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
  const [isUserInstancesModalOpen, setIsUserInstancesModalOpen] = useState(false);
  const [userInstances, setUserInstances] = useState<any[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [cloudSliceModal, setCloudSliceModal] = useState<any>(null);
  const [deletingInstanceId, setDeletingInstanceId] = useState<string | null>(null);
  const [launchingId,setLaunchingId] = useState<string | null>(null);
  const navigate = useNavigate();
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
    return user?.role === 'superadmin' || user.role === 'orgsuperadmin' && !slice?.assessment  || user?.id === slice?.createdby ;
  };
  const handleLaunch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLaunching(true);
    setNotification(null);
    if(user.role === 'superadmin' || user.role === 'orgsuperadmin' && !slice?.assessment || user?.id === slice?.createdby) {
      console.log('if')
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
            role:user.id === slice?.createdby || getOrgLabStatus(slice?.labid)?.orgid === user?.org_id ? 'superadmin' : user?.role,
            labid:slice.labid,
            purchased:slice?.purchased || false
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
      console.log('else')
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
            orgid:user?.org_id,
            purchased:slice?.purchased || false
          });

          if (!createIamAccount.data.success) {
            throw new Error(createIamAccount.data.message || 'Failed to create IAM user');
          }

          const updateLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`, {
            labId: slice.labid,
            orgId:user?.org_id,
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

  // Check if the user is an labadmin and not the creator of this slice
  const isOrgAdminNotCreator = user?.role === 'labadmin' && slice.createdby && slice.createdby !== user.id;
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handlePodsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingInstances(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgCloudSliceUserInstances/${user?.org_id !==null ? user?.org_id : 'superadmin'}/${slice.labid}`
      );
      if (response.data.success) {
        setUserInstances(response.data.data);
        setIsUserInstancesModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch user instances:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load user instances'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleDeleteUserInstance = async (userLab: any) => {

    setDeletingInstanceId(userLab.id);
    try {
      // Delete IAM account if it exists
      if (userLab.username) {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deleteIamAccount`, {
          userName: userLab.username
        });
      }

      // Delete the user instance based on role
      if (userLab?.role === 'user') {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteUserCloudSlice`, {
          userId: userLab.user_id || userLab.userid,
          labId: userLab.labid || userLab.lab_id,
          purchased: userLab?.purchased || false
        });
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/orgAdminDeleteCloudSlice/${userLab.labid || userLab.lab_id}`, {
          orgId: userLab.orgid || userLab.org_id
        });
      }

      // Remove from local state
      setUserInstances(prev => prev.filter(instance => instance.id !== userLab.id));

      setNotification({
        type: 'success',
        message: 'Lab instance deleted successfully'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete lab instance'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setDeletingInstanceId(null);
    }
  };

  const handleLaunchConnect = async (userLab: any) => {
    try {
      if (userLab?.role === 'user') {
        if (userLab?.modules === 'without-modules') {
          if (!userLab.launched) {
            setLaunchingId(userLab?.id)
            const createIamUser = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
              userName: userLab.name,
              services: userLab.services,
              role: userLab.role,
              labid: userLab.labid,
              user_id: userLab.user_id,
              purchased: userLab?.purchased || false
            });

            if (createIamUser.data.success) {
              await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`, {
                status: 'active',
                launched: true,
                labId: userLab.labid,
                userId: userLab.user_id,
                purchased: userLab?.purchased || false
              });
            }
          }
        } else {
          if (!userLab.launched) {
            setLaunchingId(userLab?.id)
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`, {
              status: 'active',
              launched: true,
              labId: userLab.labid,
              userId: userLab.user_id,
              purchased: userLab?.purchased || false
            });
          }
        }
        // Refresh instances
        setLaunchingId(null)
        handlePodsClick({ stopPropagation: () => {} } as React.MouseEvent);
        setCloudSliceModal(userInstances.find(lab => lab.id === userLab.id));
      } else {
        if (!userLab.launched) {
          setLaunchingId(userLab?.id)
          if (userLab?.modules === 'without-modules') {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
              userName: userLab?.name,
              services: userLab?.services,
              role: userLab?.role,
              labid: userLab?.labid || userLab?.lab_id,
              orgid: userLab?.orgid || userLab?.org_id,
              purchased: userLab?.purchased || false
            });

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`, {
              labId: userLab?.labid || userLab?.lab_id,
              orgId: userLab?.orgid,
              status: 'active',
              launched: true,
            });
          } else {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfOrg`, {
              labId: userLab?.labid || userLab?.lab_id,
              orgId: userLab?.orgid,
              status: 'active',
              launched: true,
            });
          }
        }
        // Refresh instances
        setLaunchingId(null)
        handlePodsClick({ stopPropagation: () => {} } as React.MouseEvent);
        setCloudSliceModal(userInstances.find(lab => lab.id === userLab.id));
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to launch/connect'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };
  const confirmDelete = async () => {
    setIsDeleting(true);

    try {
      // Use different API endpoint if user is labadmin and not creator
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
      <div className="flex flex-col min-h-[240px] sm:min-h-[280px] lg:min-h-[260px] xl:min-h-[280px] 
                    max-h-fit overflow-hidden rounded-xl border border-primary-500/10 
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

        <div className="p-2 sm:p-3 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
            <div className="flex items-start flex-1 min-w-0">
              {onSelect && (
                <div className="flex-shrink-0 mt-1 mr-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={handleCheckboxClick}
                    className="form-checkbox h-3 w-3 sm:h-4 sm:w-4 text-primary-500 rounded border-gray-500/20"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold mb-1 line-clamp-2">
                  <GradientText>{slice.title}</GradientText>
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 sm:line-clamp-1">{slice.description}</p>
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
             <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                userRole === 'superadmin' || ((userRole === 'orgsuperadmin' || userRole === 'labadmin') && !slice?.assessment )
                  ? slice.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : slice.status === 'expired'
                    ? 'bg-red-500/20 text-red-300'
                    : slice.status === 'inactive'
                    ? 'bg-gray-500/20 text-gray-300'
                    : 'bg-amber-500/20 text-amber-300'
                  : getOrgLabStatus(slice.labid).status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : getOrgLabStatus(slice.labid).status === 'expired'
                  ? 'bg-red-500/20 text-red-300'
                  : getOrgLabStatus(slice.labid).status === 'inactive'
                  ? 'bg-gray-500/20 text-gray-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {userRole === 'superadmin' || ((userRole === 'orgsuperadmin' || userRole === 'labadmin') && !slice?.assessment )
                ? slice.status
                : getOrgLabStatus(slice.labid).status}
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
              {slice?.services?.map((service, index) => (
                <span key={index} className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300 
                                          inline-block max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-primary-500/10">
            <div className="flex flex-col space-y-2">
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
                    {userRole === 'superadmin' || ((userRole === 'orgsuperadmin' || userRole === 'labadmin') && !slice?.assessment )? (
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

              {(userRole === 'superadmin' || userRole === 'orgsuperadmin' || userRole === 'labadmin') && (
                <button
                  onClick={handlePodsClick}
                  disabled={isLoadingInstances}
                  className="h-8 px-3 rounded-lg text-xs font-medium w-full
                           bg-dark-400/80 hover:bg-dark-300/80
                           border border-primary-500/20 hover:border-primary-500/30
                           text-primary-300
                           flex items-center justify-center
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingInstances ? (
                    <Loader className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Pods
                </button>
              )}
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

      {/* User Instances Modal */}
      {isUserInstancesModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  User Lab Instances - {slice.title}
                </h3>
                <button onClick={() => setIsUserInstancesModalOpen(false)} className="p-2 hover:bg-dark-300 rounded-lg">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh]">
                {isLoadingInstances ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="h-8 w-8 text-primary-400 animate-spin" />
                  </div>
                ) : userInstances.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No user instances found
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      // Group instances by role
                      const groupedByRole = userInstances.reduce((acc, userLab) => {
                        const role = userLab.role || 'user';
                        if (!acc[role]) {
                          acc[role] = [];
                        }
                        acc[role].push(userLab);
                        return acc;
                      }, {} as Record<string, any[]>);

                      return Object.entries(groupedByRole).map(([role, instances]) => (
                        <div key={role} className="bg-dark-300/30 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-primary-300 mb-4">
                            {role === 'user' ? 'Users' : role === 'labadmin' ? 'Lab Admins' : role === 'orgadmin' ? 'Org Admins' : role} ({instances.length})
                          </h3>
                          <div className="space-y-3">
                            {instances.map((userLab) => (
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
                                      User ID: {userLab?.user_id || userLab?.userid}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Launched: {new Date(userLab.startdate).toLocaleString()}
                                    </p>
                                    <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                      userLab.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                                      'bg-gray-500/20 text-gray-300'
                                    }`}>
                                      {userLab.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-2">
                                    <button
                                      onClick={() => handleLaunchConnect(userLab)}
                                      disabled={launchingId === userLab?.id}
                                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                      title={userLab.launched ? 'View Credentials' : 'Launch'}
                                    >
                                      {launchingId === userLab?.id ? (
                                       <Loader className="h-4 w-4 text-primary-400 animate-spin" />
                                      )
                                      : userLab?.launched ? (
                                        <Eye className="h-4 w-4 text-primary-400" />
                                      ) : (
                                        <Play className="h-4 w-4 text-primary-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUserInstance(userLab)}
                                      disabled={deletingInstanceId === userLab.id}
                                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                      title="Delete Instance"
                                    >
                                      {deletingInstanceId === userLab.id ? (
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
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t border-primary-500/10">
                <button
                  onClick={() => setIsUserInstancesModalOpen(false)}
                  className="px-4 py-2 bg-dark-400/50 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 font-mono">
                    {showPasswords[cloudSliceModal.id] ? cloudSliceModal.password : '••••••••'}
                  </div>
                  <button
                    onClick={() => togglePasswordVisibility(cloudSliceModal.id)}
                    className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                  >
                    {showPasswords[cloudSliceModal.id] ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
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
    </>
  );
};