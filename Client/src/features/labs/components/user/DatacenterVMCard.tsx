import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Tag, 
  BookOpen, 
  Play, 
  AlertCircle, 
  Check,
  Square,
  Loader,
  Cpu,
  HardDrive,
  Server,
  Trash2,
  User,
  Network
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface DatacenterVMCardProps {
  lab: {
    id: string;
    labid: string;
    title: string;
    description: string;
    platform: string;
    protocol: string;
    startdate: string;
    enddate: string;
    status: 'started' | 'expired' | 'not-started';
    creds_id: string;
    isrunning: boolean;
    software?: string[];
  };
  onDelete: (labId: string) => void;
}

export const DatacenterVMCard: React.FC<DatacenterVMCardProps> = ({ lab, onDelete }) => {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [vmDetails, setVmDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullStartDate, setShowFullStartDate] = useState(false);
  const [showFullEndDate, setShowFullEndDate] = useState(false);


  const handleStartLab = async () => {
    if(lab.userscredentials[0].disabled){
         setNotification({
          type: 'error',
          message: 'The VM is disabled.'
        });
        setTimeout(()=>{
          setNotification(null);
        },2000)
        return;
    }
    if (lab.isrunning) {
      // Stop the lab
      setIsStopping(true);
      setNotification(null);
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVmDatacenterUserAssignment`, {
           isrunning: false,
          userId:lab.userscredentials[0].assigned_to,
          labId: lab.lab_id
        });
        
        if (response.data.success) {
          setNotification({
            type: 'success',
            message: 'Lab stopped successfully'
          });
          
          // Update local state
          lab.isrunning = false;
        } else {
          throw new Error(response.data.message || 'Failed to stop lab');
        }
      } catch (error: any) {
        setNotification({
          type: 'error',
          message: error.response?.data?.message || 'Failed to stop lab'
        });
      } finally {
        setIsStopping(false);
        setTimeout(() => setNotification(null), 3000);
      }
    } else {
      // Start the lab
      setIsLaunching(true);
      setNotification(null);
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVmDatacenterUserAssignment`, {
          
          isrunning: true,
          userId:lab.userscredentials[0].assigned_to,
          labId: lab.lab_id
        });
        
        if (response.data.success) {
          setNotification({
            type: 'success',
            message: 'Lab started successfully'
          });
          
          // Update local state
          lab.isrunning = true;
          // Navigate to VM session page
        const tokenResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/connectToDatacenterVm`, {
        Protocol: lab.protocol || 'RDP',
        VmId:lab.userscredentials[0].id,
        Ip: lab.userscredentials[0].ip,
        userName: lab.userscredentials[0].username,
        password: lab.userscredentials[0].password,
        port: lab.userscredentials[0].port,
        
      });
      
      if (tokenResponse.data.success && tokenResponse.data.token) {
        // Then connect to VM using the token
        const guacUrl = `${lab?.guacamole_url}?token=${tokenResponse.data.token.result}`;
          navigate(`/dashboard/labs/vm-session/${lab.lab_id}`, {
            state: { 
              guacUrl,
              vmTitle: lab.title,
              vmId: lab.lab_id,
              doc:lab.userguide,
              credentials:lab.userscredentials
            }
          });
        } else {
          throw new Error(response.data.message || 'Failed to start lab');
        }}
      } catch (error: any) {
        setNotification({
          type: 'error',
          message: error.response?.data?.message || 'Failed to start lab'
        });
      } finally {
        setIsLaunching(false);
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    
    try {
      await onDelete(lab.lab_id);
    } catch (error) {
      console.error('Error deleting lab:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete lab'
      });
    } finally {
      setIsDeleting(false);
    }
  };
 function formatDateTime(dateString:string) {
    const date = new Date(dateString);
  
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
  
    let hours = date.getHours();
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12 || 12; // Convert 0 to 12 for 12AM
    hours = `${hours}`.padStart(1, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
  }
  

  return (
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
              <GradientText>{lab.title}</GradientText>
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">{lab?.description || 'No description available'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              {isDeleting ? (
                <Loader className="h-4 w-4 text-red-400 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-400" />
              )}
            </button>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              lab.status === 'started' ? 'bg-emerald-500/20 text-emerald-300' :
              lab.status === 'expired' ? 'bg-red-500/20 text-red-300' :
              'bg-amber-500/20 text-amber-300'
            }`}>
              {lab.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-400">
            <Server className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
            <span className="truncate">{lab.platform}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Network className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
            <span className="truncate">{lab.protocol}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
            <span 
              className={`${showFullStartDate ? '' : 'truncate'} cursor-pointer`}
              onClick={() => setShowFullStartDate(!showFullStartDate)}
              title={showFullStartDate ? "Click to collapse" : "Click to expand"}
            >
              Start: {formatDateTime(lab.startdate)}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
            <span 
              className={`${showFullEndDate ? '' : 'truncate'} cursor-pointer`}
              onClick={() => setShowFullEndDate(!showFullEndDate)}
              title={showFullEndDate ? "Click to collapse" : "Click to expand"}
            >
              End: {formatDateTime(lab.enddate)}
            </span>
          </div>
        </div>

        {/* Software Section */}
        {lab.software && lab.software.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Software:</h4>
            <div className="flex flex-wrap gap-2">
              {lab.software.map((sw, index) => (
                <span key={index} className="px-2 py-1 text-xs font-medium rounded-full bg-secondary-500/20 text-secondary-300">
                  {sw}
                </span>
              ))}
            </div>
          </div>
        )}
      
        <div className="mt-auto pt-3 border-t border-secondary-500/10">
          <button
            onClick={handleStartLab}
            disabled={isLaunching || isStopping}
            className={`w-full h-9 px-4 rounded-lg text-sm font-medium
                     ${lab.isrunning 
                       ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                       : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                     }
                     transition-colors flex items-center justify-center`}
          >
            {isLaunching || isStopping ? (
              <Loader className="animate-spin h-4 w-4" />
            ) : lab.isrunning ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Lab
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
  );
};