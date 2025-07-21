
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Server,
  Users,
  Calendar,
  Clock,
  Play,
  LinkIcon,
  Check,
  AlertCircle,
  Loader,
  Trash2
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { ClusterUserListModalForUser } from './ClusterUserListModalForUser';

interface ClusterVM {
  id: string;
  labid: string;
  title: string;
  description: string;
  platform: string;
  protocol: string;
  startdate: string;
  enddate: string;
  status: "started" | "not-started" | "expired";
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

interface VMClusterSingleVMCardProps {
  vm: ClusterVM;
  onDelete?: (labId: string) => void;
  user?:any;
}

export const VMClusterSingleVMCard: React.FC<VMClusterSingleVMCardProps> = ({ vm, onDelete ,user}) => {
  const navigate = useNavigate();
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showFullStartDate, setShowFullStartDate] = useState(false);
  const [showFullEndDate, setShowFullEndDate] = useState(false);
  function formatDate(dateString: string) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    let hours = date.getHours();
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;
    hours = `${hours}`.padStart(1, "0");

    return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
  }

  const handleStartLab = () => {
    setIsUserListModalOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteClusterLab`,{
          labId:vm?.lab?.labid,
          orgId:user?.org_id,
          userId:user?.id
        }
      );

      if (response.data.success) {
        setNotification({
          type: "success",
          message: "Lab deleted successfully",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to delete lab");
      }
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to delete lab",
      });
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div
        className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-secondary-500/10 
                    hover:border-secondary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/10 
                    hover:translate-y-[-2px] group relative"
      >
        {notification && (
          <div
            className={`absolute top-2 right-2 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
              notification.type === "success"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {notification.type === "success" ? (
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
                <GradientText>{vm.lab?.title || vm.title}</GradientText>
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">
                {vm.lab?.description || vm.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isDeleting}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete Lab"
              >
                {isDeleting ? (
                  <Loader className="h-4 w-4 text-red-400 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-400" />
                )}
              </button>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  vm.lab?.status === "started" || vm.status === "started"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : vm.lab?.status === "expired" || vm.status === "expired"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {vm.lab?.status || vm.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center text-sm text-gray-400">
              <Server className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">{vm.lab?.platform || vm.platform}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <LinkIcon className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">rdp/ssh/vnc</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span
                className={`${showFullStartDate ? "" : "truncate"} cursor-pointer`}
                onClick={() => setShowFullStartDate(!showFullStartDate)}
                title={
                  showFullStartDate ? "Click to collapse" : "Click to expand"
                }
              >
                Start: {formatDate(vm?.lab?.startdate || vm?.startdate)}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span
                className={`${showFullEndDate ? "" : "truncate"} cursor-pointer`}
                onClick={() => setShowFullEndDate(!showFullEndDate)}
                title={
                  showFullEndDate ? "Click to collapse" : "Click to expand"
                }
              >
                End: {formatDate(vm?.lab?.enddate || vm?.enddate)}
              </span>
            </div>
          </div>

          {/* Software Section */}
          {(vm.lab?.software || vm.software) && (vm.lab?.software || vm.software).length > 0 && (
            <div className="mb-3 max-h-[60px] overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-400 mb-1">
                Software:
              </h4>
              <div className="flex flex-wrap gap-2">
                {(vm.lab?.software || vm.software).map((sw, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-secondary-500/20 text-secondary-300"
                  >
                    {sw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-secondary-500/10 flex justify-center">
            <button
              onClick={handleStartLab}
              disabled={isLaunching}
              className="w-full h-9 px-4 rounded-lg text-sm font-medium
                       bg-gradient-to-r from-secondary-500 to-accent-500
                       hover:from-secondary-400 hover:to-accent-400
                       transform hover:scale-105 transition-all duration-300
                       text-white shadow-lg shadow-secondary-500/20
                       flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLaunching ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Launching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Lab
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isUserListModalOpen && (
        <ClusterUserListModalForUser
          isOpen={isUserListModalOpen}
          onClose={() => setIsUserListModalOpen(false)}
          users={vm.users || []}
          vmId={vm.lab?.labid || vm.lab_id || vm.id}
          vmTitle={vm.lab?.title || vm.title}
          vm={vm}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-xl p-6 w-full max-w-md mx-4 border border-secondary-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Delete Lab</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <strong>{vm.lab?.title || vm.title}</strong>? 
              This will permanently remove the lab and all associated data.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center"
              >
                {isDeleting ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Lab"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
