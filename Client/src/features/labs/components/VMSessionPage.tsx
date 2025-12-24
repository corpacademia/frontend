import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { GradientText } from "../../../components/ui/GradientText";
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
} from "lucide-react";
import axios from "axios";
import Split from "react-split";
import Guacamole from "guacamole-common-js";

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
  const [selectedResolution, setSelectedResolution] = useState("1280x720");
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [vmDropdownOpen, setVmDropdownOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState(70);

  const displayContainerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLDivElement>(null);

  const clientRef = useRef<any>(null);
  const keyboardRef = useRef<any>(null);
  const mouseRef = useRef<any>(null);

  // 🔥 store CSS scales so mouse mapping can use them
  const scaleXRef = useRef(1);
  const scaleYRef = useRef(1);

  const { guacUrl, vmTitle, credentials, isGroupConnection } = location.state || {};
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [activeGuacUrl, setActiveGuacUrl] = useState<string>(guacUrl || "");

  const credentialsList = credentials;

  const resolutions = ["800x600", "1024x768", "1280x720", "1366x768", "1600x900", "1920x1080"];

  const extractFileName = (filePath: string) => {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : "";
  };

  // Load documents from location
  useEffect(() => {
    const docs = location.state?.doc || location.state?.document || [];
    setDocuments(docs);
  }, [location.state]);

  // Escape → exit fullscreen
  useEffect(() => {
    if (!activeGuacUrl && !isGroupConnection) {
      navigate("/dashboard/labs/cloud-vms");
    }

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [activeGuacUrl, navigate, isFullscreen, isGroupConnection]);

  // 🔥 Central size/scale update – used for fullscreen + window resize + split drag
  // Uses auto-detected framebuffer size from the Guac canvas
  const updateDisplaySize = useCallback(() => {
    if (!clientRef.current || !displayCanvasRef.current) return;

    const container = displayCanvasRef.current;

    const containerWidth = container.offsetWidth || 1280;
    const containerHeight = container.offsetHeight || 720;

    // Try to detect current VM framebuffer size from the canvas
    const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;

    const framebufferWidth = canvas?.width || containerWidth || 1280;
    const framebufferHeight = canvas?.height || containerHeight || 720;

    // Independent scale factors (stretch to fill)
    const scaleX = containerWidth / framebufferWidth;
    const scaleY = containerHeight / framebufferHeight;

    // Save for mouse mapping
    scaleXRef.current = scaleX;
    scaleYRef.current = scaleY;

    try {
      // We don't use display.scale() anymore (it enforces uniform scaling)
      const root = container.firstElementChild as HTMLElement | null; // this is display.getElement()
      if (root) {
        root.style.transformOrigin = "top left";
        root.style.transform = `scale(${scaleX}, ${scaleY})`;
        root.style.position = "absolute";
        root.style.left = "0";
        root.style.top = "0";
      }

      // Inform Guacamole of the logical size we want;
      // here we keep using container size as target resolution.
      clientRef.current.sendSize(containerWidth, containerHeight, 96);

      console.log(
        "📐 updateDisplaySize:",
        "container:",
        containerWidth,
        "x",
        containerHeight,
        "fb:",
        framebufferWidth,
        "x",
        framebufferHeight,
        "scaleX:",
        scaleX,
        "scaleY:",
        scaleY
      );
    } catch (err) {
      console.warn("⚠️ updateDisplaySize error:", err);
    }
  }, []);

  // Window resize → update size
  useEffect(() => {
    const onResize = () => updateDisplaySize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateDisplaySize]);

  // Fullscreen toggle, docs panel resize, split drag → recalc size
  useEffect(() => {
    updateDisplaySize();
  }, [isFullscreen, updateDisplaySize, showDocuments, splitRatio]);

  // ---------------------------------------
  // Guacamole initialization (ONLY when activeGuacUrl changes)
  // ---------------------------------------
  useEffect(() => {
    if (!activeGuacUrl) return;
    if (!displayCanvasRef.current) return;

    console.log("🔌 Initializing Guacamole WebSocket for:", activeGuacUrl);

    // Clean up previous client if any
    if (clientRef.current) {
      console.log("🧹 Cleaning old client");
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    setIsConnecting(true);

    const wsUrl = activeGuacUrl.replace("?undefined", "").replace("??", "?");
    console.log("🌐 WebSocket URL:", wsUrl);

    const tunnel = new Guacamole.WebSocketTunnel(wsUrl);

    tunnel.onerror = (status: any) => {
      console.error("❌ Tunnel error:", status);
      setIsConnecting(false);
    };

    tunnel.onstatechange = (state: number) => {
      console.log("📡 Tunnel state:", state);
      if (state === Guacamole.Tunnel.State.CLOSED) {
        setIsConnecting(false);
      }
    };

    const client = new Guacamole.Client(tunnel);
    clientRef.current = client;

    client.onstatechange = (state: number) => {
      console.log("🖥️ Client state:", state);
    };

    client.onerror = (error: any) => {
      console.error("❌ Client error:", error);
      setIsConnecting(false);
    };

    const display = client.getDisplay();
    const displayEl = display.getElement();

    // Attach displayEl into our canvas container
    if (displayCanvasRef.current) {
      displayCanvasRef.current.innerHTML = "";
      displayCanvasRef.current.appendChild(displayEl);
      console.log("✅ Display element attached");
    }

    client.connect();

    // Wait until server actually draws canvas
    const checkCanvas = () => {
      const canvas = displayEl.querySelector("canvas") as HTMLCanvasElement | null;
      if (canvas) {
        console.log("✅ Canvas found:", canvas.width, "x", canvas.height);
        setIsConnecting(false);
        updateDisplaySize();
      } else {
        console.log("⏳ Waiting for canvas...");
        setTimeout(checkCanvas, 500);
      }
    };
    setTimeout(checkCanvas, 800);

    // Keyboard
    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => {
      if (clientRef.current) clientRef.current.sendKeyEvent(1, keysym);
    };
    keyboard.onkeyup = (keysym: number) => {
      if (clientRef.current) clientRef.current.sendKeyEvent(0, keysym);
    };
    keyboardRef.current = keyboard;

    // Mouse (uses our CSS scale refs)
    const mouse = new Guacamole.Mouse(display.getElement());
    mouse.onmousedown =
      mouse.onmouseup =
      mouse.onmousemove =
        (mouseState: any) => {
          if (!clientRef.current) return;

          const scaledState = new Guacamole.Mouse.State(
            mouseState.x / scaleXRef.current,
            mouseState.y / scaleYRef.current,
            mouseState.left,
            mouseState.middle,
            mouseState.right,
            mouseState.up,
            mouseState.down
          );

          clientRef.current.sendMouseState(scaledState);
        };
    mouseRef.current = mouse;

    // Focus to capture keyboard
    displayEl.setAttribute("tabindex", "0");
    displayEl.focus();

    // Cleanup
    return () => {
      console.log("🧹 Cleanup Guacamole");
      if (keyboardRef.current) {
        keyboardRef.current.onkeydown = null;
        keyboardRef.current.onkeyup = null;
        keyboardRef.current = null;
      }
      if (mouseRef.current) {
        mouseRef.current.onmousedown = null;
        mouseRef.current.onmouseup = null;
        mouseRef.current.onmousemove = null;
        mouseRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [activeGuacUrl, updateDisplaySize]);

  // ---------------------------------------
  // Handlers
  // ---------------------------------------

  const handleNextDocument = () => {
    if (currentDocIndex < documents.length - 1) {
      setCurrentDocIndex((i) => i + 1);
    }
  };

  const handlePrevDocument = () => {
    if (currentDocIndex > 0) {
      setCurrentDocIndex((i) => i - 1);
    }
  };

  // 🔥 This does NOT reconnect. It sends a size instruction inside the same session.
  const handleResolutionChange = (resolution: string) => {
    setSelectedResolution(resolution);
    setIsControlsOpen(false);
    console.log("Resolution:", resolution);

    if (clientRef.current) {
      const [w, h] = resolution.split("x").map(Number);
      console.log("📨 sendSize from dropdown:", w, "x", h);
      clientRef.current.sendSize(w, h, 96);
    }

    // Also adjust local scaling to fill container
    setTimeout(() => updateDisplaySize(), 200);
  };

  const handleConnectToCredential = async (credential: any) => {
    try {
      console.log("🔌 Connecting to credential:", credential);
      setIsConnecting(true);
      setVmDropdownOpen(false);

      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }

      const resp = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
        {
          protocol: credential.vmData?.protocol || credential?.protocol ||"RDP",
          hostname: credential.ip,
          username: credential.username,
          password: credential.password,
          port: credential.port,
        }
      );

      if (resp.data.success) {
        const wsPath = resp.data.wsPath;
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const hostPort = `${window.location.hostname}:3002`; // adjust if needed
        const wsUrl = `${protocol}://${hostPort}${wsPath}`;
        console.log("🌐 WebSocket URL (credential):", wsUrl);
        setActiveGuacUrl(wsUrl);
        setSelectedCredential(credential);
      } else {
        throw new Error("Failed to get connection token");
      }
    } catch (err) {
      console.error("❌ Error connecting to VM:", err);
      setIsConnecting(false);
    }
  };

  const handlePowerAction = (action: "restart" | "shutdown") => {
    console.log("⚡ Power action:", action);
    setIsPowerMenuOpen(false);
    // TODO: backend call for restart/shutdown if you have it
  };

  // ---------------------------------------
  // Render
  // ---------------------------------------
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
            <GradientText>{vmTitle || "VM Session"}</GradientText>
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
              onClick={() => setShowDocuments((v) => !v)}
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
            onClick={() => setIsFullscreen((v) => !v)}
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

      {/* Main content – SAME layout always. Fullscreen is only CSS */}
      <div
        className={
          isFullscreen
            ? "fixed inset-0 z-40 bg-dark-900 flex flex-col"
            : "glass-panel p-0 overflow-hidden h-[calc(100vh-120px)] flex flex-col"
        }
      >
        <Split
          sizes={showDocuments && documents.length > 0 ? [splitRatio, 100 - splitRatio] : [100]}
          minSize={showDocuments && documents.length > 0 ? 300 : 100}
          gutterSize={showDocuments && documents.length > 0 ? 8 : 0}
          className="flex flex-1 overflow-hidden"
          onDragEnd={(sizes) => setSplitRatio(sizes[0])}
          gutter={() => {
            const gutter = document.createElement("div");
            gutter.className =
              "h-full w-2 bg-primary-500/20 hover:bg-primary-500/40 cursor-col-resize transition-colors";
            return gutter;
          }}
        >
          {/* LEFT: VM PANEL */}
          <div className="h-full w-full flex flex-col bg-dark-200 overflow-hidden relative">
            {/* Toolbar */}
            <div className="bg-dark-400 p-2 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Power menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsPowerMenuOpen((v) => !v)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors text-red-400"
                  >
                    <Power className="h-5 w-5" />
                  </button>
                  {isPowerMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                      <button
                        onClick={() => handlePowerAction("restart")}
                        className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-dark-300/50 transition-colors flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restart
                      </button>
                      <button
                        onClick={() => handlePowerAction("shutdown")}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
                      >
                        <PowerOff className="h-4 w-4 mr-2" />
                        Shutdown
                      </button>
                    </div>
                  )}
                </div>

                {/* Resolution */}
                <div className="relative">
                  <button
                    onClick={() => setIsControlsOpen((v) => !v)}
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
                              ? "text-primary-400"
                              : "text-gray-300"
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
                      onClick={() => setVmDropdownOpen((v) => !v)}
                      className="p-2 hover:bg-dark-300 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Server className="h-5 w-5 text-primary-400" />
                      <span className="text-sm text-gray-300">
                        {selectedCredential
                          ? selectedCredential.vmData?.vmname || "VM"
                          : "Select VM"}
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
                                ? "text-primary-400 bg-primary-500/10"
                                : "text-gray-300"
                            }`}
                          >
                            {cred.vmData?.vmname || `VM ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Credentials (non-group) */}
                {(!isGroupConnection || isGroupConnection) && credentialsList && (
                  <div className="relative">
                    <button
                      onClick={() => setShowCredentials((v) => !v)}
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
            </div>

            {/* VM Display area */}
            <div
              ref={displayContainerRef}
              className="flex-1 w-full overflow-hidden"
              style={{
                minHeight: 0,
                position: "relative",
                backgroundColor: "#000",
              }}
            >
              <div
                ref={displayCanvasRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
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

          {/* RIGHT: DOCUMENTS PANEL */}
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
                            ? "text-gray-500"
                            : "text-primary-400 hover:bg-primary-500/10"
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
                            ? "text-gray-500"
                            : "text-primary-400 hover:bg-primary-500/10"
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
                        "_blank"
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
                          ? "bg-primary-500/20 text-primary-300"
                          : "bg-dark-300/50 text-gray-300 hover:bg-dark-300"
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
                          window.open(
                            `http://localhost:3002/uploads/${extractFileName(doc)}`,
                            "_blank"
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div /> // empty right panel
          )}
        </Split>
      </div>
    </div>
  );
};
