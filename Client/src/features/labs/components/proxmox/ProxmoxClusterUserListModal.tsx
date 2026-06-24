/**
 * ProxmoxClusterUserListModal  ("Pods" button on admin card)
 *
 * Shows all users assigned to this cluster lab with their cloned VMs.
 * Per user section:
 *   - User name, email, assignment status
 *   - [Launch All]  [Stop All]  buttons for the entire assignment
 *   - Table: VM Label | VMID | Username | Password | IP | Port | Protocol | Status | Actions
 *   - Actions column: individual Power (start) / Square (stop) + Connect icons
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Eye, EyeOff, Loader, AlertCircle, Check,
  RefreshCw, Trash2, Power, Square, Monitor, Terminal, Globe
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../../../components/ui/GradientText';

interface ProxmoxClusterUserListModalProps {
  isOpen:  boolean;
  onClose: () => void;
  lab:     any;
}

export const ProxmoxClusterUserListModal: React.FC<ProxmoxClusterUserListModalProps> = ({
  isOpen, onClose, lab
}) => {
  console.log(lab)
  const navigate = useNavigate();

  const [assignments,       setAssignments]       = useState<any[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [deleting,          setDeleting]          = useState<string | null>(null);
  const [showPass,          setShowPass]          = useState<Record<string, boolean>>({});
  const [notification,      setNotification]      = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Per-assignment launch / stop loading
  const [launchingAssign,   setLaunchingAssign]   = useState<string | null>(null);
  const [stoppingAssign,    setStoppingAssign]    = useState<string | null>(null);

  // Per-VM start / stop loading
  const [startingVM,        setStartingVM]        = useState<string | null>(null);
  const [stoppingVM,        setStoppingVM]        = useState<string | null>(null);

  // ── IP poller ─────────────────────────────────────────────────────────────
  // Polls getProxmoxClusterLabDetails every 4 s while any running VM still
  // has no IP (guest-agent populates it asynchronously after boot).
  const ipPollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopIpPoller = useCallback(() => {
    if (ipPollerRef.current) {
      clearInterval(ipPollerRef.current);
      ipPollerRef.current = null;
    }
  }, []);

  const startIpPoller = useCallback(() => {
    // Don't stack multiple intervals
    if (ipPollerRef.current) return;
    ipPollerRef.current = setInterval(async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterLabDetails`,
          { labId: lab?.labid }
        );
        if (res.data.success) {
          const fresh: any[] = res.data.data.assignments || [];
          setAssignments(fresh);
          // Stop polling once every running VM across all assignments has an IP
          const anyMissingIp = fresh.some(a =>
            (a.vms || []).some((v: any) => v.isrunning && !v.ip)
          );
          if (!anyMissingIp) stopIpPoller();
        }
      } catch { /* silent */ }
    }, 4000);
  }, [lab?.labid, stopIpPoller]);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterLabDetails`,
        { labId: lab?.labid }
      );
      if (res.data.success) setAssignments(res.data.data.assignments || []);
    } catch (e) { console.error('ProxmoxClusterUserListModal:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isOpen && lab?.labid) fetchData();
    // Clean up IP poller when modal closes
    return () => { if (!isOpen) stopIpPoller(); };
  }, [isOpen, lab?.labid]);

  // ── Assignment-level: Launch All ─────────────────────────────────────────
  const handleLaunchAll = async (assignmentId: string) => {
    setLaunchingAssign(assignmentId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/launchProxmoxClusterVMs`,
        { assignmentId }
      );
      if (res.data.success) {
        notify('success', 'All VMs launched — polling for IPs...');
        // Update local VM state
        setAssignments(prev => prev.map(a => {
          if (a.id !== assignmentId) return a;
          const updatedVms = res.data.data.map((v: any) => ({
            ...a.vms.find((av: any) => av.id === v.id) || v,
            ...v,
            isrunning: v.isrunning,
            ip:        v.ip,
            port:      v.port,
            proxmox_vmid: v.proxmox_vmid ?? a.vms.find((av: any) => av.id === v.id)?.proxmox_vmid
          }));
          return { ...a, isrunning: true, vms: updatedVms };
        }));
        // Start IP poller — VMs boot asynchronously; guest-agent IP arrives later
        startIpPoller();
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to launch VMs');
    } finally { setLaunchingAssign(null); }
  };

  // ── Assignment-level: Stop All ────────────────────────────────────────────
  const handleStopAll = async (assignmentId: string) => {
    setStoppingAssign(assignmentId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/stopProxmoxClusterVMs`,
        { assignmentId }
      );
      if (res.data.success) {
        notify('success', 'All VMs stopped');
        setAssignments(prev => prev.map(a => {
          if (a.id !== assignmentId) return a;
          return {
            ...a,
            isrunning: false,
            vms: a.vms.map((v: any) => ({ ...v, isrunning: false }))
          };
        }));
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to stop VMs');
    } finally { setStoppingAssign(null); }
  };

  // ── Individual VM: Start ──────────────────────────────────────────────────
  const handleStartVM = async (assignmentId: string, vmRowId: string) => {
    setStartingVM(vmRowId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/startSingleProxmoxClusterVM`,
        { vmRowId }
      );
      if (res.data.success) {
        notify('success', 'VM start command sent — polling for IP...');
        setAssignments(prev => prev.map(a => {
          if (a.id !== assignmentId) return a;
          return {
            ...a,
            vms: a.vms.map((v: any) =>
              v.id === vmRowId ? { ...v, isrunning: res.data.data.isrunning,ip:res.data.data.ip } : v
            )
          };
        }));
        // Start IP poller — guest-agent IP arrives asynchronously after boot
        startIpPoller();
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to start VM');
    } finally { setStartingVM(null); }
  };

  // ── Individual VM: Stop ───────────────────────────────────────────────────
  const handleStopVM = async (assignmentId: string, vmRowId: string) => {
    setStoppingVM(vmRowId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/stopSingleProxmoxClusterVM`,
        { vmRowId }
      );
      if (res.data.success) {
        notify('success', 'VM stopped');
        setAssignments(prev => prev.map(a => {
          if (a.id !== assignmentId) return a;
          return {
            ...a,
            vms: a.vms.map((v: any) =>
              v.id === vmRowId ? { ...v, isrunning: false } : v
            )
          };
        }));
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to stop VM');
    } finally { setStoppingVM(null); }
  };

  // ── Delete assignment ─────────────────────────────────────────────────────
  const handleDelete = async (assignmentId: string) => {
    setDeleting(assignmentId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteProxmoxClusterUserAssignment`,
        { assignmentId }
      );
      if (res.data.success) {
        notify('success', 'Assignment removed');
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to remove assignment');
    } finally { setDeleting(null); }
  };

  // ── Connect to VM via Guacamole ───────────────────────────────────────────
  const handleConnect = async (vm: any) => {
    if (!vm.ip) { notify('error', 'VM is not running — no IP available'); return; }
    try {
      const resp = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/get-guac-url`,
        { protocol: vm.protocol || 'RDP', hostname: vm.ip, port: vm.port, username: vm.username, password: vm.password }
      );
      if (resp.data.success) {
        const wsPath   = resp.data.wsPath;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const hostPort = `${window.location.hostname}:3002`;
        const wsUrl    = `${protocol}://${hostPort}${wsPath}`;
        navigate(`/dashboard/labs/vm-session/${lab.labid}`, {
          state: { guacUrl: wsUrl, vmTitle: `${lab.title} — ${vm.vm_label}`, vmId: lab.labid, doc: lab.labguide, credentials: [vm] }
        });
      } else throw new Error('Failed to get connection token');
    } catch (e: any) {
      notify('error', e.message || 'Failed to connect to VM');
    }
  };

  const protocolIcon = (p: string) => {
    if (p === 'SSH') return <Terminal className="h-3.5 w-3.5" />;
    if (p === 'VNC') return <Globe    className="h-3.5 w-3.5" />;
    return                  <Monitor  className="h-3.5 w-3.5" />;
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-dark-200 rounded-lg w-full max-w-6xl p-6 max-h-[90vh] overflow-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Cluster User List — {lab?.title}</GradientText>
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={fetchData} className="p-2 hover:bg-dark-300 rounded-lg" title="Refresh all">
              <RefreshCw className="h-4 w-4 text-gray-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-3 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-emerald-900/20 border-emerald-500/20'
              : 'bg-red-900/20 border-red-500/20'
          }`}>
            <p className={`text-sm ${notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {notification.message}
            </p>
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin h-6 w-6 text-primary-500" />
            <span className="ml-3 text-gray-400">Loading...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No users assigned to this lab yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map(assignment => {
              const anyRunning   = assignment.vms?.some((v: any) => v.isrunning);
              const isLaunching  = launchingAssign === assignment.id;
              const isStopping   = stoppingAssign  === assignment.id;
              const isLaunched =  assignment.vms?.every((v: any) => v.islaunched)

              return (
                <div key={assignment.id} className="bg-dark-300/30 rounded-lg p-4">

                  {/* User header row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-lg font-semibold text-primary-300">
                        {assignment.user_name || assignment.user_id}
                      </h3>
                      {assignment.user_email && (
                        <span className="text-sm text-gray-500">{assignment.user_email}</span>
                      )}
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        assignment.isrunning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {assignment.isrunning ? 'Running' : assignment.status || 'not-started'}
                      </span>
                    </div>

                    {/* Per-user Launch All / Stop All + Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLaunchAll(assignment.id)}
                        disabled={isLaunching || anyRunning ||isLaunched}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                   bg-gradient-to-r from-secondary-500 to-accent-500
                                   hover:from-secondary-400 hover:to-accent-400 text-white
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {isLaunching
                          ? <><Loader className="animate-spin h-3.5 w-3.5" /><span>Launching...</span></>
                          : <><Power  className="h-3.5 w-3.5" /><span>Launch All</span></>}
                      </button>

                      <button
                        onClick={() => handleStopAll(assignment.id)}
                        disabled={isStopping || !anyRunning}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                   bg-dark-400/80 hover:bg-dark-300/80 border border-secondary-500/20 text-secondary-300
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {isStopping
                          ? <><Loader className="animate-spin h-3.5 w-3.5" /><span>Stopping...</span></>
                          : <><Square className="h-3.5 w-3.5" /><span>Stop All</span></>}
                      </button>

                      <button
                        onClick={() => handleDelete(assignment.id)}
                        disabled={deleting === assignment.id}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                        title="Remove assignment">
                        {deleting === assignment.id
                          ? <Loader className="animate-spin h-4 w-4" />
                          : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* VMs table */}
                  {(!assignment.vms || assignment.vms.length === 0) ? (
                    <p className="text-sm text-gray-500 italic">No VMs provisioned yet — click Launch All.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                            <th className="pb-3 pr-3">VM Label</th>
                            <th className="pb-3 pr-3">VMID</th>
                            <th className="pb-3 pr-3">Username</th>
                            <th className="pb-3 pr-3">Password</th>
                            <th className="pb-3 pr-3">IP Address</th>
                            <th className="pb-3 pr-3">Port</th>
                            <th className="pb-3 pr-3">Protocol</th>
                            <th className="pb-3 pr-3">Status</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignment.vms.map((vm: any) => {
                            const passKey   = `${assignment.id}-${vm.id}`;
                            const isRunning = vm.isrunning;
                            const isVMStart = startingVM === vm.id;
                            const isVMStop  = stoppingVM  === vm.id;

                            return (
                              <tr key={vm.id} className="border-b border-primary-500/10">

                                {/* VM Label */}
                                <td className="py-3 pr-3">
                                  <div className="flex items-center space-x-1.5">
                                    {protocolIcon(vm.protocol)}
                                    <span className="font-medium text-gray-300 text-sm">{vm.vm_label}</span>
                                  </div>
                                </td>

                                {/* VMID */}
                                <td className="py-3 pr-3">
                                  <span className="font-mono text-gray-400 text-sm">
                                    {vm.proxmox_vmid ?? <span className="italic text-gray-600">pending</span>}
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
                                      className="p-0.5 hover:bg-dark-300/50 rounded">
                                      {showPass[passKey] ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
                                    </button>
                                  </div>
                                </td>

                                {/* IP */}
                                <td className="py-3 pr-3">
                                  <span className="font-mono text-gray-300 text-sm">{vm.ip || '—'}</span>
                                </td>

                                {/* Port */}
                                <td className="py-3 pr-3">
                                  <span className="font-mono text-gray-300 text-sm">{vm.port || '—'}</span>
                                </td>

                                {/* Protocol */}
                                <td className="py-3 pr-3">
                                  <span className="font-mono text-gray-300 text-sm">{vm.protocol}</span>
                                </td>

                                {/* Status */}
                                <td className="py-3 pr-3">
                                  <span className={`text-xs font-medium ${
                                    isRunning       ? 'text-emerald-400' :
                                    vm.proxmox_vmid ? 'text-amber-400'   : 'text-gray-500'
                                  }`}>
                                    ● {vm.proxmox_vmid ? (isRunning ? 'running' : 'stopped') : 'pending'}
                                  </span>
                                </td>

                                {/* Actions: Start | Stop | Connect */}
                                <td className="py-3">
                                  <div className="flex items-center space-x-1">

                                    {/* Start single VM */}
                                    <button
                                      onClick={() => handleStartVM(assignment.id, vm.id)}
                                      disabled={!vm.proxmox_vmid || isRunning || isVMStart}
                                      className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400
                                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Start VM">
                                      {isVMStart
                                        ? <Loader className="animate-spin h-4 w-4" />
                                        : <Power className="h-4 w-4" />}
                                    </button>

                                    {/* Stop single VM */}
                                    <button
                                      onClick={() => handleStopVM(assignment.id, vm.id)}
                                      disabled={!vm.proxmox_vmid || !isRunning || isVMStop}
                                      className="p-1.5 rounded hover:bg-red-500/10 text-red-400
                                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Stop VM">
                                      {isVMStop
                                        ? <Loader className="animate-spin h-4 w-4" />
                                        : <Square className="h-4 w-4" />}
                                    </button>

                                    {/* Connect via Guacamole */}
                                    <button
                                      onClick={() => handleConnect(vm)}
                                      disabled={!isRunning || !vm.ip}
                                      className="p-1.5 rounded hover:bg-primary-500/10 text-primary-400
                                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title={isRunning ? 'Connect to VM' : 'VM not running'}>
                                      <Monitor className="h-4 w-4" />
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
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center border-t border-primary-500/10 pt-4">
          <span className="text-sm text-gray-400">
            {assignments.length} user{assignments.length !== 1 ? 's' : ''} assigned
          </span>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};
