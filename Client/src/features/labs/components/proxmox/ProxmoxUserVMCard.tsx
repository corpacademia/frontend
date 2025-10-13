
import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Check, 
  AlertCircle, 
  X, 
  Cpu, 
  Hash,
  FileCode,
  Loader,
  Trash2,
  Play,
  Square,
  Calendar,
  Clock,
  MemoryStick
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ProxmoxDeleteModal } from './ProxmoxDeleteModal';

interface ProxmoxVM {
  id: string;
  title: string;
  description: string;
  platform: string;
  status: 'active' | 'inactive' | 'pending' | 'available' | 'expired';
  cpu: number;
  ram: number;
  storage: number;
  os: string;
  templateId?: string;
  startdate: string;
  enddate: string;
  labid: string;
  vmid?: string;
  node?: string;
  storagetype?: string;
  isoimage?: string;
  nicmodel?: string;
  networkbridge?: string;
  firewall?: boolean;
  boot?: string;
  vmname?: string;
}

interface ProxmoxUserVMCardProps {
  vm: ProxmoxVM;
}

export const ProxmoxUserVMCard: React.FC<ProxmoxUserVMCardProps> = ({ vm }) => {
  const navigate = useNavigate();
  const [isLaunchProcessing, setIsLaunchProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [buttonLabel, setButtonLabel] = useState<'Launch VM' | 'Stop' | 'Start VM'>('Launch VM');
  const [showFullTemplateId, setShowFullTemplateId] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [vmStatus, setVmStatus] = useState<'running' | 'stopped' | 'pending'>('stopped');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkVMStatus();
    fetchCurrentUser();
  }, [vm.labid]);
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const checkVMStatus = async () => {
    try {
      const user = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/checkVMStatus`, {
        labId: vm.labid,
        vmId: vm.vmid,
        type: 'user'
      });

      if (response.data.success) {
        const isLaunched = response.data.data.islaunched;
        const isRunning = response.data.data.isrunning;

        if (isRunning) {
          setVmStatus('running');
        } else if (isLaunched) {
          setVmStatus('stopped');
        } else {
          setVmStatus('pending');
        }

        if (!isLaunched) {
          setButtonLabel("Launch VM");
        } else if (isRunning) {
          setButtonLabel("Stop");
        } else if (isLaunched && !isRunning) {
          setButtonLabel("Start VM");
        }
      }
    } catch (error) {
      console.error('Error checking VM status:', error);
    }
  };

  const handleLaunchVM = async () => {
    setIsLaunchProcessing(true);
    try {
      if (buttonLabel === 'Launch VM') {
        const launchVM = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchVM`, {
          node: vm.node,
          vmid: vm.vmid,
          name: vm.vmname,
          cores: vm.cpu,
          memory: vm.ram,
          storageType: vm.storagetype,
          storage: vm.storage,
          iso: vm.isoimage,
          nicModel: vm.nicmodel,
          networkBridge: vm.networkbridge,
          firewall: vm.firewall,
          boot: vm.boot,
          type: 'user'
        });
        
        if (launchVM.data.success) {
          setButtonLabel('Start VM');
          setVmStatus('stopped');
          setNotification({
            type: 'success',
            message: 'VM Launched successfully',
          });
        }
      } else if (buttonLabel === 'Stop') {
        const stopResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox_ms/stopVM`, {
          lab_id: vm.labid,
          vmId: vm.vmid,
          node: vm.node
        });

        if (stopResponse.data.success) {
          setButtonLabel('Start VM');
          setVmStatus('stopped');
          setNotification({
            type: 'success',
            message: 'VM stopped successfully',
          });
        } else {
          throw new Error(stopResponse.data.message || 'Failed to stop VM');
        }
      } else {
        const startResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox_ms/startVM`, {
          lab_id: vm.labid,
          vmId: vm.vmid,
          node: vm.node
        });

        if (startResponse.data.success) {
          setButtonLabel('Stop');
          setVmStatus('running');
          setNotification({
            type: 'success',
            message: 'VM started successfully',
          });

          if (startResponse.data.guacamoleUrl) {
            navigate(`/dashboard/labs/vm-session/${vm.labid}`, {
              state: {
                guacUrl: startResponse.data.guacamoleUrl,
                vmTitle: vm.title,
                vmId: vm.labid,
              }
            });
          }
        } else {
          throw new Error(startResponse.data.message || 'Failed to start VM');
        }
      }
    } catch (error: any) {
      console.log(error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Operation failed',
      });
    } finally {
      setIsLaunchProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteSingleVMProxmoxUser`, {
        labId: vm.labid,
        userId:currentUser?.id
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
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'expired':
      case 'inactive':
        return 'bg-red-500/20 text-red-300';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="flex flex-col min-h-[280px] sm:min-h-[320px] lg:min-h-[300px] xl:min-h-[320px] 
                  max-h-fit rounded-xl border border-orange-500/10 
                  hover:border-orange-500/30 bg-dark-200/80 backdrop-blur-sm
                  transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 
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

      <div className="p-3 sm:p-4 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-1">
              <span 
                className="cursor-pointer hover:text-orange-300 transition-colors line-clamp-2"
                onClick={() => setShowFullTitle(!showFullTitle)}
                title={showFullTitle ? "Click to collapse" : "Click to expand"}
              >
                <GradientText>
                  {showFullTitle ? vm.title : (vm.title.length > 30 ? vm.title.substring(0, 30) + '...' : vm.title)}
                </GradientText>
              </span>
            </h3>
            <p 
              className="text-xs sm:text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors line-clamp-2"
              onClick={() => setShowFullDescription(!showFullDescription)}
              title={showFullDescription ? "Click to collapse" : "Click to expand"}
            >
              {showFullDescription ? vm.description : (vm.description.length > 80 ? vm.description.substring(0, 80) + '...' : vm.description)}
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-start space-x-2 flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(vm.status)}`}>
              {vm.status}
            </span>
            <div className="flex items-center space-x-1">
              <div className={`h-2 w-2 rounded-full ${
                vmStatus === 'running' ? 'bg-emerald-400' : 
                vmStatus === 'stopped' ? 'bg-red-400' : 'bg-amber-400'
              }`} />
              <span className="text-xs text-gray-400">
                {vmStatus}
              </span>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1.5 sm:p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <Cpu className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-400" />
            <span>{vm.cpu} vCPU</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <MemoryStick className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-400" />
            <span>{vm.ram}GB RAM</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-400" />
            <span>Storage: {vm.storage}GB</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <Hash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-400" />
            <span className="truncate">VM ID: {vm.vmid || 'N/A'}</span>
          </div>
          {vm.templateId && (
            <div className="flex items-center text-xs sm:text-sm text-gray-400 col-span-1 sm:col-span-2">
              <FileCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-400" />
              <span 
                className="truncate cursor-pointer hover:text-orange-300"
                onClick={() => setShowFullTemplateId(!showFullTemplateId)}
                title={showFullTemplateId ? "Click to collapse" : "Click to expand"}
              >
                {showFullTemplateId ? vm.templateId : `Template: ${vm.templateId.length > 15 ? vm.templateId.substring(0, 15) + '...' : vm.templateId}`}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="h-3 w-3 mr-1 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-xs font-medium">Start:</span>
              <span className="text-xs">{formatDate(vm.startdate)}</span>
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-xs font-medium">End:</span>
              <span className="text-xs">{formatDate(vm.enddate)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2 sm:pt-3 border-t border-orange-500/10">
          <div className="flex justify-center">
            <button 
              onClick={handleLaunchVM}
              disabled={isLaunchProcessing}
              className={`w-full h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                       ${buttonLabel === 'Stop' 
                         ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                         : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                       }
                       transition-colors flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLaunchProcessing ? (
                <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : buttonLabel === 'Stop' ? (
                <>
                  <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span>{buttonLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ProxmoxDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        vmTitle={vm.title}
      />
    </div>
  );
};
