import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  ArrowLeft, 
  Cloud, 
  Key, 
  User, 
  ExternalLink, 
  Loader, 
  AlertCircle, 
  Check,
  Clock,
  Play,
  Square
} from 'lucide-react';
import axios from 'axios';



export const LabExercisePage: React.FC = () => {
  const { exerciseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<any>({
    ...(location.state?.exercise || mockExercise),
    ...(location.state?.labExercise || {})
  });
  
  const [labDetails, setLabDetails] = useState<any>(location.state?.labDetails );
  const [moduleId, setModuleId] = useState<string | null>(location.state?.moduleId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labStarted, setLabStarted] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [user, setUser] = useState<any>();
  // const [resources, setResources] = useState<any[]>(mockResources);
  const [notes, setNotes] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [credentials, setCredentials] = useState<any>(null);
  const [buttonLabel, setButtonLabel] = useState<'Start Lab' | 'Resume Lab' | 'Stop Lab'>('Start Lab');

  // Check if account is already created
  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        setIsCheckingAccount(true);
        const userResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(userResponse.data.user);
        
        // Check if IAM account is already created
        let accountStatusResponse;
        let accountData;
        if(labDetails.purchased){
          accountStatusResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSlicePurchasedLabs`,{
              userId:userResponse.data.user.id
            });
         accountData = accountStatusResponse.data.data.find((lab)=>lab.labid === labDetails.labid);
        }
        else{
          accountStatusResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserLabStatus/${userResponse.data.user.id}`);
         accountData = accountStatusResponse.data.data.find((lab)=>lab.labid === labDetails.labid);
        }
         
        
        if (accountData && accountData.username && accountData.password && accountData.console_url) {
          setCredentials(accountData);
          setAccountCreated(true);
          
          // Check if lab is running to set the correct button state
          if (accountData.isrunning) {
            setLabStarted(true);
            setButtonLabel('Stop Lab');
          } else if (accountData.launched) {
            setButtonLabel('Resume Lab');
          }
        } else {
          setAccountCreated(false);
          setButtonLabel('Start Lab');
        }
      } catch (error) {
        console.error('Error checking account status:', error);
      } finally {
        setIsCheckingAccount(false);
      }
    };
    
    checkAccountStatus();
  }, [labDetails?.labid]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start lab
  const handleStartLab = async () => {
    setIsStarting(true);
    setNotification(null);
    
    try {
      if (!accountCreated) {
        // Create IAM user account if not already created
        const createIamResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
          userName: user.name,
          services: exercise?.services || [],
          role: user.role,
          labid: labDetails?.labid,
          user_id:user.id,
          purchased:labDetails?.purchased || false
        });
        
        if (createIamResponse.data.success) {
          const submit = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/addLabStatusOfUser`,
            {
              module_id: moduleId,
              exercise_id: exerciseId,
              isrunning: true,
              status: 'in-progress',
              completed_in: 0,
              user_id: user.id,
            }
          );

          // Get the updated account details
          if(labDetails.purchased){
            
            const accountDetailsResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSlicePurchasedLabs`,{
              userId:user.id
            });
            setCredentials(accountDetailsResponse.data.data.find((lab)=>lab.labid === labDetails.labid));
            setAccountCreated(true);
          }
          else{
            const accountDetailsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserLabStatus/${user.id}`);
            setCredentials(accountDetailsResponse.data.data.find((lab)=>lab.labid === labDetails.labid));
            setAccountCreated(true);
          }
          
          
          // Update lab status
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`, {
            status: 'active',
            launched: true,
            isRunning: true,
            labId: labDetails?.labid,
            userId: user.id,
            purchased:labDetails?.purchased || false
          });
          
          setLabStarted(true);
          setButtonLabel('Stop Lab');
          setNotification({ type: 'success', message: 'Lab started successfully' });
          setCountdown(exercise.duration * 60); // Convert minutes to seconds
        } else {
          throw new Error(createIamResponse.data.message || 'Failed to create account');
        }
      } else if (buttonLabel === 'Resume Lab') {
        const submit = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/addLabStatusOfUser`,
          {
            module_id: moduleId,
            exercise_id: exerciseId,
            isrunning: true,
            status: 'in-progress',
            completed_in: 0,
            user_id: user.id,
          }
        );
        // Resume lab that was previously stopped
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudSliceRunningStateOfUser`, {
          isRunning: true,
          labId: labDetails?.labid,
          userId: user?.id,
          purchased:labDetails?.purchased || false
        });
        const editAwsServices = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/addAwsServices`,{
          userName:credentials.username,
          services:exercise.services
        });
        setLabStarted(true);
        setButtonLabel('Stop Lab');
        setNotification({ type: 'success', message: 'Lab resumed successfully' });
        setCountdown(exercise.duration * 60); // Reset countdown
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to start lab'
      });
    } finally {
      setIsStarting(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Stop lab
  const handleStopLab = async () => {
    setIsStopping(true);
    setNotification(null);
    
    try {
      // Update lab running state to false
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudSliceRunningStateOfUser`, {
        isRunning: false,
        labId: labDetails?.labid,
        userId: user?.id,
        purchased:labDetails?.purchased || false
      });
      
      setLabStarted(false);
      setButtonLabel('Resume Lab');
      setNotification({ type: 'success', message: 'Lab stopped successfully' });
      setCountdown(null);
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to stop lab'
      });
    } finally {
      setIsStopping(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Submit exercise
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setNotification(null);
  
    try {
      const completedIn =
        countdown !== null && exercise?.duration
          ? exercise.duration * 60 - countdown
          : null;
  
      if (completedIn == null || user?.id == null || !moduleId || !exercise?.id) {
        throw new Error("Missing required submission data.");
      }
      const submit = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/addLabStatusOfUser`,
        {
          module_id: moduleId,
          exercise_id: exerciseId,
          isrunning: true,
          status: 'completed',
          completed_in: completedIn,
          user_id: user.id,
        }
      );
  
  
      if (submit.data.success) {
        const deleteAwsServices = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deleteAwsServices`,{
          userName:credentials.username,
        });
        setNotification({ type: 'success', message: 'Exercise submitted successfully' });
        setTimeout(()=>{
          setNotification(null)
        },1500)

        // Navigate after showing success
        // setTimeout(() => {
        //   navigate(`/dashboard/my-labs/${labDetails?.labid}/modules`, {
        //     state: { labDetails },
        //   });
        // }, 1500);
      } else {
        throw new Error("Submission failed. Server did not return success.");
      }
  
    } catch (error) {
      console.error("Submission Error:", error);
      setNotification({ type: 'error', message: error.message || 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  // Countdown timer
  useEffect(() => {
    if (countdown === null || !labStarted) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Auto-submit when countdown reaches zero
          handleSubmit();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown, labStarted]);

  // Function to extract the exact filename from the url
  function extractFile_Name(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">{error}</h2>
        <p className="text-gray-400 mb-6">Unable to load the exercise details.</p>
        <button 
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      </div>
    );
  }

  if (isCheckingAccount) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 text-primary-400 animate-spin mr-3" />
        <span className="text-gray-300">Checking account status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold">
              <GradientText>{exercise?.title || 'Lab Exercise'}</GradientText>
            </h1>
            <p className="mt-1 text-gray-400">{exercise?.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {countdown !== null && labStarted && (
            <div className="px-4 py-2 bg-dark-300/50 rounded-lg flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-mono text-gray-300">{formatTimeRemaining(countdown)}</span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={labStarted ? handleStopLab : handleStartLab}
              disabled={isStarting || isStopping}
              className={`btn-primary ${
                buttonLabel === 'Stop Lab' ? 'bg-red-500 hover:bg-red-600' : ''
              }`}
            >
              {isStarting || isStopping ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : buttonLabel === 'Stop Lab' ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isStarting ? 'Starting...' : 
               isStopping ? 'Stopping...' : 
               buttonLabel}
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !labStarted}
              className="btn-secondary"
            >
              {isSubmitting ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Instructions */}
        <div className="lg:col-span-2">
          <div className="glass-panel">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>Instructions</GradientText>
              </h2>
              <Clock className="h-5 w-5 text-primary-400" />
            </div>

            <div className="prose prose-invert prose-primary max-w-none">
              <div dangerouslySetInnerHTML={{ __html: exercise?.instructions || '<p>No instructions provided for this exercise.</p>' }} />
            </div>
            
            {exercise.files && exercise.files.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <div className="space-y-2">
                  {exercise.files.map((resource, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-dark-300/50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-primary-400" />
                        <span className="text-sm text-gray-300">{extractFile_Name(resource)}</span>
                      </div>
                      <a
                        href={`http://localhost:3006/uploads/${extractFile_Name(resource)}`}
                        download
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-primary-400" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Credentials & Actions */}
        <div className="space-y-6">
          <div className={`glass-panel ${!accountCreated || !labStarted ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-semibold mb-6">
              <GradientText>Access Credentials</GradientText>
            </h2>
            
            <div className="space-y-4">
              <div className="p-3 bg-dark-300/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Username</span>
                  <User className="h-4 w-4 text-primary-400" />
                </div>
                <p className="text-sm font-mono bg-dark-400/50 p-2 rounded border border-primary-500/10 text-gray-300">
                  {credentials?.username || 'Not available'}
                </p>
              </div>
              
              <div className="p-3 bg-dark-300/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Password</span>
                  <Key className="h-4 w-4 text-primary-400" />
                </div>
                <p className="text-sm font-mono bg-dark-400/50 p-2 rounded border border-primary-500/10 text-gray-300">
                  {credentials?.password || 'Not available'}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => window.open(credentials?.console_url || labDetails?.consoleUrl, '_blank')}
            disabled={!accountCreated || !labStarted}
            className={`btn-secondary w-full ${!accountCreated || !labStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open AWS Console
          </button>
          
          <div className="glass-panel">
            <h2 className="text-xl font-semibold mb-6">
              <GradientText>Services</GradientText>
            </h2>
            
            <div className="space-y-2">
              {exercise?.services && exercise.services.length > 0 ? (
                exercise.services.map((service: string, index: number) => (
                  <div 
                    key={index}
                    className="p-3 bg-dark-300/50 rounded-lg flex items-center space-x-2"
                  >
                    <Cloud className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate">{service}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-2">
                  No services specified
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};