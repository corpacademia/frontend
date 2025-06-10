
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
import { ClusterUserListModal } from './ClusterUserListModal';

interface ClusterVM {
  id: string;
  lab_id: string;
  title: string;
  description: string;
  platform: string;
  protocol: string;
  startdate: string;
  enddate: string;
  status: 'active' | 'inactive' | 'pending';
  users: Array<{
    id: string;
    username: string;
    vms: Array<{
      id: string;
      vmName: string;
      username: string;
      password: string;
      ip: string;
      port: string;
      protocol: string;
      disabled?: boolean;
    }>;
  }>;
  software?: string[];
  labguide?: string;
  userguide?: string;
  user_id?: string;
}

interface ClusterVMCardProps {
  vm: ClusterVM;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  vmTitle: string;
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

export const ClusterVMCard: React.FC<ClusterVMCardProps> = ({ vm }) => {
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showFullStartDate, setShowFullStartDate] = useState(false);
  const [showFullEndDate, setShowFullEndDate] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  console.log(vm)

  function formatDate(dateString: string) {
    const date = new Date(dateString);
  
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
  
    let hours = date.getHours();
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12 || 12;
    hours = `${hours}`.padStart(1, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
  }

  // Fetch current user details
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(`http://localhost:3000/api/v1/lab_ms/deleteClusterLab/${vm.lab_id}`);
      
      if (response.data.success) {
        setNotification({ type: 'success', message: 'Cluster VM deleted successfully' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete cluster VM');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete cluster VM'
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Check if current user can edit content
  const canEditContent = () => {
    if (!currentUser) return false;
    return vm.lab.user_id === currentUser.id;
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
                <GradientText>{vm.lab.title}</GradientText>
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">{vm.lab.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              {canEditContent() && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              )}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                vm.lab.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                vm.lab.status === 'inactive' ? 'bg-red-500/20 text-red-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>
                {vm.lab.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center text-sm text-gray-400">
              <Server className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">{vm.lab.platform}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <LinkIcon className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">{vm.lab.protocol}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span 
                className={`${showFullStartDate ? '' : 'truncate'} cursor-pointer`}
                onClick={() => setShowFullStartDate(!showFullStartDate)}
                title={showFullStartDate ? "Click to collapse" : "Click to expand"}
              >
                Start: {formatDate(vm?.lab?.startdate)}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span 
                className={`${showFullEndDate ? '' : 'truncate'} cursor-pointer`}
                onClick={() => setShowFullEndDate(!showFullEndDate)}
                title={showFullEndDate ? "Click to collapse" : "Click to expand"}
              >
                End: {formatDate(vm?.lab?.enddate)}
              </span>
            </div>
          </div>

          {/* Software Section */}
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
                       bg-gradient-to-r from-secondary-500 to-accent-500
                       hover:from-secondary-400 hover:to-accent-400
                       transform hover:scale-105 transition-all duration-300
                       text-white shadow-lg shadow-secondary-500/20
                       flex items-center justify-center"
            >
              <Users className="h-4 w-4 mr-2" />
              User List
            </button>
          </div>
        </div>
      </div>

      {isUserListModalOpen && (
        <ClusterUserListModal
          isOpen={isUserListModalOpen}
          onClose={() => setIsUserListModalOpen(false)}
          users={vm.users || []}
          vmId={vm.lab.labid}
          vmTitle={vm.lab.title}
          vm={vm}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        vmTitle={vm.lab.title}
      />
    </>
  );
};
