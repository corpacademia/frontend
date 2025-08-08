import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Pencil, 
  BookOpen, 
  Cloud, 
  Key, 
  User, 
  Lock,
  Calendar,
  Clock as ClockIcon,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { Exercise, LabExercise, CleanupPolicy } from '../../types/modules';
import axios from 'axios';
import { create } from 'zustand';

interface LabExerciseContentProps {
  exercise: Exercise;
  labExercise: LabExercise | undefined;
  isLoading: boolean;
  onEdit: () => void;
  formatCleanupPolicy: (policy?: CleanupPolicy) => string;
  extractFileName: (filePath: string) => string | null;
  canEdit: boolean;
  user:any;
  labId:string;
}

export const LabExerciseContent: React.FC<LabExerciseContentProps> = ({
  exercise,
  labExercise,
  isLoading,
  onEdit,
  formatCleanupPolicy,
  extractFileName,
  canEdit,
  user,
  labId
}) => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked,setChecking]= useState(false);
  const [credentials,setCredentials]= useState<any>();

//check account is created
  useEffect(()=>{
    const checkAccountStatus = async()=>{
      try {
        setChecking(true);
        if(user.role === 'superadmin' || user.role === 'orgsuperadmin'){
          const createdByAccountStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${labId}`);
          const status = createdByAccountStatus.data.data
          if(createdByAccountStatus.data.success){
             if(status.username != null && status.password !=null && status.console_url){
              setCredentials(status);
              setAccountCreated(true);
              const editAwsServices = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/editAwsServices`,{
                userName:status.username,
                services:labExercise.services
              });
              
             }
             else setAccountCreated(false);
          }
        }
        else{
          const orgAccountStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/`,{
            orgId:user.org_id,
            admin_id:user.id,
          
          })
          const status = orgAccountStatus.data.data.find((lab)=>lab.labid === labId);
          if(orgAccountStatus.data.success){
            if(status.username != null && status.password !=null && status.console_url){
              setCredentials(status)
              setAccountCreated(true);
              const editAwsServices = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/editAwsServices`,{
                userName:status.username,
                services:labExercise.services
              });
              
             }
             else setAccountCreated(false);
          }
        }
        
      } catch (error) {
        console.log(error);
      }
      finally{
        setChecking(false);
      }
        
    }
    checkAccountStatus();
  },[])

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    setError(null);
    
    try {
      let response;
      if(user.role === 'superadmin' || user.role === 'orgsuperadmin'){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
          userName: user.name, 
          services: labExercise?.services || [],
          role: user.role,
          labid:labId,
          purchased:labExercise?.purchased || false
        });
      }
      else if(user.role === 'orgadmin'){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
          userName: user.name, 
          services: labExercise?.services || [],
          role: user.role,
          labid:labId,
          orgid:user.org_id,
          purchased:labExercise?.purchased || false
        });
      }
       
      
      if (response.data.success) {
        setAccountCreated(true);
      } else {
        throw new Error(response.data.message || 'Failed to create IAM user');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create IAM user');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  if (checked) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!labExercise) {
    return (
      <div className="p-6 bg-dark-300/50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <p>Lab exercise content not found</p>
          </div>
          {canEdit && (
            <button
              onClick={onEdit}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Lab Content
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lab Content</h3>
        <div className="flex space-x-3">
          {!accountCreated && (
            <button
              onClick={handleCreateAccount}
              disabled={isCreatingAccount}
              className="btn-primary"
            >
              {isCreatingAccount ? 'Creating...' : 'Create Account'}
            </button>
          )}
          {canEdit && (
            <button
              onClick={onEdit}
              className="btn-secondary"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Lab Content
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      <div className="p-6 bg-dark-300/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Instructions</h3>
        <p className="text-gray-300">{labExercise.instructions}</p>
      </div>

      {/* Cleanup Policy Section */}
      <div className="p-6 bg-dark-300/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Cleanup Policy</h3>
        {labExercise.cleanuppolicy?.enabled ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-dark-400/50 rounded-lg">
              <div className={`p-2 rounded-lg ${
                labExercise.cleanuppolicy.type === 'auto' ? 'bg-primary-500/20' :
                labExercise.cleanuppolicy.type === 'scheduled' ? 'bg-secondary-500/20' :
                labExercise.cleanuppolicy.type === 'inactivity' ? 'bg-accent-500/20' :
                'bg-gray-500/20'
              }`}>
                {labExercise.cleanuppolicy.type === 'auto' ? (
                  <ClockIcon className="h-5 w-5 text-primary-400" />
                ) : labExercise.cleanuppolicy.type === 'scheduled' ? (
                  <Calendar className="h-5 w-5 text-secondary-400" />
                ) : labExercise.cleanuppolicy.type === 'inactivity' ? (
                  <ClockIcon className="h-5 w-5 text-accent-400" />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-200">
                  {labExercise.cleanuppolicy.type === 'auto' ? 'Auto Delete' :
                   labExercise.cleanuppolicy.type === 'scheduled' ? 'Scheduled Deletion' :
                   labExercise.cleanuppolicy.type === 'inactivity' ? 'Inactivity Timeout' :
                   'Manual Cleanup'}
                </p>
                <p className="text-sm text-gray-400">
                  {formatCleanupPolicy(labExercise.cleanuppolicy)}
                </p>
              </div>
            </div>
            
            {labExercise.cleanuppolicy.type === 'auto' && (
              <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-primary-400" />
                  <span className="text-sm text-gray-300">Duration:</span>
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {labExercise.cleanuppolicy.duration} {labExercise.cleanuppolicy.durationUnit}
                </span>
              </div>
            )}
            
            {labExercise.cleanuppolicy.type === 'scheduled' && (
              <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-secondary-400" />
                  <span className="text-sm text-gray-300">Scheduled Time:</span>
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {new Date(labExercise.cleanuppolicy.scheduledTime || '').toLocaleString()}
                </span>
              </div>
            )}
            
            {labExercise.cleanuppolicy.type === 'inactivity' && (
              <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-accent-400" />
                  <span className="text-sm text-gray-300">Inactivity Timeout:</span>
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {labExercise.cleanuppolicy.inactivityTimeout} {labExercise.cleanupPolicy.inactivityTimeoutUnit}
                </span>
              </div>
            )}
            
            {labExercise.cleanuppolicy.type === 'manual' && (
              <div className="flex items-center p-3 bg-dark-400/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-400 mr-2" />
                <span className="text-sm text-gray-300">
                  Resources will need to be manually cleaned up by the user or administrator.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center p-3 bg-dark-400/30 rounded-lg">
            <Info className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-gray-300">No cleanup policy configured</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-dark-300/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Resources</h3>
        <ul className="space-y-2">
          {labExercise.files?.map((resource, index) => (
            <li key={index} className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-primary-400" />
              <a href={`http://localhost:3006/uploads/${extractFileName(resource)}`} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                {resource}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Services Section */}
      <div className="p-6 bg-dark-300/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">AWS Services</h3>
        {labExercise.services && labExercise.services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {labExercise.services.map((service, index) => (
              <div key={index} className="px-3 py-1.5 bg-primary-500/10 text-primary-300 rounded-full flex items-center">
                <Cloud className="h-4 w-4 mr-2" />
                {service}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No services configured for this lab</p>
        )}
      </div>

      {/* Credentials Section */}
      <div className={`p-6 bg-dark-300/50 rounded-lg ${!accountCreated ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AWS Console Credentials</h3>
          <a 
            href={credentials?.console_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`btn-secondary flex items-center ${!accountCreated ? 'cursor-not-allowed' : ''}`}
            onClick={(e) => !accountCreated && e.preventDefault()}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open AWS Console
          </a>
        </div>
        <div className="space-y-4">
          {/* <div className="flex items-center justify-between p-3 bg-dark-400/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-primary-400" />
              <div>
                <p className="text-sm text-gray-400">Access Key ID</p>
                <p className="font-mono text-gray-300">{labExercise?.credentials?.accessKeyId || '123456'}</p>
              </div>
            </div>
          </div> */}
          
          <div className="flex items-center justify-between p-3 bg-dark-400/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-primary-400" />
              <div>
                <p className="text-sm text-gray-400">Username</p>
                <p className="font-mono text-gray-300">{credentials?.username || '123456'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-dark-400/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-primary-400" />
              <div>
                <p className="text-sm text-gray-400">Password</p>
                <p className="font-mono text-gray-300">{credentials?.password}</p>
              </div>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
              >
                <Pencil className="h-4 w-4 text-primary-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};