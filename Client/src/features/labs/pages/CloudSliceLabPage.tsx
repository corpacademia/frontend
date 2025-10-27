import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { 
  ArrowLeft, 
  Cloud, 
  Server, 
  Key, 
  User, 
  ExternalLink, 
  Edit, 
  Save, 
  Loader, 
  AlertCircle, 
  Check,
  ChevronDown,
  Search,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import axios from 'axios';

interface ServiceCategory {
  name: string;
  services: {
    name: string;
    description: string;
    services_prefix:string;
  }[];
}

export const CloudSliceLabPage: React.FC = () => {
  const location = useLocation();
  const { sliceId } = useParams();
  const navigate = useNavigate();
  
  const [sliceDetails, setSliceDetails] = useState<any>(location.state?.sliceDetails || null);
  const [isLoading, setIsLoading] = useState(!location.state?.sliceDetails);
  const [error, setError] = useState<string | null>(null);
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orgLabStatus,setOrgLabStatus] = useState<any>(null);
  
  // Service selection state
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [fetching , setFetching] = useState(false);
  
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
  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setFetching(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setCurrentUser(response.data.user);
        if(response.data.user.role === 'labadmin'){
          const orgLabDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getOrgAssignedLabs`,{
            orgId: response.data.user.org_id,
            admin_id: response.data.user.id
          })
          if(orgLabDetails.data.success){

            setOrgLabStatus(orgLabDetails.data.data.find((lab)=>lab.labid === sliceId));
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
      finally{
        setFetching(false);
      }
    };
    
    fetchCurrentUser();
  }, []);
  // Fetch slice details if not provided in location state
  useEffect(() => {
    if (!sliceDetails && sliceId) {
      const fetchSliceDetails = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${sliceId}`);
          if (response.data.success) {
            setSliceDetails(response.data.data);
            setSelectedServices(response.data.data.services || []);
          } else {
            setError('Failed to load cloud slice details');
          }
        } catch (err) {
          setError('Failed to load cloud slice details');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchSliceDetails();
    } else if (sliceDetails) {
      setSelectedServices(sliceDetails.services || []);
    }
  }, [sliceId, sliceDetails]);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!sliceDetails) return;
      
      setIsLoadingDocs(true);
      try {
        // Determine which documents to show based on user role
        let documentsToShow: string[] = [];
        
        if (currentUser?.role === 'user') {
          // For regular users, show user guides
          documentsToShow = sliceDetails.userguides || [];
        } else {
          // For other users (admins), show lab guides
          documentsToShow = sliceDetails.labguides || [];
        }
        
        setDocuments(documentsToShow);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    if (currentUser && sliceDetails) {
      fetchDocuments();
    }
  }, [currentUser, sliceDetails]);

  // Document navigation handlers
  const handlePrevDocument = () => {
    setCurrentDocIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextDocument = () => {
    setCurrentDocIndex(prev => Math.min(documents.length - 1, prev + 1));
  };

   //extract the aws services
 const extractAwsServices = async (awsServices: { services: string; description: string; category: string ,services_prefix:string}[]): Promise<CategorizedServices> => {
  const servicess: CategorizedServices = {};
  awsServices.forEach(({ services, description, category ,services_prefix}) => {
    if (servicess[category]) {
      servicess[category].push({ name: services, category: category, description: description,services_prefix:services_prefix });
    } else {
      servicess[category] = [{ name: services, category: category, description: description,services_prefix:services_prefix }];
    }
  });

  return servicess;
};

  // Fetch service categories
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getAwsServices`);
        if (response.data.success) {
          const awsServiceCategories = await extractAwsServices(response.data.data);
          setServiceCategories(awsServiceCategories);
        }
      } catch (err) {
        console.error('Failed to fetch service categories:', err);
      }
    };
    
    if (isEditingServices) {
      fetchServiceCategories();
    }
  }, [isEditingServices, sliceDetails?.provider]);

  // Check if current user can edit content
  const canEditContent = () => {
    if (!currentUser || !sliceDetails) return false;
    
    // Super admin can edit anything
    if (currentUser.role === 'superadmin') return true;
    
    // Org admin can only edit content they created
    if (currentUser.role === 'labadmin') {
      return sliceDetails.createdby === currentUser.id;
    }
    
    return false;
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => {
      const exists = prev.includes(service);
      if (exists) {
        return prev.filter(s => s !== service);
      }
      return [...prev, service];
    });
  };

  const handleSaveServices = async () => {
    setIsSaving(true);
    setNotification(null);
    
    try {
      const updateServices = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/editAwsServices`,{
        userName:sliceDetails.username,
        services:selectedServices
      })
      if(updateServices.data.success){
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudSliceServices/${sliceId}`, {
          services: selectedServices
        });
        
        if (response.data.success) {
          setNotification({ type: 'success', message: 'Services updated successfully' });
          setIsEditingServices(false);
          
          // Update slice details with new services
          setSliceDetails(prev => ({
            ...prev,
            services: selectedServices
          }));
          
          setTimeout(() => setNotification(null), 3000);
        }
      }
     else {
        throw new Error(updateServices.data.message || 'Failed to update services');
      }
    } catch (err: any) {
      setNotification({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update services' 
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };
  const handleGoToConsole = () => {
    if (sliceDetails?.console_url) {
      // window.open(sliceDetails.console_url, '_blank');
      const awsWindow = window.open(sliceDetails.console_url, '_blank');
      const openedAt = Date.now();
      const openedAtFormatted = new Date(openedAt).toLocaleString();
      console.log(`AWS Console opened at: ${openedAtFormatted}`);

      const checkClosed = setInterval(() => {
      if (awsWindow?.closed) {
        const closedAt = Date.now();
        const closedAtFormatted = new Date(closedAt).toLocaleString();
        console.log(`AWS Console closed at: ${closedAtFormatted}`);
        const totalTime = closedAt - openedAt;
        console.log(`AWS Console window open time: ${Math.round(totalTime / 1000)} seconds`);
        clearInterval(checkClosed);
      }
}, 1000);

    }
    else{
      // window.open('https://console.aws.amazon.com/', '_blank');
     const awsWindow = window.open('https://console.aws.amazon.com/', '_blank');
      const openedAt = Date.now();
      const openedAtFormatted = new Date(openedAt).toLocaleString();
      console.log(`AWS Console opened at: ${openedAtFormatted}`);

      const checkClosed = setInterval(() => {
      if (awsWindow?.closed) {
        const closedAt = Date.now();
        const closedAtFormatted = new Date(closedAt).toLocaleString();
        console.log(`AWS Console closed at: ${closedAtFormatted}`);
        const totalTime = closedAt - openedAt;
        console.log(`AWS Console window open time: ${Math.round(totalTime / 1000)} seconds`);
        clearInterval(checkClosed);
      }
}, 1000);
    }
  };

  // Filter categories and services based on search
  const filteredCategories = Object.keys(serviceCategories).filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredServices = selectedCategory 
  ? serviceCategories[selectedCategory].filter(service =>
      service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      service.description.toLowerCase().includes(serviceSearch.toLowerCase())
    )
  : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }
  if(fetching){
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
        <p className="text-gray-400 mb-6">Unable to load the cloud slice details.</p>
        <button 
          onClick={() => navigate('/dashboard/labs/cloud-slices')}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cloud Slices
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
            onClick={() => navigate('/dashboard/labs/cloud-slices')}
            className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold">
              <GradientText>{sliceDetails?.title || 'Cloud Slice Lab'}</GradientText>
            </h1>
            <p className="mt-1 text-gray-400">{sliceDetails?.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            sliceDetails?.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
            sliceDetails?.status === 'inactive' ? 'bg-red-500/20 text-red-300' :
            'bg-amber-500/20 text-amber-300'
          }`}>
            {sliceDetails?.status}
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
            {sliceDetails?.provider?.toUpperCase()}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Services */}
        <div className="lg:col-span-2">
          <div className="glass-panel">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <h2 className="text-xl font-semibold">
                <GradientText>Cloud Services</GradientText>
              </h2>
              <div className="flex items-center space-x-2">
                {documents.length > 0 && (
                  <button
                    onClick={() => setShowDocuments(!showDocuments)}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    {showDocuments ? 'Hide' : 'View'} Documents
                  </button>
                )}
                {canEditContent() ? (
                  isEditingServices ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setIsEditingServices(false);
                          // Reset to original services
                          setSelectedServices(sliceDetails?.services || []);
                        }}
                        className="btn-secondary text-sm py-1.5 px-3"
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveServices}
                        disabled={isSaving}
                        className="btn-primary text-sm py-1.5 px-3"
                      >
                        {isSaving ? (
                          <Loader className="animate-spin h-4 w-4" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1.5" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingServices(true)}
                      className="btn-secondary text-sm py-1.5 px-3"
                    >
                      <Edit className="h-4 w-4 mr-1.5" />
                      Edit Services
                    </button>
                  )
                ) : null}
              </div>
            </div>

            {isEditingServices ? (
              <div className="space-y-4">
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
                      <span className="text-gray-300 truncate">
                        {selectedCategory || 'Select a category'}
                      </span>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
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

                {/* Service Selector */}
                {selectedCategory && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Services
                    </label>
                    <div className="relative">
                      <div 
                        className="w-full flex items-center justify-between p-3 bg-dark-400/50 
                                 border border-primary-500/20 hover:border-primary-500/40 
                                 rounded-lg cursor-pointer transition-colors"
                        onClick={() => setShowServiceDropdown(!showServiceDropdown)}
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

                      {showServiceDropdown && (
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
                                  checked={selectedServices.includes(service.name)}
                                  onChange={() => handleServiceToggle(service.services_prefix)}
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
                )}

                {/* Selected Services Display */}
                {selectedServices.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Selected Services:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map(service => (
                        <div
                          key={service}
                          className="flex items-center px-3 py-1 bg-primary-500/10 text-primary-300
                                   rounded-full text-sm max-w-full"
                        >
                          <span className="truncate">{service}</span>
                          <button
                            onClick={() => handleServiceToggle(service)}
                            className="ml-2 hover:text-primary-400 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedServices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                    {selectedServices.map(service => (
                      <div 
                        key={service}
                        className="p-3 bg-dark-300/50 rounded-lg flex items-center space-x-2 min-w-0"
                      >
                        <Cloud className="h-4 w-4 text-primary-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No services have been selected for this cloud slice.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Credentials & Actions */}
        <div className="space-y-6">
          <div className="glass-panel">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">
                <GradientText>Access Credentials</GradientText>
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-dark-300/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Username</span>
                  <User className="h-4 w-4 text-primary-400" />
                </div>
                <p className="text-sm font-mono bg-dark-400/50 p-2 rounded border border-primary-500/10 text-gray-300">
                  {currentUser.role === 'superadmin' || currentUser.role === 'orgsuperadmin'? sliceDetails?.username : orgLabStatus.username || 'Not available'}
                </p>
              </div>
              
              <div className="p-3 bg-dark-300/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Password</span>
                  <Key className="h-4 w-4 text-primary-400" />
                </div>
                <p className="text-sm font-mono bg-dark-400/50 p-2 rounded border border-primary-500/10 text-gray-300">
                {currentUser.role === 'superadmin' || currentUser.role === 'orgsuperadmin' ? sliceDetails?.password : orgLabStatus.password || 'Not available'}
                </p>
              </div>
              
              {/* <div className="p-3 bg-dark-300/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Secret Access Key</span>
                  <Key className="h-4 w-4 text-primary-400" />
                </div>
                <p className="text-sm font-mono bg-dark-400/50 p-2 rounded border border-primary-500/10 text-gray-300">
                  {sliceDetails?.credentials?.secretAccessKey || 'Not available'}
                </p>
              </div> */}
            </div>
          </div>
          
          <button
            onClick={handleGoToConsole}
            // disabled={!sliceDetails?.consoleUrl}
            className="btn-primary w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to {sliceDetails?.provider?.toUpperCase()} Console
          </button>
        </div>

        </div>

      {/* Documents Section - Below main grid */}
      {showDocuments && (
        <div className="glass-panel h-[500px] md:h-[600px] flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-primary-500/10 gap-3">
            <h2 className="text-lg font-semibold">
              <GradientText>
                {currentUser?.role === 'user' ? 'User Guides' : 'Lab Documents'}
              </GradientText>
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
          
          <div className="flex-grow overflow-hidden">
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
                  No {currentUser?.role === 'user' ? 'user guides' : 'lab documents'} available for this lab
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    // </div>
  );
};