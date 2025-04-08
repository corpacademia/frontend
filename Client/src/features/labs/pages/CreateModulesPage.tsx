import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Trash2, 
  BookOpen, 
  HelpCircle, 
  Clock, 
  Save,
  Loader,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  X
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  options: Option[];
  correctAnswer: string;
}

interface LabExercise {
  id: string;
  title: string;
  duration: number;
  instructions: string;
  services?: string[];
}

interface Exercise {
  id: string;
  type: 'lab' | 'questions';
  labExercise?: LabExercise;
  questions?: Question[];
}

interface Module {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
}

interface Service {
  name: string;
  category: string;
  description: string;
}

export const CreateModulesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const labConfig = location.state?.labConfig;
  
  const [modules, setModules] = useState<Module[]>([{
    id: `module-${Date.now()}`,
    name: '',
    description: '',
    exercises: []
  }]);
  
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Service selection state
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Record<string, Service[]>>({});
  const [showCategoryDropdowns, setShowCategoryDropdowns] = useState<Record<string, boolean>>({});
  const [showServiceDropdowns, setShowServiceDropdowns] = useState<Record<string, boolean>>({});
  const [categorySearches, setCategorySearches] = useState<Record<string, string>>({});
  const [serviceSearches, setServiceSearches] = useState<Record<string, string>>({});
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string | null>>({});

  useEffect(() => {
    // Check if we have lab config from previous step
    if (!labConfig) {
      setNotification({
        type: 'error',
        message: 'No lab configuration found. Please go back and configure your lab first.'
      });
    } else if (labConfig.services && Array.isArray(labConfig.services)) {
      // Convert service names to service objects
      const services = labConfig.services.map((serviceName: string) => ({
        name: serviceName,
        category: 'AWS Service',
        description: 'AWS Cloud Service'
      }));
      setSelectedServices(services);
    }

    // Fetch AWS service categories
    const fetchAwsServiceCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/cloud_slice_ms/getAwsServices');
        if (response.data.success) {
          const categories: Record<string, Service[]> = {};
          
          response.data.data.forEach((service: any) => {
            if (!categories[service.category]) {
              categories[service.category] = [];
            }
            
            categories[service.category].push({
              name: service.services,
              category: service.category,
              description: service.description
            });
          });
          
          setAvailableCategories(categories);
        }
      } catch (error) {
        console.error('Failed to fetch AWS services:', error);
      }
    };
    
    fetchAwsServiceCategories();
  }, [labConfig]);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addModule = () => {
    const newModule: Module = {
      id: generateId('module'),
      name: '',
      description: '',
      exercises: []
    };
    setModules([...modules, newModule]);
    setCurrentModuleIndex(modules.length);
  };

  const removeModule = (index: number) => {
    if (modules.length <= 1) return;
    const newModules = [...modules];
    newModules.splice(index, 1);
    setModules(newModules);
    if (currentModuleIndex >= newModules.length) {
      setCurrentModuleIndex(newModules.length - 1);
    }
  };

  const updateModule = (index: number, field: keyof Module, value: string) => {
    const newModules = [...modules];
    newModules[index] = {
      ...newModules[index],
      [field]: value
    };
    setModules(newModules);
  };

  const addExercise = (moduleIndex: number, type: 'lab' | 'questions') => {
    const newModules = [...modules];
    const exerciseId = generateId('exercise');
    
    let newExercise: Exercise;
    
    if (type === 'lab') {
      newExercise = {
        id: exerciseId,
        type,
        labExercise: {
          id: generateId('lab'),
          title: '',
          duration: 30,
          instructions: '',
          services: []
        }
      };
    } else {
      newExercise = {
        id: exerciseId,
        type,
        questions: [{
          id: generateId('question'),
          title: '',
          description: '',
          options: [
            { id: generateId('option'), text: '' },
            { id: generateId('option'), text: '' }
          ],
          correctAnswer: ''
        }]
      };
    }
    
    newModules[moduleIndex].exercises.push(newExercise);
    setModules(newModules);
    
    // Auto-expand the new exercise
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: true
    }));
  };

  const removeExercise = (moduleIndex: number, exerciseIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].exercises.splice(exerciseIndex, 1);
    setModules(newModules);
  };

  const updateLabExercise = (
    moduleIndex: number, 
    exerciseIndex: number, 
    field: keyof LabExercise, 
    value: string | number | string[]
  ) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'lab' && exercise.labExercise) {
      exercise.labExercise = {
        ...exercise.labExercise,
        [field]: value
      };
      setModules(newModules);
    }
  };

  const addQuestion = (moduleIndex: number, exerciseIndex: number) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'questions' && exercise.questions) {
      exercise.questions.push({
        id: generateId('question'),
        title: '',
        description: '',
        options: [
          { id: generateId('option'), text: '' },
          { id: generateId('option'), text: '' }
        ],
        correctAnswer: ''
      });
      setModules(newModules);
    }
  };

  const removeQuestion = (moduleIndex: number, exerciseIndex: number, questionIndex: number) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'questions' && exercise.questions) {
      exercise.questions.splice(questionIndex, 1);
      setModules(newModules);
    }
  };

  const updateQuestion = (
    moduleIndex: number,
    exerciseIndex: number,
    questionIndex: number,
    field: keyof Question,
    value: string
  ) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'questions' && exercise.questions) {
      exercise.questions[questionIndex] = {
        ...exercise.questions[questionIndex],
        [field]: value
      };
      setModules(newModules);
    }
  };

  const addOption = (moduleIndex: number, exerciseIndex: number, questionIndex: number) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'questions' && exercise.questions) {
      exercise.questions[questionIndex].options.push({
        id: generateId('option'),
        text: ''
      });
      setModules(newModules);
    }
  };

  const removeOption = (
    moduleIndex: number,
    exerciseIndex: number,
    questionIndex: number,
    optionIndex: number
  ) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'questions' && exercise.questions) {
      const question = exercise.questions[questionIndex];
      
      // Don't allow removing if only 2 options remain
      if (question.options.length <= 2) return;
      
      // If removing the correct answer, reset it
      const removedOption = question.options[optionIndex];
      if (removedOption.id === question.correctAnswer) {
        question.correctAnswer = '';
      }
      
      question.options.splice(optionIndex, 1);
      setModules(newModules);
    }
  };

  const updateOption = (
    moduleIndex: number,
    exerciseIndex: number,
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'questions' && exercise.questions) {
      exercise.questions[questionIndex].options[optionIndex].text = value;
      setModules(newModules);
    }
  };

  const setCorrectAnswer = (
    moduleIndex: number,
    exerciseIndex: number,
    questionIndex: number,
    optionId: string
  ) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'questions' && exercise.questions) {
      exercise.questions[questionIndex].correctAnswer = optionId;
      setModules(newModules);
    }
  };

  const toggleExerciseExpansion = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const toggleCategoryDropdown = (exerciseId: string) => {
    setShowCategoryDropdowns(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
    
    // Close service dropdown if category dropdown is being opened
    if (!showCategoryDropdowns[exerciseId]) {
      setShowServiceDropdowns(prev => ({
        ...prev,
        [exerciseId]: false
      }));
    }
  };

  const toggleServiceDropdown = (exerciseId: string) => {
    setShowServiceDropdowns(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const updateCategorySearch = (exerciseId: string, value: string) => {
    setCategorySearches(prev => ({
      ...prev,
      [exerciseId]: value
    }));
  };

  const updateServiceSearch = (exerciseId: string, value: string) => {
    setServiceSearches(prev => ({
      ...prev,
      [exerciseId]: value
    }));
  };

  const selectCategory = (exerciseId: string, category: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [exerciseId]: category
    }));
    
    setShowCategoryDropdowns(prev => ({
      ...prev,
      [exerciseId]: false
    }));
    
    setShowServiceDropdowns(prev => ({
      ...prev,
      [exerciseId]: true
    }));
  };

  const toggleServiceForExercise = (
    moduleIndex: number,
    exerciseIndex: number,
    serviceName: string
  ) => {
    const newModules = [...modules];
    const exercise = newModules[moduleIndex].exercises[exerciseIndex];
    
    if (exercise.type === 'lab' && exercise.labExercise) {
      const services = exercise.labExercise.services || [];
      
      if (services.includes(serviceName)) {
        exercise.labExercise.services = services.filter(s => s !== serviceName);
      } else {
        exercise.labExercise.services = [...services, serviceName];
      }
      
      setModules(newModules);
    }
  };

  const validateModules = (): boolean => {
    // Basic validation
    for (const module of modules) {
      if (!module.name.trim()) {
        setNotification({
          type: 'error',
          message: 'All modules must have a name'
        });
        return false;
      }
      
      for (const exercise of module.exercises) {
        if (exercise.type === 'lab') {
          if (!exercise.labExercise?.title.trim()) {
            setNotification({
              type: 'error',
              message: 'All lab exercises must have a title'
            });
            return false;
          }
        } else if (exercise.type === 'questions') {
          for (const question of exercise.questions || []) {
            if (!question.title.trim()) {
              setNotification({
                type: 'error',
                message: 'All questions must have a title'
              });
              return false;
            }
            
            if (question.options.length < 2) {
              setNotification({
                type: 'error',
                message: 'All questions must have at least 2 options'
              });
              return false;
            }
            
            if (!question.correctAnswer) {
              setNotification({
                type: 'error',
                message: 'All questions must have a correct answer selected'
              });
              return false;
            }
            
            for (const option of question.options) {
              if (!option.text.trim()) {
                setNotification({
                  type: 'error',
                  message: 'All options must have text'
                });
                return false;
              }
            }
          }
        }
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateModules()) return;
    
    setIsSubmitting(true);
    setNotification(null);
    
    try {
      // Get the current user
      const userResponse = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      const userId = userResponse.data.user.id;
      
      // Prepare data for submission
      const submissionData = {
        labConfig,
        modules,
        createdBy: userId
      };
      
      // Submit to backend
      console.log(submissionData)
      const response = await axios.post(
        'http://localhost:3000/api/v1/cloud_slice_ms/createLabModules', 
        submissionData
      );
      
      if (response.data.success) {
        setNotification({
          type: 'success',
          message: 'Lab modules created successfully!'
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/dashboard/labs/cloud-vms');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to create lab modules');
      }
    } catch (error: any) {
      console.error('Error creating modules:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create lab modules'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredCategories = (exerciseId: string) => {
    const search = categorySearches[exerciseId] || '';
    return Object.keys(availableCategories).filter(category =>
      category.toLowerCase().includes(search.toLowerCase())
    );
  };

  const getFilteredServices = (exerciseId: string) => {
    const search = serviceSearches[exerciseId] || '';
    const category = selectedCategories[exerciseId];
    
    if (!category) return [];
    
    return availableCategories[category].filter(service =>
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Create Lab Modules</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Define learning modules and exercises for your cloud slice lab
          </p>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <Loader className="animate-spin h-4 w-4 mr-2" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Save Lab Modules
            </span>
          )}
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20' 
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span className={notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'}>
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {/* Lab Configuration Summary */}
      {labConfig && (
        <div className="glass-panel">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Lab Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Lab Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Title:</span>
                  <span className="text-gray-200">{labConfig.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cloud Provider:</span>
                  <span className="text-gray-200">{labConfig.cloudProvider}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Services</h4>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map(service => (
                  <div
                    key={service.name}
                    className="flex items-center px-3 py-1 bg-primary-500/10 text-primary-300
                             rounded-full text-sm"
                  >
                    {service.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {modules.map((module, index) => (
          <button
            key={module.id}
            onClick={() => setCurrentModuleIndex(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              currentModuleIndex === index
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'bg-dark-300/50 text-gray-400 hover:bg-dark-300 hover:text-gray-300'
            }`}
          >
            {module.name || `Module ${index + 1}`}
          </button>
        ))}
        <button
          onClick={addModule}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-300/50 text-gray-400 
                   hover:bg-dark-300 hover:text-gray-300 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Module
        </button>
      </div>

      {/* Current Module */}
      <div className="glass-panel">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>
              {modules[currentModuleIndex].name || `Module ${currentModuleIndex + 1}`}
            </GradientText>
          </h2>
          {modules.length > 1 && (
            <button
              onClick={() => removeModule(currentModuleIndex)}
              className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Module Name
            </label>
            <input
              type="text"
              value={modules[currentModuleIndex].name}
              onChange={(e) => updateModule(currentModuleIndex, 'name', e.target.value)}
              placeholder="Enter module name"
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Module Description
            </label>
            <textarea
              value={modules[currentModuleIndex].description}
              onChange={(e) => updateModule(currentModuleIndex, 'description', e.target.value)}
              placeholder="Describe what students will learn in this module"
              rows={3}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-200">Exercises</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => addExercise(currentModuleIndex, 'lab')}
                  className="btn-secondary text-sm py-1.5"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Add Lab Exercise
                </button>
                <button
                  onClick={() => addExercise(currentModuleIndex, 'questions')}
                  className="btn-secondary text-sm py-1.5"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Add Practice Questions
                </button>
              </div>
            </div>

            {modules[currentModuleIndex].exercises.length === 0 ? (
              <div className="p-6 bg-dark-300/30 rounded-lg border border-primary-500/10 text-center">
                <p className="text-gray-400">
                  No exercises added yet. Add a lab exercise or practice questions to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules[currentModuleIndex].exercises.map((exercise, exerciseIndex) => (
                  <div 
                    key={exercise.id}
                    className="bg-dark-300/50 rounded-lg border border-primary-500/10 overflow-hidden"
                  >
                    {/* Exercise Header */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleExerciseExpansion(exercise.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {exercise.type === 'lab' ? (
                          <BookOpen className="h-5 w-5 text-primary-400" />
                        ) : (
                          <HelpCircle className="h-5 w-5 text-secondary-400" />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-200">
                            {exercise.type === 'lab' 
                              ? (exercise.labExercise?.title || 'Lab Exercise') 
                              : 'Practice Questions'
                            }
                          </h4>
                          <p className="text-sm text-gray-400">
                            {exercise.type === 'lab' 
                              ? `${exercise.labExercise?.duration || 0} minutes` 
                              : `${exercise.questions?.length || 0} questions`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeExercise(currentModuleIndex, exerciseIndex);
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {expandedExercises[exercise.id] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Exercise Content */}
                    {expandedExercises[exercise.id] && (
                      <div className="p-4 border-t border-primary-500/10">
                        {exercise.type === 'lab' ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Lab Title
                              </label>
                              <input
                                type="text"
                                value={exercise.labExercise?.title || ''}
                                onChange={(e) => updateLabExercise(
                                  currentModuleIndex, 
                                  exerciseIndex, 
                                  'title', 
                                  e.target.value
                                )}
                                placeholder="Enter lab title"
                                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Estimated Duration (minutes)
                              </label>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-primary-400" />
                                <input
                                  type="number"
                                  min="1"
                                  value={exercise.labExercise?.duration || 30}
                                  onChange={(e) => updateLabExercise(
                                    currentModuleIndex, 
                                    exerciseIndex, 
                                    'duration', 
                                    parseInt(e.target.value) || 30
                                  )}
                                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Service Selection for this Lab Exercise */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-gray-300">AWS Services for this Exercise</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Category Dropdown */}
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-300">
                                    Service Category
                                  </label>
                                  <div className="relative">
                                    <div 
                                      className="w-full flex items-center justify-between p-3 bg-dark-400/50 
                                               border border-primary-500/20 hover:border-primary-500/40 
                                               rounded-lg cursor-pointer transition-colors"
                                      onClick={() => toggleCategoryDropdown(exercise.id)}
                                    >
                                      <span className="text-gray-300">
                                        {selectedCategories[exercise.id] || 'Select a category'}
                                      </span>
                                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                                        showCategoryDropdowns[exercise.id] ? 'transform rotate-180' : ''
                                      }`} />
                                    </div>

                                    {showCategoryDropdowns[exercise.id] && (
                                      <div className="absolute z-50 w-full mt-2 bg-dark-200 rounded-lg border 
                                                    border-primary-500/20 shadow-lg max-h-80 overflow-y-auto">
                                        <div className="p-2 sticky top-0 bg-dark-200 border-b border-primary-500/10">
                                          <div className="relative">
                                            <input
                                              type="text"
                                              placeholder="Search categories..."
                                              value={categorySearches[exercise.id] || ''}
                                              onChange={(e) => updateCategorySearch(exercise.id, e.target.value)}
                                              className="w-full px-3 py-2 pl-9 bg-dark-400/50 border border-primary-500/20 
                                                       rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                                            />
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                          </div>
                                        </div>
                                        <div>
                                          {getFilteredCategories(exercise.id).map(category => (
                                            <button
                                              key={category}
                                              onClick={() => selectCategory(exercise.id, category)}
                                              className="w-full text-left px-4 py-2 hover:bg-dark-300/50 transition-colors"
                                            >
                                              <p className="text-gray-200">{category}</p>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Services Dropdown */}
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-300">
                                    Services
                                  </label>
                                  <div className="relative">
                                    <div 
                                      className="w-full flex items-center justify-between p-3 bg-dark-400/50 
                                               border border-primary-500/20 hover:border-primary-500/40 
                                               rounded-lg cursor-pointer transition-colors"
                                      onClick={() => selectedCategories[exercise.id] && toggleServiceDropdown(exercise.id)}
                                    >
                                      <span className="text-gray-300">
                                        {exercise.labExercise?.services?.length 
                                          ? `${exercise.labExercise.services.length} service(s) selected` 
                                          : 'Select services'}
                                      </span>
                                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                                        showServiceDropdowns[exercise.id] ? 'transform rotate-180' : ''
                                      }`} />
                                    </div>

                                    {showServiceDropdowns[exercise.id] && selectedCategories[exercise.id] && (
                                      <div className="absolute z-50 w-full mt-2 bg-dark-200 rounded-lg border 
                                                    border-primary-500/20 shadow-lg max-h-80 overflow-y-auto">
                                        <div className="p-2 sticky top-0 bg-dark-200 border-b border-primary-500/10">
                                          <div className="relative">
                                            <input
                                              type="text"
                                              placeholder="Search services..."
                                              value={serviceSearches[exercise.id] || ''}
                                              onChange={(e) => updateServiceSearch(exercise.id, e.target.value)}
                                              className="w-full px-3 py-2 pl-9 bg-dark-400/50 border border-primary-500/20 
                                                       rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                                            />
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                          </div>
                                        </div>
                                        <div>
                                          {getFilteredServices(exercise.id).map(service => (
                                            <label
                                              key={service.name}
                                              className="flex items-center space-x-3 p-3 hover:bg-dark-300/50 
                                                       cursor-pointer transition-colors"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={exercise.labExercise?.services?.includes(service.name) || false}
                                                onChange={() => toggleServiceForExercise(
                                                  currentModuleIndex,
                                                  exerciseIndex,
                                                  service.name
                                                )}
                                                className="form-checkbox h-4 w-4 text-primary-500 rounded 
                                                         border-gray-500/20 focus:ring-primary-500"
                                              />
                                              <div>
                                                <p className="font-medium text-gray-200">{service.name}</p>
                                                <p className="text-sm text-gray-400">{service.description}</p>
                                              </div>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Selected Services Display */}
                              {exercise.labExercise?.services && exercise.labExercise.services.length > 0 && (
                                <div className="mt-2">
                                  <h5 className="text-sm font-medium text-gray-400 mb-2">Selected Services:</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {exercise.labExercise.services.map(serviceName => (
                                      <div
                                        key={serviceName}
                                        className="flex items-center px-3 py-1 bg-primary-500/10 text-primary-300
                                                 rounded-full text-sm"
                                      >
                                        {serviceName}
                                        <button
                                          onClick={() => toggleServiceForExercise(
                                            currentModuleIndex,
                                            exerciseIndex,
                                            serviceName
                                          )}
                                          className="ml-2 hover:text-primary-400"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Lab Instructions
                              </label>
                              <textarea
                                value={exercise.labExercise?.instructions || ''}
                                onChange={(e) => updateLabExercise(
                                  currentModuleIndex, 
                                  exerciseIndex, 
                                  'instructions', 
                                  e.target.value
                                )}
                                placeholder="Provide step-by-step instructions for the lab exercise"
                                rows={6}
                                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {exercise.questions?.map((question, questionIndex) => (
                              <div 
                                key={question.id}
                                className="p-4 bg-dark-400/30 rounded-lg border border-primary-500/10"
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <h5 className="font-medium text-gray-200">
                                    Question {questionIndex + 1}
                                  </h5>
                                  {(exercise.questions?.length || 0) > 1 && (
                                    <button
                                      onClick={() => removeQuestion(
                                        currentModuleIndex, 
                                        exerciseIndex, 
                                        questionIndex
                                      )}
                                      className="p-1 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Question Title
                                    </label>
                                    <input
                                      type="text"
                                      value={question.title}
                                      onChange={(e) => updateQuestion(
                                        currentModuleIndex,
                                        exerciseIndex,
                                        questionIndex,
                                        'title',
                                        e.target.value
                                      )}
                                      placeholder="Enter question title"
                                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Question Description
                                    </label>
                                    <textarea
                                      value={question.description}
                                      onChange={(e) => updateQuestion(
                                        currentModuleIndex,
                                        exerciseIndex,
                                        questionIndex,
                                        'description',
                                        e.target.value
                                      )}
                                      placeholder="Provide additional context for the question"
                                      rows={3}
                                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-gray-300">
                                        Options
                                      </label>
                                      <button
                                        onClick={() => addOption(
                                          currentModuleIndex,
                                          exerciseIndex,
                                          questionIndex
                                        )}
                                        className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Option
                                      </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {question.options.map((option, optionIndex) => (
                                        <div 
                                          key={option.id}
                                          className="flex items-center space-x-2"
                                        >
                                          <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={question.correctAnswer === option.id}
                                            onChange={() => setCorrectAnswer(
                                              currentModuleIndex,
                                              exerciseIndex,
                                              questionIndex,
                                              option.id
                                            )}
                                            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
                                          />
                                          <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => updateOption(
                                              currentModuleIndex,
                                              exerciseIndex,
                                              questionIndex,
                                              optionIndex,
                                              e.target.value
                                            )}
                                            placeholder={`Option ${optionIndex + 1}`}
                                            className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
                                          />
                                          {question.options.length > 2 && (
                                            <button
                                              onClick={() => removeOption(
                                                currentModuleIndex,
                                                exerciseIndex,
                                                questionIndex,
                                                optionIndex
                                              )}
                                              className="p-1 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                                            >
                                              <Minus className="h-4 w-4" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            <button
                              onClick={() => addQuestion(currentModuleIndex, exerciseIndex)}
                              className="btn-secondary w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Question
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="glass-panel">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">AWS Services for this Lab</h3>
        <div className="space-y-4">
          <p className="text-gray-400">
            The following AWS services will be available in this lab environment:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedServices.map(service => (
              <div 
                key={service.name}
                className="p-4 bg-dark-300/50 rounded-lg border border-primary-500/10 flex items-start space-x-3"
              >
                <div>
                  <h4 className="font-medium text-gray-200">{service.name}</h4>
                  <p className="text-sm text-gray-400">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          Back to Lab Configuration
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <Loader className="animate-spin h-4 w-4 mr-2" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              Create Lab with Modules
            </span>
          )}
        </button>
      </div>
    </div>
  );
};