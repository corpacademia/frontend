
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
  ChevronUp
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { formatDate } from '../../../utils/date';

export const LabDetailsPage: React.FC = () => {
  const { labId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { 
    selectedLab, 
    reviews, 
    isLoadingDetails, 
    isLoadingReviews, 
    error,
    fetchLabDetails,
    fetchReviews,
    addReview,
    clearSelectedLab
  } = useLabDetailsStore();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [showAllModules, setShowAllModules] = useState(false);
  const [expandAllModules, setExpandAllModules] = useState(false);

  const labType = location.state?.labType ;
  console.log(selectedLab)
  useEffect(() => {
    if (labId) {
      fetchLabDetails(labId, labType);
      fetchReviews(labId);
    }

    return () => {
      clearSelectedLab();
    };
  }, [labId, labType]);

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim() || !labId) return;
    setIsSubmittingReview(true);
    try {
      await addReview(labId, newReview.rating, newReview.comment);
      setNewReview({ rating: 5, comment: '' });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
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

  const renderLabSpecificDetails = () => {
    if (!selectedLab) return null;

    switch (labType) {
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
                      return total + (exercise?.details?.estimated_duration || exercise?.details[0]?.duration);
                    }, 0) || 0;
                    
                    return (
                      <div key={moduleKey} className="border border-primary-500/20 rounded-lg p-4">
                        <div className="flex justify-between items-center cursor-pointer" 
                             onClick={() => toggleModuleExpansion(moduleKey)}>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-300">{module.name}</h4>
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
                                  return (
                                    <div key={exIndex} className="pl-4 border-l border-primary-500/20">
                                      <div 
                                        className="flex justify-between items-center cursor-pointer p-2 hover:bg-dark-400/30 rounded"
                                        onClick={() => toggleExerciseExpansion(exerciseKey)}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <span className="inline-block w-2 h-2 bg-primary-400 rounded-full"></span>
                                          <span className="text-sm text-gray-300">{exercise?.details?.title || exercise?.details[0]?.title}</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs px-2 py-1 bg-secondary-500/20 text-secondary-300 rounded">
                                              {exercise.type || 'lab'}
                                            </span>
                                              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded">
                                                {exercise?.details?.estimated_duration || exercise?.details[0]?.duration}m
                                              </span>
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

  const canEdit = user?.role === 'superadmin' || user?.role === 'orgsuperadmin' || selectedLab.createdBy === user?.id;
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
              <button className="btn-secondary flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Lab</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      <span>{selectedLab.totalEnrollments || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-secondary-400" />
                      <span>{selectedLab.duration || 60}m</span>
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

                {selectedLab.key_technologies && selectedLab.key_technologies.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Technologies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLab.key_technologies.map((tech, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-dark-400/50 text-primary-300 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button className="w-full btn-primary flex items-center justify-center space-x-2">
                  <Play className="h-4 w-4" />
                  <span>Start Lab</span>
                </button>
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
              {selectedLab.learning_objectives && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-300">What You'll Learn</h3>
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <p className="text-gray-400 leading-relaxed">{selectedLab.learning_objectives}</p>
                  </div>
                </div>
              )}
              {/* additional details */}
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
              {selectedLab.target_audience && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-300">Who This Lab Is For</h3>
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <p className="text-gray-400">{selectedLab.target_audience}</p>
                  </div>
                </div>
              )}

              {/* Course Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedLab.category && (
                  <div className="bg-dark-300/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Level</h4>
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
                <button 
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-secondary text-sm"
                >
                  Write Review
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
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
                      <span>Submit</span>
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {isLoadingReviews ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin text-primary-400" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-dark-300/30 rounded-lg border border-primary-500/10">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-300">{review.userName}</h4>
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
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-400">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No reviews yet. Be the first to review this lab!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
