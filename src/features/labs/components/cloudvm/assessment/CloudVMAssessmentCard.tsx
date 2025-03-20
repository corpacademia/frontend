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
  Loader
} from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';
import axios from 'axios';

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

interface LabDetails {
  cpu: string;
  ram: string;
  storage: string;
  instance: string;
  description: string;
}

export const CloudVMAssessmentCard: React.FC<CloudVMAssessmentProps> = ({ assessment }) => {
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

  const [admin,setAdmin] = useState({});

  // useEffect(() => {
  //   const getUserDetails = async () => {
  //     const response = await axios.get('http://localhost:3000/api/v1/user_profile');
  //     setAdmin(response.data.user);
  //   };
  //   getUserDetails();
  // }, []);

  useEffect(() => {
    const fetchOrg = async () => {
      if (assessment.config_details?.organizationId) {
        const organizationDetails = await axios.post('http://localhost:3000/api/v1/organization_ms/getOrgDetails', {
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
        const user_cred = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setAdmin(user_cred.data.user);
        const response = await axios.post('http://localhost:3000/api/v1/user_ms/getOrganizationUsers', {
          admin_id: user_cred.data.user.id
        });
        setUsers(response.data.data);
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
          "http://localhost:3000/api/v1/lab_ms/getLabOnId",
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

  const handlePayment = async () => {
    if (!selectedUsers.length && !email) {
      setNotification({ type: 'error', message: 'Please select users or enter an email address' });
      return;
    }

    setIsPaying(true);
    setNotification(null);

    try {
      const response = await axios.post('http://localhost:3000/api/v1/initiate-payment', {
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

    if (!paymentSuccess) {
      setNotification({ type: 'error', message: 'Please complete payment first' });
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      const response = await axios.post('http://localhost:3000/api/v1/lab_ms/assignlab', {
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
      const response = await axios.post(`http://localhost:3000/api/v1/organization_ms/deleteAssessment`,{
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

          <div className="mt-auto pt-3 border-t border-primary-500/10">
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

              <button
                onClick={handlePayment}
                disabled={isPaying || (!selectedUsers.length && !email) || paymentSuccess}
                className="w-full btn-primary bg-emerald-500 hover:bg-emerald-600"
              >
                {isPaying ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {paymentSuccess ? 'Payment Completed' : 'Pay Now'}
                  </span>
                )}
              </button>

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
                disabled={isLoading || !paymentSuccess}
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
