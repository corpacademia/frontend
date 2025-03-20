import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { 
  Clock, Tag, BookOpen, Play, FolderX, Brain, 
  Search, Filter, Square, Trash2,
  Cpu, Server, HardDrive, X, Loader, AlertCircle, Check
} from 'lucide-react';
import axios from 'axios';

interface Instance {
  username: string;
  user_id: string;
  instance_id: string;
  public_ip: string;
  password: string;
}

interface LabControl {
  isLaunched: boolean;
  isLaunching: boolean;
  isProcessing: boolean;
  buttonLabel: 'Start Lab' | 'Stop Lab';
  notification: {
    type: 'success' | 'error';
    message: string;
  } | null;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  labId: string;
  labTitle: string;
  userId: string;
}

interface LabDetails {
  id: string;
  user_id: string;
  instance_id: string;
  public_ip: string;
  password: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, labId, labTitle, userId }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    setNotification(null);

    try {

      const instance_details = await axios.post('http://localhost:3000/api/v1/lab_ms/awsInstanceOfUsers', {
        lab_id: labId,
        user_id:userId,
      });
      const ami = await axios.post('http://localhost:3000/api/v1/lab_ms/amiinformation', { lab_id: labId });
      const response = await axios.post('http://localhost:3000/api/v1/aws_ms/deletevm', {
        id: labId,
        instance_id: instance_details.data.result.instance_id,
        ami_id: ami.data.result.ami_id,
        user_id: userId
      });
      
      if (response.data.success) {
        setNotification({ type: 'success', message: 'Lab deleted successfully' });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete lab');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error?.data?.message || 'Failed to delete lab'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Delete Lab</GradientText>
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
            Are you sure you want to delete <span className="font-semibold">{labTitle}</span>? This action cannot be undone.
          </p>

          {notification && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              notification.type === 'success' 
                ? 'bg-emerald-500/20 border border-emerald-500/20' 
                : 'bg-red-500/20 border border-red-500/20'
            }`}>
              {notification.type === 'success' ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <span className={`text-sm ${
                notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {notification.message}
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-primary bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                'Delete Lab'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyLabs: React.FC = () => {
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [labStatus, setLabStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudInstanceDetails, setCloudInstanceDetails] = useState<LabDetails | undefined>(undefined);
  const [labControls, setLabControls] = useState<Record<string, LabControl>>({});
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    labId: string;
    labTitle: string;
    userId: string;
  }>({
    isOpen: false,
    labId: '',
    labTitle: '',
    userId: '',
  });

  const [filters, setFilters] = useState({
    search: '',
    provider: '',
    status: ''
  });

  const [user,setUser] = useState({});

  // const admin = JSON.parse(localStorage.getItem('auth') ?? '{}').result || {};
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setUser(response.data.user);
    };
    getUserDetails();
  }, []);
  // Combine all fetch calls into a single useEffect
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cataloguesRes, labsRes, softwareRes] = await Promise.all([
          axios.get('http://localhost:3000/api/v1/lab_ms/getCatalogues'),
          axios.post('http://localhost:3000/api/v1/lab_ms/getAssignedLabs', { userId: user.id }),
          axios.get('http://localhost:3000/api/v1/lab_ms/getSoftwareDetails')
        ]);
        const cats = cataloguesRes.data.data;
        const labss = labsRes.data.data;
        const softwareData = softwareRes.data.data;

        // Filter catalogues based on assigned labs
        const filteredCatalogues = cats.filter((cat) => 
          labss.some((lab) => lab.lab_id === cat.lab_id)
        );

        // Attach software details to each lab
        const updatedLabs = filteredCatalogues.map((lab) => {
          const software = softwareData.find((s) => s.lab_id === lab.lab_id);
          return {
            ...lab,
            software: software ? [software.software] : []
          };
        });

        setLabs(updatedLabs);
        setFilteredLabs(updatedLabs);
        setLabStatus(labss);

          // Check status for each lab
      for (const lab of updatedLabs) {
        await checkLabStatus(lab.lab_id);
      }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  // Apply filters effect
  useEffect(() => {
    let result = [...labs];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(lab => 
        lab.title.toLowerCase().includes(searchTerm) ||
        lab.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.provider) {
      result = result.filter(lab => lab.provider.toLowerCase() === filters.provider.toLowerCase());
    }

    if (filters.status) {
      result = result.filter((lab, index) => 
        labStatus[index]?.status === filters.status
      );
    }

    setFilteredLabs(result);
  }, [filters, labs, labStatus]);

 

  const checkLabStatus = async (labId: string) => {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/aws_ms/checkLabStatus', {
        lab_id: labId,
        user_id: user.id
      });
      if (response.data.success) {
        setLabControls(prev => ({
          ...prev,
          [labId]: {
            ...prev[labId],
            isLaunched: response.data.success,
            buttonLabel: response.data.data.isrunning ? 'Stop Lab' : 'Start Lab'
          }
        }));
      }
    } catch (error) {
      console.error('Error checking lab status:', error);
    }
  };

  const handleLaunchLab = async (lab) => {
    setLabControls(prev => ({
      ...prev,
      [lab.lab_id]: {
        ...prev[lab.lab_id],
        isLaunching: true, // Loading starts
        notification: null
      }
    }));
  
    try {
      const [ami, labConfig] = await Promise.all([
        axios.post('http://localhost:3000/api/v1/lab_ms/amiinformation', { lab_id: lab.lab_id }),
        axios.post('http://localhost:3000/api/v1/lab_ms/getAssignLabOnId', { labId: lab.lab_id ,userId:user.id}),
        
      ]);
      if (!ami.data.success) {
        throw new Error('Failed to retrieve instance details');
      }
  
      // setCloudInstanceDetails(cloudInstanceDetails.data.data);
  
      // First API: Launch instance (Keep loading active)
      const response = await axios.post('http://localhost:3000/api/v1/aws_ms/launchInstance', {
        name: user.name,
        ami_id: ami.data.result.ami_id,
        user_id: user.id,
        lab_id: lab.lab_id,
        instance_type: lab.instance,
        start_date: formatDate(new Date()),
        end_date: formatDate(labConfig.data.data.completion_date),
      });
      // Only proceed if launchInstance is successful
      if (response.data.success) {
        // const cloudInstanceDetails = await axios.post('http://localhost:3000/api/v1/getAssignedInstance', {
        //   user_id: user.id,
        //   lab_id: lab.lab_id,
        // })
        // // Second API: Decrypt password (Keep loading active)
        // const decryptResponse = await axios.post("http://localhost:3000/api/v1/userDecryptPassword", {
        //   user_id: user.id,
        //   public_ip: cloudInstanceDetails.data.data.public_ip,
        //   instance_id: cloudInstanceDetails.data.data.instance_id,
        // });
  
        // Update state only after decryption completes
        setLabControls(prev => ({
          ...prev,
          [lab.lab_id]: {
            ...prev[lab.lab_id],
            isLaunched: true,
            isLaunching: false, // Loading stops after decryption
            notification: {
              type: 'success',
              message: 'Lab launched and password decrypted successfully'
            }
          }
        }));
        // Remove notification after 3 seconds
setTimeout(() => {
  setLabControls(prev => ({
    ...prev,
    [lab.lab_id]: {
      ...prev[lab.lab_id],
      notification: null // Clear notification
    }
  }));
}, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to launch lab');
      }
  
    } catch (error: any) {
      setLabControls(prev => ({
        ...prev,
        [lab.lab_id]: {
          ...prev[lab.lab_id],
          isLaunching: false, // Loading stops on error
          notification: {
            type: 'error',
            message: error.response?.data?.message || 'Failed to launch lab'
          }
        }
      }));
      // Remove notification after 3 seconds
setTimeout(() => {
  setLabControls(prev => ({
    ...prev,
    [lab.lab_id]: {
      ...prev[lab.lab_id],
      notification: null // Clear notification
    }
  }));
}, 3000);
    }
  };
  

  const handleStartStopLab = async (lab) => {
    const isStop = labControls[lab.lab_id]?.buttonLabel === 'Stop Lab';

    setLabControls(prev => ({
      ...prev,
      [lab.lab_id]: {
        ...prev[lab.lab_id],
        isProcessing: true,
        notification: null
      }
    }));

    const cloudinstanceDetails = await axios.post('http://localhost:3000/api/v1/aws_ms/getAssignedInstance', {
      user_id: user.id,
      lab_id: lab.lab_id,
    })
    if (!cloudinstanceDetails.data.success) {
      throw new Error('Failed to retrieve instance details');
    }
    setCloudInstanceDetails(cloudinstanceDetails.data.data);

    try {
      const instanceId = cloudInstanceDetails?.instance_id;

      if (isStop) {
        const stop =await axios.post('http://localhost:3000/api/v1/aws_ms/stopInstance', {
          instance_id: instanceId
        });
        if(stop.data.success){
          await axios.post('http://localhost:3000/api/v1/lab_ms/updateawsInstanceOfUsers',{
            lab_id:lab.lab_id,
            user_id:user.id,
            state:false,
            isStarted:true
          })
        }

        setLabControls(prev => ({
          ...prev,
          [lab.lab_id]: {
            ...prev[lab.lab_id],
            isProcessing: false,
            buttonLabel: 'Start Lab',
            notification: {
              type: 'success',
              message: 'Lab stopped successfully'
            }
          }
        }));

        setTimeout(() => {
          setLabControls(prev => ({
            ...prev,
            [lab.lab_id]: {
              ...prev[lab.lab_id],
              notification: null
            }
          }));
        }, 3000);

        return;
      }

    
      const checkInstanceAlreadyStarted = await axios.post('http://localhost:3000/api/v1/lab_ms/checkisstarted',{
        type:'user',
        id:cloudinstanceDetails?.data.data.instance_id,
      })
      if(checkInstanceAlreadyStarted.data.isStarted === false){
       
          console.log('stop')
          const response = await axios.post('http://localhost:3000/api/v1/aws_ms/runSoftwareOrStop', {
            os_name: lab.os,
            instance_id: cloudinstanceDetails?.data.data.instance_id,
            hostname: cloudinstanceDetails?.data.data.public_ip,
            password: cloudinstanceDetails?.data.data.password,
            buttonState: 'Start Lab'
          });
          
        if (response.data.response.success && response.data.response.jwtToken) {
          await axios.post('http://localhost:3000/api/v1/lab_ms/updateawsInstanceOfUsers',{
            lab_id:lab.lab_id,
            user_id:user.id,
            state:true,
            isStarted:false
          })
  
          const guacUrl = `http://192.168.1.210:8080/guacamole/#/?token=${response.data.jwtToken}`;
          window.open(guacUrl, '_blank');
        }
      }
      else{
        console.log('run')
        
        const restart = await axios.post('http://localhost:3000/api/v1/aws_ms/restart_instance', {
          instance_id: cloudinstanceDetails?.data.data.instance_id,
          user_type:'user'
        });


  
        if (restart.data.success ) {
          const cloudInstanceDetails = await axios.post('http://localhost:3000/api/v1/aws_ms/getAssignedInstance', {
            user_id: user.id,
            lab_id: lab.lab_id,
          })
          if(cloudInstanceDetails.data.success){
            const response = await axios.post('http://localhost:3000/api/v1/aws_ms/runSoftwareOrStop', {
              os_name: lab.os,
              instance_id: cloudinstanceDetails?.data.data.instance_id,
              hostname: cloudInstanceDetails?.data.data.public_ip,
              password: cloudinstanceDetails?.data.data.password,
              buttonState: 'Start Lab'
            });
            if(response.data.response.success){
              //update database that the instance is started
              await axios.post('http://localhost:3000/api/v1/lab_ms/updateawsInstanceOfUsers',{
                lab_id:lab.lab_id,
                user_id:user.id,
                state:true,
                isStarted:true
              })
  
              const guacUrl = `http://192.168.1.210:8080/guacamole/#/?token=${response.data.response.jwtToken}`;
            window.open(guacUrl, '_blank');
            }
          }
          
       
          
        }
      }
      
  

      setLabControls(prev => ({
        ...prev,
        [lab.lab_id]: {
          ...prev[lab.lab_id],
          isProcessing: false,
          buttonLabel: 'Stop Lab',
          notification: {
            type: 'success',
            message: 'Lab started successfully'
          }
        }
      }));

      setTimeout(() => {
        setLabControls(prev => ({
          ...prev,
          [lab.lab_id]: {
            ...prev[lab.lab_id],
            notification: null
          }
        }));
      }, 3000);

    } catch (error) {
      setLabControls(prev => ({
        ...prev,
        [lab.lab_id]: {
          ...prev[lab.lab_id],
          isProcessing: false,
          notification: {
            type: 'error',
            message: error.response?.data?.message || `Failed to ${isStop ? 'stop' : 'start'} lab`
          }
        }
      }));

      setTimeout(()=>{
        setLabControls(prev => ({
          ...prev,
          [lab.lab_id]: {
            ...prev[lab.lab_id],
            notification: null
          }
        }));
      },3000)
    }
  };

  function formatDate(inputDate: Date) {
    const date = new Date(inputDate);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
        <span className="ml-2 text-gray-400">Loading labs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="glass-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold mb-2">
              <GradientText>My Labs</GradientText>
            </h1>
            <p className="text-gray-400">Track your progress and continue your learning journey</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search labs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>

            <select
              value={filters.provider}
              onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
              className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            >
              <option value="">All Providers</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>

            <button 
              onClick={() => setFilters({ search: '', provider: '', status: '' })}
              className="btn-secondary whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Lab Cards */}
      {filteredLabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel">
          <FolderX className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            <GradientText>No Labs Found</GradientText>
          </h2>
          <p className="text-gray-400 text-center max-w-md mb-6">
            {labs.length === 0 
              ? "You haven't been assigned any labs yet. Check out our lab catalogue to get started."
              : "No labs match your current filters. Try adjusting your search criteria."}
          </p>
          {labs.length === 0 && (
            <a 
              href="/dashboard/labs/catalogue"
              className="btn-primary"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Lab Catalogue
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLabs.map((lab, index) => (
            <div key={lab.lab_id} 
                className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-primary-500/10 
                          hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                          transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
                          hover:translate-y-[-2px] group relative">
              {labControls[lab.lab_id]?.notification && (
                <div className={`absolute top-2 right-2 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
                  labControls[lab.lab_id].notification.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {labControls[lab.lab_id].notification.type === 'success' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{labControls[lab.lab_id].notification.message}</span>
                </div>
              )}
              
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      <GradientText>{lab.title}</GradientText>
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{lab.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDeleteModal({
                        isOpen: true,
                        labId: lab.lab_id,
                        labTitle: lab.title,
                        userId: user.id
                      })}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      labStatus[index]?.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      labStatus[index]?.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-primary-500/20 text-primary-300'
                    }`}>
                      {labStatus[index]?.status || 'Not Started'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Cpu className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
                    <span className="truncate">{lab.cpu} vCPU</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Tag className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
                    <span className="truncate">{lab.ram}GB RAM</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Server className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
                    <span className="truncate">Instance: {lab.instance}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <HardDrive className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
                    <span className="truncate">Storage: {lab.storage}GB</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Software Installed:</h4>
                  <div className="flex flex-wrap gap-2">
                    {lab.software?.map((software, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                        {software}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-primary-500/10 flex justify-end space-x-3">
                  {!labControls[lab.lab_id]?.isLaunched ? (
                    <button
                      onClick={() => handleLaunchLab(lab)}
                      disabled={labControls[lab.lab_id]?.isLaunching}
                      className="w-12 h-12 rounded-full flex items-center justify-center
                               bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {labControls[lab.lab_id]?.isLaunching ? (
                        <Loader className="animate-spin h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartStopLab(lab)}
                      disabled={labControls[lab.lab_id]?.isProcessing}
                      className={`w-12 h-12 rounded-full flex items-center justify-center
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                               ${labControls[lab.lab_id]?.buttonLabel === 'Stop Lab'
                                 ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                 : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                               }`}
                    >
                      {labControls[lab.lab_id]?.isProcessing ? (
                        <Loader className="animate-spin h-5 w-5" />
                      ) : labControls[lab.lab_id]?.buttonLabel === 'Stop Lab' ? (
                        <Square className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, labId: '', labTitle: '', userId: '' })}
        labId={deleteModal.labId}
        labTitle={deleteModal.labTitle}
        userId={deleteModal.userId}
      />
    </div>
  );
};