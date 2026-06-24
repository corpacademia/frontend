/**
 * ProxmoxClusterVMListModal  ("User List" button on admin card)
 *
 * Shows VM configurations with live Proxmox status, launch/stop controls,
 * and Guacamole connect buttons.
 *
 * Key behaviours:
 *  - After Launch All or Start single: polls status every 4 s until every
 *    started VM shows "running", then stops polling automatically.
 *  - "Connect All" appears as soon as ANY VM is running (not only immediately
 *    after launch).
 *  - Individual connect is disabled until IP is confirmed from guest-agent.
 *  - IP/status re-fetched on every statusPoll tick so the Connect button
 *    lights up the moment the VM is ready.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Server, Loader, AlertCircle, Eye, EyeOff,
  RefreshCw, Power, Square, Monitor, Users
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
// VMModal is the existing connect/start/stop UI from ProxmoxClusterUserCard.
// Reused here so the org admin can connect to their own cloned VMs right after
// "Launch My VMs" — no need to duplicate any of the connect machinery.
import { VMModal } from './ProxmoxClusterUserCard';

interface ProxmoxClusterVMListModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  lab:         any;
  // readOnly=true for org-purchased labs — templates should not be launched/stopped directly.
  // Users who are assigned will launch their own NEW cloned VMs from these templates.
  readOnly?:   boolean;
}

export const ProxmoxClusterVMListModal: React.FC<ProxmoxClusterVMListModalProps> = ({
  isOpen, onClose, lab, readOnly = false
}) => {

  const navigate = useNavigate();
  const { user,organizations } = useAuthStore();
  const orgAdmin = organizations.find(org=>org.id === user?.org_id)?.org_admin;
  const [vmConfigs,       setVmConfigs]       = useState<any[]>([]);
  const [liveStatus,      setLiveStatus]      = useState<Record<string, any>>({});
  const [loading,         setLoading]         = useState(true);
  const [isPolling,       setIsPolling]       = useState(false);
  const [isLaunchingAll,  setIsLaunchingAll]  = useState(false);
  const [isStoppingAll,   setIsStoppingAll]   = useState(false);
  const [startingVM,      setStartingVM]      = useState<string | null>(null);
  const [stoppingVM,      setStoppingVM]      = useState<string | null>(null);
  const [connectingVM,    setConnectingVM]    = useState<string | null>(null);
  const [connectingGroup, setConnectingGroup] = useState(false);
  const [showPass,        setShowPass]        = useState<Record<string, boolean>>({});
  const [notification,    setNotification]    = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // True after Launch All succeeds — makes Connect All button appear immediately
  // so admin doesn't have to wait for auto-poller to confirm "running" state
  const [hasLaunched,     setHasLaunched]     = useState(false);
  const [isSelfLaunching, setIsSelfLaunching] = useState(false); // org admin launching their own cloned VMs
  // Set after "Launch My VMs" succeeds — holds the new assignment + cloned VMs
  // so VMModal can be opened immediately for connect/start/stop.
  const [launchedAssignment, setLaunchedAssignment] = useState<{ id: string; labid: string; vms: any[] } | null>(null);

  // Track which config IDs were recently started so we can auto-poll until running
  const pendingVmIds = useRef<Set<string>>(new Set());
  const autoPollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };
    readOnly = user?.role === 'labadmin' ? (lab.user_id === orgAdmin || user?.id)  ? false : true: readOnly;
  // ── Helpers ───────────────────────────────────────────────────────────────
  const defaultPort = (protocol: string) =>
    protocol === 'SSH' ? '22' : protocol === 'VNC' ? '5900' : '3389';

  const buildWsUrl = (wsPath: string) => {
    const proto    = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const hostPort = `${window.location.hostname}:3002`;
    return `${proto}://${hostPort}${wsPath}`;
  };

  const buildCredential = (vm: any, status: any) => ({
    id:       vm.id,
    ip:       status?.ip       || '',
    port:     status?.port     || defaultPort(vm.protocol || 'RDP'),
    username: vm.username      || '',
    password: vm.password      || '',
    protocol: vm.protocol      || 'RDP',
    vmData: {
      protocol: vm.protocol || 'RDP',
      vmname:   vm.vm_label || vm.id,
    },
  });

  // ── Fetch VM configs ──────────────────────────────────────────────────────
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterLabOnId`,
        { labId: lab?.labid }
      );
      if (res.data.success) setVmConfigs(res.data.data.vmConfigs || []);
    } catch (e) { console.error('[VMList] fetchConfigs:', e); }
  }, [lab?.labid]);

  // ── Single status poll (updates liveStatus) ───────────────────────────────
  const pollOnce = useCallback(async () => {
    if (!lab?.labid) return;
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterConfigVMStatus`,
        { labId: lab.labid,readOnly:user?.role === 'labadmin' ? (lab.user_id === orgAdmin || user?.id) ? false : true : readOnly,orgId:user?.org_id }
      );
      if (res.data.success) {
        setLiveStatus(prev => {
          const map = { ...prev };
          (res.data.data || []).forEach((s: any) => {
            if (s.configId) map[s.configId] = s;
          });
          return map;
        });
        // Remove from pending on any KNOWN terminal status (running/stopped/template)
        // so the auto-poller doesn't spin forever on stopped VMs
        (res.data.data || []).forEach((s: any) => {
          const isTerminal = ['running', 'stopped', 'template'].includes(s.liveStatus);
          
          if (isTerminal && pendingVmIds.current.has(s.configId)) {
            pendingVmIds.current.delete(s.configId);
          }
        });
      }
    } catch (e) { /* silent */ }
  }, [lab?.labid]);
  // ── Manual refresh button ─────────────────────────────────────────────────
  const handleManualRefresh = useCallback(async () => {
    setIsPolling(true);
    await pollOnce();
    setIsPolling(false);
  }, [pollOnce]);
  // ── Auto-poller: runs every 4 s while there are pending VMs ──────────────
  const startAutoPoller = useCallback(() => {
    if (autoPollerRef.current) clearInterval(autoPollerRef.current);
    autoPollerRef.current = setInterval(async () => {
      if (pendingVmIds.current.size === 0) {
        clearInterval(autoPollerRef.current!);
        autoPollerRef.current = null;
        return;
      }
      await pollOnce();
    }, 4000);
  }, [pollOnce]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !lab?.labid) return;
    const init = async () => {
      setLoading(true);
      if (readOnly ) {
        // readOnly = purchased/assigned lab.
        // lab.vmConfigs carries islaunched/vmid but may lack hardware detail
        // (cpu, ram, storage, node, protocol, username, password, vm_label).
        // Seed the list immediately so the modal isn't blank, then enrich via
        // fetchConfigs (getProxmoxClusterLabOnId) which returns the full config
        // rows. Merge by id: full-detail wins but islaunched from lab.vmConfigs
        // is preserved since the config-table rows don't carry the assignment flag.
        const baseConfigs: any[] = lab.vmConfigs || [];
        // setVmConfigs(baseConfigs);

        // try {
        //   const res = await axios.post(
        //     `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterLabOnId`,
        //     { labId: lab.labid }
        //   );
        //   if (res.data.success) {
        //     const detailMap: Record<string, any> = {};
        //     (res.data.data.vmConfigs || []).forEach((c: any) => {
        //       detailMap[c.id] = c;
        //     });
        //     // Merge: keep all base entries; overlay full detail where id matches
        //     setVmConfigs(
        //       baseConfigs.map((base: any) =>
        //         detailMap[base.vm_config_id]
        //           ? { ...detailMap[base.vm_config_id],id:base.id, islaunched: base.islaunched ,vmid:base.proxmox_vmid }
        //           : base
        //       )
        //     );
        //   }
        // } 
          if (baseConfigs.length === 0) {
          // ── Case A: No assignment yet (purchased lab, first open) ─────────────
          // lab.vmConfigs is empty because this org hasn't launched VMs yet.
          // Show the lab's template VM configs as a read-only preview so the
          // org admin can see what VMs are included before clicking "Launch My VMs".
          // No status polling — these are template VMs, not running user VMs.
          await fetchConfigs();
          setLoading(false);
          // Skip pollOnce + auto-poller entirely for Case A — nothing to poll.
          return;
        } else {
          // ── Case B: Already has an assignment (user has launched VMs before) ──
          // lab.vmConfigs contains the user's assignment VM rows (id, vm_config_id,
          // proxmox_vmid, islaunched). Enrich with full hardware details from the
          // lab config table, then poll live Proxmox status for each VM.
          setVmConfigs(baseConfigs);
          try {
            const res = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgVMConfigs`,
              { labId: lab.labid,readOnly,orgId:user?.org_id }
            );
            if (res.data.success) {
              const detailMap: Record<string, any> = {};
              (res.data.data.vmConfigs || []).forEach((c: any) => {
                detailMap[c.vm_config_id] = c;
              });
              // Merge: preserve assignment id/vmid/islaunched, overlay hardware detail
              setVmConfigs(
                baseConfigs.map((base: any) =>
                  detailMap[base.id]
                    ? {
                        ...detailMap[base.id],
                        id:          detailMap[base.id].id,
                        vm_config_id: base.id,
                        // islaunched:   base.islaunched,
                        vmid: detailMap[base.id].proxmox_vmid,
                      }
                    : base
                )
              );
            }
          } catch (e) {
            console.error('[VMList] readOnly enrichConfigs:', e);
          }
        // catch (e) {
        //   console.error('[VMList] readOnly enrichConfigs:', e);
        // }
      }}
      else {
        await fetchConfigs();
      }
      setLoading(false);
      setIsPolling(true);
      await pollOnce();
      setIsPolling(false);

      // For VMs that were already launched (have template_id in DB), kick off the
      // auto-poller so we always get fresh live status on every open — not just
      // a single snapshot that might be stale.
      setVmConfigs(cfgs => {
        const alreadyLaunched = cfgs.filter((c: any) => c.template_id);
        if (alreadyLaunched.length > 0) {
          alreadyLaunched.forEach((c: any) => pendingVmIds.current.add(c.id));
          startAutoPoller();
        }
        // If every config already has a vmid, the VMs were previously launched —
        // set hasLaunched so "Connect All" is shown without needing a fresh Launch All.
        if (cfgs.length > 0 && cfgs.every((c: any) => c.vmid)) {
          setHasLaunched(true);
        }
        return cfgs;
      });
    };
    init();
    return () => {
      // Fully clean up on close so stale state never leaks into the next open
      if (autoPollerRef.current) clearInterval(autoPollerRef.current);
      autoPollerRef.current = null;
      pendingVmIds.current.clear();
      setLiveStatus({});
      setHasLaunched(false);
    };
  }, [isOpen, lab?.labid]);
  // ── Launch All ────────────────────────────────────────────────────────────
  const handleLaunchAll = async () => {
    setIsLaunchingAll(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchProxmoxClusterConfigVMs`,
        { labId: lab.labid }
      );
      if (res.data.success) {
        const failed = (res.data.data || []).filter((r: any) => r.status === 'failed');
        if (failed.length === 0) {
          notify('success', 'All VMs launched — click "Connect All" to connect when ready');
          setHasLaunched(true);   // show Connect All button immediately
        } else {
          notify('error', `${failed.length} VM(s) failed to launch`);
        }

        // Re-fetch configs (template_id updated in DB after launch)
        await fetchConfigs();
        await pollOnce();

        // Mark all configs as pending so auto-poller watches them
        setVmConfigs(cfgs => {
          cfgs.forEach(c => pendingVmIds.current.add(c.id));
          return cfgs;
        });
        startAutoPoller();
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to launch VMs');
    } finally { setIsLaunchingAll(false); }
  };

  // ── Stop All ──────────────────────────────────────────────────────────────
  const handleStopAll = async () => {
    setIsStoppingAll(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/stopProxmoxClusterConfigVMs`,
        { labId: lab.labid }
      );
      if (res.data.success) {
        notify('success', 'Stop commands sent');
        await pollOnce();
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to stop VMs');
    } finally { setIsStoppingAll(false); }
  };

  // ── Start single VM ───────────────────────────────────────────────────────
  const handleStartOne = async (vmConfigId: string) => {
    setStartingVM(vmConfigId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/startSingleProxmoxClusterConfigVM`,
        { vmConfigId,readOnly
         }
      );
      if (res.data.success) {
        notify('success', 'VM start command sent — polling until running...');
        // Mark as pending and start auto-poller to watch it
        pendingVmIds.current.add(vmConfigId);
        await pollOnce();
        startAutoPoller();
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to start VM');
    } finally { setStartingVM(null); }
  };

  // ── Stop single VM ────────────────────────────────────────────────────────
  const handleStopOne = async (vmConfigId: string) => {
    setStoppingVM(vmConfigId);
    try {
      
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/stopSingleProxmoxClusterConfigVM`,
        { vmConfigId,readOnly }
      );
      if (res.data.success) {
        notify('success', 'VM stopped');
        await pollOnce();
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to stop VM');
    } finally { setStoppingVM(null); }
  };

  // ── Start VM + get connection details, then build Guac WS URL ────────────
  // Mirrors ProxmoxVMCard.tsx exactly:
  //   startVM response → { hostname, protocol, port }
  //   → get-guac-url  → wsPath
  //   → buildWsUrl    → navigate to VMSessionPage
  const startAndGetGuacUrl = async (vm: any): Promise<{
    wsUrl: string;
    hostname: string; protocol: string; port: number;
    username: string; password: string;
  }> => {
    // Step 1: Start VM + wait for guest-agent IP (mirrors startVM in proxmoxService.js)
    const startResp = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/startAndConnectProxmoxClusterVM`,
      { vmConfigId: vm.id }
    );
    if (!startResp.data.success) {
      throw new Error(startResp.data.message || 'Failed to start VM and get connection details');
    }
    const { hostname, protocol, port, username, password } = startResp.data.data;

    // Step 2: Get Guacamole token (mirrors ProxmoxVMCard.tsx startVM → get-guac-url)
    const guacResp = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
      { protocol, hostname, port, username, password }
    );
    if (!guacResp.data.success) {
      throw new Error('Failed to get Guacamole connection token');
    }

    return {
      wsUrl:    buildWsUrl(guacResp.data.wsPath),
      hostname, protocol, port, username, password
    };
  };

  // ── Connect All (group session) ───────────────────────────────────────────
  // Calls startAndConnectProxmoxClusterVM for ALL VMs in PARALLEL via Promise.all.
  // Each call: starts VM if stopped → polls guest-agent until IP ready (up to 45 s).
  // Once all IPs are obtained, navigates to VMSessionPage with isGroupConnection=true.
  // This works even immediately after "Launch All" before VMs show as "running" —
  // the backend waits for each VM to boot and provide its IP.
  const handleConnectAll = async () => {
    // Use all VM configs (launched or running), not just confirmed-running ones
    const targetVMs = vmConfigs.filter(vm =>
      liveStatus[vm.id]?.liveStatus === 'running' ||
      pendingVmIds.current.has(vm.id) ||
      hasLaunched    // include all if launched recently
    );
    const vmsToConnect = targetVMs.length > 0 ? targetVMs : vmConfigs;

    if (!vmsToConnect.length) {
      notify('error', 'No VMs to connect — launch them first');
      return;
    }

    setConnectingGroup(true);
    notify('success', `Connecting to ${vmsToConnect.length} VM(s) — waiting for all to be ready...`);

    try {
      // Fetch connection details for ALL VMs in parallel
      // startAndConnectProxmoxClusterVM starts if stopped and polls until IP ready
      const results = await Promise.all(
        vmsToConnect.map(vm =>
          startAndGetGuacUrl(vm).catch(err => ({
            wsUrl: null as string | null,
            hostname: '', protocol: 'rdp', port: 3389,
            username: vm.username || '', password: vm.password || '',
            _error: err.message, _vm: vm
          }))
        )
      );

      // Separate successes from failures
      const successes = results.filter(r => r.wsUrl !== null);
      const failures  = results.filter(r => r.wsUrl === null);

      if (failures.length > 0) {
        const failedLabels = failures.map((r: any) => r._vm?.vm_label || '?').join(', ');
        notify('error', `${failures.length} VM(s) failed to connect: ${failedLabels}`);
      }
      if (!successes.length) return;

      // Build credentials list — all successful VMs
      const allCreds = vmsToConnect
        .map((vm, i) => {
          const r = results[i];
          if (!r.wsUrl) return null;
          return {
            id:       vm.id,
            ip:       r.hostname,
            port:     r.port,
            username: r.username,
            password: r.password,
            protocol: r.protocol,
            vmData:   { protocol: r.protocol, vmname: vm.vm_label },
          };
        })
        .filter(Boolean);

      const firstSuccess = successes[0];
      const firstVm      = vmsToConnect[results.indexOf(firstSuccess)];

      navigate(`/dashboard/labs/vm-session/${firstVm.vmid}`, {
        state: {
          guacUrl:           firstSuccess.wsUrl,
          vmTitle:           lab?.title || 'Proxmox Cluster',
          vmId:              firstVm.vmid,
          doc:               lab?.labguide || [],
          credentials:       allCreds,
          isGroupConnection: allCreds.length > 1,
        }
      });
    } catch (e: any) {
      notify('error', e.message || 'Failed to connect');
    } finally { setConnectingGroup(false); }
  };

  // ── Connect single VM ─────────────────────────────────────────────────────
  // Calls startAndConnectProxmoxClusterVM which mirrors startVM in proxmoxService:
  //   starts if stopped → polls guest-agent until IP ready → returns {hostname, protocol, port}
  // Then calls get-guac-url → navigate to VMSessionPage with credentials.
  const handleConnectSingle = async (vm: any) => {
    setConnectingVM(vm.id);
    try {
      const { wsUrl, hostname, protocol, port, username, password } =
        await startAndGetGuacUrl(vm);

      // Provide all running VMs as credentials so admin can switch between them
      const allRunning = vmConfigs
        .filter(c => liveStatus[c.id]?.liveStatus === 'running')
        .map(c => ({
          id:       c.id,
          ip:       liveStatus[c.id]?.ip || (c.id === vm.id ? hostname : ''),
          port,
          username: c.username || username,
          password: c.password || password,
          protocol: (c.protocol || 'RDP').toLowerCase(),
          vmData:   { protocol: (c.protocol || 'RDP').toLowerCase(), vmname: c.vm_label },
        }));

      const isGroup = allRunning.length > 1;

      navigate(`/dashboard/labs/vm-session/${vm.vmid}`, {
        state: {
          guacUrl:           wsUrl,
          vmTitle:           `${lab?.title || 'Cluster'} — ${vm.vm_label}`,
          vmId:              vm.vmid,
          doc:               lab?.labguide || [],
          credentials:       isGroup ? allRunning : [{
            id: vm.id, ip: hostname, port,
            username, password,
            protocol: protocol,
            vmData: { protocol, vmname: vm.vm_label }
          }],
          isGroupConnection: isGroup,
        }
      });
    } catch (e: any) {
      notify('error', e.message || 'Failed to connect to VM');
    } finally { setConnectingVM(null); }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const runningVMs   = vmConfigs.filter(vm => liveStatus[vm.id]?.liveStatus === 'running');
  const runningCount = runningVMs.length;
  const anyRunning   = runningCount > 0;
  // Show Connect All:
  //  - immediately after Launch All succeeds (hasLaunched=true), OR
  //  - whenever any VM confirms "running" from the status poller
  const showConnectAll = hasLaunched || runningCount > 0;
  // Auto-poller is active when pendingVmIds has entries
  const isAutoPolling = pendingVmIds.current.size > 0;
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-dark-200 rounded-lg w-full max-w-6xl p-6 max-h-[90vh] overflow-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              <GradientText>VM List — {lab?.title}</GradientText>
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {readOnly
                ? 'Template configs — users get NEW cloned VMs from these when they launch'
                : 'Launch VMs to configure them, then convert to templates'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isAutoPolling && (
              <span className="text-xs text-amber-400 flex items-center space-x-1">
                <Loader className="animate-spin h-3 w-3" />
                <span>Waiting for VMs to start...</span>
              </span>
            )}
            <button onClick={handleManualRefresh} disabled={isPolling}
              className="p-2 hover:bg-dark-300 rounded-lg" title="Refresh status">
              <RefreshCw className={`h-4 w-4 text-gray-400 ${isPolling ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-3 rounded-lg border ${
            notification.type === 'success' ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-red-900/20 border-red-500/20'
          }`}>
            <p className={`text-sm ${notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {notification.message}
            </p>
          </div>
        )}

        {/* Purchased lab — org admin can launch their own NEW cloned VMs */}
        {readOnly && (
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg text-sm text-primary-300">
              <strong>Purchased lab — template view.</strong><br />
              These are the VM template configs. Click <strong>Launch My VMs</strong> below to get
              your own <strong>new</strong> cloned VMs spun up directly from these templates.
            </div>
            <button
              disabled={isSelfLaunching || (vmConfigs || []).every((c: any) => c.islaunched)}
              onClick={async () => {
                setIsSelfLaunching(true);
                try {
                  // Step 1: self-assign this lab to the org admin's account
                  const assignRes = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/selfAssignProxmoxCluster`,
                    {
                      labId:     lab.labid,
                      userId:    user?.id,
                      startDate: lab.startdate,
                      endDate:   lab.enddate,
                    }
                  );
                  if (!assignRes.data.success) {
                    notify('error', assignRes.data.message || 'Failed to assign lab to your account');
                    return;
                  }

                  // Step 2: launch cloned VMs using the assignment ID returned
                  const assignmentId = assignRes.data.data?.id || assignRes.data.data?.assignmentId;
                  if (assignmentId) {
                    const launchRes = await axios.post(
                      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchProxmoxClusterVMs`,
                      { assignmentId }
                    );
                    if (launchRes.data.success) {
                      notify('success', 'Your VMs are launching — click "Connect My VMs" below to connect when ready.');
                      // Open VMModal immediately so the org admin can connect
                      // to their own cloned VMs without leaving this modal.
                      setLaunchedAssignment({
                        id:    assignmentId,
                        labid: lab.labid,
                        vms:   launchRes.data.data || [],
                      });
                    } else {
                      notify('error', launchRes.data.message || 'VMs assigned but failed to launch — try from your Labs section.');
                    }
                  } else {
                    // assignment created but no ID in response — tell them where to go
                    notify('success', 'Lab assigned to your account — go to your Labs section to launch VMs.');
                  }
                } catch (e: any) {
                  notify('error', e.response?.data?.message || 'Failed to launch VMs');
                } finally { setIsSelfLaunching(false); }
              }}
              className="w-full h-9 px-4 rounded-lg text-sm font-medium
                         bg-gradient-to-r from-emerald-600 to-teal-600
                         hover:from-emerald-500 hover:to-teal-500
                         text-white flex items-center justify-center transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed">
              {isSelfLaunching
                ? <><Loader className="animate-spin h-4 w-4 mr-2" />Launching your VMs...</>
                : <><Power  className="h-4 w-4 mr-2" />Launch My VMs</>}
            </button>

            {/* Connect My VMs — appears after Launch My VMs succeeds */}
            {launchedAssignment && (
              <button
                onClick={() => setLaunchedAssignment(prev => prev ? { ...prev } : null)}
                className="w-full h-9 px-4 rounded-lg text-sm font-medium
                           bg-gradient-to-r from-primary-600 to-secondary-600
                           hover:from-primary-500 hover:to-secondary-500
                           text-white flex items-center justify-center gap-2 transition-all"
              >
                <Monitor className="h-4 w-4" />
                Connect My VMs
              </button>
            )}
          </div>
        )}

        {/* VMModal for org admin's own cloned VMs — opened after Launch My VMs */}
        {launchedAssignment && (
          <VMModal
            isOpen={true}
            onClose={() => setLaunchedAssignment(null)}
            assignment={{
              id:        launchedAssignment.id,
              labid:     launchedAssignment.labid,
              status:    'active',
              isrunning: false,
              startdate: lab.startdate || '',
              enddate:   lab.enddate   || '',
              purchased: true,
            }}
            lab={{
              labid:       lab.labid,
              title:       lab.title,
              description: lab.description || '',
              software:    lab.software    || [],
              labguide:    lab.labguide    || [],
            }}
            vms={launchedAssignment.vms}
            onVmsUpdate={vms => setLaunchedAssignment(prev => prev ? { ...prev, vms } : null)}
          />
        )}

        {/* Action bar — hidden for read-only (org-purchased) labs */}
        {!loading && vmConfigs.length > 0 && !readOnly && (
          <div className="flex flex-wrap items-center gap-3 mb-6">

            {/* Launch All */}
            <button onClick={handleLaunchAll} disabled={isLaunchingAll || anyRunning || hasLaunched}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                         bg-gradient-to-r from-secondary-500 to-accent-500
                         hover:from-secondary-400 hover:to-accent-400 text-white
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {isLaunchingAll
                ? <><Loader className="animate-spin h-4 w-4" /><span>Launching...</span></>
                : <><Power  className="h-4 w-4" /><span>Launch All</span></>}
            </button>

            {/* Stop All */}
            <button onClick={handleStopAll} disabled={isStoppingAll || !anyRunning}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                         bg-dark-400/80 hover:bg-dark-300/80 border border-secondary-500/20 text-secondary-300
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {isStoppingAll
                ? <><Loader className="animate-spin h-4 w-4" /><span>Stopping...</span></>
                : <><Square className="h-4 w-4" /><span>Stop All</span></>}
            </button>

            {/* Connect All — visible after Launch All OR when any VM is running */}
            {showConnectAll && (
              <button onClick={handleConnectAll} disabled={connectingGroup}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                           bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30
                           text-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title={
                  runningCount > 0
                    ? `Group connect to ${runningCount} running VM(s) via Guacamole`
                    : 'Group connect — waits for each VM to boot and provide its IP'
                }>
                {connectingGroup
                  ? <><Loader className="animate-spin h-4 w-4" /><span>Connecting to all VMs...</span></>
                  : runningCount > 0
                    ? <><Users className="h-4 w-4" /><span>Connect All ({runningCount})</span></>
                    : <><Users className="h-4 w-4" /><span>Connect All (waiting for boot...)</span></>
                }
              </button>
            )}

          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin h-6 w-6 text-primary-500" />
            <span className="ml-3 text-gray-400">Loading VM configurations...</span>
          </div>
        ) : vmConfigs.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No VM configurations defined for this lab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                  <th className="pb-3 pr-3">#</th>
                  <th className="pb-3 pr-3">VM Label</th>
                  <th className="pb-3 pr-3">Node</th>
                  <th className="pb-3 pr-3">VMID</th>
                  <th className="pb-3 pr-3">CPU</th>
                  <th className="pb-3 pr-3">RAM</th>
                  <th className="pb-3 pr-3">Storage</th>
                  <th className="pb-3 pr-3">Protocol</th>
                  <th className="pb-3 pr-3">Username</th>
                  <th className="pb-3 pr-3">Password</th>
                  <th className="pb-3 pr-3">IP</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vmConfigs.map((vm: any, i: number) => {
                  const status     = liveStatus[vm.id];
                  const vmRunning  = status?.liveStatus === 'running';
                  const isTemplate = status?.isTemplate === true;
                  // Connect is enabled when VM is running — IP fetched live by startAndConnectProxmoxClusterVM
                  const hasIp      = true;   // always allow attempt; backend waits for guest-agent
                  const isPending  = pendingVmIds.current.has(vm.id);
                  const isStarting = startingVM  === vm.id;
                  const isStopping = stoppingVM  === vm.id;
                  const isConn     = connectingVM === vm.id;
                  return (
                    <tr key={vm.id} className="border-b border-primary-500/10">

                      <td className="py-3 pr-3 text-gray-500 text-sm">{i + 1}</td>

                      <td className="py-3 pr-3">
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                          <span className="font-medium text-gray-300">{vm.vm_label}</span>
                          {isPending && (
                            <Loader className="animate-spin h-3 w-3 text-amber-400" title="Waiting for running state..." />
                          )}
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-300 text-sm">{vm.node}</span>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-300 text-sm">{vm.vmid}</span>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="text-gray-300 text-sm">{vm.cpu} core{vm.cpu !== 1 ? 's' : ''}</span>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="text-gray-300 text-sm">
                          {vm.ram >= 1024 ? `${vm.ram / 1024} GB` : `${vm.ram} MB`}
                        </span>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="text-gray-300 text-sm">{vm.storage} GB</span>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-secondary-500/10 text-secondary-300">
                          {vm.protocol}
                        </span>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-300 text-sm">{vm.username || '—'}</span>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-gray-300 text-sm">
                            {showPass[vm.id] ? (vm.password || '—') : '••••••••'}
                          </span>
                          {vm.password && (
                            <button onClick={() => setShowPass(prev => ({ ...prev, [vm.id]: !prev[vm.id] }))}
                              className="p-0.5 hover:bg-dark-300/50 rounded">
                              {showPass[vm.id]
                                ? <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                                : <Eye    className="h-3.5 w-3.5 text-gray-400" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* IP from live status */}
                      <td className="py-3 pr-3">
                        <span className="font-mono text-gray-300 text-sm">
                          {status?.ip || (isPending ? <span className="text-amber-400 text-xs">waiting...</span> : '—')}
                        </span>
                      </td>

                      {/* Live status */}
                      <td className="py-3 pr-3">
                        {status ? (
                          <span className={`text-xs font-medium ${
                            isTemplate ? 'text-purple-400' :
                            vmRunning  ? 'text-emerald-400' :
                            isPending  ? 'text-amber-400' : 'text-gray-400'
                          }`}>
                            ● {isTemplate ? 'template' : (status.liveStatus || '—')}
                          </span>
                        ) : isPending ? (
                          <span className="text-xs text-amber-400">● starting...</span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>

                      {/* Actions: Start | Stop | Connect — hidden for read-only (org-purchased) labs */}
                      <td className="py-3">
                        {(readOnly && !lab.vmConfigs.length > 0) ? (
                          <span className="text-xs text-gray-600 italic">template</span>
                        ) : (
                        <div className="flex items-center space-x-1">

                          {/* Start */}
                          <button onClick={() => handleStartOne(vm.id)}
                            disabled={ vmRunning || isTemplate || isStarting || isPending }
                            className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Start VM">
                            { isStarting || isPending
                              ? <Loader className="animate-spin h-4 w-4" />
                              : <Power  className="h-4 w-4" /> }
                          </button>

                          {/* Stop */}
                          <button onClick={() => handleStopOne(vm.id)}
                            disabled={!vmRunning || isTemplate || isStopping}
                            className="p-1.5 rounded hover:bg-red-500/10 text-red-400
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Stop VM">
                            {isStopping
                              ? <Loader className="animate-spin h-4 w-4" />
                              : <Square className="h-4 w-4" />}
                          </button>

                          {/* Connect — enabled only when running AND IP is known */}
                          <button onClick={() => handleConnectSingle(vm)}
                            disabled={!vmRunning || isTemplate || !hasIp || isConn}
                            className="p-1.5 rounded hover:bg-primary-500/10 text-primary-400
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={
                              !vmRunning && !isPending ? 'VM not running — start it first' :
                              isPending    ? 'Waiting for running state...' :
                              isTemplate   ? 'Already a template' :
                              'Connect via Guacamole (will wait for VM to be ready)'
                            }>
                            {isConn
                              ? <Loader   className="animate-spin h-4 w-4" />
                              : <Monitor  className="h-4 w-4" />}
                          </button>

                        </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center border-t border-primary-500/10 pt-4">
          <span className="text-sm text-gray-400">
            {vmConfigs.length} VM{vmConfigs.length !== 1 ? 's' : ''}
            {anyRunning && (
              <span className="ml-2 text-emerald-400 text-xs">· {runningCount} running</span>
            )}
            {isAutoPolling && (
              <span className="ml-2 text-amber-400 text-xs">· auto-polling every 4s</span>
            )}
          </span>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};
