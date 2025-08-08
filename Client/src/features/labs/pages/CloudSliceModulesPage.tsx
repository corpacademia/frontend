import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { 
  Layers, 
  BookOpen, 
  Award, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Loader,
  Plus,
  Pencil,
  Trash2,
  FileText
} from 'lucide-react';
import axios from 'axios';

// Import components
import { EditModuleModal } from '../components/modules/EditModuleModal';
import { EditExerciseModal } from '../components/modules/EditExerciseModal';
import { EditLabExerciseModal } from '../components/modules/EditLabExerciseModal';
import { EditQuizExerciseModal } from '../components/modules/EditQuizExerciseModal';
import { DeleteConfirmationModal } from '../components/modules/DeleteConfirmationModal';

// Import the exercise content components
import { LabExerciseContent } from '../components/modules/LabExerciseContent';
import { QuizExerciseContent } from '../components/modules/QuizExerciseContent';

// Import the module list component
import { ModuleList } from '../components/modules/ModuleList';

// Import types
import { 
  Module, 
  Exercise, 
  LabExercise, 
  QuizExercise, 
  CleanupPolicy 
} from '../types/modules';

export const CloudSliceModulesPage: React.FC = () => {
  const { sliceId } = useParams<{ sliceId: string }>();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [labExercises, setLabExercises] = useState<Record<string, LabExercise>>({});
  const [quizExercises, setQuizExercises] = useState<Record<string, QuizExercise>>({});
  
  // Loading states for each API call
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [isLoadingLabExercises, setIsLoadingLabExercises] = useState(false);
  const [isLoadingQuizExercises, setIsLoadingQuizExercises] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRUD modals state
  const [isEditModuleModalOpen, setIsEditModuleModalOpen] = useState(false);
  const [isEditExerciseModalOpen, setIsEditExerciseModalOpen] = useState(false);
  const [isEditLabExerciseModalOpen, setIsEditLabExerciseModalOpen] = useState(false);
  const [isEditQuizExerciseModalOpen, setIsEditQuizExerciseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedLabExercise, setSelectedLabExercise] = useState<LabExercise | null>(null);
  const [selectedQuizExercise, setSelectedQuizExercise] = useState<QuizExercise | null>(null);
  const [deleteType, setDeleteType] = useState<'module' | 'exercise' | 'labExercise' | 'quizExercise'>('module');
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sliceDetails, setSliceDetails] = useState<any>(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setCurrentUser(response.data.user);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch slice details to check creator
  useEffect(() => {
    const fetchSliceDetails = async () => {
      if (!sliceId) return;
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${sliceId}`);
        if (response.data.success) {
          setSliceDetails(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch slice details:', err);
      }
    };
    
    fetchSliceDetails();
  }, [sliceId]);

  // Fetch modules
  useEffect(() => {
    const fetchModules = async () => {
      setIsLoadingModules(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getModules/${sliceId}`);
        if (response.data.success) {
          setModules(Array.isArray(response.data.data) ? response.data.data : [response.data.data] || []);
          if (response.data.data && response.data.data.length > 0) {
            setActiveModule(response.data.data[0].id);
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch modules');
        }
       
      } catch (err: any) {
        if(err.response && err.response.status === 404){
          console.warn("No modules found. Setting modules to an empty list.");
          setModules([]);  // Set modules to an empty array instead of stopping the UI
        } else {
          console.error("Failed to fetch modules:", err);
          setError(err.response?.data?.message || 'Failed to fetch modules');
        }
      } finally {
        setIsLoadingModules(false);
      }
    };

    if (sliceId) {
      fetchModules();
    }
  }, [sliceId]);

  // Fetch lab exercises when a module is selected
  useEffect(() => {
    const fetchLabExercises = async () => {
      if (!activeModule) return;
      
      setIsLoadingLabExercises(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/lab-exercises/${activeModule}`);
        if (response.data.success) {
          const labExercisesData = response.data.data || [];
          const labExercisesMap: Record<string, LabExercise> = {};
          
          labExercisesData.forEach((exercise: LabExercise) => {
            labExercisesMap[exercise.exercise_id] = exercise;
          });
          setLabExercises(labExercisesMap);
        }
        
      } catch (err) {
        console.error('Error fetching lab exercises:', err);
      } finally {
        setIsLoadingLabExercises(false);
      }
    };

    fetchLabExercises();
  }, [activeModule]);

  // Fetch quiz exercises when a module is selected
  useEffect(() => {
    const fetchQuizExercises = async () => {
      if (!activeModule) return;
      
      setIsLoadingQuizExercises(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/quiz-exercises/${activeModule}`);
        if (response.data.success) {
          const quizExercisesData = response.data.data || [];
          const quizExercisesMap: Record<string, QuizExercise> = {};
          quizExercisesData.forEach((exercise: QuizExercise) => {
            quizExercisesMap[exercise.exerciseId] = exercise;
          });
          setQuizExercises(quizExercisesMap);
        }
      } catch (err) {
        console.error('Error fetching quiz exercises:', err);
      } finally {
        setIsLoadingQuizExercises(false);
      }
    };

    fetchQuizExercises();
  }, [activeModule]);

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(activeModule === moduleId ? null : moduleId);
    setActiveExercise(null);
  };

  const handleExerciseClick = (exerciseId: string) => {
    setActiveExercise(activeExercise === exerciseId ? null : exerciseId);
  };

  const getActiveModule = () => {
    if (!activeModule || !modules || modules.length === 0) return null;
    return modules.find(m => m.id === activeModule) || null;
  };

  const getActiveExercise = () => {
    const module = getActiveModule();
    if (!module || !activeExercise || !module.exercises) return null;
    return module.exercises.find(e => e.id === activeExercise) || null;
  };

  // Check if current user can edit content
  const canEditContent = () => {
    if (!currentUser || !sliceDetails) return false;
    // Super admin can edit anything
    if (currentUser.role === 'superadmin') return true;
    // Org admin can only edit content they created
    if (currentUser.role === 'orgsuperadmin' || currentUser.role === 'orgadmin') {
      return sliceDetails.createdby === currentUser.id;
    }
    return false;
  };

  // CRUD operations for modules
  const handleAddModule = () => {
    setSelectedModule(null);
    setIsEditModuleModalOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setIsEditModuleModalOpen(true);
  };

  const handleDeleteModule = (moduleId: string) => {
    setDeleteType('module');
    setDeleteItemId(moduleId);
    setIsDeleteModalOpen(true);
  };

  const handleSaveModule = async(module: Module) => {
    if (selectedModule) {
      // Update existing module
      const result = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateModule`, module);
      if(result.data.success){
        setModules(modules.map(m => m.id === module.id ? module : m));
        showNotification('success', 'Module updated successfully');
      }
      
    } else {
      // Add new module
      setModules([...modules, module]);
      showNotification('success', 'Module added successfully');
    }
  };

  // CRUD operations for exercises
  const handleAddExercise = (moduleId: string) => {
    setSelectedExercise(null);
    setActiveModule(moduleId);
    setIsEditExerciseModalOpen(true);
  };

  const handleEditExercise = (moduleId: string, exercise: Exercise) => {
    setSelectedExercise(exercise);
    setActiveModule(moduleId);
    setIsEditExerciseModalOpen(true);
  };

  const handleDeleteExercise = (moduleId: string, exerciseId: string) => {
    setDeleteType('exercise');
    setActiveModule(moduleId);
    setDeleteItemId(exerciseId);
    setIsDeleteModalOpen(true);
  };

  const handleSaveExercise = (moduleId: string, exercise: Exercise) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const updatedModules = [...modules];
    const module = { ...updatedModules[moduleIndex] };

    if (selectedExercise) {
      // Update existing exercise
      module.exercises = module.exercises.map(e => e.id === exercise.id ? exercise : e);
      showNotification('success', 'Exercise updated successfully');
    } else {
      // Add new exercise
      module.exercises = [...module.exercises, exercise];
      showNotification('success', 'Exercise added successfully');
    }

    updatedModules[moduleIndex] = module;
    setModules(updatedModules);
    
    // If it's a lab exercise, open the lab exercise modal
    if (exercise.type === 'lab') {
      setSelectedExercise(exercise);
      // setTimeout(() => {
      //   setIsEditLabExerciseModalOpen(true);
      // }, 100);
    } 
    // If it's a quiz, open the quiz modal
    else if (exercise.type === 'questions') {
      setSelectedExercise(exercise);
      // setTimeout(() => {
      //   setIsEditQuizExerciseModalOpen(true);
      // }, 100);
    }
  };

  // CRUD operations for lab exercises
  const handleEditLabExercise = (exerciseId: string) => {
    // Make sure to set the selected lab exercise before opening the modal
    setSelectedLabExercise(labExercises[exerciseId] || null);
    
    // Find the exercise in the modules
    const exercise = findExerciseById(exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
    }
    
    setIsEditLabExerciseModalOpen(true);
  };

  const handleSaveLabExercise = (exercise_id: string, labExercise: LabExercise) => {
    setLabExercises({
      ...labExercises,
      [exercise_id]: labExercise
    });
    showNotification('success', 'Lab exercise updated successfully');
  };

  // CRUD operations for quiz exercises
  const handleEditQuizExercise = (exerciseId: string) => {
    setSelectedQuizExercise(quizExercises[exerciseId] || null);
    
    // Find the exercise in the modules
    const exercise = findExerciseById(exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
    }
    
    setIsEditQuizExerciseModalOpen(true);
  };

  const handleSaveQuizExercise = (exerciseId: string, quizExercise: QuizExercise) => {
    setQuizExercises({
      ...quizExercises,
      [exerciseId]: quizExercise
    });
    showNotification('success', 'Quiz updated successfully');
  };

  // Helper function to find an exercise by ID across all modules
  const findExerciseById = (exerciseId: string): Exercise | null => {
    for (const module of modules) {
      const exercise = module.exercises.find(e => e.id === exerciseId);
      if (exercise) {
        return exercise;
      }
    }
    return null;
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      switch (deleteType) {
        case 'module':
          setModules(modules.filter(m => m.id !== deleteItemId));
          showNotification('success', 'Module deleted successfully');
          if (activeModule === deleteItemId) {
            setActiveModule(null);
            setActiveExercise(null);
          }
          break;
        case 'exercise':
          if (!activeModule) break;
          
          const moduleIndex = modules.findIndex(m => m.id === activeModule);
          if (moduleIndex === -1) break;
          
          const updatedModules = [...modules];
          const module = { ...updatedModules[moduleIndex] };
          module.exercises = module.exercises.filter(e => e.id !== deleteItemId);
          updatedModules[moduleIndex] = module;
          
          setModules(updatedModules);
          showNotification('success', 'Exercise deleted successfully');
          
          if (activeExercise === deleteItemId) {
            setActiveExercise(null);
          }
          break;
        case 'labExercise':
          // In a real app, you would call an API to delete the lab exercise
          const updatedLabExercises = { ...labExercises };
          delete updatedLabExercises[deleteItemId];
          setLabExercises(updatedLabExercises);
          showNotification('success', 'Lab exercise deleted successfully');
          break;
        case 'quizExercise':
          // In a real app, you would call an API to delete the quiz exercise
          const updatedQuizExercises = { ...quizExercises };
          delete updatedQuizExercises[deleteItemId];
          setQuizExercises(updatedQuizExercises);
          showNotification('success', 'Quiz deleted successfully');
          break;
      }
    } catch (err) {
      showNotification('error', 'Failed to delete item');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  function extractFile_Name(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

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
  

  // Helper function to format cleanup policy display
  const formatCleanupPolicy = (policy?: CleanupPolicy): string => {
    if (!policy || !policy.enabled) return 'No cleanup policy';
    
    switch (policy.type) {
      case 'auto':
        return `Auto delete after ${policy.duration} ${policy.durationUnit}`;
      case 'scheduled':
        return `Scheduled deletion at ${new Date(policy.scheduledTime || '').toLocaleString()}`;
      case 'inactivity':
        return `Delete after ${policy.inactivityTimeout} ${policy.inactivityTimeoutUnit} of inactivity`;
      case 'manual':
        return 'Manual cleanup only';
      default:
        return 'Custom cleanup policy';
    }
  };

  const renderExerciseContent =  () => {
    const exercise = getActiveExercise();
    if (!exercise) return null;
    if (exercise.type === 'lab') {
      return (
        <LabExerciseContent
          exercise={exercise}
          labExercise={labExercises[exercise.id]}
          isLoading={isLoadingLabExercises}
          onEdit={() => handleEditLabExercise(exercise.id)}
          formatCleanupPolicy={formatCleanupPolicy}
          extractFileName={extractFile_Name}
          canEdit={canEditContent()}
          user={currentUser}
          labId={sliceId}
        />
      );
    } 
    else if (exercise.type === 'questions') {
      return (
        <QuizExerciseContent
          exercise={exercise}
          quizExercise={quizExercises[exercise.id]}
          isLoading={isLoadingQuizExercises}
          onEdit={() => handleEditQuizExercise(exercise.id)}
          canEdit={canEditContent()}
        />
      );
    }

    return null;
  };
  // Main loading state
  if (isLoadingModules) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 text-primary-400 animate-spin mr-3" />
        <span className="text-gray-300 text-lg">Loading modules...</span>
      </div>
    );
  }
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          {error}
        </h2>
        <p className="text-gray-400 text-center max-w-md">
          There was a problem loading the module content. Please try again later or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/20 text-emerald-300' : 
          'bg-red-500/20 border border-red-500/20 text-red-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">
          <GradientText>Learning Modules</GradientText>
        </h1>
        {canEditContent() && (
          <button 
            onClick={handleAddModule}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Modules Sidebar */}
        <div className="lg:col-span-1">
          <ModuleList
            modules={modules}
            activeModule={activeModule}
            activeExercise={activeExercise}
            onModuleClick={handleModuleClick}
            onExerciseClick={handleExerciseClick}
            onAddModule={handleAddModule}
            onEditModule={handleEditModule}
            onDeleteModule={handleDeleteModule}
            onAddExercise={handleAddExercise}
            onEditExercise={handleEditExercise}
            onDeleteExercise={handleDeleteExercise}
            canEdit={canEditContent()}
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeExercise ? (
            <div className="glass-panel">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  <GradientText>
                    {getActiveExercise()?.title || 'Exercise'}
                  </GradientText>
                </h2>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{getActiveExercise()?.duration || 0} minutes</span>
                </div>
              </div>

              {renderExerciseContent()}
            </div>
          ) : activeModule ? (
            <div className="glass-panel">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  <GradientText>
                    {getActiveModule()?.title || 'Module Overview'}
                  </GradientText>
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{getActiveModule()?.totalduration || 0} minutes</span>
                  </div>
                  {canEditContent() && (
                    <div className="flex space-x-2">
                      <button
                      onClick={() => {
                      handleEditModule(getActiveModule()!);
                      }}  
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-primary-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(activeModule)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-dark-300/50 rounded-lg">
                  <p className="text-gray-300">{getActiveModule()?.description}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Exercises</h3>
                    {canEditContent() && (
                      <button
                        onClick={() => handleAddExercise(activeModule)}
                        className="btn-secondary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {getActiveModule()?.exercises?.length === 0 ? (
                      <div className="p-6 bg-dark-300/50 rounded-lg text-center">
                        <FileText className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">No exercises available for this module</p>
                        {canEditContent() && (
                          <button
                            onClick={() => handleAddExercise(activeModule)}
                            className="mt-2 text-primary-400 hover:text-primary-300 flex items-center justify-center mx-auto"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add your first exercise
                          </button>
                        )}
                      </div>
                    ) : (
                      getUniqueExercises( getActiveModule()?.exercises)?.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center space-x-3 flex-1 cursor-pointer"
                              onClick={() => handleExerciseClick(exercise.id)}
                            >
                              {exercise.type === 'lab' ? (
                                <BookOpen className="h-5 w-5 text-primary-400" />
                              ) : (
                                <Award className="h-5 w-5 text-primary-400" />
                              )}
                              <div>
                                <h4 className="font-medium text-gray-200">{exercise.title}</h4>
                                <p className="text-sm text-gray-400">{exercise.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1 text-gray-400">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{exercise.duration} min</span>
                              </div>
                              {canEditContent() && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditExercise(activeModule, exercise)}
                                    className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                  >
                                    <Pencil className="h-4 w-4 text-primary-400" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExercise(activeModule, exercise.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                  </button>
                                  <button
                                    onClick={() => handleExerciseClick(exercise.id)}
                                    className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                  >
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  </button>
                                </div>
                              )}
                              {!canEditContent() && (
                                <button
                                  onClick={() => handleExerciseClick(exercise.id)}
                                  className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                                >
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel flex flex-col items-center justify-center py-12">
              <Layers className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                {modules.length === 0 ? 'No Modules Available' : 'Select a Module'}
              </h2>
              <p className="text-gray-400 text-center max-w-md mb-6">
                {modules.length === 0 
                  ? 'This cloud slice doesn\'t have any learning modules yet. Click the button below to create your first module.'
                  : 'Choose a module from the sidebar to view its content and exercises.'}
              </p>
              {modules.length === 0 && canEditContent() && (
                <button 
                  onClick={handleAddModule}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Module
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CRUD Modals */}
      <EditModuleModal
        isOpen={isEditModuleModalOpen}
        onClose={() => setIsEditModuleModalOpen(false)}
        module={selectedModule}
        onSave={handleSaveModule}
        labId={sliceId || ''}
      />

      <EditExerciseModal
        isOpen={isEditExerciseModalOpen}
        onClose={() => setIsEditExerciseModalOpen(false)}
        moduleId={activeModule || ''}
        exercise={selectedExercise}
        onSave={handleSaveExercise}
      />

      <EditLabExerciseModal
        isOpen={isEditLabExerciseModalOpen}
        onClose={() => setIsEditLabExerciseModalOpen(false)}
        exerciseId={selectedExercise?.id || ''}
        labExercise={selectedLabExercise}
        sliceDetails = {sliceDetails}
        onSave={handleSaveLabExercise}
      />

      <EditQuizExerciseModal
        isOpen={isEditQuizExerciseModalOpen}
        onClose={() => setIsEditQuizExerciseModalOpen(false)}
        exerciseId={selectedExercise?.id || ''}
        quizExercise={selectedQuizExercise}
        onSave={handleSaveQuizExercise}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteType === 'module' ? 'Module' : 
                deleteType === 'exercise' ? 'Exercise' : 
                deleteType === 'labExercise' ? 'Lab Content' : 'Quiz'}`}
        message={`Are you sure you want to delete this ${deleteType === 'module' ? 'module' : 
                deleteType === 'exercise' ? 'exercise' : 
                deleteType === 'labExercise' ? 'lab content' : 'quiz'}? This action cannot be undone.`}
        isDeleting={isDeleting}
        moduleId={deleteItemId}
      />
    </div>
  );
};