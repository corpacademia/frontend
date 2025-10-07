import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Plus, 
  Check, 
  AlertCircle, 
  X, 
  Cpu, 
  Hash,
  FileCode,
  Server,
  UserPlus,
  Loader,
  Pencil, 
  Trash2,
  Tag,
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
import { ProxmoxEditModal } from './ProxmoxEditModal';
import { ProxmoxConvertToCatalogueModal } from './ProxmoxConvertToCatalogueModal';

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

interface ProxmoxVMProps {
  vm: ProxmoxVM;
}

export const ProxmoxVMCard: React.FC<ProxmoxVMProps> = ({ vm }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLaunchProcessing, setIsLaunchProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [buttonLabel, setButtonLabel] = useState<'Launch VM' | 'Stop' | 'Start VM'>('Launch VM');
  const [showFullTemplateId, setShowFullTemplateId] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [vmStatus, setVmStatus] = useState<'running' | 'stopped' | 'pending'>('stopped');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [hasTemplate,setHasTemplate] = useState(false);
  useEffect(() => {
    checkVMStatus();
    checkTemplateCreated();
  }, [vm.labid]);
  const checkVMStatus = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/checkVMStatus`, {
        labId: vm.labid,
        vmId: vm.vmid
      });

      if (response.data.success) {
        const isLaunched = response.data.data.islaunched;
        const isRunning = response.data.data.isrunning;

        // Update VM status
        if (isRunning) {
          setVmStatus('running');
        } else if (isLaunched) {
          setVmStatus('stopped');
        } else {
          setVmStatus('pending');
        }

        // Update button label based on state
        if (!isLaunched) {
          setButtonLabel("Launch VM");
        } else if (isRunning) {
          setButtonLabel("Stop");
        } else if(isLaunched && !isRunning) {
          setButtonLabel("Start VM");
        }
      }
    } catch (error) {
      console.error('Error checking VM status:', error);
    }
  };
  const checkTemplateCreated = async()=>{
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getTemplateInformation/${vm.labid}`);
        if(response.data.success){
          setHasTemplate(true);
          setIsProcessing(response.data.data.processing);
        }
      } catch (error) {
         console.log(error);
      }
  }
  const handleLaunchVM = async () => {
    setIsLaunchProcessing(true);
    try {
      if( buttonLabel === 'Launch VM'){
         const launchVM = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchVM`,{
          node:vm.node,
          vmid:vm.vmid, 
          name:vm.vmname, 
          cores:vm.cpu,
          memory:vm.ram,
          storageType:vm.storagetype,
          storage:vm.storage,
          iso:vm.isoimage,
          nicModel:vm.nicmodel,
          networkBridge:vm.networkbridge,
          firewall:vm.firewall,
          boot:vm.boot
         }) 
         if(launchVM.data.success){
           setButtonLabel('Start VM');
          setVmStatus('stopped');
          setNotification({
            type: 'success',
            message: 'VM Launched successfully',
          });
         }

      }
      else if (buttonLabel === 'Stop') {
        // Stop the VM
        const stopResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/proxmox_ms/stopVM`, {
          lab_id: vm.labid,
          vmId: vm.vmid,
          node: vm.node
        });

        if (stopResponse.data.success) {
          setButtonLabel('Launch VM');
          setVmStatus('stopped');
          setNotification({
            type: 'success',
            message: 'VM stopped successfully',
          });
        } else {
          throw new Error(stopResponse.data.message || 'Failed to stop VM');
        }
      } 
      else {
        // Start the VM
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

          // Navigate to VM session if available
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
    } catch (error:any) {
      console.log(error)
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Operation failed',
      });
    } finally {
      setIsLaunchProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCreateTemplate = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/createTemplate`, {
        labId: vm.labid,
        vmid: vm.vmid,
        node: vm.node
      });

      if (response.data.success) {
        setNotification({ type: 'success', message: 'Template created successfully' });
        setHasTemplate(true)

        // Update lab status to available
        // const updateStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateProxmoxLabStatus`, {
        //   labId: vm.labid,
        //   status: 'available',
        //   templateId: response.data.templateId
        // });

        // if (updateStatus.data.success) {
        //   setNotification({ type: 'success', message: 'Lab status updated successfully' });
        // }
      } else {
        throw new Error(response.data.message || 'Failed to create template');
      }
    } catch (error:any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create template'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteProxmoxLab`,{
        labId:vm.labid,
        node:vm.node,
        vmid:vm.vmid
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

  const handleEditSuccess = () => {
    setNotification({ type: 'success', message: 'VM updated successfully' });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
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
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 sm:p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
            >
              <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400" />
            </button>
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
            <Server className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-400" />
            <span className="truncate">Node: {vm.node || 'N/A'}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-400" />
            <span>Storage: {vm.storage}GB</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-400 col-span-1 sm:col-span-2">
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

        {/* Date Information */}
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
          <div className="flex flex-col space-y-2">
            <div className="flex gap-1 sm:gap-2">
              <button 
                onClick={handleLaunchVM}
                disabled={isLaunchProcessing}
                className={`flex-1 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
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
                    <span className="hidden sm:inline">Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{buttonLabel}</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleCreateTemplate}
                disabled={isProcessing || vmStatus !== 'stopped'}
                className="flex-1 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                         bg-orange-500/20 text-orange-300 hover:bg-orange-500/30
                         transition-colors flex items-center justify-center
                         disabled:opacity-50 disabled:cursor-not-allowed"
                title={vmStatus !== 'stopped' ? 'Stop VM to create template' : ''}
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <FileCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Create Template</span>
                  </>
                )}
              </button>
            </div>

            <button
              className={`h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium w-full
                       ${hasTemplate 
                         ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transform hover:scale-105 shadow-lg shadow-orange-500/20' 
                         : 'bg-gray-500/20 cursor-not-allowed opacity-50'
                       }
                       transition-all duration-300
                       text-white
                       flex items-center justify-center`}
              disabled = {!hasTemplate}
              onClick={() => setIsConvertModalOpen(true)}
              title={!hasTemplate ? 'Create template first to enable this option' : ''}

            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Convert to Catalogue
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

      <ProxmoxEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        vm={vm}
        onSuccess={handleEditSuccess}
      />
      
      <ProxmoxConvertToCatalogueModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        vmId={vm.labid}
      />
    </div>
  );
};