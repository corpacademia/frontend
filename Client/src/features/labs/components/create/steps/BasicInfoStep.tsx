import React, { useState } from 'react';
import { ChevronRight, Clock, FileText, Target, Users, Wrench, Monitor, Globe } from 'lucide-react';

interface BasicInfoStepProps {
  onNext: (data: any) => void;
  type: string;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ onNext, type }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    learningObjectives: '',
    prerequisites: '',
    targetAudience: '',
    technologies: '',
    additionalDetails: '',
    guacamoleName: '', // Added Guacamole Name
    guacamoleUrl: ''   // Added Guacamole URL
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Lab title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Guacamole validation
    if (formData.guacamoleUrl && !formData.guacamoleUrl.trim()) {
      newErrors.guacamoleUrl = 'Guacamole URL is required if name is provided';
    }
    if (formData.guacamoleName && !formData.guacamoleName.trim()) {
      newErrors.guacamoleName = 'Guacamole Name is required if URL is provided';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
    const labDetailsWithGuacamole = { ...formData };
    const prevData = JSON.parse(localStorage.getItem('formData')) || {}
    const updatedData = {...prevData, details: labDetailsWithGuacamole};
    localStorage.setItem('formData',JSON.stringify(updatedData))
      onNext(formData);
    }
  };

  const getTypeDisplayName = () => {
    switch (type) {
      case 'cloudslice':
        return 'Cloud Slice';
      case 'single-vm':
        return 'Single VM';
      case 'vm-cluster':
        return 'VM Cluster';
      default:
        return 'Lab';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-400 mb-2">
          Basic Information - {getTypeDisplayName()}
        </h2>
        <p className="text-gray-400">
          Provide the essential details for your {getTypeDisplayName().toLowerCase()} lab.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab Name */}
        <div className="lg:col-span-2">
          <label className="flex items-center text-gray-400 mb-2">
            <FileText className="h-4 w-4 mr-2 text-primary-400" />
            Lab Name *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg text-white 
                       placeholder-gray-400 focus:outline-none transition-colors ${
                         errors.title
                           ? 'border-red-500 focus:border-red-400'
                           : 'border-primary-500/20 focus:border-primary-500/40'
                       }`}
            placeholder="Enter a descriptive name for your lab"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="lg:col-span-2">
          <label className="flex items-center text-gray-400 mb-2">
            <FileText className="h-4 w-4 mr-2 text-primary-400" />
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg text-white 
                       placeholder-gray-400 focus:outline-none transition-colors resize-none h-24 ${
                         errors.description
                           ? 'border-red-500 focus:border-red-400'
                           : 'border-primary-500/20 focus:border-primary-500/40'
                       }`}
            placeholder="Describe what students will learn and accomplish in this lab"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Learning Objectives */}
        <div>
          <label className="flex items-center text-gray-400 mb-2">
            <Target className="h-4 w-4 mr-2 text-primary-400" />
            Learning Objectives
          </label>
          <textarea
            value={formData.learningObjectives}
            onChange={(e) => handleInputChange('learningObjectives', e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none
                       resize-none h-20"
            placeholder="What will students achieve after completing this lab?"
          />
        </div>

        {/* Prerequisites */}
        <div>
          <label className="flex items-center text-gray-400 mb-2">
            <FileText className="h-4 w-4 mr-2 text-primary-400" />
            Prerequisites
          </label>
          <textarea
            value={formData.prerequisites}
            onChange={(e) => handleInputChange('prerequisites', e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none
                       resize-none h-16"
            placeholder="What knowledge or skills are required?"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="flex items-center text-gray-400 mb-2">
            <Users className="h-4 w-4 mr-2 text-primary-400" />
            Target Audience
          </label>
          <input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => handleInputChange('targetAudience', e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
            placeholder="e.g., Software Engineers, DevOps Engineers, Students"
          />
        </div>

        {/* Key Technologies/Tools */}
        <div className="lg:col-span-2">
          <label className="flex items-center text-gray-400 mb-2">
            <Wrench className="h-4 w-4 mr-2 text-primary-400" />
            Key Technologies/Tools
          </label>
          <input
            type="text"
            value={formData.technologies}
            onChange={(e) => handleInputChange('technologies', e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
            placeholder="e.g., AWS, Docker, Kubernetes, Python (comma-separated)"
          />
        </div>

        {/* Additional Details */}
        <div className="lg:col-span-2">
          <label className="flex items-center text-gray-400 mb-2">
            <FileText className="h-4 w-4 mr-2 text-primary-400" />
            Additional Details
          </label>
          <textarea
            value={formData.additionalDetails}
            onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none
                       resize-none h-20"
            placeholder="Any additional information about the lab (e.g., platform specifics, special requirements)"
          />
        </div>

        {/* Guacamole Configuration */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-400 mb-4">Guacamole Configuration</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-gray-400 mb-2">
                <Monitor className="h-4 w-4 mr-2 text-primary-400" />
                Guacamole Name
              </label>
              <input
                type="text"
                value={formData.guacamoleName}
                onChange={(e) => handleInputChange('guacamoleName', e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
                placeholder="Enter a name for the Guacamole connection"
              />
              {errors.guacamoleName && <p className="text-red-500 text-sm mt-1">{errors.guacamoleName}</p>}
            </div>
            <div>
              <label className="flex items-center text-gray-400 mb-2">
                <Globe className="h-4 w-4 mr-2 text-primary-400" />
                Guacamole URL
              </label>
              <input
                type="text"
                value={formData.guacamoleUrl}
                onChange={(e) => handleInputChange('guacamoleUrl', e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
                placeholder="Enter the URL for the Guacamole connection"
              />
              {errors.guacamoleUrl && <p className="text-red-500 text-sm mt-1">{errors.guacamoleUrl}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleNext}
          className="flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 
                     text-white font-medium rounded-lg transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default BasicInfoStep;