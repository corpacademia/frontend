import React, { useState, useEffect } from 'react';
import {
  Server, Calendar, Clock, Pencil, Trash2, Plus,
  X, Check, AlertCircle, Loader, Users, UserIcon, LinkIcon, Layers
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { AssignUsersModal } from '../catalogue/AssignUsersModal';
import { ProxmoxClusterVMListModal } from './ProxmoxClusterVMListModal';
import { ProxmoxClusterUserListModal } from './ProxmoxClusterUserListModal';
import { ProxmoxClusterConvertToCatalogueModal } from './ProxmoxClusterConvertToCatalogueModal';
import { ProxmoxClusterConvertToTemplateModal } from './ProxmoxClusterConvertToTemplateModal';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// ── interfaces ────────────────────────────────────────────────────────────────
interface VMConfig {
  id:            string;
  vm_label:      string;
  node:          string;
  template_id:   number;
  cpu:           number;
  ram:           number;
  storage:       number;
  protocol:      string;
  username:      string;
  password:      string;
}

interface ProxmoxClusterLab {
  labid:        string;
  user_id:      string;
  title:        string;
  description:  string;
  status:       string;
  startdate:    string;
  enddate:      string;
  software:     string[];
  vmConfigs:    VMConfig[];
  remaining:    number;
  assessment?:  boolean;   // true = org-assigned (show Assign Lab); false/undefined = own (show Convert)
}

interface ProxmoxClusterCardProps {
  lab:      ProxmoxClusterLab;
  onDelete?: () => void;
}

function formatDate(dateString: string) {
  if (!dateString) return '—';
  const date  = new Date(dateString);
  const year  = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day   = `${date.getDate()}`.padStart(2, '0');
  let hours   = date.getHours();
  const mins  = `${date.getMinutes()}`.padStart(2, '0');
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  hours       = hours % 12 || 12;
  return `${year}-${month}-${day} ${hours}:${mins} ${ampm}`;
}

// (ConvertToCatalogueModal is now ProxmoxClusterConvertToCatalogueModal — imported above)

// ── Main Card ─────────────────────────────────────────────────────────────────
export const ProxmoxClusterCard: React.FC<ProxmoxClusterCardProps> = ({ lab, onDelete }) => {
  
  const { user } = useAuthStore();
  const [currentUser, setCurrentUser]   = useState<any>(null);
  const [isDeleting,     setIsDeleting]     = useState(false);
  const [isEditOpen,     setIsEditOpen]     = useState(false);
  const [isAssignOpen,   setIsAssignOpen]   = useState(false);
  const [isVMListOpen,   setIsVMListOpen]   = useState(false);   // User List = lab VM configs
  const [isPodsOpen,     setIsPodsOpen]     = useState(false);   // Pods = assigned users
  const [isConvertOpen,  setIsConvertOpen]  = useState(false);
  const [isSaving,    setIsSaving]      = useState(false);
  const [isConverting,       setIsConverting]       = useState(false);
  const [isTemplatizing,     setIsTemplatizing]     = useState(false);
  const [isTemplateModalOpen,setIsTemplateModalOpen]= useState(false);
  const [isSelfAssigning,    setIsSelfAssigning]    = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showFullStartDate, setShowFullStartDate] = useState(false);
  const [showFullEndDate,   setShowFullEndDate]   = useState(false);

  // Edit form
  const [editTitle,       setEditTitle]       = useState(lab.title);
  const [editDescription, setEditDescription] = useState(lab.description || '');
  const [editStart,       setEditStart]       = useState<Date | null>(lab.startdate ? new Date(lab.startdate) : null);
  const [editEnd,         setEditEnd]         = useState<Date | null>(lab.enddate   ? new Date(lab.enddate)   : null);
  const [editSoftware,    setEditSoftware]    = useState<string[]>((lab.software || []));
  
  useEffect(() => { setCurrentUser(user); }, [user]);
  // Same logic as ClusterVMCard.canEditContent():
  // Returns true for superadmin, or orgsuperadmin on their OWN labs (!assessment), or the creator
  const canEditContent = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'orgsuperadmin' && !lab.assessment) return true;
    if (currentUser.id === lab.user_id) return true;
    return false;
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    if (!canEditContent()) {
      // ── Org admin delete: remove this org's assignment + all their users' Proxmox VMs
      // Mirrors ClusterVMCard.handleDelete → deleteFromOrganization
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteProxmoxClusterFromOrganization`,
          {
            labId:   lab.labid,
            orgId:   currentUser?.org_id,
            adminId: currentUser?.impersonating ? currentUser?.impersonatedUserId : currentUser?.id,
            role:currentUser?.role
          }
        );
        if (res.data.success) {
          notify('success', 'Lab removed from organization and VMs deleted');
          setTimeout(() => onDelete?.(), 1500);
        } else throw new Error(res.data.message || 'Failed to remove lab from organization');
      } catch (e: any) {
        notify('error', e.response?.data?.message || 'Failed to remove lab from organization');
      } finally { setIsDeleting(false); }
      return;
    }
    // ── Superadmin / creator: full delete — lab + all VMs from Proxmox
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteProxmoxClusterLab/${lab.labid}`
      );
      if (res.data.success) {
        notify('success', 'Lab deleted');
        setTimeout(() => onDelete?.(), 1500);
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to delete lab');
    } finally { setIsDeleting(false); }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateProxmoxClusterLab`,
        { labId: lab.labid, title: editTitle, description: editDescription, startdate: editStart, enddate: editEnd, software: editSoftware.filter(s => s.trim()) }
      );
      if (res.data.success) {
        notify('success', 'Lab updated');
        setIsEditOpen(false);
        setTimeout(() => window.location.reload(), 1200);
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to update lab');
    } finally { setIsSaving(false); }
  };

  // Convert all VM configs to Proxmox templates (prerequisite for assignment)
  const handleConvertToTemplate = async () => {
    setIsTemplatizing(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/convertProxmoxClusterVMsToTemplates`,
        { labId: lab.labid }
      );
      if (res.data.success) {
        const results  = res.data.data || [];
        const failed   = results.filter((r: any) => r.status === 'failed');
        if (failed.length === 0) {
          notify('success', `All ${results.length} VM(s) converted to templates`);
        } else {
          notify('error', `${failed.length} VM(s) failed to convert — check Proxmox`);
        }
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Template conversion failed');
    } finally { setIsTemplatizing(false); }
  };

  // Self-assign so admin can launch + test the lab from their user view
  const handleSelfAssign = async () => {
    setIsSelfAssigning(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/selfAssignProxmoxCluster`,
        {
          labId:     lab.labid,
          userId:    currentUser?.id,
          startDate: lab.startdate,
          endDate:   lab.enddate,
        }
      );
      if (res.data.success) {
        notify('success', 'Lab assigned to your account — check your labs to launch');
      } else throw new Error(res.data.message);
    } catch (e: any) {
      notify('error', e.response?.data?.message || 'Failed to assign lab to your account');
    } finally { setIsSelfAssigning(false); }
  };

  const statusCls =
    lab.status === 'available' ? 'bg-emerald-500/20 text-emerald-300' :
    lab.status === 'expired'   ? 'bg-red-500/20 text-red-300' :
                                  'bg-amber-500/20 text-amber-300';

  const inputCls = 'w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none';

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-[280px] sm:min-h-[320px] lg:min-h-[300px] xl:min-h-[320px]
                      max-h-fit overflow-hidden rounded-xl border border-secondary-500/10
                      hover:border-secondary-500/30 bg-dark-200/80 backdrop-blur-sm
                      transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/10
                      hover:translate-y-[-2px] group relative">

        {/* Notification overlay */}
        {notification && (
          <div className={`absolute top-2 right-2 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {notification.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        <div className="p-3 sm:p-4 flex flex-col h-full">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold mb-1 line-clamp-2">
                <GradientText>{lab.title}</GradientText>
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{lab.description}</p>
            </div>
            <div className="flex items-center justify-between sm:justify-start space-x-2 flex-shrink-0">
              {canEditContent() && (
                <button onClick={() => setIsEditOpen(true)}
                  className="p-1.5 sm:p-2 hover:bg-dark-300/50 rounded-lg transition-colors">
                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-primary-400" />
                </button>
              )}
              <button onClick={handleDelete} disabled={isDeleting}
                className="p-1.5 sm:p-2 hover:bg-dark-300/50 rounded-lg transition-colors">
                {isDeleting
                  ? <Loader className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                  : <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />}
              </button>
              <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusCls}`}>
                {lab.status}
              </span>
            </div>
          </div>

          {/* VM list */}
          <div className="mb-3 space-y-1.5">
            {(lab.vmConfigs || []).map((vm, i) => (
              <div key={vm.id || i}
                className="flex items-center justify-between px-2 py-1.5 bg-dark-400/40 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Server className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                  <span className="text-xs text-gray-300 font-medium truncate max-w-[110px]">{vm.vm_label}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>{vm.cpu}vCPU / {vm.ram >= 1024 ? `${vm.ram / 1024}GB` : `${vm.ram}MB`}</span>
                  <span className="px-1.5 py-0.5 bg-secondary-500/10 text-secondary-300 rounded">
                    {vm.protocol}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3">
            <div className="flex items-center text-xs sm:text-sm text-gray-400">
              <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">{lab.vmConfigs?.length || 0} VMs</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-400 col-span-1 sm:col-span-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-secondary-400 flex-shrink-0" />
              <span className={`${showFullStartDate ? '' : 'truncate'} cursor-pointer`}
                onClick={() => setShowFullStartDate(!showFullStartDate)}>
                Start: {formatDate(lab.startdate)}
              </span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-400 col-span-1 sm:col-span-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-secondary-400 flex-shrink-0" />
              <span className={`${showFullEndDate ? '' : 'truncate'} cursor-pointer`}
                onClick={() => setShowFullEndDate(!showFullEndDate)}>
                End: {formatDate(lab.enddate)}
              </span>
            </div>
          </div>

          {/* Software / Technologies */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Software</p>
            {(lab.software || []).length > 0 ? (
              <div className="flex flex-wrap gap-1 max-h-[56px] overflow-y-auto">
                {(lab.software || []).map((sw: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-500/20 text-secondary-300">
                    {sw}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-600 italic">—</span>
            )}
          </div>

          {/* ── Action buttons — same logic as ClusterVMCard ─────────────── */}
          <div className="mt-auto pt-2 sm:pt-3 border-t border-secondary-500/10 space-y-2">

            {/* VM List — shows the lab's configured VMs */}
            <button onClick={() => setIsVMListOpen(true)}
              className="w-full h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                         bg-dark-400/80 hover:bg-dark-300/80 border border-secondary-500/20
                         hover:border-secondary-500/30 text-secondary-300
                         flex items-center justify-center">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              User List
            </button>

            {/* Bottom row depends on role + ownership */}
            {!canEditContent() &&
              (currentUser?.role === 'labadmin' || currentUser?.role === 'orgsuperadmin' || currentUser?.role === 'trainer') ? (
              // ── Org-assigned (purchased) lab ─────────────────────────────────
              // Mirrors ProxmoxVMCard.tsx exactly:
              //   orgsuperadmin: "Convert to Template" (with cred/payment) + "Assign Lab" + Pods
              //   labadmin/trainer: "Assign Lab" + Pods only
              // NO "Convert to Catalogue" — that only exists for OWN labs.
              // After templates are ready, org admin assigns users who will clone on launch.
              // "Launch Lab (Test)" is inside the User List modal.
              <div className="space-y-2">
                {currentUser?.role === 'orgsuperadmin' && (
                  <button onClick={() => setIsTemplateModalOpen(true)}
                    className="w-full h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                               bg-dark-400/80 hover:bg-dark-300/80
                               border border-primary-500/20 hover:border-primary-500/30
                               text-primary-300 flex items-center justify-center transition-all">
                    <Layers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Convert to Template
                  </button>
                )}

                {/* Assign Lab + Pods (all org roles) */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentUser?.role === 'trainer'}
                    onClick={() => setIsAssignOpen(true)}
                    className="flex-1 h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                               bg-gradient-to-r from-primary-500 to-secondary-500
                               hover:from-primary-400 hover:to-secondary-400
                               transform hover:scale-105 transition-all duration-300
                               text-white shadow-lg shadow-primary-500/20
                               flex items-center justify-center
                               disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Assign Lab
                  </button>
                  <button onClick={() => setIsPodsOpen(true)}
                    className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg bg-dark-400/80 hover:bg-dark-300/80
                               border border-secondary-500/20 hover:border-secondary-500/30
                               text-secondary-300 flex items-center justify-center flex-shrink-0"
                    title="Pods">
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            ) : (
              canEditContent() && (
                // Own lab — lifecycle: open User List to launch/stop VMs → Convert to Template → Convert to Catalogue
                <div className="space-y-2">

                  {/* Convert to Template */}
                  <button onClick={handleConvertToTemplate} disabled={isTemplatizing}
                    className="w-full h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                               bg-dark-400/80 hover:bg-dark-300/80
                               border border-primary-500/20 hover:border-primary-500/30
                               text-primary-300 flex items-center justify-center
                               disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    {isTemplatizing
                      ? <><Loader className="animate-spin h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Converting to Templates...</>
                      : <><Layers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Convert to Template</>}
                  </button>

                  {/* Step: Publish as catalogue + Pods */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsConvertOpen(true)} disabled={isConverting}
                      className="flex-1 h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium
                                 bg-gradient-to-r from-secondary-500 to-accent-500
                                 hover:from-secondary-400 hover:to-accent-400
                                 transform hover:scale-105 transition-all duration-300
                                 text-white shadow-lg shadow-secondary-500/20
                                 flex items-center justify-center
                                 disabled:opacity-40 disabled:cursor-not-allowed">
                      {isConverting
                        ? <Loader className="animate-spin h-3 w-3 sm:h-4 sm:w-4" />
                        : <><Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Convert to Catalogue</>}
                    </button>
                    <button onClick={() => setIsPodsOpen(true)}
                      className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg bg-dark-400/80 hover:bg-dark-300/80
                                 border border-secondary-500/20 hover:border-secondary-500/30
                                 text-secondary-300 flex items-center justify-center flex-shrink-0"
                      title="Pods">
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* Convert to Template modal (orgsuperadmin on purchased lab) */}
      {isTemplateModalOpen && (
        <ProxmoxClusterConvertToTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          lab={lab}
          onSuccess={() => {
            setIsTemplateModalOpen(false);
            notify('success', 'All VMs converted to templates successfully');
          }}
        />
      )}

      {/* User List = lab VM configs (readOnly for org-purchased so templates stay protected) */}
      {isVMListOpen && (
        <ProxmoxClusterVMListModal
          isOpen={isVMListOpen}
          onClose={() => setIsVMListOpen(false)}
          lab={lab}
          readOnly={lab.assessment}
        />
      )}

      {/* Pods = assigned users + their cloned VMs */}
      {isPodsOpen && (
        <ProxmoxClusterUserListModal
          isOpen={isPodsOpen}
          onClose={() => setIsPodsOpen(false)}
          lab={lab}
        />
      )}

      {isAssignOpen && (
        <AssignUsersModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          lab={{ ...lab, labid: lab.labid } as any}
          type="proxmox-cluster"
        />
      )}

      {isConvertOpen && (
        <ProxmoxClusterConvertToCatalogueModal
          isOpen={isConvertOpen}
          onClose={() => setIsConvertOpen(false)}
          lab={lab}
        />
      )}

      {/* Edit modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-xl w-full max-w-lg p-6 space-y-4"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold"><GradientText>Edit Lab</GradientText></h2>
              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-dark-300 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Title</label>
              <input className={inputCls} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <textarea className={inputCls} rows={3} value={editDescription}
                onChange={e => setEditDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Start Date</label>
                <DatePicker selected={editStart} onChange={setEditStart}
                  showTimeSelect dateFormat="MMMM d, yyyy h:mm aa" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">End Date</label>
                <DatePicker selected={editEnd} onChange={setEditEnd}
                  minDate={editStart || new Date()} showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa" className={inputCls} />
              </div>
            </div>
            {/* Software / Technologies */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm text-gray-300">Software / Technologies</label>
                <button type="button" onClick={() => setEditSoftware(prev => [...prev, ''])}
                  className="text-xs text-primary-400 hover:text-primary-300">+ Add</button>
              </div>
              <div className="space-y-2">
                {editSoftware.map((sw, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={`${inputCls} flex-1`} value={sw}
                      onChange={e => {
                        const copy = [...editSoftware]; copy[i] = e.target.value; setEditSoftware(copy);
                      }}
                      placeholder="e.g. Kali Linux" />
                    <button type="button" onClick={() => setEditSoftware(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {editSoftware.length === 0 && (
                  <p className="text-xs text-gray-600 italic">No software added</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setIsEditOpen(false)} className="btn-secondary" disabled={isSaving}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="btn-primary">
                {isSaving ? <><Loader className="animate-spin h-4 w-4 mr-2" />Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
