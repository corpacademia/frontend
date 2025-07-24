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
  Square
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { ConvertToCatalogueModal } from './ConvertToCatalogueModal';
import { EditModal } from './EditModal';
// import { EditStorageModal } from './EditStorageModal';
import { DeleteModal } from './DeleteModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface CloudVM {
  id: string;
  name: string;
  description: string;
  provider: string;
  instance: string;
  instance_id?: string;
  ami_id?: string;
  status: 'running' | 'stopped' | 'pending';
  cpu: number;
  ram: number;
  storage: number;
  os: string;
  lab_id: string;
  title: string;
  document: string;
}

interface CloudVMProps {
  vm: CloudVM;
}

interface Instance {
  id: string;
  lab_id: string;
  instance_id: string;
  instance_name: string;
  public_ip: string;
  password: string;
}

interface LabDetails {
  cpu: string;
  ram: string;
  storage: string;
  instance: string;
  description: string;
}

export const CloudVMCard: React.FC<CloudVMProps> = ({ vm }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLaunchProcessing, setIsLaunchProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConvertEnabled, setIsConvertEnabled] = useState(false);
  const [amiId, setAmiId] = useState<string | undefined>(vm.ami_id);
  const [instanceDetails, setInstance] = useState<Instance | undefined>(undefined);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isInstance, setIsInstance] = useState(false);
  const [isAmi, setIsAmi] = useState(false);
  const [labDetails, setLabDetails] = useState<LabDetails | null>(null);
  const [buttonLabel, setButtonLabel] = useState<'Launch Software' | 'Stop'>('Launch Software');
  const [showFullAmiId, setShowFullAmiId] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [admin,setAdmin] = useState({});
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);
useEffect(() => {
  const checkVmCreated = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/checkvmcreated`, {
        lab_id: vm.lab_id,
      });
      if (response.data.success) {
        setAmiId(response.data?.result?.ami_id);
        setIsConvertEnabled(true);
      }
    } catch (error) {
      console.error('Error checking VM status:', error);
    } 
  };

  checkVmCreated();
}, []);

 const checkLabLaunched= async ()=>{
      try {
        const check = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/checkIsLabInstanceLaunched`,{
          lab_id:vm.lab_id
        })
        if(check.data.success){
          // Set button label based on instance state
        if (check.data.data.isrunning) {
          setButtonLabel('Stop'); // If running, set to "Stop Instance"
        } else {
          setButtonLabel('Launch Software'); // If not running, set to "Launch Instance"
        }
        }
      } catch (error) {
        console.error('Error checking lab status:', error);
      }
 }

  useEffect(() => {
    const fetchInstanceDetails = async () => {
      try {
        const instance = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/awsCreateInstanceDetails`, {
          lab_id: vm.lab_id,
        });

        if (instance.data.success) {
          checkLabLaunched();
        setInstance(instance.data.result);
          setIsInstance(true);
        }
      } catch (error) {
        console.error('Failed to fetch instance details:', error);
      }
    };

    fetchInstanceDetails();
  }, [vm.lab_id,isLaunchProcessing]);

  useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`,
          {
            labId: vm.lab_id,
          }
        );
        if (response.data.success) {
          setLabDetails(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching lab details:", error);
      }
    };
    fetchLabDetails();
  }, [vm.lab_id]);

  const handleEditSuccess = () => {
    const fetchLabDetails = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`,
          {
            labId: vm.lab_id,
          }
        );
        if (response.data.success) {
          setLabDetails(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching lab details:", error);
      }
    };
    fetchLabDetails();
  }

  const handleLaunchSoftware = async () => {
    setIsLaunchProcessing(true);

    try {
      if (buttonLabel === 'Stop') {
        // Stop the Instance
        const stopResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/stopInstance`, {
          instance_id: instanceDetails?.instance_id,
        });

        if (stopResponse.data.success) {
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstance`, {
            lab_id: vm.lab_id,
            state: false,
            isStarted:true
          });

          setButtonLabel('Launch Software');
          setNotification({
            type: 'success',
            message: 'Software stopped successfully',
          });

          setIsLaunchProcessing(false);
          return; // Exit early since we don't need to continue
        } else {
          throw new Error(stopResponse.data.message || 'Failed to stop Instance');
        }
      }

      //check the instance is already started once
      const checkInstanceAlreadyStarted = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/checkisstarted`,{
        type:'lab',
        id:instanceDetails?.instance_id,
      })
      if(checkInstanceAlreadyStarted.data.isStarted === false){
        // Launch the Instance
      const launchResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
        os_name: vm.os,
        instance_id: instanceDetails?.instance_id,
        hostname: instanceDetails?.public_ip,
        password: instanceDetails?.password,
        buttonState: buttonLabel,
      });

      if (launchResponse.data.response.success) {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstance`, {
          lab_id: vm.lab_id,
          state: true,
          isStarted:false
        });

        setButtonLabel('Stop');
        setNotification({
          type: 'success',
          message: 'Software launched successfully',
        });

        // Navigate to Guacamole frame page instead of opening in new tab
        if (launchResponse.data.response.jwtToken) {
          const guacUrl = `${vm?.guacamole_url}?token=${launchResponse.data.response.jwtToken}`;
          navigate(`/dashboard/labs/vm-session/${vm.lab_id}`, {
            state: { 
              guacUrl,
              vmTitle: vm.title,
              vmId: vm.lab_id,
              doc:vm.labguide,
            }
          });
        }
      } else {
        throw new Error(launchResponse.data.response.message || 'Failed to launch software');
      }
      }
      else{
        const restart = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/restart_instance`, {
          instance_id:  instanceDetails?.instance_id,
          user_type:'lab'
        });

        //get the public from the database which is updated public_ip after stop
        const instance = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/awsCreateInstanceDetails`, {
          lab_id: vm.lab_id,
        });

        if(instance.data.success){
          console.log(instance.data)
              // Launch the Instance
      const launchResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
        os_name: vm.os,
        instance_id: instanceDetails?.instance_id,
        hostname: instance?.data.result.public_ip,
        password: instanceDetails?.password,
        buttonState: buttonLabel,
      });
      if (launchResponse.data.response.success) {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstance`, {
          lab_id: vm.lab_id,
          state: true,
          isStarted:true
        });

        setButtonLabel('Stop');
        setNotification({
          type: 'success',
          message: 'Software launched successfully',
        });

        // Navigate to Guacamole frame page instead of opening in new tab
        if (launchResponse.data.response.jwtToken) {
          const guacUrl = `${vm?.guacamole_url}?token=${launchResponse.data.response.jwtToken}`;
          navigate(`/dashboard/labs/vm-session/${vm.lab_id}`, {
            state: { 
              guacUrl,
              vmTitle: vm.title,
              vmId: vm.lab_id,
              doc:vm.labguide,
            }
          });
        }
      } else {
        throw new Error(launchResponse.data.response.message || 'Failed to launch software');
      }
        }

      }


    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Operation failed',
      });
    } finally {
      setIsLaunchProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };


  const handleVMGoldenImage = async () => {
    setIsProcessing(true);
    try {

       const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/awsCreateInstanceDetails`, {
        lab_id: vm.lab_id
      });

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createGoldenImage`, {
        instance_id: result.data.result.instance_id,
        lab_id: vm.lab_id
      });
      if (response.data.success) { 
        const ami = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiInformation`, {
          lab_id: vm.lab_id
        });
        setNotification({ type: 'success', message: 'Golden image created successfully' });
        setAmiId(ami.data.ami_id);
        setIsConvertEnabled(true);

        try {
          const updateStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVmStatus`, {
            labId: vm.lab_id,
            status: 'available',
          })
          if(updateStatus.data.success){
            setNotification({ type: 'success', message: 'Lab status updated successfully' });
          } else {
            setNotification({ type: 'error', message: 'Failed to update lab status' });
          }
        } catch (error) {
          setNotification({
            type: 'error',
            message: error.response?.data?.message || 'Failed to update lab status'
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to create golden image');
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create golden image'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deletesupervm`, {
        id: vm.lab_id,
        instance_id: instanceDetails?.instance_id,
        ami_id: amiId,
      });

      if (response.data.success) {
        setNotification({ type: 'success', message: 'VM deleted successfully' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete VM');
      }
    } catch (error) {
      console.log(error)
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete VM'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (!isInstance) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="animate-spin h-8 w-8 text-primary-400" />
        <span className="ml-2 text-gray-300">
          Loading instance details...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-[320px] max-h-fit overflow-hidden rounded-xl border border-primary-500/10 
                    hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
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
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-lg font-semibold mb-1">
                <GradientText>
                  <span 
                    className="cursor-pointer hover:text-primary-300 transition-colors"
                    onClick={() => setShowFullTitle(!showFullTitle)}
                    title={showFullTitle ? "Click to collapse" : "Click to expand"}
                  >
                    {showFullTitle ? vm.title : (vm.title.length > 30 ? vm.title.substring(0, 30) + '...' : vm.title)}
                  </span>
                </GradientText>
              </h3>
              <p 
                className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => setShowFullDescription(!showFullDescription)}
                title={showFullDescription ? "Click to collapse" : "Click to expand"}
              >
                {showFullDescription ? vm.description : (vm.description.length > 80 ? vm.description.substring(0, 80) + '...' : vm.description)}
              </p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                vm.status === 'running' ? 'bg-emerald-500/20 text-emerald-300' :
                vm.status === 'stopped' ? 'bg-red-500/20 text-red-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>
                {vm.status}
              </span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
              >
                <Pencil className="h-4 w-4 text-primary-400" />
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-400">
              <Cpu className="h-4 w-4 mr-2 text-primary-400" />
              <span>{vm.cpu} vCPU</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Tag className="h-4 w-4 mr-2 text-primary-400" />
              <span>{vm.ram}GB RAM</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Server className="h-4 w-4 mr-2 text-primary-400" />
              <span className="truncate">Instance: {vm.instance}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <HardDrive className="h-4 w-4 mr-2 text-primary-400" />
              <span>Storage: {vm.storage}GB</span>
            </div>
            <div className="flex items-center text-sm text-gray-400 col-span-2">
              <Hash className="h-4 w-4 mr-2 text-primary-400" />
              <span className="truncate">ID: {instanceDetails?.instance_id || 'N/A'}</span>
            </div>
            {amiId && (
              <div className="flex items-center text-sm text-gray-400 col-span-2">
                <FileCode className="h-4 w-4 mr-2 text-primary-400" />
                <span 
                  className="truncate cursor-pointer hover:text-primary-300"
                  onClick={() => setShowFullAmiId(!showFullAmiId)}
                  title={showFullAmiId ? "Click to collapse" : "Click to expand"}
                >
                  {showFullAmiId ? amiId : `AMI: ${amiId.length > 15 ? amiId.substring(0, 15) + '...' : amiId}`}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-primary-500/10">
            <div className="flex flex-col space-y-2">
              <div className="flex gap-2">
                <button 
                  onClick={handleLaunchSoftware}
                  disabled={isProcessing}
                  className={`flex-1 h-9 px-4 rounded-lg text-sm font-medium
                           ${buttonLabel === 'Stop' 
                             ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                             : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                           }
                           transition-colors flex items-center justify-center
                           disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLaunchProcessing ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : buttonLabel === 'Stop' ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Launch VM
                    </>
                  )}
                </button>
                <button 
                  onClick={handleVMGoldenImage}
                  disabled={isProcessing}
                  className="flex-1 h-9 px-4 rounded-lg text-sm font-medium
                           bg-primary-500/20 text-primary-300 hover:bg-primary-500/30
                           transition-colors flex items-center justify-center
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'VM-GoldenImage'}
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                disabled={!isConvertEnabled}
                className="h-9 px-4 rounded-lg text-sm font-medium w-full
                         bg-gradient-to-r from-primary-500 to-secondary-500
                         hover:from-primary-400 hover:to-secondary-400
                         transform hover:scale-105 transition-all duration-300
                         text-white shadow-lg shadow-primary-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Convert to Catalogue
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConvertToCatalogueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vmId={vm.lab_id}
        amiId={amiId}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentStorage={Number(labDetails?.storage) || 0}
        assessmentId={instanceDetails?.instance_id}
        lab_id={vm.lab_id}
        onSuccess={handleEditSuccess}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};