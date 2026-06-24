import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Plus, Trash2, Server,
  Check, AlertCircle, Loader, Eye, EyeOff,
  Building2, Globe
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { useProxmoxConfigStore } from '../../../../store/proxmoxConfigStore';
import { useCloudCredentialsStore, CloudCredential } from '../../../../store/cloudCredentialsStore';
import { BasicInfoStep } from '../create/steps/BasicInfoStep';
import { DocumentUploader } from '../create/steps/DocumentUploader';
import axios from 'axios';

// ── VM Config interface ───────────────────────────────────────────────────────
interface VMConfig {
  vm_label:      string;
  node:          string;
  template_id:   string;
  cpu:           number;
  ram:           number;
  storage:       number;
  storagetype:   string;
  networkbridge: string;
  nicmodel:      string;
  protocol:      string;
  username:      string;
  password:      string;
  showPassword:  boolean;
}

interface TemplateOption { vmid: number; name: string; }
interface NodeOption     { node: string; }

const emptyVM = (): VMConfig => ({
  vm_label:      'VM',
  node:          '',
  template_id:   '',
  cpu:           2,
  ram:           2048,
  storage:       50,
  storagetype:   'local-lvm',
  networkbridge: 'vmbr0',
  nicmodel:      'virtio',
  protocol:      'RDP',
  username:      '',
  password:      '',
  showPassword:  false,
});

interface ProxmoxClusterWorkflowProps {
  onBack: () => void;
}

export const ProxmoxClusterWorkflow: React.FC<ProxmoxClusterWorkflowProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const { storages, networkBridges, nicModels, fetchNetworkBridges, fetchNICModels } = useProxmoxConfigStore();
  const { globalCredentials, orgCredentials, isLoading: credsLoading, fetchGlobalCredentials, fetchOrgCredentials } =
    useCloudCredentialsStore();

  const [step, setStep]                   = useState(1);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [notification, setNotification]  = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // VM configs state (used in step 2)
  const [vmConfigs, setVmConfigs]         = useState<VMConfig[]>([emptyVM()]);

  // Lab-level fields not collected by BasicInfoStep
  const [startdate,     setStartdate]     = useState('');
  const [enddate,       setEnddate]       = useState('');

  // Credential selection (step 4)
  const [selectedCred,   setSelectedCred]   = useState<CloudCredential | null>(null);
  const [selectedSource, setSelectedSource] = useState<'org' | 'global'>('org');

  // Per-node template cache
  const [nodesList, setNodesList]             = useState<NodeOption[]>([]);
  const [templatesByNode, setTemplatesByNode] = useState<Record<string, TemplateOption[]>>({});
  const [loadingNodes, setLoadingNodes]       = useState(false);

  // ── Fetch Proxmox nodes + bridge/NIC models on mount ─────────────────────
  
  useEffect(() => {
    const fetchNodes = async () => {
      setLoadingNodes(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/nodes/${selectedCred?.id}`);
        const nodes: NodeOption[] = ((res.data.data || res.data) || []).map((n: any) => ({ node: n.node || n }));
        setNodesList(nodes);
      } catch (e) { console.error('Could not fetch Proxmox nodes:', e); }
      setLoadingNodes(false);
    };
    fetchNodes();
    fetchNetworkBridges('',selectedCred?.id);
    fetchNICModels();

    // Fetch proxmox credentials based on role
    if (user?.role === 'superadmin') {
      fetchGlobalCredentials();
    } else if ((user?.role === 'orgsuperadmin' || user?.role === 'labadmin') && user?.org_id) {
      fetchGlobalCredentials();
      fetchOrgCredentials(user.org_id);
    }

    // Clear any stale localStorage formData for a clean form
    localStorage.removeItem('formData');
  }, [selectedCred]);

  // Fetch templates for a node when selected
  const fetchTemplatesForNode = async (node: string) => {
    if (!node || templatesByNode[node]) return;
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/templates`,
        { NODE: node,credentialId:selectedCred.id }
      );
      if (res.data.success || res.data.data) {
        setTemplatesByNode(prev => ({ ...prev, [node]: res.data.data || [] }));
      }
    } catch (e) { console.error('Could not fetch templates for node', node); }
  };

  // ── VM config helpers ─────────────────────────────────────────────────────
  const updateVM = (index: number, field: keyof VMConfig, value: any) => {
    setVmConfigs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'node') fetchTemplatesForNode(value);
      return copy;
    });
  };

  const addVM    = () => setVmConfigs(prev => [...prev, emptyVM()]);
  const removeVM = (i: number) => setVmConfigs(prev => prev.filter((_, idx) => idx !== i));

  // ── Step navigation ───────────────────────────────────────────────────────
  // Called by BasicInfoStep when the user clicks "Next"
  const handleBasicInfoNext = (_data: any) => {
    setStep(2);
  };

  // Called when user clicks "Next" in the VM configs step
  const handleVMConfigsNext = () => {
    if (!startdate || !enddate) {
      setNotification({ type: 'error', message: 'Please fill in Start Date and End Date' });
      return;
    }
    const allValid = vmConfigs.every(vm => vm.node && vm.template_id && vm.vm_label.trim());
    if (!allValid) {
      setNotification({ type: 'error', message: 'Please fill in all VM fields (Label, Node, Template)' });
      return;
    }
    setNotification(null);
    setStep(4);
  };

  // Called by DocumentUploader's "Continue" button (onNext prop)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setNotification(null);

    try {
      // Read basic info + documents from localStorage (saved by BasicInfoStep and DocumentUploader)
      const storedData = JSON.parse(localStorage.getItem('formData') || '{}');
      const details    = storedData.details    || {};
      const labGuides  = storedData.labGuides  || [];
      const userGuides = storedData.userGuides || [];

      if (!details.title) {
        setNotification({ type: 'error', message: 'Lab title is missing. Please go back to step 1.' });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        userId:        user?.id,
        details,
        labGuides,
        userGuides,
        startdate,
        enddate,
        credential_id: selectedCred?.id || undefined,
        credential_source: selectedSource,
        software:  details.technologies
          ? details.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
        vmConfigs: vmConfigs.map(({ showPassword, ...rest }) => ({
          ...rest,
          template_id: parseInt(rest.template_id, 10)
        }))
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/createProxmoxClusterLab`,
        payload
      );

      if (res.data.success) {
        setNotification({ type: 'success', message: 'Proxmox Cluster Lab created successfully!' });
        localStorage.removeItem('formData');
        setTimeout(() => onBack(), 2000);
      } else {
        throw new Error(res.data.message || 'Failed to create lab');
      }
    } catch (err: any) {
      setNotification({
        type:    'error',
        message: err.response?.data?.message || err.message || 'Failed to create lab'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  // Proxmox-only credential lists
  const proxmoxGlobal = globalCredentials.filter(c => c.provider === 'proxmox');
  const proxmoxOrg    = orgCredentials.filter(c => c.provider === 'proxmox');

  const stepLabels = ['Basic Info', 'Select Account', 'VM Configurations', 'Documents'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold">
            <GradientText>Create Proxmox VM Cluster Lab</GradientText>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Define multiple VM templates — each assigned user gets their own set of cloned VMs
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center space-x-2">
        {stepLabels.map((label, idx) => {
          const s = idx + 1;
          return (
            <React.Fragment key={s}>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-colors
                  ${step > s ? 'bg-primary-500 text-white' :
                    step === s ? 'bg-primary-500 text-white' :
                    'bg-dark-400 text-gray-400'}`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                <span className={`text-sm hidden sm:inline ${step === s ? 'text-gray-200' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {s < 4 && <div className={`h-0.5 flex-1 ${step > s ? 'bg-primary-500' : 'bg-dark-400'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          notification.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/20 border border-red-500/20 text-red-300'
        }`}>
          {notification.type === 'success'
            ? <Check className="h-5 w-5 flex-shrink-0" />
            : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* ── STEP 1: Basic Info (reuse existing component) ─────────────────── */}
      {step === 1 && (
        <BasicInfoStep
          onNext={handleBasicInfoNext}
          type="proxmox-cluster"
        />
      )}

      {/* ── STEP 2: Select Account ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center space-x-4">
            <button onClick={() => setStep(1)}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <div>
              <h3 className="text-lg font-semibold"><GradientText>Select Proxmox Account</GradientText></h3>
              <p className="text-sm text-gray-400 mt-0.5">Choose the account to deploy your cluster lab on</p>
            </div>
          </div>

          {credsLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 text-primary-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">

              {/* ── Superadmin: global credentials only ── */}
              {user?.role === 'superadmin' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-amber-400" />
                    <h4 className="text-sm font-medium text-gray-300">Global Proxmox Credentials</h4>
                  </div>
                  {proxmoxGlobal.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-primary-500/20 rounded-lg">
                      No global Proxmox credentials configured.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {proxmoxGlobal.map(cred => (
                        <button
                          key={cred.id}
                          onClick={() => { setSelectedCred(cred); setSelectedSource('global'); }}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-200
                            ${selectedCred?.id === cred.id
                              ? 'border-primary-500/60 bg-primary-500/10'
                              : 'border-primary-500/20 bg-dark-300/40 hover:border-primary-500/40'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-amber-500/10">
                                <Globe className="h-4 w-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                <p className="text-xs text-gray-400 capitalize">{cred.provider}</p>
                                {cred.credentials?.api_url && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5">{cred.credentials.api_url}</p>
                                )}
                              </div>
                            </div>
                            {selectedCred?.id === cred.id && <Check className="h-4 w-4 text-primary-400" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Orgsuperadmin / Labadmin: org creds + global creds ── */}
              {(user?.role === 'orgsuperadmin' || user?.role === 'labadmin') && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-primary-400" />
                      <h4 className="text-sm font-medium text-gray-300">Your Organization's Credentials</h4>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300">Free</span>
                    </div>
                    {proxmoxOrg.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-primary-500/20 rounded-lg">
                        No org Proxmox credentials. Add them in Cloud Settings.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {proxmoxOrg.map(cred => (
                          <button
                            key={cred.id}
                            onClick={() => { setSelectedCred(cred); setSelectedSource('org'); }}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200
                              ${selectedCred?.id === cred.id
                                ? 'border-primary-500/60 bg-primary-500/10'
                                : 'border-primary-500/20 bg-dark-300/40 hover:border-primary-500/40'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary-500/10">
                                  <Building2 className="h-4 w-4 text-primary-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                  <p className="text-xs text-gray-400 capitalize">{cred.provider}</p>
                                  {cred.credentials?.api_url && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{cred.credentials.api_url}</p>
                                  )}
                                </div>
                              </div>
                              {selectedCred?.id === cred.id && <Check className="h-4 w-4 text-primary-400" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-primary-500/20" />
                    <span className="text-xs text-gray-500">or use GoLab Cloud</span>
                    <div className="flex-1 h-px bg-primary-500/20" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-amber-400" />
                      <h4 className="text-sm font-medium text-gray-300">GoLab Global Credentials</h4>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300">⚡ Paid</span>
                    </div>
                    {proxmoxGlobal.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-amber-500/20 rounded-lg">
                        No GoLab global credentials available.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {proxmoxGlobal.map(cred => (
                          <button
                            key={cred.id}
                            onClick={() => { setSelectedCred(cred); setSelectedSource('global'); }}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200
                              ${selectedCred?.id === cred.id
                                ? 'border-amber-500/60 bg-amber-500/10'
                                : 'border-amber-500/20 bg-dark-300/40 hover:border-amber-500/40'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10">
                                  <Globe className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-200">{cred.name}</p>
                                  <p className="text-xs text-gray-400 capitalize">{cred.provider}</p>
                                  {cred.credentials?.api_url && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{cred.credentials.api_url}</p>
                                  )}
                                </div>
                              </div>
                              {selectedCred?.id === cred.id && <Check className="h-4 w-4 text-amber-400" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-primary-500/10">
            <button onClick={() => setStep(1)}
              className="flex items-center space-x-2 px-6 py-2 bg-dark-400/50 hover:bg-dark-300/50 text-gray-300 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4" /><span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500
                         hover:from-primary-400 hover:to-secondary-400
                         text-white rounded-lg transition-all"
            >
              Next: VM Configurations
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: VM Configurations ─────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold"><GradientText>VM Configurations</GradientText></h3>
            <button onClick={addVM}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg transition-colors text-sm">
              <Plus className="h-4 w-4" /><span>Add VM</span>
            </button>
          </div>

          {/* Lab Schedule */}
          <div className="bg-dark-200 rounded-xl border border-primary-500/10 p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-300">Lab Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date *</label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={startdate}
                  onChange={e => setStartdate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>End Date *</label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={enddate}
                  onChange={e => setEnddate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400">
            Each VM below represents a template to clone. Every assigned user gets their own copy of <strong>all</strong> VMs.
          </p>

          {vmConfigs.map((vm, i) => (
            <div key={i} className="bg-dark-200 rounded-xl border border-secondary-500/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-secondary-500/10 rounded-lg">
                    <Server className="h-4 w-4 text-secondary-400" />
                  </div>
                  <span className="font-medium text-gray-200">VM {i + 1}</span>
                </div>
                {vmConfigs.length > 1 && (
                  <button onClick={() => removeVM(i)}
                    className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>VM Label * <span className="text-gray-500 text-xs">(e.g. Router, Attacker, Target)</span></label>
                  <input className={inputCls} value={vm.vm_label}
                    onChange={e => updateVM(i, 'vm_label', e.target.value)}
                    placeholder="e.g. Kali Attacker" />
                </div>

                <div>
                  <label className={labelCls}>Proxmox Node *</label>
                  {loadingNodes ? (
                    <div className="flex items-center space-x-2 text-gray-400 text-sm py-2">
                      <Loader className="animate-spin h-4 w-4" /><span>Loading nodes...</span>
                    </div>
                  ) : (
                    <select className={inputCls} value={vm.node}
                      onChange={e => updateVM(i, 'node', e.target.value)}>
                      <option value="">Select node</option>
                      {nodesList.map(n => (
                        <option key={n.node} value={n.node}>{n.node}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={labelCls}>VM Template *</label>
                  <select className={inputCls} value={vm.template_id}
                    onChange={e => updateVM(i, 'template_id', e.target.value)}
                    disabled={!vm.node}>
                    <option value="">{vm.node ? 'Select template' : 'Select node first'}</option>
                    {(templatesByNode[vm.node] || []).map((t: any) => (
                      <option key={t.vmid} value={t.vmid}>{t.name} (VMID: {t.vmid})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Protocol</label>
                  <select className={inputCls} value={vm.protocol}
                    onChange={e => updateVM(i, 'protocol', e.target.value)}>
                    <option value="RDP">RDP</option>
                    <option value="SSH">SSH</option>
                    <option value="VNC">VNC</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>CPU Cores</label>
                  <input type="number" min={1} max={64} className={inputCls} value={vm.cpu}
                    onChange={e => updateVM(i, 'cpu', parseInt(e.target.value) || 1)} />
                </div>

                <div>
                  <label className={labelCls}>RAM</label>
                  <select className={inputCls} value={vm.ram}
                    onChange={e => updateVM(i, 'ram', parseInt(e.target.value))}>
                    {[512, 1024, 2048, 4096, 8192, 16384, 32768].map(v => (
                      <option key={v} value={v}>{v >= 1024 ? `${v / 1024} GB` : `${v} MB`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Storage (GB)</label>
                  <input type="number" min={10} max={2000} className={inputCls} value={vm.storage}
                    onChange={e => updateVM(i, 'storage', parseInt(e.target.value) || 50)} />
                </div>

                <div>
                  <label className={labelCls}>Storage Type</label>
                  <select className={inputCls} value={vm.storagetype}
                    onChange={e => updateVM(i, 'storagetype', e.target.value)}>
                    {(storages.length ? storages : [{ storage: 'local-lvm' }, { storage: 'local' }]).map((s: any) => (
                      <option key={s.storage} value={s.storage}>{s.storage}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Network Bridge</label>
                  <select className={inputCls} value={vm.networkbridge}
                    onChange={e => updateVM(i, 'networkbridge', e.target.value)}>
                    {(networkBridges.length ? networkBridges : [{ iface: 'vmbr0' }]).map((b: any) => (
                      <option key={b.iface} value={b.iface}>{b.iface}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>NIC Model</label>
                  <select className={inputCls} value={vm.nicmodel}
                    onChange={e => updateVM(i, 'nicmodel', e.target.value)}>
                    {(nicModels.length ? nicModels : [{ value: 'virtio' }, { value: 'e1000' }]).map((n: any) => (
                      <option key={n.value} value={n.value}>{n.value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Default Username</label>
                  <input className={inputCls} value={vm.username}
                    onChange={e => updateVM(i, 'username', e.target.value)}
                    placeholder="e.g. Administrator, root" />
                </div>

                <div>
                  <label className={labelCls}>Default Password</label>
                  <div className="relative">
                    <input
                      type={vm.showPassword ? 'text' : 'password'}
                      className={`${inputCls} pr-10`}
                      value={vm.password}
                      onChange={e => updateVM(i, 'password', e.target.value)}
                      placeholder="Default VM password"
                    />
                    <button type="button"
                      onClick={() => updateVM(i, 'showPassword', !vm.showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                      {vm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Step 3 navigation */}
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)}
              className="flex items-center space-x-2 px-6 py-2 bg-dark-400/50 hover:bg-dark-300/50 text-gray-300 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4" /><span>Back</span>
            </button>
            <button onClick={handleVMConfigsNext}
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white rounded-lg transition-all">
              Next: Documents
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Documents ────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <button onClick={() => setStep(3)}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <h3 className="text-lg font-semibold"><GradientText>Upload Documents</GradientText></h3>
          </div>

          {isSubmitting && (
            <div className="flex items-center justify-center space-x-3 py-4 text-primary-400">
              <Loader className="animate-spin h-5 w-5" />
              <span>Creating lab...</span>
            </div>
          )}

          <DocumentUploader
            onDocumentsChange={() => {}}
            onUserGuidesChange={() => {}}
            onNext={handleSubmit}
          />
        </div>
      )}

    </div>
  );
};

