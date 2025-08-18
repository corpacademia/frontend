import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { 
  Clock, Tag, BookOpen, Play, FolderX, Brain, 
  Search, Filter, Square, Trash2,
  Cpu, Server, HardDrive, X, Loader, AlertCircle, Check
} from 'lucide-react';
import axios from 'axios';
import { CloudSliceCard } from '../../labs/components/user/CloudSliceCard';
import { DatacenterVMCard } from '../../labs/components/user/DatacenterVMCard';
import { VMClusterSingleVMCard } from '../../labs/components/user/VMClusterSingleVMCard';
import { useNavigate } from 'react-router-dom';

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
      let instance_details;
      try {
        instance_details = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/awsInstanceOfUsers`, {
          lab_id: labId,
          user_id: userId,
        });
      } catch (error) {
        console.error("Error fetching instance details:", error);
      }
  
      let ami;
      try {
        ami = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiinformation`, { lab_id: labId });
      } catch (error) {
        console.error("Error fetching AMI details:", error);
      }
  
      let response;
      try {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deletevm`, {
          id: labId,
          instance_id: instance_details?.data?.result?.instance_id || null,
          ami_id: ami?.data?.result?.ami_id || null,
          user_id: userId,
        });
      } catch (error) {
        console.error("Error deleting VM:", error);
      }
  
      if (response?.data?.success) {
        setNotification({
        type: 'success',
        message: response?.data?.message || 'Successfully deleted lab'
      });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
          // onDelete(deletedId);
        } else {
          throw new Error(response?.data?.message || 'Failed to delete lab');
        }
    } catch (error) {
      setTimeout(() => setNotification(null), 3000);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to delete lab',
      })
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
            <div className={`rounded-md bg-${notification.type === 'success' ? 'emerald' : 'red'}-900/50 border border-${notification.type === 'success' ? 'emerald' : 'red'}-500/50 p-4`}>
              <div className="flex">
                {notification.type === 'success' ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <h3 className={`text-sm font-medium text-${notification.type === 'success' ? 'emerald' : 'red'}-200`}>{notification.message}</h3>
                </div>
              </div>
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
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [cloudSliceLabs, setCloudSliceLabs] = useState([]);
  const [datacenterVMs, setDatacenterVMs] = useState([]);
  const [clusterVMs, setClusterVMs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [filteredCloudSliceLabs, setFilteredCloudSliceLabs] = useState([]);
  const [filteredDatacenterVMs, setFilteredDatacenterVMs] = useState([]);
  const [filteredClusterVMs, setFilteredClusterVMs] = useState([]);
  const [labStatus, setLabStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudInstanceDetails, setCloudInstanceDetails] = useState<LabDetails | undefined>(undefined);
  const [labControls, setLabControls] = useState<Record<string, LabControl>>({});
  const [userLabStatus,setUserLabStatus] = useState<any>();
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

  const [user, setUser] = useState({});

  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setUser(response.data.user);
      const labStatus = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserLabStatus/${response.data.user.id}`);
      if(labStatus.data.success){
        setUserLabStatus(labStatus?.data?.data)
      }
    };
    getUserDetails();
  }, []);

  // Combine all fetch calls into a single useEffect
 useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);

    try {
      let cats: any[] = [];
      let labss: any[] = [];
      let softwareData: any[] = [];

      // Fetch catalogues, assigned labs, and software - isolated per call
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCatalogues`);
        cats = res.data.data;
      } catch (err) {
        console.error('Failed to fetch catalogues:', err);
      }

      try {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAssignedLabs`, { userId: user.id });
        labss = res.data.data;
        setLabStatus(labss); // safe to set even if others fail
      } catch (err) {
        console.error('Failed to fetch assigned labs:', err);
      }
      //user purchased single vm
      try {
        
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVMUserPurchsedLabs`,
           { userId: user?.id }
          );
        labss = res.data.data;
        setLabStatus(labss); // safe to set even if others fail
      } catch (error) {
        console.error("Failed to fetch the singlevm labs")
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSoftwareDetails`);
        softwareData = res.data.data;
      } catch (err) {
        console.error('Failed to fetch software details:', err);
      }
      // Safely process lab data if available
      const filteredCatalogues = cats
        .map(cat => {
          const matchingLab = labss.find(
            lab => (lab?.lab_id ?? lab?.labid) === cat.lab_id
          );
          return matchingLab ? { ...cat, ...matchingLab } : null;
        })
        .filter(Boolean); // remove nulls (non-matching)

      const updatedLabs = filteredCatalogues.map((lab) => {
        const software = softwareData.find((s) => s.lab_id === lab.lab_id);
        return {
          ...lab,
          software: software ? software.software : []
        };
      });
      setLabs(updatedLabs);
      setFilteredLabs(updatedLabs);

      // Fetch cloud slice labs
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserCloudSlices/${user.id}`);
        if (res.data.success) {
          const cloudSlices = res.data.data || [];
          setCloudSliceLabs(cloudSlices);
          setFilteredCloudSliceLabs(cloudSlices);
        }
      } catch (err) {
        console.error('Error fetching cloud slice labs:', err);
      }
      //fetch user purchased cloudslice labs
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSlicePurchasedLabs`,{
        userId:user?.id
      })
      if(res.data.success){
          const cloudslices = res.data.data.map((lab: any) => ({
        ...lab,
        purchased: true
       }));
       setCloudSliceLabs((data = []) => [
            ...data,
            ...cloudslices
          ]);

          setFilteredCloudSliceLabs((data = []) => [
            ...data,
            ...cloudslices
          ]);
          if (Array.isArray(cloudslices)) {
            setUserLabStatus((data = []) => [
              ...data,
              ...cloudslices
            ]);
          }


      }
       
      } catch (err) {
         console.error('Error fetching cloud slice purchased labs:', err);
      }
      // Fetch datacenter VMs
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getUserAssignedSingleVmDatacenterLabs/${user?.id}`
        );
        if (res.data.success) {
          const vmDetails = await Promise.all(
            res.data.data.map(async (assignment: any) => {
              try {
                const vmRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabOnId`, {
                  labId: assignment.labid,
                });

                if (vmRes.data.success) {
                  const credsRes = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getUserAssignedSingleVMDatacenterCredsToUser`,
                    { labId: assignment.labid, userId: user.id }
                  );

                  return {
                    ...vmRes.data.data,
                    ...assignment,
                    userscredentials: credsRes.data.success ? credsRes.data.data : [],
                  };
                }
              } catch (err) {
                console.error(`Error fetching VM/creds for lab ${assignment.labid}:`, err);
              }
              return null;
            })
          );

          const cleanVMs = vmDetails.filter(Boolean);
          setDatacenterVMs(cleanVMs);
          setFilteredDatacenterVMs(cleanVMs);
        }
      } catch (err) {
        console.error('Error fetching datacenter VMs:', err);
      }

      // Fetch cluster VMs
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getUserAssignedClusterLabs/${user.id}`
        );
        if (res.data.success) {
          const clusterDetails = await Promise.all(
            res.data.data.map(async (assignment: any) => {
              try {
                const clusterRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabOnId`, {
                  labId: assignment.labid,
                });

                if (clusterRes.data.success) {
                  const usersRes = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getUserAssignedClusterCredsToUser`,
                    { labId: assignment.labid, userId: user.id }
                  );
                  
                  return {
                    ...clusterRes.data.data[0],
                    lab:{
                      ...clusterRes.data.data[0].lab,
                      ...assignment,
                    },
                    
                    users: usersRes.data.success ? usersRes.data.data : [],
                  };
                }
              } catch (err) {
                console.error(`Error fetching cluster/creds for lab ${assignment.labid}:`, err);
              }
              return null;
            })
          );
          const cleanClusters = clusterDetails.filter(Boolean);
          setClusterVMs(cleanClusters);
          setFilteredClusterVMs(cleanClusters);
        }
      } catch (err) {
        console.error('Error fetching cluster VMs:', err);
      }

      // Optional: Check status of each lab
      for (const lab of updatedLabs) {
        try {
          await checkLabStatus(lab.lab_id);
        } catch (err) {
          console.error(`Failed checking status for lab ${lab.lab_id}:`, err);
        }
      }

    } catch (finalErr) {
      console.error('Unhandled error during data fetch:', finalErr);
    } finally {
      setIsLoading(false);
    }
  };

  if (user.id) {
    fetchData();
  }
}, [user.id]);

  // Apply filters effect
  useEffect(() => {
    // Filter regular labs
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

    // Filter cloud slice labs
    let cloudSliceResult = [...cloudSliceLabs];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      cloudSliceResult = cloudSliceResult.filter(lab => 
        lab.title.toLowerCase().includes(searchTerm) ||
        lab.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.provider) {
      cloudSliceResult = cloudSliceResult.filter(lab => 
        lab.provider.toLowerCase() === filters.provider.toLowerCase()
      );
    }

    if (filters.status) {
      cloudSliceResult = cloudSliceResult.filter(lab => 
        lab.status === filters.status
      );
    }

    setFilteredCloudSliceLabs(cloudSliceResult);
    
    // Filter datacenter VMs
    let datacenterResult = [...datacenterVMs];
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      datacenterResult = datacenterResult.filter(lab => 
        lab.title.toLowerCase().includes(searchTerm) ||
        (lab.description && lab.description.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters.status) {
      datacenterResult = datacenterResult.filter(lab => 
        lab.status === filters.status
      );
    }
    
    setFilteredDatacenterVMs(datacenterResult);

    // Filter cluster VMs
    let clusterResult = [...clusterVMs];
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      clusterResult = clusterResult.filter(lab => 
        lab.lab?.title?.toLowerCase().includes(searchTerm) ||
        lab.title?.toLowerCase().includes(searchTerm) ||
        (lab.lab?.description && lab.lab.description.toLowerCase().includes(searchTerm)) ||
        (lab.description && lab.description.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters.status) {
      clusterResult = clusterResult.filter(lab => 
        lab.lab?.status === filters.status || lab.status === filters.status
      );
    }
    
    setFilteredClusterVMs(clusterResult);
  }, [filters, labs, labStatus, cloudSliceLabs, datacenterVMs, clusterVMs]);

  const checkLabStatus = async (labId: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/checkLabStatus`, {
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
    if(lab?.status === 'expired'){
       setLabControls(prev => ({
      ...prev,
      [lab.lab_id]: {
        ...prev[lab.lab_id],
        notification: {type:'error',message:"Lab has expired"}
      }
    }));
     setTimeout(() => {
          setLabControls(prev => ({
            ...prev,
            [lab.lab_id]: {
              ...prev[lab.lab_id],
              notification: null // Clear notification
            }
          }));
        }, 2000);
    return;
    }
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
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiinformation`, { lab_id: lab?.lab_id || lab?.labid }),
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAssignLabOnId`, { labId: lab?.lab_id || lab?.labid ,userId:user.id}),
        
      ]);
      if (!ami.data.success) {
        throw new Error('Failed to retrieve instance details');
      }
  
      // First API: Launch instance (Keep loading active)
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/launchInstance`, {
        name: user.name,
        ami_id: ami.data.result.ami_id,
        user_id: user.id,
        lab_id: lab?.lab_id || lab?.labid,
        instance_type: lab.instance,
        start_date: formatDate(new Date()),
        end_date: formatDate(
        labConfig?.data?.data?.completion_date ||
          new Date(Date.now() + (labConfig?.data?.data?.duration) * 24 * 60 * 60 * 1000) 
      )
      });
      // Only proceed if launchInstance is successful
      if (response.data.success) {
        setLabControls(prev => ({
          ...prev,
          [lab?.lab_id || lab?.labid]: {
            ...prev[lab?.lab_id || lab?.labid],
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
            [lab?.lab_id || lab?.labid]: {
              ...prev[lab?.lab_id || lab?.labid],
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
        [lab?.lab_id || lab?.labid]: {
          ...prev[lab?.lab_id || lab?.labid],
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
          [lab?.lab_id || lab?.labid]: {
            ...prev[lab?.lab_id || lab?.labid],
            notification: null // Clear notification
          }
        }));
      }, 3000);
    }
  };
  

  const handleStartStopLab = async (lab) => {
    const isStop = labControls[lab?.lab_id || lab?.labid]?.buttonLabel === 'Stop Lab';

    setLabControls(prev => ({
      ...prev,
      [lab?.lab_id || lab?.labid]: {
        ...prev[lab?.lab_id || lab?.labid],
        isProcessing: true,
        notification: null
      }
    }));

    const cloudinstanceDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
      user_id: user.id,
      lab_id: lab?.lab_id || lab?.labid,
    })
    if (!cloudinstanceDetails.data.success) {
      throw new Error('Failed to retrieve instance details');
    }
    setCloudInstanceDetails(cloudinstanceDetails.data.data);

    try {
      const instanceId = cloudInstanceDetails?.instance_id;
      if (isStop) {
        const stop =await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/stopInstance`, {
          instance_id: instanceId
        });
        if(stop.data.success){
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,{
            lab_id:lab?.lab_id || lab?.labid,
            user_id:user.id,
            state:false,
            isStarted:true
          })
        }

        setLabControls(prev => ({
          ...prev,
          [lab?.lab_id || lab?.labid]: {
            ...prev[lab?.lab_id || lab?.labid],
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
            [lab?.lab_id || lab?.labid]: {
              ...prev[lab?.lab_id || lab?.labid],
              notification: null
            }
          }));
        }, 3000);

        return;
      }

    
      const checkInstanceAlreadyStarted = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/checkisstarted`,{
        type:'user',
        id:cloudinstanceDetails?.data.data.instance_id,
      })
      if(checkInstanceAlreadyStarted.data.isStarted === false){
       
          console.log('stop')
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
            os_name: lab.os,
            instance_id: cloudinstanceDetails?.data.data.instance_id,
            hostname: cloudinstanceDetails?.data.data.public_ip,
            password: cloudinstanceDetails?.data.data.password,
            buttonState: 'Start Lab'
          });
          
        if (response.data.response.success && response.data.response.jwtToken) {
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,{
            lab_id:lab?.lab_id || lab?.labid,
            user_id:user.id,
            state:true,
            isStarted:false
          })
          
           const guacUrl = `${lab.guacamole_url}?token=${response.data.response.jwtToken}`;
           console.log(guacUrl)
          navigate(`/dashboard/labs/vm-session/${lab.lab_id}`, {
            state: { 
              guacUrl,
              vmTitle: lab.title,
              vmId: lab?.lab_id || lab?.labid,
              doc:lab.userguide
            }
          });
        }
      }
      else{
        console.log('run')
        
        const restart = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/restart_instance`, {
          instance_id: cloudinstanceDetails?.data.data.instance_id,
          user_type:'user'
        });


  
        if (restart.data.success ) {
          const cloudInstanceDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
            user_id: user.id,
            lab_id: lab?.lab_id || lab?.labid,
          })
          if(cloudInstanceDetails.data.success){
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
              os_name: lab.os,
              instance_id: cloudinstanceDetails?.data.data.instance_id,
              hostname: cloudInstanceDetails?.data.data.public_ip,
              password: cloudinstanceDetails?.data.data.password,
              buttonState: 'Start Lab'
            });
            if(response.data.success){
              //update database that the instance is started
              await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,{
                lab_id:lab?.lab_id || lab?.labid,
                user_id:user.id,
                state:true,
                isStarted:true
              })
              const guacUrl = `${lab.guacamole_url}?token=${response.data.response.jwtToken}`;
              
          navigate(`/dashboard/labs/vm-session/${lab?.lab_id || lab?.labid}`, {
            state: { 
              guacUrl,
              vmTitle: lab.title,
              vmId: lab?.lab_id || lab?.labid,
              doc:lab.userguide
            }
          });
            }
          }
        }
      }
      
  

      setLabControls(prev => ({
        ...prev,
        [lab?.lab_id || lab?.labid]: {
          ...prev[lab?.lab_id || lab?.labid],
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
          [lab?.lab_id || lab?.labid]: {
            ...prev[lab?.lab_id || lab?.labid],
            notification: null
          }
        }));
      }, 3000);

    } catch (error) {
      setLabControls(prev => ({
        ...prev,
        [lab?.lab_id || lab?.labid]: {
          ...prev[lab?.lab_id || lab?.labid],
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
          [lab?.lab_id || lab?.labid]: {
            ...prev[lab?.lab_id || lab?.labid],
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

  const handleDeleteCloudSlice = async (labId: string, labStatus: any) => {
    // This function will be passed to the CloudSliceCard component
    // It will be called when the user clicks the delete button on a cloud slice lab
    const acountDetails = labStatus.find((lab) => lab.labid === labId)
    try {
      let response;
      let IamSuccess;
      if (acountDetails?.username !== null && acountDetails?.username !== undefined) {
      const deleteIam = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deleteIamAccount`, {
        userName: acountDetails.username
      })
     IamSuccess = deleteIam.data.success;
    }
      IamSuccess = true ;
      if (IamSuccess) {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteUserCloudSlice`, {
          userId: user.id,
          labId: labId,
          purchased:acountDetails?.purchased || false
        })
        if (response.data.success) {
          setCloudSliceLabs(prev => prev.filter(lab => lab.labid !== labId));
          setFilteredCloudSliceLabs(prev => prev.filter(lab => lab.labid !== labId));
        }
      }
    } catch (error) {
      console.error('Error deleting cloud slice:', error);
      throw error;
    }
  };
  
  const handleDeleteDatacenterVM = async (labId: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteSingleVmDatacenterUserAssignment`, {
        labId: labId,
        userId: user.id
      });
      
      if (response.data.success) {
        setDatacenterVMs(prev => prev.filter(vm => vm.labid !== labId));
        setFilteredDatacenterVMs(prev => prev.filter(vm => vm.labid !== labId));
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete datacenter VM');
      }
    } catch (error) {
      console.error('Error deleting datacenter VM:', error);
      throw error;
    }
  };

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
              <option value="expired">Expired</option>
              <option value="not-started">Not Started</option>
              <option value="started">Started</option>
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
      {filteredLabs.length === 0 && filteredCloudSliceLabs.length === 0 && filteredDatacenterVMs.length === 0 && filteredClusterVMs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel">
          <FolderX className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            <GradientText>No Labs Found</GradientText>
          </h2>
          <p className="text-gray-400 text-center max-w-md mb-6">
            {labs.length === 0 && cloudSliceLabs.length === 0 && datacenterVMs.length === 0 && clusterVMs.length === 0
              ? "You haven't been assigned any labs yet. Check out our lab catalogue to get started."
              : "No labs match your current filters. Try adjusting your search criteria."}
          </p>
          {labs.length === 0 && cloudSliceLabs.length === 0 && datacenterVMs.length === 0 && clusterVMs.length === 0 && (
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
        <div className="space-y-6">
          {/* Regular VM Labs */}
          {filteredLabs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                <GradientText>Virtual Machine Labs</GradientText>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLabs.map((lab, index) => (
                  <div key={lab.lab_id} 
                      className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-primary-500/10 
                                hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                                transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
                                hover:translate-y-[-2px] group relative">
                    {labControls[lab.lab_id]?.notification && (
                      <div className={`absolute top-2 right-2 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
                        labControls[lab.lab_id]?.notification.type === 'success' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {labControls[lab.lab_id]?.notification.type === 'success' ? (
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
                            labStatus[index]?.status === 'started' ? 'bg-emerald-500/20 text-emerald-300' :
                            labStatus[index]?.status === 'expired' ? 'bg-red-500/20 text-red-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {labStatus[index]?.status || 'not-started'}
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
            </div>
          )}

          {/* Datacenter VMs */}
          {filteredDatacenterVMs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                <GradientText>Datacenter VMs</GradientText>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDatacenterVMs.map((vm) => (
                  <DatacenterVMCard 
                    key={vm.id} 
                    lab={vm}
                    onDelete={handleDeleteDatacenterVM}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cluster VMs */}
          {filteredClusterVMs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                <GradientText>VM Cluster Labs</GradientText>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClusterVMs.map((cluster) => (
                  <VMClusterSingleVMCard 
                    key={cluster.id} 
                    vm={cluster}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cloud Slice Labs */}
          {filteredCloudSliceLabs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                <GradientText>Cloud Slice Labs</GradientText>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCloudSliceLabs.map((lab) => (
                  <CloudSliceCard 
                    key={lab.id} 
                    lab={lab} 
                    onDelete={handleDeleteCloudSlice} 
                    labStatus={userLabStatus}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}
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