import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  ArrowLeft, 
  Cloud, 
  Clock, 
  Layers, 
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Check,
  Loader,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  exercises: Exercise[];
  totalduration?: number;
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'lab' | 'questions';
  order: number;
  duration: number;
  status?: 'not-started' | 'in-progress' | 'completed';
}

export const ModularLabPage: React.FC = () => {
  const { labId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [labDetails, setLabDetails] = useState<any>(location.state?.labDetails || null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [labExercises, setLabExercises] = useState<Record<string, any>>({});
  const [quizExercises, setQuizExercises] = useState<Record<string, any>>({});
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // Fetch user details
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch lab details if not provided in location state
  useEffect(() => {
    if (!labDetails && labId) {
      const fetchLabDetails = async () => {
        try {
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${labDetails.labid}`);
          if (response.data.success) {
            setLabDetails(response.data.data);
          } else {
            setError('Failed to load cloud slice details');
          }
        } catch (err) {
          setError('Failed to load cloud slice details');
        }
      };
      
      fetchLabDetails();
    }
  }, [labDetails.labid, labDetails]);

  // Fetch modules
  useEffect(() => {
    const fetchModules = async () => {
      if (!labDetails.labid || !user?.id) return;
  
      setIsLoading(true);
      setError(null);
  
      try {
        // 1) Fetch modules
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getModules/${labDetails.labid}`
        );
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch modules');
        }
  
        const modulesData = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
  
        // 2) For each module, fetch quiz & lab statuses in parallel
        const statusResponses = await Promise.all(
          modulesData.map(async (module) => {
            // quiz statuses
            const quizPromise = axios
              .post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserQuizData`, {
                moduleId: module.id,
                userId: user.id
              })
              .then((r) => r.data.data)
              .catch(() => []);
  
            // lab statuses
            const labPromise = axios
              .post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserLabStatus`, {
                moduleId: module.id,
                userId: user.id
              })
              .then((r) => r.data.data)
              .catch(() => []);
  
            const [quizStatuses, labStatuses] = await Promise.all([quizPromise, labPromise]);
  
            return {
              moduleId: module.id,
              quizStatuses,
              labStatuses
            };
          })
        );
  
        // 3) Build a map: moduleId -> exerciseId -> status
        const statusMap = new Map<string, Record<string, string>>();
        statusResponses.forEach(({ moduleId, quizStatuses, labStatuses }) => {
          const mapForModule: Record<string, string> = {};
  
          // quizStatuses: assume shape [ { exercise_id, status }, … ]
          quizStatuses.forEach((s: any) => {
            mapForModule[s.exercise_id] = s.status;
          });

          // labStatuses: assume same shape
          labStatuses.forEach((s: any) => {
            mapForModule[s.exercise_id] = s.status;
          });
  
          statusMap.set(moduleId, mapForModule);
        });
  
        // 4) Sort modules & inject statuses into each exercise
        const sortedModules = [...modulesData].sort((a, b) => a.order - b.order);
        const processed = sortedModules.map((mod) => {
          const exStatuses = statusMap.get(mod.id) || {};
          const sortedEx = (mod.exercises || [])
            .slice()
            .sort((a: any, b: any) => a.order - b.order)
            .map((ex: any) => ({
              ...ex,
              status: exStatuses[ex.id] || 'not-started'
            }));
          return { ...mod, exercises: sortedEx };
        });
  
        setModules(processed);
        if (processed.length) setActiveModuleId(processed[0].id);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.warn('No modules found. Defaulting to empty list.');
          setModules([]);
        } else {
          console.error('Failed to fetch modules:', err);
          setError(err.response?.data?.message || 'Failed to fetch modules');
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchModules();
  }, [labDetails.labid, user]);
  
  // Fetch lab exercises when a module is selected
  useEffect(() => {
    const fetchLabExercises = async () => { 
      if (!activeModuleId) return;
      
      setIsLoadingExercises(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/lab-exercises/${activeModuleId}`);
        if (response.data.success) {
          const labExercisesData = response.data.data || [];
          const labExercisesMap: Record<string, any> = {};
          
          labExercisesData.forEach((exercise: any) => {
            labExercisesMap[exercise.exercise_id] = exercise;
          });
          setLabExercises(labExercisesMap);
        }
      } catch (err) {
        console.error('Error fetching lab exercises:', err);
      } finally {
        setIsLoadingExercises(false);
      }
    };

    fetchLabExercises();
  }, [activeModuleId]);

  // Fetch quiz exercises when a module is selected
  useEffect(() => {
    const fetchQuizExercises = async () => {
      if (!activeModuleId) return;
      
      setIsLoadingExercises(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/quiz-exercises/${activeModuleId}`);
        if (response.data.success) {
          const quizExercisesData = response.data.data || [];
          const quizExercisesMap: Record<string, any> = {};
          
          quizExercisesData.forEach((exercise: any) => {
            quizExercisesMap[exercise.exerciseId] = exercise;
          });
          setQuizExercises(quizExercisesMap);
        }
      } catch (err) {
        console.error('Error fetching quiz exercises:', err);
      } finally {
        setIsLoadingExercises(false);
      }
    };

    fetchQuizExercises();
  }, [activeModuleId]);

  // Calculate total duration
  const totalDuration = modules.reduce((total, module) => {
    return total + (module.totalduration || module.exercises.reduce((moduleTotal, exercise) => {
      return moduleTotal + exercise.duration;
    }, 0));
  }, 0);

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleModuleClick = (moduleId: string) => {
    setActiveModuleId(activeModuleId === moduleId ? null : moduleId);
  };

  const handleExerciseClick = (moduleId: string, exercise: Exercise) => {
    if (exercise.type === 'lab') {
      navigate(`/dashboard/my-labs/${labDetails.labid}/exercise/${exercise.id}`, {
        state: { 
          exercise,
          labDetails,
          moduleId,
          labExercise: labExercises[exercise.id]
        }
      });
    } else if (exercise.type === 'questions') {
      navigate(`/dashboard/my-labs/${labDetails.labid}/quiz/${exercise.id}`, {
        state: { 
          exercise,
          labDetails,
          moduleId,
          quizExercise: quizExercises[exercise.id]
        }
      });
    }
  };

 const getUniqueExercises = (exercises: Exercise[]): Exercise[] => {
        const uniqueExercises = new Map<string, Exercise>();
        
        exercises.forEach(exercise => {
          // Use exercise ID as the key to ensure uniqueness
          if (!uniqueExercises.has(exercise.id)) {
            uniqueExercises.set(exercise.id, exercise);
          }
        });
        return Array.from(uniqueExercises.values());
};

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
              <GradientText>{labDetails?.title || 'Modular Lab'}</GradientText>
            </h1>
            <p className="mt-1 text-gray-400">{labDetails?.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-dark-300/50 rounded-lg flex items-center space-x-2">
            <Clock className="h-4 w-4 text-primary-400" />
            <span className="text-sm text-gray-300">Total: {formatDuration(totalDuration)}</span>
          </div>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
            {labDetails?.provider?.toUpperCase()}
          </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Module List */}
        <div className="glass-panel">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              <GradientText>Modules</GradientText>
            </h2>
            <Layers className="h-5 w-5 text-primary-400" />
          </div>

          <div className="space-y-4">
            {modules.length === 0 ? (
              <div className="p-4 bg-dark-300/50 rounded-lg text-center">
                <p className="text-gray-400">No modules available</p>
              </div>
            ) : (
              modules.map((module, index) => (
                <div key={module.id} className="space-y-2">
                  <button
                    onClick={() => handleModuleClick(module.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      activeModuleId === module.id 
                        ? 'bg-primary-500/20 text-primary-300' 
                        : 'bg-dark-300/50 text-gray-300 hover:bg-dark-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-dark-400/80 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <span className="font-medium">{module.title}</span>
                    </div>
                    {activeModuleId === module.id ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  {activeModuleId === module.id && module.exercises && (
                    <div className="ml-6 space-y-1">
                      {getUniqueExercises(module.exercises).map((exercise) => (
                        <div key={exercise.id} className="flex items-center">
                          <button
                            onClick={() => handleExerciseClick(module.id, exercise)}
                            className={`flex-1 flex items-center space-x-2 p-2 rounded-lg text-left text-sm transition-colors ${
                              exercise.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300' :
                              exercise.status == 'in-progress' ? 'bg-amber-500/10 text-amber-300' :
                              'text-gray-400 hover:bg-dark-300/70 hover:text-gray-300'
                            }`}
                          >
                            {exercise.type === 'lab' ? (
                              <BookOpen className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <HelpCircle className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="truncate">{exercise.title}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Module Exercises */}
        <div className="lg:col-span-3 glass-panel">
          {activeModuleId ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">
                  <GradientText>
                    {modules.find(m => m.id === activeModuleId)?.title || 'Module Exercises'}
                  </GradientText>
                </h2>
                <p className="mt-2 text-gray-400">
                  {modules.find(m => m.id === activeModuleId)?.description}
                </p>
              </div>

              {isLoadingExercises ? (
                <div className="flex justify-center items-center py-12">
                  <Loader className="h-8 w-8 text-primary-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {getUniqueExercises(modules.find(m => m.id === activeModuleId)?.exercises).map((exercise, index) => (
                    <div 
                      key={exercise.id}
                      onClick={() => handleExerciseClick(activeModuleId, exercise)}
                      className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {exercise.type === 'lab' ? (
                            <BookOpen className="h-5 w-5 text-primary-400" />
                          ) : (
                            <HelpCircle className="h-5 w-5 text-accent-400" />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-200">{exercise.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">{exercise.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDuration(exercise.duration)}
                          </div>
                          {exercise.status && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              exercise.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                              exercise.status === 'in-progress' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-primary-500/20 text-primary-300'
                            }`}>
                              {exercise.status === 'not-started' ? 'Not Started' : 
                               exercise.status === 'in-progress' ? 'In Progress' : 
                               'Completed'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <Layers className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-400">Select a module to view its exercises</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};