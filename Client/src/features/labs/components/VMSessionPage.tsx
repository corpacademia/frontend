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
  X,
  Eye,
  EyeOff,
  Server,
  ChevronDown,
  Users,
  Key,
  Monitor,
  Power,
  RefreshCw,
  PowerOff
} from 'lucide-react';
import axios from 'axios';
import Split from 'react-split';
import Guacamole from 'guacamole-common-js';

interface VMSessionPageProps {}

export const VMSessionPage: React.FC<VMSessionPageProps> = () => {
  const { vmId } = useParams<{ vmId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [showDocuments, setShowDocuments] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('1280x720');
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [vmDropdownOpen, setVmDropdownOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState(70);

  // Two refs for containers
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  const clientRef = useRef<any>(null);
  const keyboardRef = useRef<any>(null);
  const mouseRef = useRef<any>(null);

  // Get data from location state
  const { guacUrl, vmTitle, credentials, isGroupConnection } = location.state || {};
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [activeGuacUrl, setActiveGuacUrl] = useState<string>(guacUrl || '');

  const credentialsList = credentials;

  // Available resolutions
  const resolutions = ['800x600', '1024x768', '1280x720', '1366x768', '1600x900', '1920x1080'];

  useEffect(() => {
    const docs = location.state?.doc || location.state?.document || [];
    if (docs) {
      setDocuments(docs);
    }
  }, [location.state]);

  useEffect(() => {
    if (!guacUrl && !isGroupConnection) {
      navigate('/dashboard/labs/cloud-vms');
    }

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [guacUrl, navigate, isFullscreen, isGroupConnection]);

  // Initialize Guacamole WebSocket client
  useEffect(() => {
    const targetRef = isFullscreen ? fullscreenRef : splitRef;
    if (!activeGuacUrl || !targetRef.current) {
      console.debug("Guac init aborted - missing url or targetRef", { activeGuacUrl, hasTarget: !!targetRef.current });
      return;
    }

    console.log("🔌 Initializing Guacamole WebSocket for:", activeGuacUrl, "target:", isFullscreen ? "fullscreenRef" : "splitRef");

    // Clean up previous connection
    if (clientRef.current) {
      console.log("🧹 Cleaning up previous connection");
      if (keyboardRef.current) {
        keyboardRef.current.onkeydown = null;
        keyboardRef.current.onkeyup = null;
      }
      if (mouseRef.current) {
        mouseRef.current.onmousedown = null;
        mouseRef.current.onmouseup = null;
        mouseRef.current.onmousemove = null;
      }
      try { clientRef.current.disconnect(); } catch (e) { console.warn("Error disconnecting previous client:", e); }
      clientRef.current = null;
    }

    setIsConnecting(true);

    // Clean up WebSocket URL
    let wsUrl = activeGuacUrl.replace('?undefined', '').replace('??', '?');
    console.log("🌐 WebSocket URL:", wsUrl);

    // Create WebSocket tunnel
    const tunnel = new Guacamole.WebSocketTunnel(wsUrl);

    tunnel.onerror = (status: any) => {
      console.error("❌ Tunnel error:", status);
      setIsConnecting(false);
    };

    tunnel.onstatechange = (state: number) => {
      console.log("📡 Tunnel state:", state);
      if (state === Guacamole.Tunnel.State.OPEN) {
        console.log("✅ Tunnel OPEN");
        setIsConnecting(false);
      } else if (state === Guacamole.Tunnel.State.CLOSED) {
        console.log("⚠️ Tunnel CLOSED");
        setIsConnecting(false);
      }
    };

    // Create Guacamole client
    const client = new Guacamole.Client(tunnel);
    clientRef.current = client;

    client.onstatechange = (state: number) => {
      console.log("🖥️ Client state:", state);
    };

    client.onerror = (error: any) => {
      console.error("❌ Client error:", error);
      setIsConnecting(false);
    };

    // Get display and attach to DOM
    const display = client.getDisplay();
    const displayEl = display.getElement();

    // Clear previous contents in both refs to avoid leftover/duplicate nodes
    [fullscreenRef, splitRef].forEach(r => {
      if (r.current) {
        r.current.innerHTML = '';
      }
    });

    // Ensure container styles: target container must be positioned and allow stacking
    targetRef.current.style.position = 'relative';
    targetRef.current.style.background = 'transparent'; // so it doesn't visually block other panels
    targetRef.current.style.zIndex = '0';
    // make sure the other container is also not blocking
    if (isFullscreen && splitRef.current) {
      splitRef.current.style.zIndex = '0';
    } else if (!isFullscreen && fullscreenRef.current) {
      fullscreenRef.current.style.zIndex = '0';
    }

    // Style the Guacamole display element so it sits inside target with low z-index
    displayEl.style.position = "absolute";
    displayEl.style.top = "0";
    displayEl.style.left = "0";
    displayEl.style.width = "100%";
    displayEl.style.height = "100%";
    displayEl.style.display = "block";
    displayEl.style.objectFit = "contain";
    // explicit stacking:
    displayEl.style.zIndex = "0";
    // pointer events should be allowed on the display
    displayEl.style.pointerEvents = "auto";

    // Append to the correct target
    targetRef.current.appendChild(displayEl);
    console.log("✅ Display attached to target:", isFullscreen ? "fullscreenRef" : "splitRef");

    // Connect
    console.log("🚀 Connecting...");
    client.connect();

    // Send initial size after short delay
    const initialSizeTimeout = setTimeout(() => {
      if (clientRef.current && targetRef.current) {
        const width = targetRef.current.offsetWidth || 1280;
        const height = targetRef.current.offsetHeight || 720;
        console.log("📐 Sending size:", width, "x", height);
        clientRef.current.sendSize(width, height, 96);

        // Diagnostics: list children and detect any sibling overlay nodes that might block
        const children = Array.from(targetRef.current.children).map((c: any) => ({
          tag: c.tagName,
          classes: c.className,
          z: window.getComputedStyle(c).zIndex,
          display: window.getComputedStyle(c).display,
          position: window.getComputedStyle(c).position
        }));
        console.log("Target children after attach:", children);

        const canvas = targetRef.current.querySelector('canvas');
        if (canvas) {
          console.log("✅ Canvas found:", (canvas as HTMLCanvasElement).width, "x", (canvas as HTMLCanvasElement).height);
        } else {
          console.warn("⚠️ No canvas element found in display (may render later)");
        }
      }
    }, 500);

    // Setup keyboard
    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => {
      if (clientRef.current) clientRef.current.sendKeyEvent(1, keysym);
    };
    keyboard.onkeyup = (keysym: number) => {
      if (clientRef.current) clientRef.current.sendKeyEvent(0, keysym);
    };
    keyboardRef.current = keyboard;

    // Setup mouse using the actual display element
    const mouse = new Guacamole.Mouse(displayEl);
    mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (mouseState: any) => {
      if (clientRef.current) clientRef.current.sendMouseState(mouseState);
    };
    mouseRef.current = mouse;

    // Handle resize
    const handleResize = () => {
      const activeTarget = isFullscreen ? fullscreenRef.current : splitRef.current;
      if (clientRef.current && activeTarget) {
        const width = activeTarget.offsetWidth || 1280;
        const height = activeTarget.offsetHeight || 720;
        clientRef.current.sendSize(width, height, 96);
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      clearTimeout(initialSizeTimeout);
      window.removeEventListener("resize", handleResize);

      if (keyboardRef.current) {
        keyboardRef.current.onkeydown = null;
        keyboardRef.current.onkeyup = null;
      }
      if (mouseRef.current) {
        mouseRef.current.onmousedown = null;
        mouseRef.current.onmouseup = null;
        mouseRef.current.onmousemove = null;
      }
      if (clientRef.current) {
        try { clientRef.current.disconnect(); } catch (e) { console.warn("Error disconnecting client on cleanup:", e); }
        clientRef.current = null;
      }

      // Clear any display nodes left behind
      [fullscreenRef, splitRef].forEach(r => {
        if (r.current) r.current.innerHTML = '';
      });
    };
    // Re-run when activeGuacUrl or isFullscreen changes
  }, [activeGuacUrl, isFullscreen]);

  const extractFileName = (filePath: string) => {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
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
    if (clientRef.current) {
      const [width, height] = resolution.split('x').map(Number);
      clientRef.current.sendSize(width, height, 96);
    }
  };

  const handleConnectToCredential = async (credential: any) => {
    try {
      setIsConnecting(true);
      setVmDropdownOpen(false);

      const tokenResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/connectToDatacenterVm`, {
        Protocol: credential.vmData?.protocol || 'RDP',
        VmId: credential.id,
        Ip: credential.ip,
        userName: credential.username,
        password: credential.password,
        port: credential.port,
      });

      if (tokenResponse.data.success && tokenResponse.data.token) {
        const newGuacUrl = `https://dcweb.golabing.ai/guacamole/#/?token=${tokenResponse.data.token.result}`;
        setActiveGuacUrl(newGuacUrl);
        setSelectedCredential(credential);
      } else {
        throw new Error('Failed to get connection token');
      }
    } catch (error: any) {
      console.error('Error connecting to VM:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePowerAction = (action: 'restart' | 'shutdown') => {
    console.log(`Power action: ${action}`);
    setIsPowerMenuOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
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
          {isGroupConnection && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>VMs: {credentialsList?.length || 0}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {documents.length > 0 && (
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className="btn-secondary text-gray-200"
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
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-secondary text-gray-200"
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

      {/* Main Content */}
      {isFullscreen ? (
        <div className="glass-panel p-0 overflow-hidden h-[calc(100vh-120px)]" style={{ position: 'relative' }}>
          <div className="bg-dark-400 p-2 flex justify-between items-center" style={{ zIndex: 40, position: 'relative' }}>
            {/* toolbar same as before */}
            <div className="flex items-center space-x-3">
              {/* power, resolution, dropdowns... (omitted for brevity; same as earlier) */}
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
              {/* rest of toolbar items unchanged; keeping them with high z-index so they appear above canvas */}
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <Minimize2 className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Connecting overlay has high z-index */}
          {isConnecting && (
            <div className="absolute inset-0 flex justify-center items-center bg-dark-400/90" style={{ zIndex: 60 }}>
              <Loader className="h-8 w-8 text-primary-400 animate-spin mr-3" />
              <span className="text-gray-300">Connecting to VM...</span>
            </div>
          )}

          {/* VM container: ensure z-index 0 */}
          <div
            ref={fullscreenRef}
            className="w-full h-[calc(100%-40px)]"
            style={{
              background: "transparent",
              overflow: "hidden",
              position: "relative",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "stretch",
              zIndex: 0
            }}
          />
        </div>
      ) : (
        <Split
          sizes={showDocuments && documents.length > 0 ? [splitRatio, 100 - splitRatio] : [100]}
          minSize={showDocuments && documents.length > 0 ? 300 : 100}
          gutterSize={showDocuments && documents.length > 0 ? 8 : 0}
          className="glass-panel p-0 overflow-hidden h-[calc(100vh-120px)] flex"
          onDragEnd={(sizes) => setSplitRatio(sizes[0])}
          gutter={() => {
            const gutter = document.createElement('div');
            gutter.className = "h-full w-2 bg-primary-500/20 hover:bg-primary-500/40 cursor-col-resize transition-colors";
            return gutter;
          }}
        >
          {/* VM Panel */}
          <div className="h-full flex flex-col">
            <div className="bg-dark-400 p-2 flex justify-between items-center" style={{ zIndex: 30, position: 'relative' }}>
              <div className="flex items-center space-x-3">
                {/* toolbar items (same as earlier) */}
              </div>
            </div>

            {isConnecting && (
              <div className="absolute inset-0 flex justify-center items-center bg-dark-400/90" style={{ zIndex: 60 }}>
                <Loader className="h-8 w-8 text-primary-400 animate-spin mr-3" />
                <span className="text-gray-300">Connecting to VM...</span>
              </div>
            )}

            <div
              ref={splitRef}
              className="flex-1"
              style={{
                background: "transparent",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "stretch",
                zIndex: 0
              }}
            />
          </div>

          {/* Documents Panel (ensure it is above the VM container) */}
          {showDocuments && documents.length > 0 && (
            <div className="h-full flex flex-col overflow-hidden" style={{ zIndex: 40 }}>
              <div className="flex justify-between items-center p-4 border-b border-primary-500/10 bg-dark-300" style={{ position: 'relative', zIndex: 45 }}>
                <h2 className="text-lg font-semibold text-primary-300">Lab Documents</h2>
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
                    className="btn-secondary py-1 px-3 text-sm text-gray-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2 text-gray-200" />
                    Open
                  </button>
                  <button
                    onClick={() => setShowDocuments(false)}
                    className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-auto">
                <iframe
                  src={`http://localhost:3002/uploads/${extractFileName(documents[currentDocIndex])}`}
                  className="w-full h-full border-0"
                  title="Lab Document"
                />
              </div>

              <div className="border-t border-primary-500/10 p-4 max-h-40 overflow-y-auto bg-dark-300/50">
                <h3 className="text-sm font-medium text-gray-400 mb-2">All Documents</h3>
                <div className="space-y-2">
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
