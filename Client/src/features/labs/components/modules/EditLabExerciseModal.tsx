import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  AlertCircle, 
  Loader, 
  Link as LinkIcon, 
  Key, 
  User, 
  Lock, 
  Calendar, 
  ChevronDown, 
  Search,
  Check,
  Upload,
  File
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { LabExercise, CleanupPolicy, Service } from '../../types/modules';
import axios from 'axios';

interface EditLabExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  labExercise: LabExercise | null;
  onSave: (exerciseId: string, labExercise: LabExercise) => void;
  sliceDetails:any;
}

export const EditLabExerciseModal: React.FC<EditLabExerciseModalProps> = ({
  isOpen,
  onClose,
  exerciseId,
  labExercise,
  sliceDetails,
  onSave
}) => {

  

  const [formData, setFormData] = useState<LabExercise>({
    id: '',
    exercise_id: '',
    instructions: '',
    files: [],
    services: [],
    credentials: {
      username: '',
      password: ''
    },
  });
  
  // New fields for adding a new exercise
  const [exerciseTitle, setExerciseTitle] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState(30);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [awsServiceCategories, setAvailableCategories] = useState<Record<string, Service[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch AWS service categories
  useEffect(() => {
    const fetchAwsServiceCategories = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getAwsServices`);
        if (response.data.success) {
          const categories: Record<string, Service[]> = {};
          
          response.data.data.forEach((service: any) => {
            if (!categories[service.category]) {
              categories[service.category] = [];
            }
            
            categories[service.category].push({
              name: service.services,
              category: service.category,
              description: service.description,
              services_prefix:service.services_prefix
            });
          });
          setAvailableCategories(categories);
        }
      } catch (error) {
        console.error('Failed to fetch AWS services:', error);
        setError('Failed to load service categories');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      fetchAwsServiceCategories();
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) {
      if (labExercise) {
        // If we have an existing lab exercise, use its data
        setFormData({ 
          ...labExercise,
          credentials:{
            username:sliceDetails?.username || 'null',
            password:sliceDetails?.password || 'null'
          },
          cleanupPolicy: labExercise.cleanuppolicy 
        });
        // Don't set title/description for existing exercises
      } else {
        // Otherwise initialize with default values
        setFormData({
          id: `lab-${Date.now()}`,
          exercise_id: exerciseId,
          instructions: '',
          files: [],
          services: [],
          credentials: {
            username: '',
            password: ''
          },
          cleanupPolicy: {
            enabled: false,
            type: 'auto',
            duration: 60,
            durationUnit: 'minutes'
          }
        });
        // Reset title/description for new exercises
        setExerciseTitle('');
        setExerciseDescription('');
        setExerciseDuration(30);
      }
    }
  }, [labExercise, exerciseId, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (filePath: string) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files?.filter(file => file !== filePath) || []
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => {
      const services = prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service];
      return { ...prev, services };
    });
  };
  const handleCredentialsChange = (field: keyof LabExercise['credentials'], value: string) => {
    setFormData({
      ...formData,
      credentials: {
        ...formData.credentials,
        [field]: value
      }
    });
  };

  const handleCleanupPolicyChange = (field: keyof CleanupPolicy, value: any) => {
    if (!formData.cleanupPolicy) return;
    
    setFormData({
      ...formData,
      cleanupPolicy: {
        ...formData.cleanupPolicy,
        [field]: value
      }
    });
  };

  const filteredCategories = Object.keys(awsServiceCategories || {}).filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const filteredServices = selectedCategory && awsServiceCategories && awsServiceCategories[selectedCategory]
    ? awsServiceCategories[selectedCategory].filter(service =>
        service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(serviceSearch.toLowerCase()))
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setApiError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!formData.instructions.trim()) {
        throw new Error('Instructions are required');
      }
      
      // For new exercises, validate title
      if (!labExercise && !exerciseTitle.trim()) {
        throw new Error('Exercise title is required');
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all uploaded files
      uploadedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });
      
      // Add other form data
      formDataToSend.append('instructions', formData.instructions);
      formDataToSend.append('services', JSON.stringify(formData.services));
      formDataToSend.append('credentials', JSON.stringify(formData.credentials));
      formDataToSend.append('cleanupPolicy', JSON.stringify(formData.cleanupPolicy));
      
      // Add existing files if we're updating
      if (labExercise && formData.files) {
        formDataToSend.append('existingFiles', JSON.stringify(formData.files));
      }
      
      try {
        // Determine if this is an update or create operation
        if (labExercise) {
          // Update existing lab exercise
          formDataToSend.append('exerciseId', exerciseId);
          formDataToSend.append('labExerciseId', labExercise.id);
          
          const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateLabExercise`, 
            formDataToSend, 
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          if (response.data.success) {
            setSuccess('Lab exercise updated successfully');
            
            // Get the updated files list from the response
            const updatedLabExercise = {
              ...formData,
              files: response.data.data?.files || formData.files
            };
            
            // Save lab exercise
            onSave(exerciseId, updatedLabExercise);
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setApiError(response.data.message || 'Failed to update lab exercise');
          }
        } else {
          // Create new exercise and lab exercise in a single request
          setIsLoading(true);
          
          // Add exercise details to the form data
          formDataToSend.append('title', exerciseTitle);
          formDataToSend.append('description', exerciseDescription);
          formDataToSend.append('type', 'lab');
          formDataToSend.append('order', '1'); // Default order
          formDataToSend.append('duration', exerciseDuration.toString());
          formDataToSend.append('exerciseId', exerciseId); // Extract module ID from exerciseId
          
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/createLabExercise`, 
            formDataToSend,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          if (response.data.success) {
            setSuccess('Lab exercise created successfully');
            
            // Get the new exercise ID from the response
            const newExerciseId = response.data.data.id;
            
            // Save lab exercise with the ID from the response
            const savedLabExercise = {
              ...formData,
              id: response.data.data?.labId || formData.id,
              exercise_id: newExerciseId,
              files: response.data.data?.files || []
            };
            
            onSave(newExerciseId, savedLabExercise);
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setApiError(response.data.message || 'Failed to create lab exercise');
          }
        }
      } catch (err: any) {
        setApiError(err.response?.data?.message || 'An error occurred while saving the lab exercise');
      } finally {
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-dark-200 rounded-lg p-8 flex flex-col items-center">
          <Loader className="h-8 w-8 text-primary-400 animate-spin mb-4" />
          <p className="text-gray-300">Loading service categories...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>{labExercise ? 'Edit Lab Exercise' : 'Add Lab Exercise'}</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Only show title, description, and duration fields for new exercises */}
          {!labExercise && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exercise Title
                </label>
                <input
                  type="text"
                  value={exerciseTitle}
                  onChange={(e) => setExerciseTitle(e.target.value)}
                  placeholder="Enter exercise title"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exercise Description
                </label>
                <textarea
                  value={exerciseDescription}
                  onChange={(e) => setExerciseDescription(e.target.value)}
                  placeholder="Enter exercise description"
                  rows={2}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={exerciseDuration}
                  onChange={(e) => setExerciseDuration(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Resources
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload Resources
              </button>
            </div>
            
            {/* File upload area */}
            <div 
              className="border-2 border-dashed border-primary-500/20 rounded-lg p-6 mb-4 text-center cursor-pointer hover:border-primary-500/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-primary-400/50 mx-auto mb-2" />
              <p className="text-gray-400">Click to browse or drag and drop files here</p>
              <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG</p>
            </div>
            
            {/* Uploaded files list */}
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-primary-400 mr-2" />
                    <span className="text-sm text-gray-300 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Existing files (if editing) */}
            {formData && formData.files && formData.files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Existing Resources:</h4>
                <div className="space-y-2">
                  {formData.files.map((filePath, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
                      <div className="flex items-center flex-1 mr-2 overflow-hidden">
                        <File className="h-5 w-5 text-primary-400 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{filePath}</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <a 
                          href={`http://localhost:3006/uploads/${filePath}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <LinkIcon className="h-4 w-4 text-primary-400" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingFile(filePath)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cleanup Policy Section */}
          <div className="p-4 bg-dark-300/50 rounded-lg border border-primary-500/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-300">Cleanup Policy</h4>
              <div className="flex items-center">
                <span className="text-sm text-gray-400 mr-2">Enable</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.cleanupPolicy?.enabled || false}
                    onChange={(e) => handleCleanupPolicyChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            {formData.cleanupPolicy?.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cleanup Policy Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { value: 'auto', label: 'Auto delete after duration' },
                      { value: 'scheduled', label: 'Delete at specific time' },
                      { value: 'inactivity', label: 'Delete after inactivity' },
                      { value: 'manual', label: 'Manual cleanup only' }
                    ].map(policy => (
                      <label 
                        key={policy.value} 
                        className="flex items-center space-x-2 p-3 bg-dark-400/50 rounded-lg cursor-pointer hover:bg-dark-400/70 transition-colors"
                      >
                        <input
                          type="radio"
                          name="cleanup-policy-type"
                          value={policy.value}
                          checked={formData.cleanupPolicy?.type === policy.value}
                          onChange={() => handleCleanupPolicyChange('type', policy.value)}
                          className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
                        />
                        <span className="text-gray-300">{policy.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Conditional fields based on policy type */}
                {formData.cleanupPolicy?.type === 'auto' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Duration
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.cleanupPolicy?.duration || 60}
                        onChange={(e) => handleCleanupPolicyChange('duration', parseInt(e.target.value) || 60)}
                        className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Unit
                      </label>
                      <select
                        value={formData.cleanupPolicy?.durationUnit || 'minutes'}
                        onChange={(e) => handleCleanupPolicyChange('durationUnit', e.target.value)}
                        className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      >
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.cleanupPolicy?.type === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scheduled Time
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={formData.cleanupPolicy?.scheduledTime || ''}
                        onChange={(e) => handleCleanupPolicyChange('scheduledTime', e.target.value)}
                        className="w-full px-4 py-2 pl-10 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      />
                      <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                )}

                {formData.cleanupPolicy?.type === 'inactivity' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Inactivity Timeout
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.cleanupPolicy?.inactivityTimeout || 30}
                        onChange={(e) => handleCleanupPolicyChange('inactivityTimeout', parseInt(e.target.value) || 30)}
                        className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Unit
                      </label>
                      <select
                        value={formData.cleanupPolicy?.inactivityTimeoutUnit || 'minutes'}
                        onChange={(e) => handleCleanupPolicyChange('inactivityTimeoutUnit', e.target.value)}
                        className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AWS Services Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-4">AWS Services</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Service Category Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Service Category
                </label>
                <div className="relative">
                  <div 
                    className="w-full flex items-center justify-between p-3 bg-dark-400/50 
                             border border-primary-500/20 hover:border-primary-500/40 
                             rounded-lg cursor-pointer transition-colors"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <span className="text-gray-300">
                      {selectedCategory || 'Select a category'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                      showCategoryDropdown ? 'transform rotate-180' : ''
                    }`} />
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-dark-200 rounded-lg border 
                                  border-primary-500/20 shadow-lg max-h-80 overflow-y-auto">
                      <div className="p-2 sticky top-0 bg-dark-200 border-b border-primary-500/10">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full px-3 py-2 pl-9 bg-dark-400/50 border border-primary-500/20 
                                     rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                          />
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        {filteredCategories.map(category => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowCategoryDropdown(false);
                              setShowServiceDropdown(true);
                            }}
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

              {/* Service Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Services
                </label>
                <div className="relative">
                  <div 
                    className="w-full flex items-center justify-between p-3 bg-dark-400/50 
                             border border-primary-500/20 hover:border-primary-500/40 
                             rounded-lg cursor-pointer transition-colors"
                    onClick={() => selectedCategory && setShowServiceDropdown(!showServiceDropdown)}
                  >
                    <span className="text-gray-300">
                      {formData.services.length > 0 
                        ? `${formData.services.length} service(s) selected` 
                        : 'Select services'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                      showServiceDropdown ? 'transform rotate-180' : ''
                    }`} />
                  </div>

                  {showServiceDropdown && selectedCategory && (
                    <div className="absolute z-50 w-full mt-2 bg-dark-200 rounded-lg border 
                                  border-primary-500/20 shadow-lg max-h-80 overflow-y-auto">
                      <div className="p-2 sticky top-0 bg-dark-200 border-b border-primary-500/10">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search services..."
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            className="w-full px-3 py-2 pl-9 bg-dark-400/50 border border-primary-500/20 
                                     rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                          />
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        {Array.isArray(filteredServices) && filteredServices.length > 0 ? (
                          filteredServices.map(service => (
                            <label
                              key={service.name}
                              className="flex items-center space-x-3 p-3 hover:bg-dark-300/50 
                                       cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.services.includes(service.name)}
                                onChange={() => handleServiceToggle(service?.services_prefix)}
                                className="form-checkbox h-4 w-4 text-primary-500 rounded 
                                         border-gray-500/20 focus:ring-primary-500"
                              />
                              <div>
                                <p className="font-medium text-gray-200">{service.name}</p>
                                <p className="text-sm text-gray-400">{service.description}</p>
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="p-3 text-gray-400 text-center">
                            No services found in this category
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Services Display */}
            {formData.services.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Services:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.services.map(service => (
                    <div
                      key={service}
                      className="flex items-center px-3 py-1 bg-primary-500/10 text-primary-300
                               rounded-full text-sm"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => handleServiceToggle(service)}
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

          {/* AWS Console Credentials */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-4">AWS Console Credentials</h3>
            
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.credentials.username}
                    onChange={(e) => handleCredentialsChange('username', e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.credentials.password}
                    onChange={(e) => handleCredentialsChange('password', e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
              </div>
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

          {apiError && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{apiError}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-200">{success}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </span>
              ) : (
                'Save Lab Exercise'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}