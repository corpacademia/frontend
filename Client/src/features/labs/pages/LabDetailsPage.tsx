
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLabDetailsStore } from '../../../store/labDetailsStore';
import { useAuthStore } from '../../../store/authStore';
import { 
  ArrowLeft,
  Star, 
  Clock, 
  Users, 
  Tag,
  Cpu,
  HardDrive,
  Server,
  Cloud,
  Network,
  Calendar,
  MapPin,
  BookOpen,
  FileText,
  Layers,
  Edit,
  Play,
  ExternalLink,
  User,
  MessageCircle,
  Send,
  Loader,
  ChevronDown,
  ChevronUp,
  Filter,
  Trash2
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { formatDate } from '../../../utils/date';
import axios from 'axios';

interface LabControl {
  isLaunched: boolean;
  isLaunching: boolean;
  isProcessing: boolean;
  buttonLabel: 'Start Lab' | 'Stop Lab';
}

export const LabDetailsPage: React.FC = () => {
  const { labId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { 
    selectedLab, 
    userLabDetails,
    reviews, 
    isLoadingDetails, 
    isLoadingReviews, 
    error,
    fetchLabDetails,
    fetchUserLabDetails,
    fetchReviews,
    addReview,
    deleteReview,
    clearSelectedLab
  } = useLabDetailsStore();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [showAllModules, setShowAllModules] = useState(false);
  const [expandAllModules, setExpandAllModules] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Review filtering and pagination states
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [labControls,setLabControls] = useState<Record<string, LabControl>>({});
  const [cloudInstanceDetails, setCloudInstanceDetails] = useState<any>(null);
  const [isLabLaunched, setIsLabLaunched] = useState(false);
 
  const labType = location.state?.labType || 'catalogue';
  useEffect(() => {
    if (labId) {
      fetchLabDetails(labId, labType);
      fetchUserLabDetails(labId,labType)
      fetchReviews(labId);
      
      // Check lab status for singlevm-aws
      if (labType === 'singlevm-aws') {
        checkLabStatus(labId);
      }
    }

    return () => {
      clearSelectedLab();
    };
  }, [labId, labType]);

  const checkLabStatus = async (labId: string) => {
    if(labType === 'singlevm-aws'){
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/checkLabStatus`, {
          lab_id: labId,
          user_id: user?.id
        });
        if (response.data.success) {
          setIsLabLaunched(true);
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
      }}
    };

   function formatDateAndTime(inputDate: Date) {
    const date = new Date(inputDate);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim() || !labId || !user) return;
    
    setIsSubmittingReview(true);
    try {
      await addReview(labId,user?.id, newReview.rating, newReview.comment);
      setNewReview({ rating: 5, comment: '' });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user || user.role !== 'superadmin') return;
    
    setIsDeletingReview(reviewId);
    try {
      await deleteReview(reviewId);
    } catch (error) {
      console.error('Failed to delete review:', error);
    } finally {
      setIsDeletingReview(null);
    }
  };

  const getDays =  (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = end.getTime() - start.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const toggleExerciseExpansion = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const handleExpandAll = () => {
    const newExpandedState = !expandAllModules;
    setExpandAllModules(newExpandedState);
    
    if (selectedLab?.modules) {
      const moduleExpandState: Record<string, boolean> = {};
      const exerciseExpandState: Record<string, boolean> = {};
      
      selectedLab.modules.forEach((module: any, index: number) => {
        const moduleKey = module.id || index.toString();
        moduleExpandState[moduleKey] = newExpandedState;
        
        if (module.exercises) {
          module.exercises.forEach((exercise: any, exIndex: number) => {
            const exerciseKey = `${moduleKey}-${exIndex}`;
            exerciseExpandState[exerciseKey] = newExpandedState;
          });
        }
      });
      
      setExpandedModules(moduleExpandState);
      setExpandedExercises(exerciseExpandState);
    }
  };

  const handleEditLab = () => {
    // Navigate to edit page based on lab type
    switch (labType) {
      case 'cloud-slice':
      case 'cloudslice':
        navigate(`/dashboard/labs/cloudslice/edit/${labId}`);
        break;
      case 'cloud-vm':
      case 'catalogue':
        navigate(`/dashboard/labs/cloudvm/edit/${labId}`);
        break;
      case 'cluster':
        navigate(`/dashboard/labs/cluster/edit/${labId}`);
        break;
      default:
        navigate(`/dashboard/labs/edit/${labId}`);
    }
  };

  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    let filteredReviews;
     filteredReviews = [...reviews];
    // Filter by rating
    if (reviewFilter !== 'all') {
      filteredReviews = filteredReviews.filter(review =>review.rating === Number(reviewFilter));
    }
    // Sort reviews
    filteredReviews.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
    
    return filteredReviews;
  };

  const filteredReviews = getFilteredAndSortedReviews();
  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 5);

  const renderLabSpecificDetails = () => {
    if (!selectedLab) return null;

    switch (labType) {
      case 'cloud-slice':
      case 'cloudslice':
        return (
          <div className="space-y-6">
            {/* Provider & Region Info */}
            <div className="bg-dark-300/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Cloud Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-400">
                  <Cloud className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Provider: {selectedLab.provider?.toUpperCase()}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Region: {selectedLab.region}</span>
                </div>
              </div>
            </div>

            {/* Services */}
            {selectedLab.services && selectedLab.services.length > 0 && (
              <div className="bg-dark-300/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Available Services</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLab.services.map((service, index) => (
                    <span key={index} className="px-3 py-1 text-sm bg-primary-500/20 text-primary-300 rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modules & Exercises */}
            {selectedLab.modules && selectedLab.modules.length > 0 && (
              <div className="bg-dark-300/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-300">Learning Modules</h3>
                  <button
                    onClick={handleExpandAll}
                    className="text-sm px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
                  >
                    {expandAllModules ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>
                <div className="space-y-3">
                  {(showAllModules ? selectedLab.modules : selectedLab.modules.slice(0, 3)).map((module: any, index: number) => {
                    const moduleKey = module.id || index.toString();
                    const totalDuration = module.exercises?.reduce((total: number, exercise: any) => {
                      return total + (exercise?.details?.estimated_duration || exercise?.details[0]?.duration || exercise?.duration || 0);
                    }, 0) || 0;
                    
                    return (
                      <div key={moduleKey} className="border border-primary-500/20 rounded-lg p-4">
                        <div className="flex justify-between items-center cursor-pointer" 
                             onClick={() => toggleModuleExpansion(moduleKey)}>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-300">{module.name || module.title}</h4>
                            {totalDuration > 0 && (
                              <p className="text-sm text-primary-400 mt-1">Total Duration: {totalDuration} minutes</p>
                            )}
                          </div>
                          {expandedModules[moduleKey] ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        {expandedModules[moduleKey] && (
                          <div className="mt-3 space-y-3">
                            <p className="text-sm text-gray-400">{module.description}</p>
                            {module.exercises && module.exercises.length > 0 && (
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-300">Exercises:</h5>
                                {module.exercises.map((exercise: any, exIndex: number) => {
                                  const exerciseKey = `${moduleKey}-${exIndex}`;
                                  const exerciseDuration = exercise?.details?.estimated_duration || exercise?.details?.[0]?.duration || exercise?.duration || 0;
                                  const exerciseType = exercise.type || 'lab';
                                  const exerciseTitle = exercise?.details?.title || exercise?.details?.[0]?.title || exercise?.title || `Exercise ${exIndex + 1}`;
                                  
                                  return (
                                    <div key={exIndex} className="pl-4 border-l border-primary-500/20">
                                      <div 
                                        className="flex justify-between items-center cursor-pointer p-2 hover:bg-dark-400/30 rounded"
                                        onClick={() => toggleExerciseExpansion(exerciseKey)}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <span className="inline-block w-2 h-2 bg-primary-400 rounded-full"></span>
                                          <span className="text-sm text-gray-300">{exerciseTitle}</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs px-2 py-1 bg-secondary-500/20 text-secondary-300 rounded">
                                              {exerciseType}
                                            </span>
                                            {exerciseDuration > 0 && (
                                              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded">
                                                {exerciseDuration}m
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {expandedExercises[exerciseKey] ? (
                                          <ChevronUp className="h-4 w-4 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-gray-400" />
                                        )}
                                      </div>
                                      {expandedExercises[exerciseKey] && exercise.description && (
                                        <div className="mt-2 ml-5 p-3 bg-dark-400/30 rounded-lg">
                                          <p className="text-xs text-gray-400">{exercise.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedLab.modules.length > 3 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllModules(!showAllModules)}
                      className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
                    >
                      {showAllModules 
                        ? `Show Less (${selectedLab.modules.length - 3} hidden)` 
                        : `Show ${selectedLab.modules.length - 3} More Modules`
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'cloud-vm':
      case 'catalogue':
      case 'singlevmaws':
      case 'singlevmdatacenter':
        return (
          <div className="space-y-6">
            {/* Technical Specifications */}
            <div className="bg-dark-300/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center text-gray-400">
                  <Cpu className="h-5 w-5 mr-3 text-primary-400" />
                  <span>{selectedLab.cpu} vCPU</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Tag className="h-5 w-5 mr-3 text-primary-400" />
                  <span>{selectedLab.ram}GB RAM</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <HardDrive className="h-5 w-5 mr-3 text-primary-400" />
                  <span>{selectedLab.storage}GB Storage</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Server className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Instance: {selectedLab.instance}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Cloud className="h-5 w-5 mr-3 text-primary-400" />
                  <span>{selectedLab.os} {selectedLab.os_version}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Network className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Platform: {selectedLab.platform}</span>
                </div>
              </div>
            </div>

            {/* Software */}
            {selectedLab.software && selectedLab.software.length > 0 && (
              <div className="bg-dark-300/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Pre-installed Software</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLab.software.map((sw, index) => (
                    <span key={index} className="px-3 py-1 text-sm bg-secondary-500/20 text-secondary-300 rounded-full">
                      {sw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Guides */}
            {(selectedLab.labGuide || selectedLab.userGuide) && (
              <div className="bg-dark-300/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Lab Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLab.labGuide && (
                    <div className="flex items-center justify-between p-3 bg-dark-400/50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-3 text-primary-400" />
                        <span className="text-gray-300">Lab Guide</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  {selectedLab.userGuide && (
                    <div className="flex items-center justify-between p-3 bg-dark-400/50 rounded-lg">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-3 text-primary-400" />
                        <span className="text-gray-300">User Guide</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'cluster':
      case 'vmclusterdatacenter':
        return (
          <div className="space-y-6">
            {/* Cluster Configuration */}
            <div className="bg-dark-300/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Cluster Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-400">
                  <Network className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Network: {selectedLab.platform}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Server className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Provider: {selectedLab.provider}</span>
                </div>
              </div>
            </div>

            {/* VM Instances */}
            <div className="bg-dark-300/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Virtual Machines</h3>
              <div className="text-gray-400">
                Multiple VM instances with consistent networking configuration
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-dark-300/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Lab Configuration</h3>
            <p className="text-gray-400">Detailed configuration information for {labType} lab type.</p>
          </div>
        );
    }
  
  };

  const handleLaunchLab = async(e:React.MouseEvent)=>{
     e.stopPropagation(); // Prevent triggering card click if clicking launch
     const currentLabDetails = userLabDetails?.find((lab:any)=>lab?.user_id === user?.id) || null;
     setIsLaunching(true);
     setNotification(null);
     
     if(currentLabDetails?.status === 'expired') {
       setNotification({
         type: 'error',
         message: 'Lab has expired and cannot be launched'
       });
       setIsLaunching(false);
       setTimeout(() => setNotification(null), 3000);
       return;
     }
     
     try {
       const userLabStatus = currentLabDetails || { launched: false, status: 'not-started' }; // Fallback if selectedLab is undefined
      if(labType === 'cloudslice'){
       if( !userLabStatus.launched){
         const update = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateDates`,{
           labId:userLabStatus?.labid,
           userId:user?.id,
           duration:userLabStatus.duration,
           status:'active',
           launched:true,
         })
         if(update.data.success){
           // Update local lab state if needed, or rely on fetched data later
           // lab.startdate = update.data.data.start_date;
           // lab.enddate = update.data.data.end_date;
         }
       }
       if (userLabStatus.modules === 'without-modules') {
         // Call createIamUser only if the lab is not already launched
         if (!userLabStatus.launched) {
           const createIamUser = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/createIamUser`, {
             userName: user?.name,
             services: userLabStatus?.services,
             role:user?.role,
             labid:userLabStatus?.labid,
             user_id:user?.id,
             purchased:true
           });

           if(createIamUser.data.success){
             const updateUserLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`,{
               status:'active',
               launched:true,
               labId:userLabStatus?.labid,
               userId:user?.id,
               purchased:true
             })

             if(updateUserLabStatus.data.success){
                  // Navigate to standard lab
               navigate(`/dashboard/my-labs/${userLabStatus?.labid}/standard`, { // Use lab.labid for routing
                 state: {
                   labDetails: {
                     ...userLabStatus,
                     credentials: {
                       username: 'lab-user-789',
                       accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                       secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                     },
                     consoleUrl: 'https://console.aws.amazon.com',
                     purchased:true,
                   }
                 }
               });
             }
           }
         }
         else{
            // Navigate to standard lab if already launched
             navigate(`/dashboard/my-labs/${userLabStatus?.labid}/standard`, { // Use lab.labid for routing
               state: {
                 labDetails: {
                    ...userLabStatus,
                   credentials: {
                     username: 'lab-user-789',
                     accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                     secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                   },
                   consoleUrl: 'https://console.aws.amazon.com',
                   purchased:true
                 }
               }
             });
         }

       } else { // It's a module-based lab
         if(!userLabStatus.launched){
           const updateUserLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabStatusOfUser`,{
             status:'active',
             launched:true,
             labId:userLabStatus?.labid,
             userId:user?.id,
             purchased:true
           })
           if(updateUserLabStatus.data.success){
              // Navigate to module-based lab
              navigate(`/dashboard/my-labs/${userLabStatus?.labid}/modules`, { // Use lab.labid for routing
               state: {
                 labDetails: {
                   
                   ...userLabStatus,
                   credentials: {
                     username: 'lab-user-789',
                     accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                     secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                   },
                   consoleUrl: 'https://console.aws.amazon.com',
                   purchased:true
                 }
               }
             });
           }
         }
         else{
            // Navigate to module-based lab if already launched
            navigate(`/dashboard/my-labs/${userLabStatus.labid}/modules`, { // Use lab.labid for routing
             state: {
               labDetails: {
                 ...userLabStatus,
                 credentials: {
                   username: 'lab-user-789',
                   accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                   secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                 },
                 consoleUrl: 'https://console.aws.amazon.com',
                 purchased:true
               }
             }
           });
         }

       }
      }
      else if(labType === 'singlevm-aws'){
        const [ami, labConfig] = await Promise.all([
                axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiinformation`, { lab_id: userLabStatus?.lab_id || userLabStatus?.labid }),
                axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`, { labId: userLabStatus?.lab_id || userLabStatus?.labid }),
                
              ]);
              if (!ami.data.success) {
                throw new Error('Failed to retrieve instance details');
              }
          
              // First API: Launch instance (Keep loading active)
              const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/launchInstance`, {
                name: user?.name,
                ami_id: ami.data.result.ami_id,
                user_id: user?.id,
                lab_id: userLabStatus?.lab_id || userLabStatus?.labid,
                instance_type: labConfig?.data?.data?.instance,
                start_date: formatDateAndTime(new Date()),
                end_date: formatDateAndTime(new Date(Date.now() + (userLabStatus.duration) * 24 * 60 * 60 * 1000) 
              )
              });
              
              if (response.data.success) {
                setIsLabLaunched(true);
                setNotification({
                  type: 'success',
                  message: 'Lab launched successfully'
                });
                setTimeout(() => setNotification(null), 3000);
              }
      }
     } catch (error: any) {
       console.error("Launch error:", error); // Log the full error
       setNotification({
         type: 'error',
         message: error.response?.data?.message || error.message || 'Failed to launch lab'
       });
       setTimeout(() => setNotification(null), 3000);
     } finally {
       setIsLaunching(false);
     }
  }

   const handleStartStopLab = async () => {
      if (!labId || !user) return;
      
      const isStop = labControls[labId]?.buttonLabel === 'Stop Lab';
  
      setLabControls(prev => ({
        ...prev,
        [labId]: {
          ...prev[labId],
          isProcessing: true,
          notification: null
        }
      }));
  
      try {
        const cloudinstanceDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
          user_id: user.id,
          lab_id: labId,
        })
        if (!cloudinstanceDetails.data.success) {
          throw new Error('Failed to retrieve instance details');
        }
        setCloudInstanceDetails(cloudinstanceDetails.data.data);
  
      const instanceId = cloudInstanceDetails.instance_id;
        if (isStop) {
          const stop = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/stopInstance`, {
            instance_id: instanceId
          });
          if(stop.data.success){
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,{
              lab_id: labId,
              user_id: user.id,
              state: false,
              isStarted: true
            })
          }
  
          setLabControls(prev => ({
            ...prev,
            [labId]: {
              ...prev[labId],
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
              [labId]: {
                ...prev[labId],
                notification: null
              }
            }));
          }, 3000);
  
          return;
        }
        
        const checkInstanceAlreadyStarted = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/checkisstarted`,{
          type: 'user',
          id: cloudInstanceDetails.instance_id,
        })
        
        if(checkInstanceAlreadyStarted.data.isStarted === false){
          console.log('stop')
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
            os_name: selectedLab.os,
            instance_id: cloudInstanceDetails.instance_id,
            hostname: cloudInstanceDetails.public_ip,
            password: cloudInstanceDetails.password,
            buttonState: 'Start Lab'
          });
          
          if (response.data.response.success && response.data.response.jwtToken) {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,{
              lab_id: labId,
              user_id: user.id,
              state: true,
              isStarted: false
            })
            
            const guacUrl = `${selectedLab.guacamole_url}?token=${response.data.response.jwtToken}`;
            console.log(guacUrl)
            navigate(`/dashboard/labs/vm-session/${labId}`, {
              state: { 
                guacUrl,
                vmTitle: selectedLab.title,
                vmId: labId,
                doc: selectedLab.userguide
              }
            });
          }
        }
        else{
          console.log('run')
          
          const restart = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/restart_instance`, {
            instance_id: cloudInstanceDetails.instance_id,
            user_type: 'user'
          });
    
          if (restart.data.success) {
            const updatedCloudInstanceDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/getAssignedInstance`, {
              user_id: user.id,
              lab_id: labId,
            })
            if(updatedCloudInstanceDetails.data.success){
              const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/runSoftwareOrStop`, {
                os_name: selectedLab.os,
                instance_id: updatedCloudInstanceDetails.data.data.instance_id,
                hostname: updatedCloudInstanceDetails.data.data.public_ip,
                password: updatedCloudInstanceDetails.data.data.password,
                buttonState: 'Start Lab'
              });
              if(response.data.success){
                //update database that the instance is started
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateawsInstanceOfUsers`,{
                  lab_id: labId,
                  user_id: user.id,
                  state: true,
                  isStarted: true
                })
                const guacUrl = `${selectedLab.guacamole_url}?token=${response.data.response.jwtToken}`;
                
                navigate(`/dashboard/labs/vm-session/${labId}`, {
                  state: { 
                    guacUrl,
                    vmTitle: selectedLab.title,
                    vmId: labId,
                    doc: selectedLab.userguide
                  }
                });
              }
            }
          }
        }
        
        setLabControls(prev => ({
          ...prev,
          [labId]: {
            ...prev[labId],
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
            [labId]: {
              ...prev[labId],
              notification: null
            }
          }));
        }, 3000);
  
      } catch (error: any) {
        setLabControls(prev => ({
          ...prev,
          [labId]: {
            ...prev[labId],
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
            [labId]: {
              ...prev[labId],
              notification: null
            }
          }));
        },3000)
      }
    };

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="h-6 w-6 animate-spin text-primary-400" />
          <span className="text-gray-400">Loading lab details...</span>
        </div>
      </div>
    );
  }

  if (error || !selectedLab) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Lab Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'Unable to load lab details'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'superadmin' || user?.role === 'labadmin' || selectedLab.createdBy === user?.id;
  const averageRating = reviews.length > 0 ? 
    reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 
    selectedLab.rating || 0;

  return (
    <div className="min-h-screen bg-dark-100">
      {/* Header */}
      <div className="bg-dark-200/80 backdrop-blur-sm border-b border-primary-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Labs</span>
            </button>
            {canEdit && (
              <button 
                onClick={handleEditLab}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Lab</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2`}>
          <div className={`p-4 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                </div>
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lab Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-dark-200/80 backdrop-blur-sm rounded-xl border border-primary-500/10 p-6">
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold mb-2">
                    <GradientText>{selectedLab.title}</GradientText>
                  </h1>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-amber-400 fill-current" />
                      <span>{averageRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-primary-400" />
                      <span>{selectedLab.total_enrollments || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-secondary-400" />
                      <span>{selectedLab?.number_days || getDays(selectedLab?.startdate,selectedLab?.enddate) || getDays(selectedLab?.start_date,selectedLab?.end_date)}D</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedLab.difficulty && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-primary-300">{selectedLab.difficulty}</span>
                    </div>
                  )}
                  {selectedLab.type && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-primary-300">{selectedLab.type}</span>
                    </div>
                  )}
                  {selectedLab.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-emerald-300">${selectedLab.price}</span>
                    </div>
                  )}
                </div>

                {((selectedLab.technologies && selectedLab.technologies.length > 0) || (selectedLab.key_technologies && selectedLab.key_technologies.length > 0)) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Technologies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedLab.technologies || selectedLab.key_technologies || []).map((tech, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-dark-400/50 text-primary-300 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {labType === 'singlevm-aws' ? (
                  <>
                    {!isLabLaunched ? (
                      <button 
                        onClick={handleLaunchLab}
                        disabled={isLaunching}
                        className="w-full px-4 py-3 rounded-lg text-sm font-medium
                                 bg-gradient-to-r from-primary-500 to-secondary-500
                                 hover:from-primary-400 hover:to-secondary-400
                                 transform hover:scale-105 transition-all duration-300
                                 text-white shadow-lg shadow-primary-500/20
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center space-x-2"
                      >
                        {isLaunching ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            <span>Launching...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span>Launch Lab</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={handleStartStopLab}
                        disabled={labControls[labId]?.isProcessing}
                        className="w-full px-4 py-3 rounded-lg text-sm font-medium
                                 bg-gradient-to-r from-primary-500 to-secondary-500
                                 hover:from-primary-400 hover:to-secondary-400
                                 transform hover:scale-105 transition-all duration-300
                                 text-white shadow-lg shadow-primary-500/20
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center space-x-2"
                      >
                        {labControls[labId]?.isProcessing ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span>{labControls[labId]?.buttonLabel || 'Start Lab'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={handleLaunchLab}
                    disabled={isLaunching}
                    className="w-full px-4 py-3 rounded-lg text-sm font-medium
                             bg-gradient-to-r from-primary-500 to-secondary-500
                             hover:from-primary-400 hover:to-secondary-400
                             transform hover:scale-105 transition-all duration-300
                             text-white shadow-lg shadow-primary-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center space-x-2"
                  >
                    {isLaunching ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Launching...</span>
                      </>
                    ) : userLabDetails?.find((lab:any)=>lab?.user_id === user?.id)?.launched ? (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        <span>Go To Lab</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Start Lab</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-dark-200/80 backdrop-blur-sm rounded-xl border border-primary-500/10 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-300">About This Lab</h2>
              <p className="text-gray-400 leading-relaxed mb-6">{selectedLab.description}</p>
              
              {/* Learning Objectives */}
              {(selectedLab.learningObjectives || selectedLab.learning_objectives) && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-300">What You'll Learn</h3>
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <p className="text-gray-400 leading-relaxed">{selectedLab.learningObjectives || selectedLab.learning_objectives}</p>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {selectedLab.additional_details && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-300">Additional Details</h3>
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <p className="text-gray-400 leading-relaxed">{selectedLab.additional_details}</p>
                  </div>
                </div>
              )}

              {/* Prerequisites */}
              {selectedLab.prerequisites && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-300">Prerequisites</h3>
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <p className="text-gray-400 leading-relaxed">{selectedLab.prerequisites}</p>
                  </div>
                </div>
              )}

              {/* Target Audience */}
              {(selectedLab.targetAudience || selectedLab.target_audience) && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-300">Who This Lab Is For</h3>
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <p className="text-gray-400">{selectedLab.targetAudience || selectedLab.target_audience}</p>
                  </div>
                </div>
              )}

              {/* Course Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedLab.category && (
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Category</h4>
                    <p className="text-primary-300">{selectedLab.category}</p>
                  </div>
                )}
                {selectedLab.estimatedDuration && (
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Duration</h4>
                    <p className="text-secondary-300">{selectedLab.estimatedDuration} minutes</p>
                  </div>
                )}
                {selectedLab.instructor && (
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Instructor</h4>
                    <p className="text-emerald-300">{selectedLab.instructor}</p>
                  </div>
                )}
                <div className="bg-dark-300/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Language</h4>
                  <p className="text-gray-300">{selectedLab.language || 'English'}</p>
                </div>
                {selectedLab.certificate !== undefined && (
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Certificate</h4>
                    <p className="text-amber-300">{selectedLab.certificate ? 'Available' : 'Not Available'}</p>
                  </div>
                )}
                {selectedLab.lastUpdated && (
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Last Updated</h4>
                    <p className="text-gray-300">{formatDate(selectedLab.lastUpdated)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lab-specific details */}
            {renderLabSpecificDetails()}

            {/* Schedule */}
            {(selectedLab.startDate || selectedLab.endDate) && (
              <div className="bg-dark-300/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLab.startDate && (
                    <div className="flex items-center text-gray-400">
                      <Calendar className="h-5 w-5 mr-3 text-primary-400" />
                      <span>Start: {formatDate(selectedLab.startDate)}</span>
                    </div>
                  )}
                  {selectedLab.endDate && (
                    <div className="flex items-center text-gray-400">
                      <Calendar className="h-5 w-5 mr-3 text-secondary-400" />
                      <span>End: {formatDate(selectedLab.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-dark-200/80 backdrop-blur-sm rounded-xl border border-primary-500/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-300">Reviews & Ratings</h2>
                {user && (
                  <button 
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="btn-secondary text-sm"
                  >
                    <GradientText>
                    Write Review</GradientText>
                  </button>
                )}
              </div>

              {/* Review Form - Only for logged in users */}
              {showReviewForm && user && (
                <div className="mb-6 p-4 bg-dark-300/50 rounded-lg border border-primary-500/20">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                          className={`p-1 transition-colors ${
                            star <= newReview.rating ? 'text-amber-400' : 'text-gray-500'
                          }`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Comment</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none
                               resize-none h-20"
                      placeholder="Share your experience with this lab..."
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSubmitReview}
                      disabled={!newReview.comment.trim() || isSubmittingReview}
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmittingReview ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span><GradientText>Submit</GradientText></span>
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="btn-secondary"
                    >
                      <GradientText>Cancel</GradientText>
                    </button>
                  </div>
                </div>
              )}

              {/* Review Filters */}
              {reviews.length > 0 && (
                <div className="mb-6 p-4 bg-dark-300/30 rounded-lg border border-primary-500/10">
                  <div className="flex items-center space-x-4 mb-4">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Filter Reviews</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-400">Rating:</label>
                      <select
                        value={reviewFilter}
                        onChange={(e) => setReviewFilter(e.target.value as any)}
                        className="px-3 py-1 bg-dark-400/50 border border-primary-500/20 rounded text-sm text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      >
                        <option value="all">All</option>
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-400">Sort:</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="px-3 py-1 bg-dark-400/50 border border-primary-500/20 rounded text-sm text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {isLoadingReviews ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin text-primary-400" />
                  </div>
                ) : displayedReviews.length > 0 ? (
                  <>
                    {displayedReviews.map((review) => (
                      <div key={review.id} className="p-4 bg-dark-300/30 rounded-lg border border-primary-500/10">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-400" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium text-gray-300">{review.username}</h4>
                                <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`h-4 w-4 ${
                                        star <= review.rating ? 'text-amber-400 fill-current' : 'text-gray-500'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {formatDate(review.created_at)}
                                </span>
                              </div>
                              {user?.role === 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  disabled={isDeletingReview === review.id}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete review"
                                >
                                  {isDeletingReview === review.id ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                            <p className="text-gray-400">{review.review_text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredReviews.length > 5 && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="px-6 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
                        >
                          {showAllReviews 
                            ? `Show Less (${filteredReviews.length - 5} hidden)` 
                            : `Show ${filteredReviews.length - 5} More Reviews`
                          }
                        </button>
                      </div>
                    )}
                  </>
                ) : filteredReviews.length === 0 && reviews.length > 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No reviews match your filter criteria.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No reviews yet. Be the first to review this lab!</p>
                    {!user && (
                      <p className="text-sm text-gray-500 mt-2">Please log in to write a review.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    // </div>
  );
};
