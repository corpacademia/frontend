import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Tag, 
  BookOpen, 
  AlertCircle, 
  Check,
  X,
  Cpu,
  Hash,
  FileCode,
  HardDrive,
  Server,
  Users,
  Pencil, 
  Trash2,
  CreditCard,
  Loader,
  Play,
  Square
} from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface CloudVMAssessmentProps {
  assessment: {
    assessment_id: string;
    title: string;
    description: string;
    provider: string;
    instance: string;
    instance_id?: string;
    status: 'active' | 'inactive' | 'pending';
    cpu: number;
    ram: number;
    storage: number;
    os: string;
    software: string[];
    config_details?: any;
    lab_id: string;
  };
}

interface org {
  id: string;
  organization_name: string;
  org_id: string;
  org_admin: string;
  org_type: string;
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

export const CloudVMAssessmentCard: React.FC<CloudVMAssessmentProps> = ({ assessment }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [orgDetails, setOrgDetails] = useState<org | null>(null);
  const [labDetails, setLabDetails] = useState<LabDetails | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; }[]>([]);
  const [load, setLoad] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(true);
  const [isLaunchProcessing, setIsLaunchProcessing] = useState(false);
  const [instanceDetails, setInstanceDetails] = useState<Instance | undefined>(undefined);
  const [buttonLabel, setButtonLabel] = useState<'Launch Software' | 'Stop' | 'Start'>('Launch Software');

  const [admin,setAdmin] = useState({});
  // useEffect(() => {
  //   const getUserDetails = async () => {
  //     const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_profile`);
  //     setAdmin(response.data.user);
  //   };
  //   getUserDetails();
  // }, []);
  

  useEffect(() => {
    const fetchOrg = async () => {
      if (assessment.config_details?.organizationId) {
        const organizationDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
          org_id: assessment.config_details.organizationId
        });
        setOrgDetails(organizationDetails.data.data);
      }
    };
    fetchOrg();
  }, [assessment.config_details?.organizationId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const user_cred = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(user_cred.data.user);
      console.log(user_cred)
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user_cred?.data?.user?.org_id}`);
         const users = response.data?.data || [];

        const filteredUsers = users.filter(
          (user) => user.role === "user"
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [admin.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const fetchLabDetails = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`,
          {
            labId: assessment.lab_id,
          }
        );
        if (fetchLabDetails.data.success) {
          setLabDetails(fetchLabDetails.data.data);
        }
      } catch (error) {
        console.error("Error fetching lab details:", error);
      } finally {
        setLoad(false);
      }
    };

    if (assessment.lab_id) {
      fetch();
    }
  }, [assessment.lab_id]);

  const checkLabLaunched = async () => {
    try {
      const check = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
        lab_id: assessment.lab_id,
        user_id: admin?.id
      });
      if (check.data.success) {
        if (check?.data?.data.isrunning) {
          setButtonLabel('Stop');
        } else if (check?.data?.data?.isstarted) {
          setButtonLabel('Start');
        } else {
          setButtonLabel('Launch Software');
        }
      }
    } catch (error) {
      console.error('Error checking lab status:', error);
    }
  };

  useEffect(() => {
    const fetchInstanceDetails = async () => {
      try {
        const instance = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/awsCreateInstanceDetails`, {
          lab_id: assessment.lab_id,
        });

        if (instance.data.success) {
          checkLabLaunched();
          setInstanceDetails(instance.data.result);
        }
      } catch (error) {
        console.error('Failed to fetch instance details:', error);
      }
    };

    if (assessment.lab_id && admin?.id) {
      fetchInstanceDetails();
    }
  }, [assessment.lab_id, isLaunchProcessing, admin?.id]);

  function formatDate(inputDate: Date) {
    const date = new Date(inputDate);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  const handleLaunchSoftware = async () => {
    setIsLaunchProcessing(true);
    try {
      const isStop = buttonLabel === 'Stop';
      const cloudinstanceDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
        user_id: admin?.id,
        lab_id: assessment.lab_id,
      });
      if (!cloudinstanceDetails.data.success) {
        const ami = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiinformation`, { lab_id: assessment.lab_id });

        if (!ami.data.success) {
          throw new Error('Failed to retrieve instance details');
        }

        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/launchInstance`, {
          name: admin.name,
          ami_id: ami.data.result.ami_id,
          user_id: admin.id,
          lab_id: assessment.lab_id,
          instance_type: assessment.instance,
          start_date: formatDate(assessment.config_details?.startDate),
          end_date: formatDate(assessment.config_details?.endDate)
        });
        setButtonLabel('Start');
        setNotification({
          type: 'success',
          message: 'Software launched successfully',
        });
        return;
      }
      try {
        const cloudinstanceDetailsRefresh = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
          user_id: admin?.id,
          lab_id: assessment.lab_id,
        });
        const instanceId = cloudinstanceDetailsRefresh?.data?.data?.instance_id;
        if (isStop) {
          const stop = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/stopInstance`, {
            instance_id: instanceId
          });
          if (stop.data.success) {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`, {
              lab_id: assessment.lab_id,
              user_id: admin?.id,
              state: false,
              isStarted: true,
              type: 'org'
            });
            setButtonLabel('Start');
          }
          return;
        }

        const checkInstanceAlreadyStarted = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/checkisstarted`, {
          type: 'user',
          id: cloudinstanceDetailsRefresh?.data.data.instance_id,
        });
        if (checkInstanceAlreadyStarted.data.isStarted === false) {
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
            os_name: assessment.os,
            instance_id: cloudinstanceDetailsRefresh?.data.data.instance_id,
            hostname: cloudinstanceDetailsRefresh?.data.data.public_ip,
            password: cloudinstanceDetailsRefresh?.data.data.password,
            buttonState: 'Start Lab'
          });

          if (response.data.response.success && response.data.response.result) {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`, {
              lab_id: assessment.lab_id,
              user_id: admin?.id,
              state: true,
              isStarted: false,
              type: 'org'
            });
            setButtonLabel('Stop');
            setNotification({
              type: 'success',
              message: 'Software launched successfully',
            });
            const Data = JSON.parse(response.data.response.result);
            const userName = Data.username;
            const protocol = Data.protocol;
            const port = Data.port;
            const resp = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
              {
                protocol: protocol,
                hostname: cloudinstanceDetailsRefresh?.data?.data.public_ip,
                port: port,
                username: userName,
                password: cloudinstanceDetailsRefresh?.data.data.password,
              }
            );

            if (resp.data.success) {
              const wsPath = resp.data.wsPath;
              const protocol = window.location.protocol === "https:" ? "wss" : "ws";
              const hostPort = `${window.location.hostname}:${3002}`;
              const wsUrl = `${protocol}://${hostPort}${wsPath}`;
              navigate(`/dashboard/labs/vm-session/${assessment.lab_id}`, {
                state: {
                  guacUrl: wsUrl,
                  vmTitle: assessment.title,
                  doc: assessment.config_details?.labguide
                }
              });
            }
          }
        } else {
          const restart = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/restart_instance`, {
            instance_id: cloudinstanceDetailsRefresh?.data.data.instance_id,
            user_type: 'user'
          });

          if (restart.data.success) {
            const cloudInstanceDetailsNew = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
              user_id: admin?.id,
              lab_id: assessment.lab_id,
            });
            if (cloudInstanceDetailsNew.data.success) {
              const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
                os_name: assessment.os,
                instance_id: cloudInstanceDetailsNew?.data.data.instance_id,
                hostname: cloudInstanceDetailsNew?.data.data.public_ip,
                password: cloudInstanceDetailsNew?.data.data.password,
                buttonState: 'Start Lab'
              });
              if (response.data.success) {
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`, {
                  lab_id: assessment.lab_id,
                  user_id: admin?.id,
                  state: true,
                  isStarted: true
                });
                setButtonLabel('Stop');
                setNotification({
                  type: 'success',
                  message: 'Software launched successfully',
                });
                const Data = JSON.parse(response.data.response.result);
                const userName = Data.username;
                const protocol = Data.protocol;
                const port = Data.port;
                const resp = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
                  {
                    protocol: protocol,
                    hostname: cloudInstanceDetailsNew?.data.data.public_ip,
                    port: port,
                    username: userName,
                    password: cloudInstanceDetailsNew?.data.data.password,
                  }
                );

                if (resp.data.success) {
                  const wsPath = resp.data.wsPath;
                  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
                  const hostPort = `${window.location.hostname}:${3002}`;
                  const wsUrl = `${protocol}://${hostPort}${wsPath}`;
                  navigate(`/dashboard/labs/vm-session/${assessment.lab_id}`, {
                    state: {
                      guacUrl: wsUrl,
                      vmTitle: assessment.title,
                      doc: assessment.config_details?.labguide
                    }
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.log(error);
        throw new Error(error?.response?.data?.message || 'Failed to launch software');
      }
    } catch (error) {
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

  const handlePayment = async () => {
    if (!selectedUsers.length && !email) {
      setNotification({ type: 'error', message: 'Please select users or enter an email address' });
      return;
    }

    setIsPaying(true);
    setNotification(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/initiate-payment`, {
        lab_id: assessment.lab_id,
        user_id: admin.id,
        amount: 1000 // Amount in smallest currency unit (e.g., paise)
      });

      if (response.data.success) {
        setPaymentSuccess(true);
        setNotification({ type: 'success', message: 'Payment successful! You can now assign the lab.' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Payment failed. Please try again.' });
    } finally {
      setIsPaying(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setSelectedUsers([]);
    setNotification(null);
    setPaymentSuccess(false);
  };

  const handleAssignLab = async () => {
    if (!selectedUsers.length && !email) {
      setNotification({ type: 'error', message: 'Please select users or enter an email address' });
      return;
    }

   

    setIsLoading(true);
    setNotification(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignlab`, {
        lab: assessment.lab_id,
        userId: selectedUsers,
        assign_admin_id: admin.id
      });

      if (response.data.success) {
        setNotification({ type: 'success', message: 'Lab assigned successfully' });
        setTimeout(() => {
          clearForm();
          setIsModalOpen(false);
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to assign lab');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign lab'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/deleteAssessment`,{
        lab_id:assessment.lab_id,
        admin_id:admin.id,
      });
      
      if (response.data.success) {
        setNotification({ type: 'success', message: 'Assessment deleted successfully' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete assessment');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete assessment'
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (load) {
    return <div className="animate-pulse h-[320px] bg-dark-300/50 rounded-lg"></div>;
  }

  return (
    <>
      <div className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-primary-500/10 
                    hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
                    hover:translate-y-[-2px] group relative">
        {notification && (
          <div className={`absolute top-2 right-16 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
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
        
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            assessment.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
            assessment.status === 'inactive' ? 'bg-red-500/20 text-red-300' :
            'bg-amber-500/20 text-amber-300'
          }`}>
            {assessment.status}
          </span>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
        
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">
                <GradientText>{assessment.config_details?.catalogueName || assessment.title}</GradientText>
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">{labDetails?.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-400">
              <Cpu className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
              <span className="truncate">{labDetails?.cpu} vCPU</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Tag className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
              <span className="truncate">{labDetails?.ram}GB RAM</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Server className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
              <span className="truncate">Instance: {labDetails?.instance}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <HardDrive className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
              <span className="truncate">Storage: {labDetails?.storage}GB</span>
            </div>
          </div>

          {assessment.software && (
            <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Software Installed:</h4>
            
            <div className="flex flex-wrap gap-2">
              {assessment.software.map((software, index) => (
                <span key={index} className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                  {software}
                </span>
              ))}
            </div>
          </div>
          )}
          

          <div className="mt-auto pt-3 border-t border-primary-500/10">
           <button 
                            onClick={handleLaunchSoftware}
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
                                <span className="hidden sm:inline">Launch VM</span>
                              </>
                            )}
                          </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full h-9 px-4 rounded-lg text-sm font-medium
                       bg-gradient-to-r from-primary-500 to-secondary-500
                       hover:from-primary-400 hover:to-secondary-400
                       transform hover:scale-105 transition-all duration-300
                       text-white shadow-lg shadow-primary-500/20
                       flex items-center justify-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Assign Lab
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>Assign Lab</GradientText>
              </h2>
              <button 
                onClick={() => {
                  clearForm();
                  setIsModalOpen(false);
                }}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative dropdown-container">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Users
                </label>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 cursor-pointer flex justify-between items-center"
                >
                  <span>
                    {selectedUsers.length 
                      ? `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected` 
                      : 'Select users'}
                  </span>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-dark-200 border border-primary-500/20 rounded-lg shadow-lg">
                    <div className="max-h-48 overflow-y-auto py-1">
                      {users.map(user => (
                        <label 
                          key={user.id} 
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-dark-300/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {
                              setSelectedUsers(prev => 
                                prev.includes(user.id)
                                  ? prev.filter(id => id !== user.id)
                                  : [...prev, user.id]
                              );
                            }}
                            className="form-checkbox h-4 w-4 text-primary-500 rounded border-gray-500/20"
                          />
                          <div>
                            <p className="text-gray-300">{user.name}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Or Enter Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none
                           focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>

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

              <button
                onClick={handleAssignLab}
                disabled={isLoading }
                className="w-full btn-primary"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Assigning...
                  </span>
                ) : (
                  'Assign Lab'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
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
              Are you sure you want to delete this assessment? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-primary bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
