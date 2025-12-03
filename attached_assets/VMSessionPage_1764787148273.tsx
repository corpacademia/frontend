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
  PowerOff,
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

  const displayContainerRef = useRef<HTMLDivElement | null>(null);
  const displayCanvasRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<any>(null);
  const keyboardRef = useRef<any>(null);
  const mouseRef = useRef<any>(null);

  // NEW: track display + remote size for correct scaling
  const displayRef = useRef<any>(null);
  const remoteSizeRef = useRef<{ width: number; height: number } | null>(null);

  // Get data from location state
  const { guacUrl, vmTitle, credentials, isGroupConnection } = location.state || {};
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [activeGuacUrl, setActiveGuacUrl] = useState<string>(guacUrl || '');

  const credentialsList = credentials;

  // Available resolutions (used as zoom presets now)
  const resolutions = ['800x600', '1024x768', '1280x720', '1366x768', '1600x900', '1920x1080'];

  // Map "resolution" to zoom factor (relative to best fit)
  const resolutionScaleMap: Record<string, number> = {
    '800x600': 0.8,
    '1024x768': 0.9,
    '1280x720': 1.0,
    '1366x768': 1.05,
    '1600x900': 1.2,
    '1920x1080': 1.35,
  };

  // Helper: fit remote display into container with correct aspect ratio
  const fitDisplayToContainer = () => {
    const display = displayRef.current;
    const container = displayCanvasRef.current;
    const remoteSize = remoteSizeRef.current;

    if (!display || !container || !remoteSize) return;

    const containerWidth = container.clientWidth || container.offsetWidth;
    const containerHeight = container.clientHeight || container.offsetHeight;

    if (!containerWidth || !containerHeight) return;

    const baseScale = Math.min(
      containerWidth / remoteSize.width,
      containerHeight / remoteSize.height
    );

    const presetScale = resolutionScaleMap[selectedResolution] ?? 1.0;
    const finalScale = baseScale * presetScale;

    display.scale(finalScale);
  };

  // Extract documents from location
  useEffect(() => {
    const docs = location.state?.doc || location.state?.document || [];
    if (docs) {
      setDocuments(docs);
    }
  }, [location.state]);

  // Escape to exit fullscreen
  useEffect(() => {
    if (!activeGuacUrl && !isGroupConnection) {
      navigate('/dashboard/labs/cloud-vms');
    }

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [activeGuacUrl, navigate, isFullscreen, isGroupConnection]);

  // Initialize Guacamole WebSocket client
  useEffect(() => {
    if (!activeGuacUrl || !displayCanvasRef.current) return;

    console.log('🔌 Initializing Guacamole WebSocket for:', activeGuacUrl);

    // Clean up previous connection
    if (clientRef.current) {
      console.log('🧹 Cleaning up previous connection');
      if (keyboardRef.current) {
        keyboardRef.current.onkeydown = null;
        keyboardRef.current.onkeyup = null;
      }
      if (mouseRef.current) {
        mouseRef.current.onmousedown = null;
        mouseRef.current.onmouseup = null;
        mouseRef.current.onmousemove = null;
      }
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    setIsConnecting(true);

    // Clean up WebSocket URL
    let wsUrl = activeGuacUrl.replace('?undefined', '').replace('??', '?');
    console.log('🌐 WebSocket URL:', wsUrl);

    // Create WebSocket tunnel
    const tunnel = new Guacamole.WebSocketTunnel(wsUrl);

    tunnel.onerror = (status: any) => {
      console.error('❌ Tunnel error:', status);
      setIsConnecting(false);
    };

    tunnel.onstatechange = (state: number) => {
      console.log('📡 Tunnel state:', state);
      if (state === Guacamole.Tunnel.State.OPEN) {
        console.log('✅ Tunnel OPEN');
        setIsConnecting(false);
      } else if (state === Guacamole.Tunnel.State.CLOSED) {
        console.log('⚠️ Tunnel CLOSED');
        setIsConnecting(false);
      }
    };

    // Create Guacamole client
    const client = new Guacamole.Client(tunnel);
    clientRef.current = client;

    client.onstatechange = (state: number) => {
      console.log('🖥️ Client state:', state);
    };

    client.onerror = (error: any) => {
      console.error('❌ Client error:', error);
      setIsConnecting(false);
    };

    const display = client.getDisplay();
    displayRef.current = display;
    const displayEl = display.getElement();

    if (displayCanvasRef.current) {
      displayCanvasRef.current.innerHTML = '';
      displayCanvasRef.current.appendChild(displayEl);
      console.log('✅ Display element attached to DOM');
    }

    // Connect
    console.log('🚀 Connecting...');
    client.connect();

    // Wait for canvas, then store its size and fit into container
    const checkCanvas = () => {
      const canvas = displayEl.querySelector('canvas') as HTMLCanvasElement | null;
      if (canvas) {
        console.log('✅ Canvas found:', canvas.width, 'x', canvas.height);

        if (canvas.width && canvas.height) {
          remoteSizeRef.current = {
            width: canvas.width,
            height: canvas.height,
          };
        }

        fitDisplayToContainer();
        setIsConnecting(false);
      } else {
        console.log('⏳ Waiting for canvas to be created...');
        setTimeout(checkCanvas, 400);
      }
    };

    setTimeout(checkCanvas, 800);

    // Setup keyboard
    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => {
      if (clientRef.current) clientRef.current.sendKeyEvent(1, keysym);
    };
    keyboard.onkeyup = (keysym: number) => {
      if (clientRef.current) clientRef.current.sendKeyEvent(0, keysym);
    };
    keyboardRef.current = keyboard;

    // Setup mouse attached to the display element
    const mouse = new Guacamole.Mouse(displayEl);
    const handleMouseState = (mouseState: any) => {
      if (clientRef.current) {
        clientRef.current.sendMouseState(mouseState);
      }
    };
    mouse.onmousedown = handleMouseState;
    mouse.onmouseup = handleMouseState;
    mouse.onmousemove = handleMouseState;
    mouseRef.current = mouse;

    // Allow keyboard focus
    displayEl.setAttribute('tabindex', '0');
    displayEl.focus();

    const handleResize = () => {
      // On any window resize (including fullscreen change), just rescale
      fitDisplayToContainer();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
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
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [activeGuacUrl]);

  // Re-fit on layout changes (fullscreen toggle, docs show/hide, split ratio change)
  useEffect(() => {
    // small delay so DOM can finish layout
    const id = setTimeout(fitDisplayToContainer, 50);
    return () => clearTimeout(id);
  }, [isFullscreen, showDocuments, splitRatio, selectedResolution]);

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
    // Now this only changes zoom preset; no sendSize (avoids tunnel crash)
    setSelectedResolution(resolution);
    setIsControlsOpen(false);
    fitDisplayToContainer();
  };

  const handleConnectToCredential = async (credential: any) => {
    try {
      console.log('🔌 Connecting to credential:', credential);
      setIsConnecting(true);
      setVmDropdownOpen(false);

      // Clean up previous connection
      if (clientRef.current) {
        console.log('🧹 Cleaning up previous connection');
        if (keyboardRef.current) {
          keyboardRef.current.onkeydown = null;
          keyboardRef.current.onkeyup = null;
        }
        if (mouseRef.current) {
          mouseRef.current.onmousedown = null;
          mouseRef.current.onmouseup = null;
          mouseRef.current.onmousemove = null;
        }
        clientRef.current.disconnect();
        clientRef.current = null;
      }

      const resp = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
        {
          protocol: credential.vmData?.protocol || 'RDP',
          hostname: credential.ip,
          username: credential.username,
          password: credential.password,
          port: credential.port,
        }
      );

      if (resp.data.success) {
        const wsPath = resp.data.wsPath; // e.g. /rdp?token=...
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const hostPort = `${window.location.hostname}:${3002}`;
        const wsUrl = `${protocol}://${hostPort}${wsPath}`;

        console.log('🌐 WebSocket URL (credential):', wsUrl);

        // Replace activeGuacUrl – this will trigger the main useEffect and reuse setup
        setActiveGuacUrl(wsUrl);
        setSelectedCredential(credential);
      } else {
        throw new Error('Failed to get connection token');
      }
    } catch (error: any) {
      console.error('❌ Error connecting to VM:', error);
      setIsConnecting(false);
    }
  };

  const handlePowerAction = (action: 'restart' | 'shutdown') => {
    console.log(`Power action: ${action}`);
    setIsPowerMenuOpen(false);
    // TODO: call backend for power control if available
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
        // ===================== FULLSCREEN MODE =====================
        <div className="glass-panel p-0 overflow-hidden h-[calc(100vh-120px)] relative flex flex-col">
          {/* Toolbar */}
          <div className="bg-dark-400 p-2 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Power menu */}
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

              {/* Resolution menu */}
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
                    {resolutions.map((resolution) => (
                      <button
                        key={resolution}
                        onClick={() => handleResolutionChange(resolution)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-300/50 transition-colors ${
                          selectedResolution === resolution
                            ? 'text-primary-400'
                            : 'text-gray-300'
                        }`}
                      >
                        {resolution}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Group VM dropdown */}
              {isGroupConnection && (
                <div className="relative">
                  <button
                    onClick={() => setVmDropdownOpen(!vmDropdownOpen)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Server className="h-5 w-5 text-primary-400" />
                    <span className="text-sm text-gray-300">
                      {selectedCredential
                        ? selectedCredential.vmData?.vmname || 'VM'
                        : 'Select VM'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  {vmDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50 max-h-64 overflow-y-auto">
                      {credentialsList?.map((cred: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleConnectToCredential(cred)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-300/50 transition-colors ${
                            selectedCredential?.id === cred.id
                              ? 'text-primary-400 bg-primary-500/10'
                              : 'text-gray-300'
                          }`}
                        >
                          {cred.vmData?.vmname || `VM ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Credentials for single VM */}
              {!isGroupConnection && credentialsList && (
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
                        {credentialsList?.map((cred: any, index: number) => (
                          <div key={index} className="p-2 bg-dark-300/50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <label className="text-xs text-gray-400 block">Username</label>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300">
                                    {cred.username}
                                  </span>
                                  <button
                                    onClick={() =>
                                      navigator.clipboard.writeText(cred.username)
                                    }
                                    className="text-xs text-primary-400 hover:text-primary-300"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-400 block">Password</label>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300">
                                    {cred.password}
                                  </span>
                                  <button
                                    onClick={() =>
                                      navigator.clipboard.writeText(cred.password)
                                    }
                                    className="text-xs text-primary-400 hover:text-primary-300"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <Minimize2 className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* VM Display */}
          <div
            ref={displayContainerRef}
            className="flex-1 w-full overflow-hidden"
            style={{
              minHeight: 0,
              position: 'relative',
              backgroundColor: '#000',
            }}
          >
            <div
              ref={displayCanvasRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
              }}
            />
          </div>

          {isConnecting && (
            <div className="absolute inset-0 flex justify-center items-center bg-dark-400/90 z-50">
              <Loader className="h-8 w-8 text-primary-400 animate-spin mr-3" />
              <span className="text-gray-300">Connecting to VM...</span>
            </div>
          )}
        </div>
      ) : (
        // ===================== SPLIT MODE (VM + DOCUMENTS) =====================
        <Split
          sizes={
            showDocuments && documents.length > 0 ? [splitRatio, 100 - splitRatio] : [100]
          }
          minSize={showDocuments && documents.length > 0 ? 300 : 100}
          gutterSize={showDocuments && documents.length > 0 ? 8 : 0}
          className="glass-panel p-0 overflow-hidden h-[calc(100vh-120px)] flex"
          onDragEnd={(sizes) => {
            setSplitRatio(sizes[0]);
          }}
          gutter={() => {
            const gutter = document.createElement('div');
            gutter.className =
              'h-full w-2 bg-primary-500/20 hover:bg-primary-500/40 cursor-col-resize transition-colors';
            return gutter;
          }}
        >
          {/* LEFT: VM Panel */}
          <div className="h-full w-full flex flex-col bg-dark-200 overflow-hidden relative">
            {/* VM Toolbar */}
            <div className="bg-dark-400 p-2 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Power menu */}
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

                {/* Resolution menu */}
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
                      {resolutions.map((resolution) => (
                        <button
                          key={resolution}
                          onClick={() => handleResolutionChange(resolution)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-300/50 transition-colors ${
                            selectedResolution === resolution
                              ? 'text-primary-400'
                              : 'text-gray-300'
                          }`}
                        >
                          {resolution}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* VM dropdown */}
                {isGroupConnection && (
                  <div className="relative">
                    <button
                      onClick={() => setVmDropdownOpen(!vmDropdownOpen)}
                      className="p-2 hover:bg-dark-300 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Server className="h-5 w-5 text-primary-400" />
                      <span className="text-sm text-gray-300">
                        {selectedCredential
                          ? selectedCredential.vmData?.vmname || 'VM'
                          : 'Select VM'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    {vmDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50 max-h-64 overflow-y-auto">
                        {credentialsList?.map((cred: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleConnectToCredential(cred)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-300/50 transition-colors ${
                              selectedCredential?.id === cred.id
                                ? 'text-primary-400 bg-primary-500/10'
                                : 'text-gray-300'
                            }`}
                          >
                            {cred.vmData?.vmname || `VM ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Credentials (single VM) */}
                {!isGroupConnection && credentialsList && (
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
                          {credentialsList?.map((cred: any, index: number) => (
                            <div key={index} className="p-2 bg-dark-300/50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-400 block">
                                    Username
                                  </label>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">
                                      {cred.username}
                                    </span>
                                    <button
                                      onClick={() =>
                                        navigator.clipboard.writeText(cred.username)
                                      }
                                      className="text-xs text-primary-400 hover:text-primary-300"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-400 block">
                                    Password
                                  </label>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">
                                      {cred.password}
                                    </span>
                                    <button
                                      onClick={() =>
                                        navigator.clipboard.writeText(cred.password)
                                      }
                                      className="text-xs text-primary-400 hover:text-primary-300"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* VM display */}
            <div
              ref={displayContainerRef}
              className="flex-1 w-full overflow-hidden"
              style={{
                minHeight: 0,
                position: 'relative',
                backgroundColor: '#000',
              }}
            >
              <div
                ref={displayCanvasRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1,
                }}
              />
            </div>

            {isConnecting && (
              <div className="absolute inset-0 flex justify-center items-center bg-dark-400/90 z-50">
                <Loader className="h-8 w-8 text-primary-400 animate-spin mr-3" />
                <span className="text-gray-300">Connecting to VM...</span>
              </div>
            )}
          </div>

          {/* RIGHT: Documents Panel */}
          {showDocuments && documents.length > 0 ? (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-primary-500/10 bg-dark-300">
                <h2 className="text-lg font-semibold text-primary-300">Lab Documents</h2>
                <div className="flex items-center space-x-2">
                  {documents.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevDocument}
                        disabled={currentDocIndex === 0}
                        className={`p-1 rounded-lg ${
                          currentDocIndex === 0
                            ? 'text-gray-500'
                            : 'text-primary-400 hover:bg-primary-500/10'
                        }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-sm text-gray-400">
                        {currentDocIndex + 1} / {documents.length}
                      </span>
                      <button
                        onClick={handleNextDocument}
                        disabled={currentDocIndex === documents.length - 1}
                        className={`p-1 rounded-lg ${
                          currentDocIndex === documents.length - 1
                            ? 'text-gray-500'
                            : 'text-primary-400 hover:bg-primary-500/10'
                        }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      window.open(
                        `http://localhost:3002/uploads/${extractFileName(
                          documents[currentDocIndex]
                        )}`,
                        '_blank'
                      )
                    }
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
                  src={`http://localhost:3002/uploads/${extractFileName(
                    documents[currentDocIndex]
                  )}`}
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
                        <span className="text-sm truncate">
                          {extractFileName(doc)}
                        </span>
                      </div>
                      <Download
                        className="h-4 w-4 text-primary-400 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `http://localhost:3002/uploads/${extractFileName(doc)}`,
                            '_blank'
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div /> // empty right panel when docs hidden
          )}
        </Split>
      )}
    </div>
  );
};
