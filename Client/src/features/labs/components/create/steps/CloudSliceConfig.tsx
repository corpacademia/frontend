import React, { useEffect, useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GradientText } from '../../../../../components/ui/GradientText';
import { 
  Search, 
  ChevronDown, 
  X, 
  AlertCircle, 
  Calendar, 
  Loader, 
  Check, 
  Clock,
  Layers,
  DollarSign,
  Users,
  Shield
} from 'lucide-react';

interface CloudSliceConfigProps {
  onBack: () => void;
  labDetails: {
    title: string;
    description: string;
    duration: number;
    cloudProvider: string;
    platform: string;
  };
  awsServiceCategories: {
    service: string;
    category: string;
    description: string;
  }
}

interface Service {
  name: string;
  category: string;
  description: string;
  services_prefix:string;
}
const regions = import.meta.env.VITE_AWS_REGIONS ? JSON.parse(import.meta.env.VITE_AWS_REGIONS) : [];

export const CloudSliceConfig: React.FC<CloudSliceConfigProps> = ({ onBack, labDetails, awsServiceCategories }) => {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cleanupPolicy, setCleanupPolicy] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credits, setCredits] = useState(100); // Example credit amount
  const [labType, setLabType] = useState<'without-modules' | 'with-modules'>('without-modules');
  const [accountType, setAccountType] = useState<'iam' | 'organization'>('iam');

  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
    region.location.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const filteredCategories = Object.keys(awsServiceCategories).filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredServices = selectedCategory 
    ? awsServiceCategories[selectedCategory].filter(service =>
        service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.description.toLowerCase().includes(serviceSearch.toLowerCase())
      )
    : [];

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.name === service.name);
      if (exists) {
        return prev.filter(s => s.name !== service.name);
      }
      return [...prev, service];
    });
  };

  const handleSubmit = async () => {
    if (!selectedRegion) {
      setError('Please select a region');
      return;
    }
    
    if (selectedServices.length === 0 && labType === 'without-modules') {
      setError('Please select at least one service');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Please specify start and end dates');
      return;
    }

    if (credits <= 0) {
      setError('Please enter a valid credit amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const config = {
        title: labDetails.title,
        description: labDetails.description,
        platform: labDetails.platform,
        cloudProvider: labDetails.cloudProvider,
        services: selectedServices.map(s => s.services_prefix),
        region: selectedRegion,
        startDate,
        endDate,
        labType,
        credits: credits ? credits : 0,
        accountType,
      };

      // Only add cleanupPolicy for labs without modules
      if (labType === 'without-modules') {
        config['cleanupPolicy'] = cleanupPolicy;
      }

      if (labType === 'with-modules') {
        // For labs with modules, navigate to module creation page
        navigate('/dashboard/create-modules', { state: { labConfig: config } });
        return;
      }

      try {
        const user_profile = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/createCloudSliceLab`, {
          createdBy: user_profile.data.user.id,
          labData: config
        });
        
        if (result.data.success) {
          // For labs without modules, show success message
          setSuccess('Cloud slice created successfully!');
          setTimeout(() => {
            navigate('/dashboard/labs/cloud-slices');
          }, 3000);
        } else {
          setError('Failed to create cloud slice');
        }
      } catch (error) {
        console.error('API error:', error);
        setError('Failed to create cloud slice');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to create cloud slice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold">
            <GradientText>AWS Cloud Slice Configuration</GradientText>
          </h2>
          <p className="mt-2 text-gray-400">{labDetails.title}</p>
          <p className="mt-2 text-gray-400">{labDetails.description}</p>
        </div>
        <div className="text-lg font-semibold text-primary-400">
          Credits Available: ${credits.toLocaleString()}
        </div>
      </div>

      {/* Lab Type Selection */}
      <div className="glass-panel space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Lab Type</h3>
        
        <div className="flex flex-col space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="labType"
              value="without-modules"
              checked={labType === 'without-modules'}
              onChange={() => setLabType('without-modules')}
              className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
            />
            <div>
              <span className="text-gray-300">Lab Without Modules</span>
              <p className="text-sm text-gray-400">Standard lab with all services and functionalities</p>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="labType"
              value="with-modules"
              checked={labType === 'with-modules'}
              onChange={() => setLabType('with-modules')}
              className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
            />
            <div>
              <span className="text-gray-300">Lab With Modules</span>
              <p className="text-sm text-gray-400">Lab with structured learning modules and step-by-step guides</p>
            </div>
          </label>
        </div>
      </div>

      {/* Account Type Selection */}
      <div className="glass-panel space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Account Type</h3>
        
        <div className="flex flex-col space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="iam"
              checked={accountType === 'iam'}
              onChange={() => setAccountType('iam')}
              className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
            />
            <div>
              <span className="text-gray-300">IAM Account</span>
              <p className="text-sm text-gray-400">Standard AWS account with IAM users and roles</p>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="organization"
              checked={accountType === 'organization'}
              onChange={() => setAccountType('organization')}
              className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
            />
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">Organization Account</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                <Users className="h-3 w-3 inline mr-1" />
                15 users max
              </span>
            </div>
            <p className="text-sm text-gray-400">AWS Organizations account with centralized management</p>
          </label>
        </div>
      </div>

      {/* Credits Configuration - Only for labs without modules */}
      {labType === 'without-modules' && (
        <div className="glass-panel space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Credits Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-primary-400" />
                  <span>Credit Amount</span>
                </div>
              </label>
              <input
                type="number"
                min="1"
                value={credits}
                onChange={(e) => setCredits(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                Set the amount of credits available for this lab. Users will be limited to this budget.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Services Selection - Only show for labs without modules */}
      {labType === 'without-modules' && (
        <div className="glass-panel space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">AWS Services</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Categories Dropdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300">Service Categories</h4>
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

            {/* Right Column - Services Dropdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300">Services</h4>
              <div className="relative">
                <div 
                  className="w-full flex items-center justify-between p-3 bg-dark-400/50 
                           border border-primary-500/20 hover:border-primary-500/40 
                           rounded-lg cursor-pointer transition-colors"
                  onClick={() => selectedCategory && setShowServiceDropdown(!showServiceDropdown)}
                >
                  <span className="text-gray-300">
                    {selectedServices.length > 0 
                      ? `${selectedServices.length} service(s) selected` 
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
                      {filteredServices.map(service => (
                        <label
                          key={service.name}
                          className="flex items-center space-x-3 p-3 hover:bg-dark-300/50 
                                   cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.some(s => s.name === service.name)}
                            onChange={() => handleServiceToggle(service)}
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
          {selectedServices.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Services:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map(service => (
                  <div
                    key={service.name}
                    className="flex items-center px-3 py-1 bg-primary-500/10 text-primary-300
                             rounded-full text-sm"
                  >
                    {service.name}
                    <button
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
      )}

      {/* Region Selection - Show for both lab types */}
      <div className="glass-panel space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Region Selection</h3>
        
        <div className="relative">
          <button
            onClick={() => setShowRegionDropdown(!showRegionDropdown)}
            className="w-full flex items-center justify-between p-3 bg-dark-300/50 
                     hover:bg-dark-300 rounded-lg transition-colors"
          >
            <span className="text-gray-200">
              {selectedRegion ? 
                regions.find(r => r.code === selectedRegion)?.name :
                'Select a region'
              }
            </span>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
              showRegionDropdown ? 'transform rotate-180' : ''
            }`} />
          </button>

          {showRegionDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-dark-200 rounded-lg border 
                          border-primary-500/20 shadow-lg">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search regions..."
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 
                           rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredRegions.map(region => (
                  <button
                    key={region.code}
                    onClick={() => {
                      setSelectedRegion(region.code);
                      setShowRegionDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-dark-300/50 transition-colors"
                  >
                    <p className="text-gray-200">{region.name}</p>
                    <p className="text-sm text-gray-400">{region.location}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duration and Cleanup - Show different content based on lab type */}
      <div className="glass-panel space-y-4">
        {labType === 'without-modules' ? (
          <h3 className="text-lg font-semibold text-gray-200">Duration & Cleanup</h3>
        ) : (
          <h3 className="text-lg font-semibold text-gray-200">Duration</h3>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Only show cleanup policy for labs without modules */}
        {labType === 'without-modules' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cleanup Policy
            </label>
            <select
              value={cleanupPolicy}
              onChange={(e) => setCleanupPolicy(e.target.value)}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            >
              <option value="1">1-day cleanup</option>
              <option value="2">2-day cleanup</option>
              <option value="3">3-day cleanup</option>
              <option value="7">7-day cleanup</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
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

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          Back
        </button>
        <div className="flex space-x-4">
          {labType === 'with-modules' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Creating Lab...
                </span>
              ) : (
                <span className="flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Continue to Module Creation
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Creating Cloud Slice...
                </span>
              ) : (
                'Create Cloud Slice'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};