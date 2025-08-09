
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Cloud, 
  MapPin, 
  Calendar, 
  Play,
  Loader,
  AlertCircle,
  Check,
  Layers,
  FileText,
  Trash2,
  Square,
  X
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { useNavigate } from 'react-router-dom';

interface CloudSliceCardProps {
  lab: {
    labid: string;
    title: string;
    description: string;
    provider: 'aws' | 'azure' | 'gcp' | 'oracle' | 'ibm' | 'alibaba';
    region: string;
    services: string[];
    status: 'started' | 'not-started' | 'pending' | 'expired';
    startdate: string;
    enddate: string;
    modules: 'without-modules' | 'with-modules';
    purchased:boolean;
    duration:string;
   
  };
  labStatus:{
    id:string,
    labid:string,
    user_id:string,
    assigned_by:string,
    assigned_at:string,
    status:string,
    start_date:string,
    end_date:string,
    launched:boolean,
    isrunning:boolean,
  };
  onDelete: (labId: string,labStatus:any) => void;
 
  user:{
    admin_id:string,
    created_at:string,
    email:string,
    id:string,
    lastactive:string,
    name:string,
    org_id:string,
    organization:string,
    organization_type:string,
    password:string,
    role:string,
    status:string
  }
}

export const CloudSliceCard: React.FC<CloudSliceCardProps> = ({ lab, onDelete, labStatus, user }) => {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen , setIsDeleteModalOpen] = useState(false);
  //find the exact status based on the labid
  const selectedLab = labStatus.find(Userlab=>Userlab.labid === lab.labid );

  const handleLaunch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLaunching(true);
    setNotification(null);
    if(lab?.status === 'expired') {
      setNotification({type:'error',message:'Lab has expired'})
      setTimeout(()=>{
        setNotification(null)
      },2000)
      setIsLaunching(false);
      return;
    }
    try {
      if(lab.purchased && !selectedLab.launched){
        const update = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateDates`,{
          labId:lab?.labid,
          userId:user?.id,
          duration:lab.duration,
          status:'active',
          launched:true,
        })
        if(update.data.success){
          lab.startdate = update.data.data.start_date;
          lab.enddate = update.data.data.end_date;
        }
      }
      if (lab.modules === 'without-modules') {
        // Call createIamUser only if the lab is not already launched
        if (!selectedLab.launched) {
          const createIamUser = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
            userName: user.name,
            services: lab.services,
            role:user.role,
            labid:lab.labid,
            user_id:user.id,
            purchased:lab?.purchased || false
          });

          if(createIamUser.data.success){
            const updateUserLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`,{
              status:'active',
              launched:true,
              labId:lab.labid,
              userId:user.id,
              purchased:lab?.purchased || false
            })

            if(updateUserLabStatus.data.success){
                 // Navigate to standard lab
        navigate(`/dashboard/my-labs/${lab.id}/standard`, {
          state: {
            labDetails: {
              ...lab,
              credentials: {
                username: 'lab-user-789',
                accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
              },
              consoleUrl: 'https://console.aws.amazon.com'
            }
          }
        });
            }
          }
        }
        else{
           // Navigate to standard lab
        navigate(`/dashboard/my-labs/${lab.id}/standard`, {
          state: {
            labDetails: {
              ...lab,
              credentials: {
                username: 'lab-user-789',
                accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
              },
              consoleUrl: 'https://console.aws.amazon.com'
            }
          }
        });
        }
       
      } else {
        if(!selectedLab.launched){
          const updateUserLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`,{
            status:'active',
            launched:true,
            labId:lab.labid,
            userId:user.id,
            purchased:lab?.purchased || false
          })
          if(updateUserLabStatus.data.success){
             // Navigate to module-based lab
             navigate(`/dashboard/my-labs/${lab.id}/modules`, {
              state: {
                labDetails: {
                  ...lab,
                  credentials: {
                    username: 'lab-user-789',
                    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                  },
                  consoleUrl: 'https://console.aws.amazon.com'
                }
              }
            });
          }
        }
        else{
           // Navigate to module-based lab
           navigate(`/dashboard/my-labs/${lab.id}/modules`, {
            state: {
              labDetails: {
                ...lab,
                credentials: {
                  username: 'lab-user-789',
                  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                },
                consoleUrl: 'https://console.aws.amazon.com'
              }
            }
          });
        }
         
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to launch lab'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLaunching(false);
    }
  };
  

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleteModalOpen(true);
    
  };
const confirmDelete = async (e: React.MouseEvent) => {
  e.preventDefault();
  setIsDeleting(true);

  try {
    await onDelete(lab.labid, labStatus);

    setNotification({
      type: 'success',
      message: 'Successfully Deleted Lab',
    });

  } catch (error) {
    console.error(error);

    setNotification({
      type: 'error',
      message: 'Failed To Delete Lab',
    });

  } finally {
    setIsDeleting(false);
    setIsDeleteModalOpen(false);

    // Auto-hide the notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }
};



  function formatDateTime(dateString: string) {
    if (dateString === null) return 'N/A';
    const date = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  return (
    <>
    <div className="flex flex-col min-h-[280px] sm:min-h-[320px] lg:min-h-[300px] xl:min-h-[320px] 
                  max-h-fit overflow-hidden rounded-xl border border-primary-500/10 
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
      
      <div className="p-3 sm:p-4 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-1 line-clamp-2">
              <GradientText>{lab.title}</GradientText>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{lab.description}</p>
          </div>
          <div className="flex items-center justify-between sm:justify-start space-x-2 flex-shrink-0">
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Delete Lab"
            >
              {isDeleting ? (
                <Loader className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
              )}
            </button>
            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
              selectedLab.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
              selectedLab.status === 'expired' ? 'bg-red-500/20 text-red-300' :
              selectedLab.status === 'not-started' ? 'bg-gray-500/20 text-gray-300' :
              'bg-amber-500/20 text-amber-300'
            }`}>
              {selectedLab.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3">
          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <Cloud className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-primary-400 flex-shrink-0" />
            <span className="truncate">{lab.provider.toUpperCase()}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-primary-400 flex-shrink-0" />
            <span className="truncate">{lab.region}</span>
          </div>
        </div>
        
        <div className="space-y-1 sm:space-y-2 mb-3">
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="h-3 w-3 mr-1 text-primary-400 flex-shrink-0" />
            <span className="truncate">Start: {formatDateTime(lab.startdate)}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="h-3 w-3 mr-1 text-primary-400 flex-shrink-0" />
            <span className="truncate">End: {formatDateTime(lab.enddate)}</span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-400 mb-3">
          {lab.modules === 'with-modules' ? (
            <Layers className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
          ) : (
            <FileText className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
          )}
          <span className="truncate">
            {lab.modules === 'with-modules' ? 'Modular Lab' : 'Standard Lab'}
          </span>
        </div>

        <div className="mb-3 sm:mb-4 flex-grow overflow-hidden">
          <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Services:</h4>
          <div className="flex flex-wrap gap-1 sm:gap-2 max-h-[60px] sm:max-h-[80px] overflow-y-auto">
            {lab.services.map((service, index) => (
              <span key={index} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300 whitespace-nowrap">
                {service}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-2 sm:pt-3 border-t border-primary-500/10">
          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="w-full h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                     bg-gradient-to-r from-primary-500 to-secondary-500
                     hover:from-primary-400 hover:to-secondary-400
                     transform hover:scale-105 transition-all duration-300
                     text-white shadow-lg shadow-primary-500/20
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center"
          >
            {isLaunching ? (
              <Loader className="animate-spin h-4 w-4" />
            ) : (
              <>
              {selectedLab.launched ? (
                 <>
                          <Square className="h-4 w-4 mr-2" />
                          Go to Lab
                        </>
              ):(
                <>
                <Play className="h-4 w-4 mr-2" />
                Launch Lab
                </>
                
              )}
               
              </>
            )}
          </button>
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
                    Are you sure you want to delete <span className="font-semibold">{lab.title}</span>? This action cannot be undone.
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
    </>
  );
};
