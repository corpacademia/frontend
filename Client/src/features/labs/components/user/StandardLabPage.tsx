import React, { useState, useEffect } from 'react';
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
  Square,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import axios from 'axios';

// Mock data for testing UI
// const mockLabDetails = {
//   id: 'lab-123',
//   title: 'AWS Cloud Architecture Lab',
//   description: 'Learn to design and implement scalable cloud architectures using AWS services',
//   provider: 'aws',
//   region: 'us-east-1',
//   services: [
//     'EC2', 
//     'S3', 
//     'RDS', 
//     'Lambda', 
//     'CloudFormation', 
//     'VPC', 
//     'IAM', 
//     'CloudWatch'
//   ],
//   status: 'active',
//   startDate: '2024-04-01T00:00:00Z',
//   endDate: '2024-05-01T00:00:00Z',
//   credentials: {
//     username: 'lab-user-123',
//     accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
//     secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
//   },
//   consoleUrl: 'https://console.aws.amazon.com'
// };

export const StandardLabPage: React.FC = () => {
  const { labId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [labDetails, setLabDetails] = useState<any>(location.state?.labDetails );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [labStarted, setLabStarted] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [user, setUser] = useState<any>();
  const [userLabStatus,setUserLabStatus]= useState<any>();
  
  // Documents state
  const [documents, setDocuments] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  
  // Extract filename helper function
  const extractFileName = (filePath: string) => {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  };
  useEffect(()=>{
    const fetchUserDetails = async()=>{
      try {
        setIsLoading(true);
        const user_details = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(user_details.data.user)
        if(labDetails.purchased){
             const userLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSlicePurchasedLabs`,{
                   userId:user_details.data.user.id
             });
          let labstatus = userLabStatus.data.data.find((lab)=>lab.labid === labDetails.labid);
          setUserLabStatus(labstatus);
          setLabStarted(labstatus.isrunning);
        }
        else{
        const userLabStatus = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserLabStatus/${user_details.data.user.id}`);
        if(userLabStatus.data.success){
          let labstatus = userLabStatus.data.data.find((lab)=>lab.labid === labDetails.labid);
          setUserLabStatus(labstatus);
          setLabStarted(labstatus.isrunning);
        }
      }
      } catch (error) {
        console.log(error)
      }
      finally{
        setIsLoading(false);
      }
    }
    fetchUserDetails();
  },[])

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!labDetails || !user) return;
      
      setIsLoadingDocs(true);
      try {
        // For StandardLabPage, users get userguides
        const documentsToShow = labDetails.userguides || [];
        setDocuments(documentsToShow);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    if (user && labDetails) {
      fetchDocuments();
    }
  }, [user, labDetails]);

  // Document navigation handlers
  const handlePrevDocument = () => {
    setCurrentDocIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextDocument = () => {
    setCurrentDocIndex(prev => Math.min(documents.length - 1, prev + 1));
  };
 
  

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
    
    // Simulate API call
    const updateRunningState = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudSliceRunningStateOfUser`,{
      isRunning:true,
      labId:labDetails?.labid,
      userId:user?.id,
      purchased:labDetails?.purchased || false
    })
    if(updateRunningState.data.success){
      setTimeout(() => {
        setLabStarted(true);
        setNotification({ type: 'success', message: 'Lab started successfully' });
        setCountdown(60 * 60); // 1 hour countdown
        setIsStarting(false);
        
        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }, 1500);
    }
    
  };

  // Stop lab
  const handleStopLab = async () => {
    setIsStopping(true);
    setNotification(null);
    
    // Simulate API call
    const updateRunningState = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudSliceRunningStateOfUser`,{
      isRunning:false,
      labId:labDetails?.labid,
      userId:user?.id,
      purchased:labDetails?.purchased || false
    })
    if(updateRunningState.data.success){
      setTimeout(() => {
        setLabStarted(false);
        setNotification({ type: 'success', message: 'Lab stopped successfully' });
        setCountdown(null);
        setIsStopping(false);
        
        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }, 1500);
    }
   
  };

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

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
        <p className="text-gray-400 mb-6">Unable to load the lab details.</p>
        <button 
          onClick={() => navigate('/dashboard/my-labs')}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Labs
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/dashboard/my-labs')}
            className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold">
              <GradientText>{labDetails?.title || 'Standard Lab'}</GradientText>
            </h1>
            <p className="mt-1 text-gray-400">{labDetails?.description}</p>
          </div>
        </div>
        
        {/* <div className="flex items-center space-x-3">
          {countdown !== null && (
            <div className="px-4 py-2 bg-dark-300/50 rounded-lg flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-mono text-gray-300">{formatTimeRemaining(countdown)}</span>
            </div>
          )}
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
            {labDetails?.provider?.toUpperCase()}
          </span>
        </div> */}
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

      <div className="space-y-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services Section - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <div className="glass-panel">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  <GradientText>Cloud Services</GradientText>
                </h2>
                <Cloud className="h-5 w-5 text-primary-400" />
              </div>

              <div className="space-y-4">
                {labDetails?.services && labDetails.services.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {labDetails.services.map((service: string, index: number) => (
                      <div 
                        key={index}
                        className="p-3 bg-dark-300/50 rounded-lg flex items-center space-x-2"
                      >
                        <Cloud className="h-4 w-4 text-primary-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No services have been specified for this lab.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Credentials & Actions Section - Takes 1/3 width on large screens */}
          <div className="space-y-6">
            <div className="glass-panel">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">
                  <GradientText>Access Credentials</GradientText>
                </h2>
                {documents.length > 0 && (
                  <button
                    onClick={() => setShowDocuments(!showDocuments)}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {showDocuments ? 'Hide' : 'View'}
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-dark-300/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Username</span>
                    <User className="h-3 w-3 text-primary-400" />
                  </div>
                  <p className="text-xs font-mono bg-dark-400/50 p-2 rounded border border-primary-500/10 text-gray-300 break-all">
                    {userLabStatus?.username || 'Not available'}
                  </p>
                </div>
                
                <div className="p-3 bg-dark-300/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Password</span>
                    <Key className="h-3 w-3 text-primary-400" />
                  </div>
                  <p className="text-xs font-mono bg-dark-400/50 p-2 rounded border border-primary-500/10 text-gray-300 break-all">
                    {userLabStatus?.password || 'Not available'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={labStarted ? handleStopLab : handleStartLab}
                disabled={isStarting || isStopping}
                className={`btn-primary w-full text-sm py-2 ${
                  labStarted ? 'bg-red-500 hover:bg-red-600' : ''
                }`}
              >
                {isStarting || isStopping ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : labStarted ? (
                  <Square className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isStarting ? 'Starting...' : 
                 isStopping ? 'Stopping...' : 
                 labStarted ? 'Stop Lab' : 'Start Lab'}
              </button>
              
              {labStarted && userLabStatus?.console_url && (
                <button
                  onClick={() => window.open(userLabStatus?.console_url, '_blank')}
                  className="btn-secondary w-full text-sm py-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Console
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Documents Panel - Full width below main content */}
        {showDocuments && (
          <div className="glass-panel">
            <div className="flex justify-between items-center p-4 border-b border-primary-500/10">
              <h2 className="text-lg font-semibold">
                <GradientText>User Guides</GradientText>
              </h2>
              <div className="flex items-center space-x-2">
                {documents.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevDocument}
                      disabled={currentDocIndex === 0}
                      className={`p-1 rounded-lg ${currentDocIndex === 0 ? 'text-gray-500' : 'text-primary-400 hover:bg-primary-500/10'}`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-400">
                      {currentDocIndex + 1} / {documents.length}
                    </span>
                    <button
                      onClick={handleNextDocument}
                      disabled={currentDocIndex === documents.length - 1}
                      className={`p-1 rounded-lg ${currentDocIndex === documents.length - 1 ? 'text-gray-500' : 'text-primary-400 hover:bg-primary-500/10'}`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDocuments(false)}
                  className="p-1 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="h-[600px] overflow-hidden">
              {isLoadingDocs ? (
                <div className="flex justify-center items-center h-full">
                  <Loader className="h-6 w-6 text-primary-400 animate-spin mr-3" />
                  <span className="text-gray-300">Loading documents...</span>
                </div>
              ) : documents.length > 0 ? (
                <iframe
                  src={`http://localhost:3000/api/v1/cloud_slice_ms/uploads/${extractFileName(documents[currentDocIndex])}`}
                  className="w-full h-full border-0"
                  title="Lab Document"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <FileText className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 text-center">
                    No user guides available for this lab
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};