import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Download,
  Loader,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Power,
  Monitor,
  Key,
  ChevronDown,
  X,
  Expand,
  Shrink,
  Eye,
  EyeOff,
  RefreshCw,
  PowerOff
} from 'lucide-react';
import axios from 'axios';
import Split from 'react-split';

interface VMSessionPageProps {}

export const VMSessionPage: React.FC<VMSessionPageProps> = () => {
  const { vmId } = useParams<{ vmId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<string[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [splitRatio, setSplitRatio] = useState(70); // Default 70% for VM, 30% for docs
  const [showDocuments, setShowDocuments] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('1280x720');
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the guacUrl from location state
  const { guacUrl, vmTitle, credentials, isGroupConnection } = location.state || {};
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [activeGuacUrl, setActiveGuacUrl] = useState<string>(guacUrl || '');

useEffect(() => {
  const docs = location.state?.doc || location.state?.document || [];
  if (docs) {
    setDocuments(docs);
    setIsLoadingDocs(false);
  }
}, [location.state]);

  // Already moved above
  // Credentials for the VM - multiple credentials example
  // const credentialsList = [
  //   { label: "Admin", username: 'admin', password: 'P@ssw0rd123' },
  //   { label: "User", username: 'user', password: 'User@123' },
  //   { label: "Database", username: 'dbuser', password: 'Db@123456' }
  // ];
const credentialsList = credentials;
  // Available resolutions
  const resolutions = [
    '800x600',
    '1024x768',
    '1280x720',
    '1366x768',
    '1600x900',
    '1920x1080'
  ];
  
  useEffect(() => {
    // Check if we have the necessary data
    if (!guacUrl && !isGroupConnection) {
      navigate('/dashboard/labs/cloud-vms');
    } else {
      setIsLoading(false);
    }
    
    // Fetch lab documents
    // const fetchDocuments = async () => {
    //   try {
    //     // In a real implementation, you would fetch documents from your API
    //     // For now, we'll use mock data
    //     const mockDocuments = [
    //       "C:\\Users\\Admin\\Desktop\\microservice\\lab-service\\src\\public\\uploads\\1mb.pdf",
    //       'C:\\Users\\Admin\\Desktop\\microservice\\cloud-slice-service\\src\\public\\uploads\\ec2-ug.pdf',
    //       'C:\\Users\\Admin\\Desktop\\microservice\\cloud-slice-service\\src\\public\\uploads\\1744211988810-edb_pem_agent.exe-20250407051848'
    //     ];
        
    //     // In a real implementation, you would fetch documents for this specific VM
    //     // const response = await axios.get(`/api/labs/${vmId}/documents`);
    //     // setDocuments(response.data);
        
    //     setDocuments(mockDocuments);
    //     setIsLoadingDocs(false);
    //   } catch (error) {
    //     console.error('Failed to fetch lab documents:', error);
    //     setIsLoadingDocs(false);
    //   }
    // };
    
    // fetchDocuments();

    // Add event listener for escape key to exit fullscreen
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [guacUrl, vmId, navigate, isFullscreen]);

  // Function to extract the exact filename from the url
  function extractFileName(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleNextDocument = () => {
    if (currentDocIndex < documents.length - 1) {
      setCurrentDocIndex(currentDocIndex + 1);
    }
  };

  const handlePrevDocument = () => {
    if (currentDocIndex > 0) {
      setCurrentDocIndex(currentDocIndex - 1);
    }
  };

  const handleResolutionChange = (resolution: string) => {
    setSelectedResolution(resolution);
    setIsControlsOpen(false);
    
    // Apply resolution to the iframe
    if (iframeRef.current && containerRef.current) {
      const [width, height] = resolution.split('x').map(Number);
      const iframe = iframeRef.current;
      const container = containerRef.current;
      
      // Set the iframe dimensions
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;
      
      // Ensure container has scrollbars if needed
      container.style.overflow = 'auto';
    }
  };

  // Function to make the iframe fit the container
  const fitToContainer = () => {
    if (iframeRef.current && containerRef.current) {
      const iframe = iframeRef.current;
      
      // Reset any explicit dimensions
      iframe.style.width = '100%';
      iframe.style.height = '100%';
    }
  };

  // Apply fit to container when component mounts
  useEffect(() => {
    if (!isLoading && iframeRef.current) {
      // Set a small timeout to ensure the iframe is loaded
      const timer = setTimeout(() => {
        fitToContainer();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, showDocuments, splitRatio, isFullscreen]);

  const handleConnectToCredential = async (credential: any) => {
    try {
      // First, get JWT token
      const tokenResponse = await axios.post('http://localhost:3000/api/v1/lab_ms/connectToDatacenterVm', {
        Protocol: credential.vmData?.protocol || 'RDP',
        VmId: credential.id,
        Ip: credential.ip,
        userName: credential.username,
        password: credential.password,
        port: credential.port,
      });
      
      if (tokenResponse.data.success && tokenResponse.data.token) {
        const newGuacUrl = `http://43.204.220.7:8080/guacamole/#/?token=${tokenResponse.data.token.result}`;
        setActiveGuacUrl(newGuacUrl);
        setSelectedCredential(credential);
      } else {
        throw new Error('Failed to get connection token');
      }
    } catch (error: any) {
      console.error('Error connecting to VM:', error);
    }
  };

  const handlePowerAction = (action: 'restart' | 'shutdown') => {
    // In a real implementation, you would call an API to perform the action
    console.log(`Power action: ${action}`);
    setIsPowerMenuOpen(false);
  };

  const toggleDocumentsPanel = () => {
    setShowDocuments(!showDocuments);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-8 w-8 text-primary-400 animate-spin mr-3" />
        <span className="text-gray-300">Loading VM session...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <h1 className="text-2xl font-display font-bold">
            <GradientText>{vmTitle || 'VM Session'}</GradientText>
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleDocumentsPanel}
            className="btn-secondary"
          >
            {showDocuments ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Documents
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Documents
              </>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="btn-secondary"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      {isFullscreen ? (
        // Fullscreen mode - only show VM
        <div className="glass-panel p-0 overflow-hidden h-[calc(100vh-120px)]">
          <div className="bg-dark-400 p-2 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setIsPowerMenuOpen(!isPowerMenuOpen)}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors text-red-400"
                >
                  <Power className="h-5 w-5" />
                </button>
                {isPowerMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                    <button
                      onClick={() => handlePowerAction('restart')}
                      className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-dark-300/50 transition-colors flex items-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart
                    </button>
                    <button
                      onClick={() => handlePowerAction('shutdown')}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      Shutdown
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsControlsOpen(!isControlsOpen)}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Monitor className="h-5 w-5 text-primary-400" />
                  <span className="text-sm text-gray-300">{selectedResolution}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {isControlsOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                    {resolutions.map(resolution => (
                      <button
                        key={resolution}
                        onClick={() => handleResolutionChange(resolution)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-300/50 transition-colors ${
                          selectedResolution === resolution ? 'text-primary-400' : 'text-gray-300'
                        }`}
                      >
                        {resolution}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                  <Key className="h-5 w-5 text-primary-400" />
                </button>
                {showCredentials && (
                  <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50 p-3 w-96">
                    <div className="space-y-3">
                      {isGroupConnection ? (
                        <>
                          <h4 className="text-sm font-medium text-primary-400 mb-2">Select VM to Connect ({credentialsList.length} VMs)</h4>
                          {credentialsList.map((cred, index) => (
                            <div key={index} className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedCredential?.id === cred.id 
                                ? 'bg-primary-500/20 border border-primary-500/40' 
                                : 'bg-dark-300/50 hover:bg-dark-300/70'
                            }`}
                            onClick={() => handleConnectToCredential(cred)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-primary-400">{cred.vmData?.vmname || `VM ${index + 1}`}</span>
                                {selectedCredential?.id === cred.id && (
                                  <span className="text-xs text-green-400">Connected</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-400 block">Username</label>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">{cred.username}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(cred.username);
                                      }}
                                      className="text-xs text-primary-400 hover:text-primary-300"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-400 block">Password</label>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">{cred.password}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(cred.password);
                                      }}
                                      className="text-xs text-primary-400 hover:text-primary-300"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        credentialsList.map((cred, index) => (
                          <div key={index} className="p-2 bg-dark-300/50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <label className="text-xs text-gray-400 block">Username</label>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300">{cred.username}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(cred.username)}
                                    className="text-xs text-primary-400 hover:text-primary-300"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-400 block">Password</label>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300">{cred.password}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(cred.password)}
                                    className="text-xs text-primary-400 hover:text-primary-300"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <Minimize2 className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div className="w-full h-[calc(100%-40px)] overflow-auto" ref={containerRef}>
            <iframe 
              ref={iframeRef}
              src={activeGuacUrl} 
              style={{ width: '100%', height: '100%' }}
              className="border-0"
              title="VM Remote Access"
              allow="fullscreen"
            />
          </div>
        </div>
      ) : (
        // Split view mode with resizable panels
        <Split
          sizes={[splitRatio, 100 - splitRatio]}
          minSize={300}
          expandToMin={false}
          gutterSize={8}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="col-resize"
          className="glass-panel p-0 overflow-hidden h-[calc(100vh-120px)] flex"
          onDragEnd={(sizes) => {
            setSplitRatio(sizes[0]);
          }}
          gutter={() => {
            const gutter = document.createElement('div');
            gutter.className = "h-full w-2 bg-primary-500/20 hover:bg-primary-500/40 cursor-col-resize flex items-center justify-center z-10 transition-colors";
            const gripIcon = document.createElement('div');
            gripIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-primary-500/50"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
            gutter.appendChild(gripIcon);
            return gutter;
          }}
        >
          {/* VM Panel */}
          <div className="h-full overflow-hidden flex flex-col">
            {/* VM Controls */}
            <div className="bg-dark-400 p-2 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    onClick={() => setIsPowerMenuOpen(!isPowerMenuOpen)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors text-red-400"
                  >
                    <Power className="h-5 w-5" />
                  </button>
                  {isPowerMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                      <button
                        onClick={() => handlePowerAction('restart')}
                        className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-dark-300/50 transition-colors flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restart
                      </button>
                      <button
                        onClick={() => handlePowerAction('shutdown')}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
                      >
                        <PowerOff className="h-4 w-4 mr-2" />
                        Shutdown
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsControlsOpen(!isControlsOpen)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Monitor className="h-5 w-5 text-primary-400" />
                    <span className="text-sm text-gray-300">{selectedResolution}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  {isControlsOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                      {resolutions.map(resolution => (
                        <button
                          key={resolution}
                          onClick={() => handleResolutionChange(resolution)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-300/50 transition-colors ${
                            selectedResolution === resolution ? 'text-primary-400' : 'text-gray-300'
                          }`}
                        >
                          {resolution}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                  >
                    <Key className="h-5 w-5 text-primary-400" />
                  </button>
                  {showCredentials && (
                    <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50 p-3 w-96">
                      <div className="space-y-3">
                        {isGroupConnection ? (
                          <>
                            <h4 className="text-sm font-medium text-primary-400 mb-2">Select VM to Connect ({credentialsList.length} VMs)</h4>
                            {credentialsList.map((cred, index) => (
                              <div key={index} className={`p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedCredential?.id === cred.id 
                                  ? 'bg-primary-500/20 border border-primary-500/40' 
                                  : 'bg-dark-300/50 hover:bg-dark-300/70'
                              }`}
                              onClick={() => handleConnectToCredential(cred)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-primary-400">{cred.vmData?.vmname || `VM ${index + 1}`}</span>
                                  {selectedCredential?.id === cred.id && (
                                    <span className="text-xs text-green-400">Connected</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="flex-1">
                                    <label className="text-xs text-gray-400 block">Username</label>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-300">{cred.username}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(cred.username);
                                        }}
                                        className="text-xs text-primary-400 hover:text-primary-300"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs text-gray-400 block">Password</label>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-300">{cred.password}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(cred.password);
                                        }}
                                        className="text-xs text-primary-400 hover:text-primary-300"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          credentialsList.map((cred, index) => (
                            <div key={index} className="p-2 bg-dark-300/50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-400 block">Username</label>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">{cred.username}</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(cred.username)}
                                      className="text-xs text-primary-400 hover:text-primary-300"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-400 block">Password</label>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">{cred.password}</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(cred.password)}
                                    className="text-xs text-primary-400 hover:text-primary-300"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (splitRatio < 90) {
                      setSplitRatio(splitRatio + 10);
                    }
                  }}
                  className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                  title="Expand VM panel"
                >
                  <Expand className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => {
                    if (splitRatio > 50) {
                      setSplitRatio(splitRatio - 10);
                    }
                  }}
                  className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                  title="Shrink VM panel"
                >
                  <Shrink className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                  title="Fullscreen"
                >
                  <Maximize2 className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="w-full h-[calc(100%-40px)] overflow-auto" ref={containerRef}>
              <iframe 
                ref={iframeRef}
                src={activeGuacUrl} 
                style={{ width: '100%', height: '100%' }}
                className="border-0"
                title="VM Remote Access"
                allow="fullscreen"
              />
            </div>
          </div>
          
          {/* Documents Panel */}
          {showDocuments && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-primary-500/10 bg-dark-300">
                <h2 className="text-lg font-semibold text-primary-300">
                  Lab Documents
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
                    onClick={() => window.open(`http://localhost:3002/uploads/${extractFileName(documents[currentDocIndex])}`, '_blank')}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </button>
                  <button
                    onClick={toggleDocumentsPanel}
                    className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {isLoadingDocs ? (
                <div className="flex justify-center items-center flex-grow">
                  <Loader className="h-6 w-6 text-primary-400 animate-spin mr-3" />
                  <span className="text-gray-300">Loading documents...</span>
                </div>
              ) : documents.length > 0 ? (
                <div className="flex-grow overflow-auto">
                  <iframe
                    src={`http://localhost:3002/uploads/${extractFileName(documents[currentDocIndex])}`}
                    className="w-full h-full border-0"
                    title="Lab Document"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow">
                  <FileText className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 text-center">No documents available for this lab</p>
                </div>
              )}

              {/* Document List */}
              <div className="border-t border-primary-500/10 p-4 max-h-40 overflow-y-auto bg-dark-300/50">
                <h3 className="text-sm font-medium text-gray-400 mb-2">All Documents</h3>
                <div className="space-y-2 overflow-y-auto max-h-32">
                  {documents.map((doc, index) => (
                    <div 
                      key={index}
                      onClick={() => setCurrentDocIndex(index)}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer ${
                        currentDocIndex === index 
                          ? 'bg-primary-500/20 text-primary-300' 
                          : 'bg-dark-300/50 text-gray-300 hover:bg-dark-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{extractFileName(doc)}</span>
                      </div>
                      <Download 
                        className="h-4 w-4 text-primary-400 flex-shrink-0" 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`http://localhost:3002/uploads/${extractFileName(doc)}`, '_blank');
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Split>
      )}
    </div>
  );
};
