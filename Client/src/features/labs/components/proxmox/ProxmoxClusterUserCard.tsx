import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Server, Power, Square, RefreshCw, Eye, EyeOff,
  Check, AlertCircle, Loader, Monitor, Terminal, Globe,
  Calendar, Clock, Layers, X, Users, Trash2
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface UserVM {
  id:           string;
  vm_label:     string;
  proxmox_vmid: number | null;
  vmname:       string;
  node:         string;
  protocol:     string;
  username:     string;
  password:     string;
  ip:           string | null;
  port:         string | null;
  islaunched:   boolean;
  isrunning:    boolean;
  isprocessing: boolean;
  liveStatus?:  string;
}

interface Assignment {
  id:        string;
  labid:     string;
  status:    string;
  isrunning: boolean;
  startdate: string;
  enddate:   string;
  purchased: boolean;
}

interface LabInfo {
  labid:       string;
  title:       string;
  description: string;
  software:    string[];
  labguide?:   any[];
}

interface ProxmoxClusterUserCardProps {
  assignment: Assignment;
  lab:        LabInfo | null;
  vms:        UserVM[];
  onDelete?:  () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const protocolIcon = (protocol: string) => {
  if (protocol === 'SSH') return <Terminal className="h-3.5 w-3.5" />;
  if (protocol === 'VNC') return <Globe    className="h-3.5 w-3.5" />;
  return                         <Monitor  className="h-3.5 w-3.5" />;
};

const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const assignmentStatusCls = (status: string) => {
  if (status === 'active' || status === 'available') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'expired')                          return 'bg-red-500/20 text-red-300';
  return 'bg-amber-500/20 text-amber-300';
};

/** Build a Guacamole WS URL from wsPath returned by backend */
const buildWsUrl = (wsPath: string) => {
  const proto    = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const hostPort = `${window.location.hostname}:3002`;
  return `${proto}://${hostPort}${wsPath}`;
};

/**
 * Build the credentials array expected by VMSessionPage.
 * Each entry must have: { id, ip, port, username, password, protocol, vmData: { protocol, vmname } }
 * VMSessionPage reads credential.vmData?.protocol  for handleConnectToCredential
 * and  credential.vmData?.vmname  for the VM dropdown label.
 */
const buildCredential = (vm: UserVM) => ({
  id:       vm.id,
  ip:       vm.ip       || '',
  port:     vm.port     || (vm.protocol === 'SSH' ? '22' : vm.protocol === 'VNC' ? '5900' : '3389'),
  username: vm.username || '',
  password: vm.password || '',
  protocol: vm.protocol || 'RDP',
  vmData: {
    protocol: (vm.protocol || 'RDP').toLowerCase(),
    vmname:   vm.vm_label || vm.vmname || vm.id,
  },
});

// ─── VM Details Modal ─────────────────────────────────────────────────────────

interface VMModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  assignment:  Assignment;
  lab:         LabInfo | null;
  vms:         UserVM[];
  onVmsUpdate: (vms: UserVM[]) => void;
}

export const VMModal: React.FC<VMModalProps> = ({
  isOpen, onClose, assignment, lab, vms, onVmsUpdate
}) => {
  const navigate = useNavigate();

  const [isLaunching,    setIsLaunching]    = useState(false);
  const [isStopping,     setIsStopping]     = useState(false);
  const [isPolling,      setIsPolling]      = useState(false);
  const [startingVM,     setStartingVM]     = useState<string | null>(null);
  const [stoppingVM,     setStoppingVM]     = useState<string | null>(null);
  const [connectingVM,   setConnectingVM]   = useState<string | null>(null);
  const [connectingAll,  setConnectingAll]  = useState(false);
  const [showPass,       setShowPass]       = useState<Record<string, boolean>>({});
  const [notification,   setNotification]   = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Track which VM row IDs are pending IP (same pattern as ProxmoxClusterVMListModal)
  const pendingVmIds   = useRef<Set<string>>(new Set());
  const autoPollerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Poll VM status from Proxmox ──────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    if (!assignment?.id) return;
    setIsPolling(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterVMStatus`,
        { assignmentId: assignment.id }
      );
      if (res.data.success) {
        onVmsUpdate(res.data.data);
        // Remove from pending when the VM has a known stable state:
        //   - has an IP (fully running, guest-agent confirmed)
        //   - OR is not running (stopped/provisioned but not started)
        (res.data.data || []).forEach((v: any) => {
          const isStable = Boolean(v.ip) || !v.isrunning;
          if (isStable && pendingVmIds.current.has(v.id)) {
            pendingVmIds.current.delete(v.id);
          }
        });
      }
    } catch (e) { /* silent */ }
    setIsPolling(false);
  }, [assignment?.id]);

  // ── Auto-poller: runs every 4 s while there are pending VMs ─────────────
  const startAutoPoller = useCallback(() => {
    if (autoPollerRef.current) clearInterval(autoPollerRef.current);
    autoPollerRef.current = setInterval(async () => {
      if (pendingVmIds.current.size === 0) {
        clearInterval(autoPollerRef.current!);
        autoPollerRef.current = null;
        return;
      }
      await pollStatus();
    }, 4000);
  }, [pollStatus]);

  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      await pollStatus();

      // For VMs already provisioned (have a proxmox_vmid), kick off the
      // auto-poller so live status is always refreshed on every open.
      const alreadyProvisioned = vms.filter(v => v.proxmox_vmid);
      if (alreadyProvisioned.length > 0) {
        alreadyProvisioned.forEach(v => pendingVmIds.current.add(v.id));
        startAutoPoller();
      }
    };
    init();

    return () => {
      // Fully clean up on close so stale state never leaks into the next open
      if (autoPollerRef.current) clearInterval(autoPollerRef.current);
      autoPollerRef.current = null;
      pendingVmIds.current.clear();
    };
  }, [isOpen]);

  // ── Launch All — clone + start every VM, update DB ────────────────────────
  const handleLaunchAll = async () => {
    setIsLaunching(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchProxmoxClusterVMs`,
        { assignmentId: assignment.id }
      );
      if (res.data.success) {
        // Backend handles DB update (sets islaunched/isrunning per VM row)
        const updated = res.data.data.map((v: any) => ({
          ...v,
          liveStatus: v.isrunning ? 'running' : 'stopped',
        }));
        onVmsUpdate(updated);
        notify('success', 'All VMs launched successfully');
        // Mark all VMs as pending IP and start auto-polling (same as ProxmoxClusterVMListModal)
        updated.forEach((v: any) => pendingVmIds.current.add(v.id));
        startAutoPoller();
      } else {
        throw new Error(res.data.message);
      }
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to launch VMs');
    } finally { setIsLaunching(false); }
  };

  // ── Stop All — stop every VM, update DB ───────────────────────────────────
  const handleStopAll = async () => {
    if (!window.confirm('Stop all VMs in this lab?')) return;
    setIsStopping(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/stopProxmoxClusterVMs`,
        { assignmentId: assignment.id }
      );
      if (res.data.success) {
        // Backend sets isrunning=false in DB; reflect in frontend
        onVmsUpdate(vms.map(v => ({ ...v, isrunning: false, liveStatus: 'stopped' })));
        notify('success', 'All VMs stopped');
      } else {
        throw new Error(res.data.message);
      }
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to stop VMs');
    } finally { setIsStopping(false); }
  };

  // ── Start single VM — starts on Proxmox, updates DB row ──────────────────
  const handleStartVM = async (vmRowId: string) => {
    setStartingVM(vmRowId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/startSingleProxmoxClusterVM`,
        { vmRowId }
      );
      if (res.data.success) {
        // Backend sets isrunning=true; reflect in frontend state
        onVmsUpdate(
          vms.map(v =>
            v.id === vmRowId
              ? { ...v, isrunning: res.data.data?.isrunning ?? true, liveStatus: 'running' }
              : v
          )
        );
        notify('success', 'VM started');
        // Mark as pending IP and start auto-polling until IP arrives
        pendingVmIds.current.add(vmRowId);
        startAutoPoller();
      } else {
        throw new Error(res.data.message);
      }
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to start VM');
    } finally { setStartingVM(null); }
  };

  // ── Stop single VM — stops on Proxmox, updates DB row ────────────────────
  const handleStopVM = async (vmRowId: string) => {
    setStoppingVM(vmRowId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/stopSingleProxmoxClusterVM`,
        { vmRowId }
      );
      if (res.data.success) {
        // Backend sets isrunning=false; reflect in frontend state
        onVmsUpdate(
          vms.map(v =>
            v.id === vmRowId
              ? { ...v, isrunning: false, liveStatus: 'stopped' }
              : v
          )
        );
        notify('success', 'VM stopped');
      } else {
        throw new Error(res.data.message);
      }
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to stop VM');
    } finally { setStoppingVM(null); }
  };

  // ── Get Guac URL for a single VM ─────────────────────────────────────────
  const getGuacUrl = async (vm: UserVM): Promise<string> => {
    console.log("VM:",vm);
    const resp = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
      {
        protocol: vm.protocol || 'RDP',
        hostname: vm.ip,
        port:     vm.port || (vm.protocol === 'SSH' ? '22' : vm.protocol === 'VNC' ? '5900' : '3389'),
        username: vm.username,
        password: vm.password,
      }
    );
    if (!resp.data.success) throw new Error('Failed to get connection token');
    return buildWsUrl(resp.data.wsPath);
  };

  // ── Connect single VM ─────────────────────────────────────────────────────
  // Navigates to VMSessionPage with correct state shape:
  //   guacUrl, vmTitle, credentials[], isGroupConnection, labDetails (optional)
  // All running VMs are passed as credentials so the user can switch
  const handleConnect = async (vm: UserVM) => {
    if (!vm.ip) {
      notify('error', 'VM has no IP — start it first and wait for it to boot');
      return;
    }
    setConnectingVM(vm.id);
    try {
      const wsUrl = await getGuacUrl(vm);

      // All running VMs passed as credentials for the VM switcher in VMSessionPage
      const runningVMs = vms.filter(v => (v.isrunning || v.liveStatus === 'running') && v.ip);
      const credentials = runningVMs.length > 1
        ? runningVMs.map(buildCredential)
        : [buildCredential(vm)];

      navigate(`/dashboard/labs/vm-session/${lab?.labid || assignment.labid}`, {
        state: {
          guacUrl:           wsUrl,
          vmTitle:           `${lab?.title || 'Cluster'} — ${vm.vm_label}`,
          credentials,
          isGroupConnection: credentials.length > 1,
          doc:               lab?.labguide || [],
          labDetails:        null,   // cluster VMs have no single labDetails
        },
      });
    } catch (e: any) {
      notify('error', e.message || 'Failed to connect to VM');
    } finally { setConnectingVM(null); }
  };

  // ── Connect All running VMs ───────────────────────────────────────────────
  // Gets a Guac URL for each running VM in parallel, then navigates.
  // Uses the first VM's URL as the initial guacUrl; VMSessionPage's
  // VM dropdown (handleConnectToCredential) lets the user switch between them.
  const handleConnectAll = async () => {
    const runningVMs = vms.filter(v => (v.isrunning || v.liveStatus === 'running') && v.ip);
    if (runningVMs.length === 0) {
      notify('error', 'No running VMs with an IP — launch them first');
      return;
    }
    setConnectingAll(true);
    notify('success', `Getting connection tokens for ${runningVMs.length} VM(s)...`);
    try {
      // Fetch all Guac URLs in parallel
      const results = await Promise.allSettled(
        runningVMs.map(async vm => ({ vm, wsUrl: await getGuacUrl(vm) }))
      );

      const successes = results
        .filter((r): r is PromiseFulfilledResult<{ vm: UserVM; wsUrl: string }> => r.status === 'fulfilled')
        .map(r => r.value);

      if (successes.length === 0) {
        notify('error', 'Could not get connection tokens for any VM');
        return;
      }

      const failures = results.filter(r => r.status === 'rejected').length;
      if (failures > 0) {
        notify('error', `${failures} VM(s) failed — connecting to ${successes.length} available`);
      }

      const credentials = successes.map(({ vm }) => buildCredential(vm));
      navigate(`/dashboard/labs/vm-session/${lab?.labid || assignment.labid}`, {
        state: {
          guacUrl:           successes[0].wsUrl,
          vmTitle:           lab?.title || 'Proxmox Cluster Lab',
          credentials,
          isGroupConnection: credentials.length > 1,
          doc:               lab?.labguide || [],
          labDetails:        null,
        },
      });
    } catch (e: any) {
      notify('error', e.message || 'Failed to connect');
    } finally { setConnectingAll(false); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const anyRunning        = vms.some(v => v.isrunning || v.liveStatus === 'running');
  const runningCount      = vms.filter(v => v.isrunning || v.liveStatus === 'running').length;
  const allProvisioned    = vms.length > 0 && vms.every(v => v.proxmox_vmid);
  const isAlreadyLaunched = vms.some(v => v.islaunched);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-dark-200 rounded-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              <GradientText>My VMs — {lab?.title || 'Proxmox Cluster Lab'}</GradientText>
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {vms.length} VM{vms.length !== 1 ? 's' : ''} assigned
              {runningCount > 0 && (
                <span className="ml-2 text-emerald-400">· {runningCount} running</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={pollStatus}
              disabled={isPolling}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              title="Refresh status from Proxmox"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${isPolling ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── Notification ──────────────────────────────────────────── */}
        {notification && (
          <div className={`mb-4 p-3 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-emerald-900/20 border-emerald-500/20'
              : 'bg-red-900/20 border-red-500/20'
          }`}>
            <p className={`text-sm flex items-center space-x-2 ${
              notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {notification.type === 'success'
                ? <Check       className="h-4 w-4 flex-shrink-0" />
                : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span>{notification.message}</span>
            </p>
          </div>
        )}

        {/* ── Action bar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Launch All */}
          <button
            onClick={handleLaunchAll}
            disabled={isLaunching || isAlreadyLaunched || (allProvisioned && anyRunning)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                       bg-gradient-to-r from-secondary-500 to-accent-500
                       hover:from-secondary-400 hover:to-accent-400 text-white
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLaunching
              ? <><Loader className="animate-spin h-4 w-4" /><span>Launching...</span></>
              : <><Power  className="h-4 w-4" /><span>Launch All</span></>}
          </button>

          {/* Stop All */}
          <button
            onClick={handleStopAll}
            disabled={isStopping || !anyRunning}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                       bg-dark-400/80 hover:bg-dark-300/80 border border-secondary-500/20
                       text-secondary-300
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isStopping
              ? <><Loader className="animate-spin h-4 w-4" /><span>Stopping...</span></>
              : <><Square className="h-4 w-4" /><span>Stop All</span></>}
          </button>

          {/* Connect All — only when ≥1 VM is running with IP */}
          {runningCount > 0 && (
            <button
              onClick={handleConnectAll}
              disabled={connectingAll}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                         bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30
                         text-primary-300
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title={`Group connect to ${runningCount} running VM(s)`}
            >
              {connectingAll
                ? <><Loader className="animate-spin h-4 w-4" /><span>Connecting...</span></>
                : <><Users  className="h-4 w-4" /><span>Connect All ({runningCount})</span></>}
            </button>
          )}
        </div>

        {/* ── VM Table ──────────────────────────────────────────────── */}
        {vms.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">
              No VMs provisioned yet — click <strong>Launch All</strong> to create your VMs on Proxmox.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                  <th className="pb-3 pr-3">VM Label</th>
                  <th className="pb-3 pr-3">VMID</th>
                  <th className="pb-3 pr-3">Protocol</th>
                  <th className="pb-3 pr-3">Username</th>
                  <th className="pb-3 pr-3">Password</th>
                  <th className="pb-3 pr-3">IP Address</th>
                  <th className="pb-3 pr-3">Port</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vms.map(vm => {
                  const liveStatus = vm.liveStatus || (vm.isrunning ? 'running' : 'stopped');
                  const isRunning  = liveStatus === 'running';
                  const hasIp      = Boolean(vm.ip);
                  const passKey    = `modal-${vm.id}`;
                  const isStarting = startingVM   === vm.id;
                  const isStopping = stoppingVM   === vm.id;
                  const isConn     = connectingVM === vm.id;
                  const isPending  = pendingVmIds.current.has(vm.id);

                  return (
                    <tr
                      key={vm.id}
                      className="border-b border-primary-500/10 hover:bg-dark-300/20 transition-colors"
                    >
                      {/* VM Label */}
                      <td className="py-3 pr-3">
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                          <span className="font-medium text-gray-300 text-sm">{vm.vm_label}</span>
                          {vm.isprocessing && (
                            <Loader className="animate-spin h-3.5 w-3.5 text-amber-400" />
                          )}
                        </div>
                      </td>

                      {/* VMID */}
                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-400 text-sm">
                          {vm.proxmox_vmid ?? <span className="italic text-gray-600 text-xs">pending</span>}
                        </span>
                      </td>

                      {/* Protocol */}
                      <td className="py-3 pr-3">
                        <span className="flex items-center space-x-1 px-2 py-0.5 text-xs rounded-full bg-secondary-500/10 text-secondary-300 w-fit">
                          {protocolIcon(vm.protocol)}
                          <span>{vm.protocol}</span>
                        </span>
                      </td>

                      {/* Username */}
                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-300 text-sm">{vm.username || '—'}</span>
                      </td>

                      {/* Password */}
                      <td className="py-3 pr-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-gray-300 text-sm">
                            {showPass[passKey] ? (vm.password || '—') : '••••••••'}
                          </span>
                          <button
                            onClick={() => setShowPass(prev => ({ ...prev, [passKey]: !prev[passKey] }))}
                            className="p-0.5 hover:bg-dark-300/50 rounded transition-colors"
                          >
                            {showPass[passKey]
                              ? <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                              : <Eye    className="h-3.5 w-3.5 text-gray-400" />}
                          </button>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-300 text-sm">
                          {vm.ip || (isPending ? <span className="text-amber-400 text-xs">waiting...</span> : '—')}
                        </span>
                      </td>

                      {/* Port */}
                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-300 text-sm">{vm.port || '—'}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 pr-3">
                        <span className={`text-xs font-medium ${
                          isRunning       ? 'text-emerald-400' :
                          vm.proxmox_vmid ? 'text-amber-400'   : 'text-gray-500'
                        }`}>
                          ● {vm.proxmox_vmid ? liveStatus : 'pending'}
                        </span>
                      </td>

                      {/* Actions: Start | Stop | Connect */}
                      <td className="py-3">
                        <div className="flex items-center space-x-1">

                          {/* Start — only when provisioned and not running */}
                          <button
                            onClick={() => handleStartVM(vm.id)}
                            disabled={!vm.proxmox_vmid || isRunning || isStarting}
                            className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={!vm.proxmox_vmid ? 'Not provisioned yet' : isRunning ? 'Already running' : 'Start VM'}
                          >
                            {isStarting
                              ? <Loader className="animate-spin h-4 w-4" />
                              : <Power  className="h-4 w-4" />}
                          </button>

                          {/* Stop — only when running */}
                          <button
                            onClick={() => handleStopVM(vm.id)}
                            disabled={!vm.proxmox_vmid || !isRunning || isStopping}
                            className="p-1.5 rounded hover:bg-red-500/10 text-red-400
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={!isRunning ? 'VM not running' : 'Stop VM'}
                          >
                            {isStopping
                              ? <Loader className="animate-spin h-4 w-4" />
                              : <Square className="h-4 w-4" />}
                          </button>

                          {/* Connect — only when running AND has IP */}
                          <button
                            onClick={() => handleConnect(vm)}
                            disabled={!isRunning || !hasIp || isConn}
                            className="p-1.5 rounded hover:bg-primary-500/10 text-primary-400
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={
                              !isRunning ? 'Start VM first' :
                              !hasIp     ? 'Waiting for VM IP (guest-agent)' :
                                           'Connect via Guacamole'
                            }
                          >
                            {isConn
                              ? <Loader  className="animate-spin h-4 w-4" />
                              : <Monitor className="h-4 w-4" />}
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="mt-6 flex justify-between items-center border-t border-primary-500/10 pt-4">
          <span className="text-sm text-gray-400">
            {formatDate(assignment.startdate)} — {formatDate(assignment.enddate)}
          </span>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Card ────────────────────────────────────────────────────────────────

export const ProxmoxClusterUserCard: React.FC<ProxmoxClusterUserCardProps> = ({
  assignment, lab, vms: initialVms, onDelete
}) => {
  const [vms,          setVms]          = useState<UserVM[]>(initialVms);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isLaunching,  setIsLaunching]  = useState(false);
  const [isStopping,   setIsStopping]   = useState(false);
  const [isPolling,    setIsPolling]    = useState(false);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Track which VM row IDs are pending IP (same pattern as ProxmoxClusterVMListModal)
  const cardPendingVmIds  = useRef<Set<string>>(new Set());
  const cardAutoPollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Initial status poll on mount
  const pollStatus = useCallback(async () => {
    if (!assignment?.id) return;
    setIsPolling(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterVMStatus`,
        { assignmentId: assignment.id }
      );
      if (res.data.success) {
        setVms(res.data.data);
        // Remove from pending when VM has an IP (guest-agent provided it)
        (res.data.data || []).forEach((v: any) => {
          if (v.ip && cardPendingVmIds.current.has(v.id)) {
            cardPendingVmIds.current.delete(v.id);
          }
        });
      }
    } catch (e) { /* silent */ }
    setIsPolling(false);
  }, [assignment?.id]);

  // ── Auto-poller: runs every 4 s while there are pending VMs ─────────────
  const startCardAutoPoller = useCallback(() => {
    if (cardAutoPollerRef.current) clearInterval(cardAutoPollerRef.current);
    cardAutoPollerRef.current = setInterval(async () => {
      if (cardPendingVmIds.current.size === 0) {
        clearInterval(cardAutoPollerRef.current!);
        cardAutoPollerRef.current = null;
        return;
      }
      await pollStatus();
    }, 4000);
  }, [pollStatus]);

  useEffect(() => {
    pollStatus();
    return () => {
      if (cardAutoPollerRef.current) clearInterval(cardAutoPollerRef.current);
      cardPendingVmIds.current.clear();
    };
  }, []);

  // Card-level Launch All
  const handleLaunchAll = async () => {
    setIsLaunching(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchProxmoxClusterVMs`,
        { assignmentId: assignment.id }
      );
      if (res.data.success) {
        const updated = res.data.data.map((v: any) => ({
          ...v,
          liveStatus: v.isrunning ? 'running' : 'stopped',
        }));
        setVms(updated);
        notify('success', 'All VMs launched');
        // Mark all VMs as pending IP and start auto-polling (same as ProxmoxClusterVMListModal)
        updated.forEach((v: any) => cardPendingVmIds.current.add(v.id));
        startCardAutoPoller();
      } else {
        throw new Error(res.data.message);
      }
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to launch VMs');
    } finally { setIsLaunching(false); }
  };

  // Card-level Stop All
  const handleStopAll = async () => {
    if (!window.confirm('Stop all VMs in this lab?')) return;
    setIsStopping(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/stopProxmoxClusterVMs`,
        { assignmentId: assignment.id }
      );
      if (res.data.success) {
        setVms(prev => prev.map(v => ({ ...v, isrunning: false, liveStatus: 'stopped' })));
        notify('success', 'All VMs stopped');
      } else {
        throw new Error(res.data.message);
      }
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to stop VMs');
    } finally { setIsStopping(false); }
  };

  const anyRunning        = vms.some(v => v.isrunning || v.liveStatus === 'running');
  const runningCount      = vms.filter(v => v.isrunning || v.liveStatus === 'running').length;
  const allProvisioned    = vms.length > 0 && vms.every(v => v.proxmox_vmid);
  const isAlreadyLaunched = vms.some(v => v.islaunched);

  // ── Delete assignment (same API as ProxmoxClusterUserListModal) ─────────────
  const handleDelete = async () => {
    if (!window.confirm('Remove this lab assignment? All your provisioned VMs will be deleted from Proxmox.')) return;
    setIsDeleting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteProxmoxClusterUserAssignment`,
        { assignmentId: assignment.id ,purchased:assignment?.purchased}
      );
      if (res.data.success) {
        notify('success', 'Assignment removed');
        setTimeout(() => onDelete?.(), 1500);
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to remove assignment');
    } finally { setIsDeleting(false); }
  };

  return (
    <>
      <div className="flex flex-col min-h-[280px] sm:min-h-[320px] lg:min-h-[300px] xl:min-h-[320px]
                      max-h-fit overflow-hidden rounded-xl border border-secondary-500/10
                      hover:border-secondary-500/30 bg-dark-200/80 backdrop-blur-sm
                      transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/10
                      hover:translate-y-[-2px] group relative">

        {/* Notification overlay */}
        {notification && (
          <div className={`absolute top-2 right-2 z-50 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm ${
            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {notification.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="p-3 sm:p-4 flex flex-col h-full">

          {/* ── Title row ──────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold mb-1 line-clamp-2">
                <GradientText>{lab?.title || 'Proxmox Cluster Lab'}</GradientText>
              </h3>
              {lab?.description && (
                <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{lab.description}</p>
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-start space-x-2 flex-shrink-0">
              <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                runningCount > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-dark-400/60 text-gray-400'
              }`}>
                {runningCount}/{vms.length} running
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${assignmentStatusCls(assignment.status)}`}>
                {assignment.status || 'active'}
              </span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Remove lab assignment"
              >
                {isDeleting
                  ? <Loader className="animate-spin h-3.5 w-3.5" />
                  : <Trash2  className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* ── VM summary rows — compact, mirrors ProxmoxClusterCard ── */}
          <div className="mb-3 space-y-1.5">
            {vms.map(vm => {
              const liveStatus = vm.liveStatus || (vm.isrunning ? 'running' : 'stopped');
              return (
                <div key={vm.id}
                  className="flex items-center justify-between px-2 py-1.5 bg-dark-400/40 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Server className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 font-medium truncate max-w-[110px]">
                      {vm.vm_label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-1.5 py-0.5 bg-secondary-500/10 text-secondary-300 rounded">
                      {vm.protocol}
                    </span>
                    {vm.isprocessing
                      ? <Loader className="animate-spin h-3 w-3 text-amber-400" />
                      : (
                        <span className={`flex items-center space-x-1 ${
                          liveStatus === 'running' ? 'text-emerald-400' :
                          vm.proxmox_vmid          ? 'text-amber-400'   : 'text-gray-500'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current inline-block" />
                          <span>{vm.proxmox_vmid ? liveStatus : 'pending'}</span>
                        </span>
                      )
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Date row ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center text-xs text-gray-400 space-x-1">
              <Calendar className="h-3 w-3 text-secondary-400 flex-shrink-0" />
              <span className="text-gray-500">From:</span>
              <span className="truncate">{formatDate(assignment.startdate)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-400 space-x-1">
              <Clock className="h-3 w-3 text-secondary-400 flex-shrink-0" />
              <span className="text-gray-500">Until:</span>
              <span className="truncate">{formatDate(assignment.enddate)}</span>
            </div>
          </div>

          {/* ── Software tags ─────────────────────────────────────── */}
          {(lab?.software || []).length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Software</p>
              <div className="flex flex-wrap gap-1 max-h-[48px] overflow-y-auto">
                {(lab?.software || []).map((sw, i) => (
                  <span key={i}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-500/20 text-secondary-300">
                    {sw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Action buttons ───────────────────────────────────────── */}
          <div className="mt-auto pt-2 sm:pt-3 border-t border-secondary-500/10 space-y-2">

            {/* View My VMs — opens modal with full table */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                         bg-dark-400/80 hover:bg-dark-300/80 border border-secondary-500/20
                         hover:border-secondary-500/30 text-secondary-300
                         flex items-center justify-center transition-all">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              View My VMs
            </button>

            {/* Launch All / Stop All / Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLaunchAll}
                disabled={isLaunching || isAlreadyLaunched || (allProvisioned && anyRunning)}
                className="flex-1 h-8 sm:h-9 flex items-center justify-center space-x-1.5 rounded-lg
                           text-xs sm:text-sm font-medium
                           bg-gradient-to-r from-secondary-500 to-accent-500
                           hover:from-secondary-400 hover:to-accent-400
                           text-white transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed">
                {isLaunching
                  ? <><Loader className="animate-spin h-3.5 w-3.5" /><span>Launching...</span></>
                  : <><Power  className="h-3.5 w-3.5" /><span>Launch All</span></>}
              </button>

              <button
                onClick={handleStopAll}
                disabled={isStopping || !anyRunning}
                className="flex-1 h-8 sm:h-9 flex items-center justify-center space-x-1.5 rounded-lg
                           text-xs sm:text-sm font-medium
                           bg-dark-400/80 hover:bg-dark-300/80
                           border border-secondary-500/20 hover:border-secondary-500/30
                           text-secondary-300 transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed">
                {isStopping
                  ? <><Loader className="animate-spin h-3.5 w-3.5" /><span>Stopping...</span></>
                  : <><Square className="h-3.5 w-3.5" /><span>Stop All</span></>}
              </button>

              <button
                onClick={pollStatus}
                disabled={isPolling}
                title="Refresh VM status from Proxmox"
                className="h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center rounded-lg flex-shrink-0
                           bg-dark-400/80 hover:bg-dark-300/80
                           border border-secondary-500/20 hover:border-secondary-500/30
                           text-secondary-300 transition-all disabled:opacity-40">
                <RefreshCw className={`h-3.5 w-3.5 ${isPolling ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* VM Details Modal */}
      <VMModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={assignment}
        lab={lab}
        vms={vms}
        onVmsUpdate={setVms}
      />
    </>
  );
};
