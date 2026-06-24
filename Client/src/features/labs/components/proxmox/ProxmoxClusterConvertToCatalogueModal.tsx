/**
 * ProxmoxClusterConvertToCatalogueModal
 *
 * Mirrors ConvertToCatalogueModal (isClusterDatacenterVM=true) exactly in UI.
 *
 * Prerequisites (done separately via "Convert to Template" button on the card):
 *   - All VMs in the cluster must already be Proxmox templates
 *
 * Flow:
 *  1. User fills the form (same fields as ConvertToCatalogueModal for cluster DC)
 *  2. On "Create Catalogue":
 *     a. POST /convertProxmoxClusterVMsToTemplates  — stops + templates each VM on Proxmox
 *     b. POST /updateProxmoxClusterCatalogueDetails — saves name/price/org/etc to DB
 *     c. If org selected → POST /assignProxmoxClusterToOrg
 */

import React, { useState, useEffect } from 'react';
import {
  X, Plus, Minus, AlertCircle, Loader, Check, Server
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { useAuthStore } from '../../../../store/authStore';

interface ProxmoxClusterConvertToCatalogueModalProps {
  isOpen:  boolean;
  onClose: () => void;
  lab:     any;    // the full ProxmoxClusterLab object (needs labid + vmConfigs)
}

interface Organization {
  id:       string;
  name:     string;
  org_admin?: string;
}

interface FormData {
  catalogueName:  string;
  organizationId: string;
  hoursPerDay:    number;
  software:       string[];
  catalogueType:  'private' | 'public';
  level:          string;
  category:       string;
  price:          string;
}

const initialForm: FormData = {
  catalogueName:  '',
  organizationId: '',
  hoursPerDay:    1,
  software:       [''],
  catalogueType:  'private',
  level:          '',
  category:       '',
  price:          '',
};

// ── Main modal ────────────────────────────────────────────────────────────────
export const ProxmoxClusterConvertToCatalogueModal: React.FC<ProxmoxClusterConvertToCatalogueModalProps> = ({
  isOpen, onClose, lab
}) => {
  const { user } = useAuthStore();
  const [admin,           setAdmin]           = useState<any>({});
  const [organizations,   setOrganizations]   = useState<Organization[]>([]);
  const [formData,        setFormData]        = useState<FormData>(initialForm);
  const [software,        setSoftware]        = useState<string[]>(['']);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState<string | null>(null);

  // ── Load admin + organizations ────────────────────────────────────────────
  useEffect(() => { setAdmin(user); }, [user]);

  useEffect(() => {
    if (!isOpen || !admin?.id) return;
    const fetchOrgs = async () => {
      try {
        if (admin.role === 'orgsuperadmin') {
          const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${admin.org_id}`);
          if (res.data.success) {
            setOrganizations(
              res.data.data
                .filter((u: any) => u.role === 'labadmin')
                .map((u: any) => ({ id: u.id, name: `${u.name} (${u.email})` }))
            );
          }
        } else {
          const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
          if (res.data.success) {
            setOrganizations(
              res.data.data.map((org: any) => ({
                id:        org.id,
                name:      org.organization_name,
                org_admin: org.org_admin
              }))
            );
          }
        }
      } catch (e) { console.error('Failed to fetch orgs:', e); }
    };
    fetchOrgs();
  }, [isOpen, admin?.id]);

  useEffect(() => {
    if (!isOpen) { setFormData(initialForm); setSoftware(['']); setError(null); setSuccess(null); }
  }, [isOpen]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSoftware    = () => setSoftware(s => [...s, '']);
  const removeSoftware = (i: number) => setSoftware(s => s.filter((_, idx) => idx !== i));
  const changeSoftware = (i: number, v: string) => {
    const copy = [...software]; copy[i] = v; setSoftware(copy);
  };

  const validate = () => {
    if (!formData.catalogueName.trim()) { setError('Catalogue name is required'); return false; }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // ── Update catalogue metadata ─────────────────────────────────────────
      // Note: Template conversion is done separately via "Convert to Template"
      // button on the card — it must be done BEFORE running this modal.
      const catalogueRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateProxmoxClusterCatalogueDetails`,
        {
          labId:        lab.labid,
          catalogueName: formData.catalogueName,
          catalogueType: formData.catalogueType,
          software:      software.filter(s => s.trim() !== ''),
          level:         formData.level,
          category:      formData.category,
          price:         formData.price,
          hoursPerDay:   formData.hoursPerDay,
        }
      );
      if (!catalogueRes.data.success) throw new Error(catalogueRes.data.message || 'Failed to update catalogue details');

      // ── Step 3: Assign to org if selected ────────────────────────────────
      if (formData.organizationId) {
        const orgPayload: any = {
          labId:      lab.labid,
          orgId:      admin.role === 'orgsuperadmin' ? admin.org_id : formData.organizationId,
          assignedBy: admin?.impersonating ? admin?.impersonatedUserId : admin?.id,
          startdate:  catalogueRes.data.data?.startdate || null,
          enddate:    catalogueRes.data.data?.enddate   || null,
        };
        if (admin.role === 'orgsuperadmin' && formData.organizationId) {
          orgPayload.admin_id = formData.organizationId;
        } else {
          orgPayload.admin_id = organizations.find(o => o.id === formData.organizationId)?.org_admin || null;
        }
        const assignRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignProxmoxClusterToOrg`,
          orgPayload
        );
        if (!assignRes.data.success) throw new Error(assignRes.data.message || 'Failed to assign to organization');
      }

      setSuccess('Successfully converted to catalogue');
      setTimeout(() => { setSuccess(null); onClose(); }, 2000);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to convert to catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none';

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-dark-200 p-6 space-y-4">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold"><GradientText>Convert to Catalogue</GradientText></h2>
              <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Reminder: templates must be created first */}
            <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-start space-x-2">
              <Server className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-primary-300">
                Make sure you have already clicked <strong>"Convert to Template"</strong> on the card
                before publishing — users will clone from those templates when assigned.
              </p>
            </div>

            <div className="space-y-6">

              {/* Catalogue Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Catalogue Name</label>
                <input type="text" name="catalogueName" value={formData.catalogueName}
                  onChange={handleInput} className={inputCls} />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                <input type="text" name="price" value={formData.price}
                  onChange={handleInput} className={inputCls} placeholder="0" />
              </div>

              {/* Organization + Catalogue Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {admin?.role === 'orgsuperadmin' ? 'Assign to Org Admin' : 'Organization'}
                  </label>
                  <select name="organizationId" value={formData.organizationId}
                    onChange={handleInput} className={inputCls}>
                    <option value="">
                      {admin?.role === 'orgsuperadmin' ? 'Select an org admin' : 'Select an organization'}
                    </option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Catalogue Type</label>
                  <select name="catalogueType" value={formData.catalogueType}
                    onChange={handleInput} className={inputCls}>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              {/* Hours per Day */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hours per Day</label>
                  <input type="number" name="hoursPerDay" min="1" max="24"
                    value={formData.hoursPerDay} onChange={handleInput} className={inputCls} />
                </div>
              </div>

              {/* Level + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                  <select name="level" value={formData.level} onChange={handleInput} className={inputCls}>
                    <option value="">Select Level</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select name="category" value={formData.category} onChange={handleInput} className={inputCls}>
                    <option value="">Select Category</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="Devops">Devops</option>
                    <option value="Security">Security</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Development">Development</option>
                    <option value="Networking">Networking</option>
                    <option value="Database">Database</option>
                  </select>
                </div>
              </div>

              {/* Software */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Software</label>
                <div className="space-y-2">
                  {software.map((s, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input type="text" value={s}
                        onChange={e => changeSoftware(i, e.target.value)}
                        placeholder="Enter software name"
                        className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none" />
                      {software.length > 1 && (
                        <button onClick={() => removeSoftware(i)}
                          className="p-2 hover:bg-dark-300 rounded-lg">
                          <Minus className="h-4 w-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addSoftware}
                    className="flex items-center text-sm text-primary-400 hover:text-primary-300">
                    <Plus className="h-4 w-4 mr-1" />Add Software
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-200">{error}</span>
                </div>
              )}
              {success && (
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex items-center space-x-2">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-200">{success}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button onClick={onClose} className="btn-secondary">
                  <GradientText>Cancel</GradientText>
                </button>
                <button onClick={handleSubmit} disabled={isLoading} className="btn-primary">
                  <GradientText>
                    {isLoading
                      ? <span className="flex items-center"><Loader className="animate-spin h-4 w-4 mr-2" />Converting...</span>
                      : 'Create Catalogue'}
                  </GradientText>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

    </>
  );
};
