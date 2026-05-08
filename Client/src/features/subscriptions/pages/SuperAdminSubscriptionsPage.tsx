import React, { useState, useEffect } from 'react';
import {
  Package, Key, Tag, Plus, Edit2, Trash2, Check, X,
  Users, BookOpen, GraduationCap, Layers, FolderOpen,
  Crown, Zap, Shield, Clock, Copy, CheckCircle, XCircle,
  Calendar, Percent, Building2, Search, RefreshCw, CreditCard, Info, Star
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

/* ─── Types ─────────────────────────────────────────── */
interface PlanFeatures { labadmins: number; trainers: number; students: number; batches: number; labs: number; catalogues: number; }
interface Plan { id: string; tier: string; styleKey?: string; name: string; description: string; monthly_price: number; annual_monthly_price: number; annual_discount: number; features: PlanFeatures; trial_days?: number; is_popular: boolean; is_active: boolean; }
interface LicenseKey { id: string; key: string; orgName: string; orgId: string; planTier: string; planName: string; billingCycle: 'monthly'|'annual'; status: 'active'|'expired'|'suspended'; features: PlanFeatures; issuedAt: string; expiresAt: string; }
interface Offer { id: string; name: string; code: string; discountPercent: number; applicablePlans: string[]; validFrom: string; validUntil: string; usageLimit: number; usedCount: number; is_active: boolean; }

/* ─── Constants ─────────────────────────────────────── */
const PLAN_STYLES: Record<string, { border: string; bg: string; badge: string; icon: React.ElementType; iconColor: string; }> = {
  free_trial: { border: 'border-gray-500/30', bg: 'from-gray-500/10 to-transparent', badge: 'bg-gray-500/20 text-gray-300', icon: Clock, iconColor: 'text-gray-400' },
  starter:    { border: 'border-blue-500/30',  bg: 'from-blue-500/10 to-transparent',  badge: 'bg-blue-500/20 text-blue-300',  icon: Zap,   iconColor: 'text-blue-400' },
  standard:   { border: 'border-purple-500/30',bg: 'from-purple-500/10 to-transparent',badge: 'bg-purple-500/20 text-purple-300',icon: Shield,iconColor: 'text-purple-400' },
  enterprise: { border: 'border-amber-500/30', bg: 'from-amber-500/10 to-transparent', badge: 'bg-amber-500/20 text-amber-300', icon: Crown, iconColor: 'text-amber-400' },
  default: {
    border: 'border-gray-400/20',
    bg: 'from-gray-400/5 to-transparent',
    badge: 'bg-gray-400/10 text-gray-200',
    icon: Clock,
    iconColor: 'text-gray-300'
  },
};
const FEATURE_ICONS: Record<string, React.ElementType> = { labadmins: Shield, trainers: GraduationCap, students: Users, batches: Layers, labs: BookOpen, catalogues: FolderOpen };
const FEATURE_LABELS: Record<string, string> = { labadmins: 'Lab Admins', trainers: 'Trainers', students: 'Students', batches: 'Batches', labs: 'Labs', catalogues: 'Catalogues' };
const fmt = (v: number) => v === -1 ? 'Unlimited' : v.toLocaleString();
const STYLE_OPTIONS = [
  { key: 'free_trial', label: 'Gray',   preview: 'bg-gray-500/20 border-gray-500/40 text-gray-300' },
  { key: 'starter',   label: 'Blue',   preview: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
  { key: 'standard',  label: 'Purple', preview: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
  { key: 'enterprise',label: 'Amber',  preview: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
] as const;
const getPlanStyle = (plan: Plan) => PLAN_STYLES[plan.styleKey || plan.tier] ?? PLAN_STYLES['starter'];

/* ─── Demo Data ─────────────────────────────────────── */
const INITIAL_PLANS: Plan[] = [
  { id:'p1', tier:'free_trial', name:'Free Trial', description:'14-day full-access trial', monthly_price:0, annual_monthly_price:0, annual_discount:0, trial_days:14, is_popular:false, is_active:true, features:{labadmins:1,trainers:2,students:10,batches:1,labs:3,catalogues:2} },
  { id:'p2', tier:'starter',    name:'Starter',    description:'Perfect for small teams',    monthly_price:49,  annual_monthly_price:39,  annual_discount:20, is_popular:false, is_active:true, features:{labadmins:3,trainers:5,students:50,batches:5,labs:15,catalogues:10} },
  { id:'p3', tier:'standard',   name:'Standard',   description:'For growing organizations',  monthly_price:149, annual_monthly_price:119, annual_discount:20, is_popular:true,  is_active:true, features:{labadmins:10,trainers:20,students:200,batches:20,labs:50,catalogues:30} },
  { id:'p4', tier:'enterprise', name:'Enterprise', description:'Unlimited scale & support',  monthly_price:399, annual_monthly_price:299, annual_discount:25, is_popular:false, is_active:true, features:{labadmins:-1,trainers:-1,students:-1,batches:-1,labs:-1,catalogues:-1} },
];
const INITIAL_KEYS: LicenseKey[] = [
  { id:'k1', key:'GOLAB-STD-8X7K-2M9P', orgName:'TechCorp Ltd',   orgId:'o1', planTier:'standard',   planName:'Standard',   billingCycle:'annual',  status:'active',  issuedAt:'2026-01-15', expiresAt:'2027-01-15', features:{labadmins:10,trainers:20,students:200,batches:20,labs:50,catalogues:30} },
  { id:'k2', key:'GOLAB-STR-4B2L-9N1Q', orgName:'EduTech Pvt',    orgId:'o2', planTier:'starter',    planName:'Starter',    billingCycle:'monthly', status:'active',  issuedAt:'2026-03-01', expiresAt:'2026-04-01', features:{labadmins:3,trainers:5,students:50,batches:5,labs:15,catalogues:10} },
  { id:'k3', key:'GOLAB-ENT-6C5M-3P8R', orgName:'CloudAcademy',   orgId:'o3', planTier:'enterprise', planName:'Enterprise', billingCycle:'annual',  status:'expired', issuedAt:'2025-01-01', expiresAt:'2026-01-01', features:{labadmins:-1,trainers:-1,students:-1,batches:-1,labs:-1,catalogues:-1} },
];
const INITIAL_OFFERS: Offer[] = [
  { id:'of1', name:'Early Bird', code:'EARLY30', discountPercent:30, applicablePlans:['starter','standard'], validFrom:'2026-01-01', validUntil:'2026-06-30', usageLimit:50, usedCount:23, is_active:true },
  { id:'of2', name:'Enterprise Bundle', code:'ENT20', discountPercent:20, applicablePlans:['enterprise'], validFrom:'2026-01-01', validUntil:'2026-12-31', usageLimit:10, usedCount:3, is_active:true },
];
// const organizations = [{ id:'o1', name:'TechCorp Ltd' },{ id:'o2', name:'EduTech Pvt' },{ id:'o3', name:'CloudAcademy' },{ id:'o4', name:'DevOps Institute' }];

/* ─── Status Badge ───────────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = { active:'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', expired:'bg-red-500/20 text-red-300 border-red-500/30', suspended:'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status]||map.expired}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
};

/* ─── Feature Row ────────────────────────────────────── */
const FeatureRow: React.FC<{ k: string; v: number }> = ({ k, v }) => {
  const Icon = FEATURE_ICONS[k];
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-1.5 text-xs text-gray-400"><Icon className="h-3 w-3 text-primary-400" />{FEATURE_LABELS[k]}</span>
      <span className={`text-xs font-semibold ${v === -1 ? 'text-emerald-400' : 'text-gray-200'}`}>{fmt(v)}</span>
    </div>
  );
};

/* ─── Plan Card ──────────────────────────────────────── */
const PlanCard: React.FC<{ plan: Plan; annual: boolean; onAssign: (p:Plan)=>void; onEdit: (p:Plan)=>void; onDelete: (p:Plan)=>void; }> = ({ plan, annual, onAssign, onEdit, onDelete }) => {
  const s = getPlanStyle(plan);
  const Icon = s.icon;
  const price = annual ? plan.annual_monthly_price : plan.monthly_price;
  return (
    <div className={`relative flex flex-col rounded-2xl border ${s.border} bg-gradient-to-b ${s.bg} bg-dark-200/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-0.5`}>
      {plan.is_popular && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500" />}
      {plan.is_popular && <div className="absolute top-3 right-3"><span className="text-[10px] font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="h-2.5 w-2.5" />Popular</span></div>}
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-xl ${s.badge} flex-shrink-0`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></div>
          <div>
            <h3 className="text-sm font-bold text-white">{plan.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
          </div>
        </div>
        {/* Price */}
        <div className="mb-4">
          {plan.monthly_price === 0 ? (
            <>
              <div className="text-2xl font-bold text-white">Free</div>
              <div className="flex items-center gap-1.5 mt-1.5 bg-gray-500/10 border border-gray-500/20 rounded-lg px-2.5 py-1.5 w-fit">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-300 font-semibold">{plan.trial_days ?? 14}-day trial</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-white">${price}</span>
                <span className="text-xs text-gray-400 mb-1">/mo</span>
              </div>
              {annual && plan.annual_discount > 0 && (
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] text-gray-500 line-through">${plan.monthly_price}/mo</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Save {plan.annual_discount}%</span>
                </div>
              )}
              {annual && <p className="text-[10px] text-gray-500 mt-0.5">billed ${(plan.annual_monthly_price*12).toLocaleString()}/year</p>}
            </>
          )}
        </div>
        {/* Features */}
        <div className="flex-1 border-t border-primary-500/10 pt-3 space-y-0.5 mb-4">
          {Object.entries(plan.features).map(([k,v]) => <FeatureRow key={k} k={k} v={v} />)}
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onAssign(plan)} className="flex-1 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-400 hover:to-secondary-400 transition-all flex items-center justify-center gap-1"><Key className="h-3 w-3" />Issue Key</button>
          <button onClick={() => onEdit(plan)} className="p-2 rounded-lg bg-dark-400/50 border border-primary-500/20 hover:bg-dark-300 transition-colors"><Edit2 className="h-3.5 w-3.5 text-primary-400" /></button>
          <button onClick={() => onDelete(plan)} className="p-2 rounded-lg bg-dark-400/50 border border-red-500/20 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
        </div>
      </div>
    </div>
  );
};

/* ─── Issue License Key Modal ────────────────────────── */
const AssignPlanModal: React.FC<{ plan: Plan|null; annual: boolean; onClose: ()=>void; onSuccess: (key: LicenseKey)=>void; }> = ({ plan, annual, onClose, onSuccess }) => {
  const {organizations} = useAuthStore();
  const [orgId, setOrgId] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [cycle, setCycle] = useState<'monthly'|'annual'>(annual ? 'annual' : 'monthly');
  const [customFeatures, setCustomFeatures] = useState<PlanFeatures|null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string|null>(null);
  if (!plan) return null;
  const features = customFeatures || plan.features;
  const handleSubmit = async() => {
    if (!orgId) return;
    setLoading(true);
    const org = organizations.find(o => o.id === orgId);
    const key = `GOLAB-${plan.tier.toUpperCase().slice(0,3)}-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    try {
       const generate = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/generateAndMailKey`,{
      key:key,
      planId:plan?.id,
      billingCycle:cycle,
      orgId:orgId,
      organization:org?.organization_name,
      userId:org?.org_admin,
      orgEmail
    })
    if(generate?.data.success){
      setLoading(false);
      setGeneratedKey(key);
      onSuccess(generate.data.data);
    }
    } catch (error) {
      console.log("Error:",error)
      setLoading(false);

    }
   
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
          <div>
            <h2 className="text-lg font-semibold"><GradientText>Issue License Key</GradientText></h2>
            <p className="text-xs text-gray-500 mt-0.5">{plan.name} Plan — key will be emailed to the organization</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg transition-colors"><X className="h-4 w-4 text-gray-400" /></button>
        </div>

        {generatedKey ? (
          <div className="p-5 space-y-4">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">License Key Generated!</p>
                <p className="text-xs text-gray-400 mt-0.5">Key delivered to organization's registered email</p>
              </div>
            </div>
            <div className="bg-dark-400/40 rounded-xl px-4 py-3 border border-primary-500/15">
              <p className="text-[10px] text-gray-500 mb-1">License Key</p>
              <code className="text-sm text-primary-300 font-mono tracking-widest">{generatedKey}</code>
            </div>
            <button onClick={onClose} className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white">Done</button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Info banner */}
              <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-gray-400">
                <Info className="h-3.5 w-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
                Organizations purchase a plan and receive a license key by email. You can also manually issue a key here.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Organization</label>
                <select value={orgId} onChange={e => { setOrgId(e.target.value); setOrgEmail(organizations.find(o=>o.id===e.target.value)?.email || ''); }} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40">
                  <option value="">Select organization</option>
                  {organizations.map(o => <option key={o.id} value={o.id}>{o?.organization_name}</option>)}
                </select>
              </div>
              {orgId && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email key to</label>
                  <input value={orgEmail} onChange={e => setOrgEmail(e.target.value)} type="email" placeholder="admin@organization.com" className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Billing Cycle</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['monthly','annual'] as const).map(c => (
                    <button key={c} onClick={() => setCycle(c)} className={`py-2 rounded-lg text-sm font-medium border transition-all ${cycle===c ? 'bg-primary-500/20 border-primary-500/40 text-primary-300' : 'border-dark-400 text-gray-400 hover:border-primary-500/20'}`}>
                      {c.charAt(0).toUpperCase()+c.slice(1)}{c==='annual' && plan.annual_discount > 0 && <span className="ml-1.5 text-[10px] text-emerald-400">-{plan.annual_discount}%</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <button onClick={() => { setShowCustom(p => !p); if (!customFeatures) setCustomFeatures({...plan.features}); }} className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300">
                  <Info className="h-3.5 w-3.5" />{showCustom ? 'Hide' : 'Customize'} feature limits (optional)
                </button>
                {showCustom && customFeatures && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(Object.keys(customFeatures) as (keyof PlanFeatures)[]).map(k => (
                      <div key={k}>
                        <label className="block text-[10px] text-gray-500 mb-0.5">{FEATURE_LABELS[k]}</label>
                        <input type="number" value={customFeatures[k]} onChange={e => setCustomFeatures(p => p ? {...p,[k]:+e.target.value} : p)} className="w-full px-2 py-1.5 text-xs bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" min={-1} />
                      </div>
                    ))}
                    <p className="col-span-2 text-[10px] text-gray-500 flex items-center gap-1"><Info className="h-3 w-3" /> Use -1 for unlimited</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-primary-500/10">
              <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={!orgId || loading} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {loading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Generating...</> : <><Key className="h-3.5 w-3.5" />Generate & Email Key</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Edit Plan Modal ─────────────────────────────────── */
const EditPlanModal: React.FC<{ plan: Plan|null; onClose: ()=>void; onSave: (p:Plan)=>void; }> = ({ plan, onClose, onSave }) => {
  const [form, setForm] = useState<Plan|null>(null);
  useEffect(() => { setForm(plan ? { ...plan } : null); }, [plan]);
  if (!plan || !form) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
          <h2 className="text-lg font-semibold"><GradientText>Edit {plan.name}</GradientText></h2>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm(p => p ? {...p,description:e.target.value} : p)} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Monthly Price ($)</label>
              <input type="number" value={form.monthly_price} onChange={e => setForm(p => p ? {...p,monthly_price:+e.target.value} : p)} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Annual Discount (%)</label>
              <input type="number" value={form.annual_discount} onChange={e => setForm(p => p ? {...p,annual_discount:+e.target.value,annual_monthly_price:Math.round(form.monthly_price*(1-+e.target.value/100))} : p)} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" min={0} max={100} />
            </div>
          </div>
          {/* Trial days — only shown when plan is free (price = 0) */}
          {form.monthly_price === 0 && (
            <div className="bg-gray-500/5 border border-gray-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">Free Trial Duration</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.trial_days ?? 14}
                  onChange={e => setForm(p => p ? { ...p, trial_days: +e.target.value } : p)}
                  className="w-28 px-3 py-2 text-sm bg-dark-400/50 border border-gray-500/30 rounded-lg text-gray-300 focus:outline-none focus:border-gray-400/60"
                />
                <span className="text-xs text-gray-400">days</span>
                <span className="text-[10px] text-gray-500 ml-auto">Key expires after this many days from issue</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Feature Limits <span className="text-gray-500">(-1 = unlimited)</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(form.features) as (keyof PlanFeatures)[]).map(k => (
                <div key={k}>
                  <label className="block text-[10px] text-gray-500 mb-0.5">{FEATURE_LABELS[k]}</label>
                  <input type="number" value={form.features[k]} onChange={e => setForm(p => p ? {...p,features:{...p.features,[k]:+e.target.value}} : p)} className="w-full px-2 py-1.5 text-xs bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" min={-1} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-primary-500/10">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit Features Modal (for License Key) ─────────── */
const EditFeaturesModal: React.FC<{ licence: LicenseKey|null; onClose: ()=>void; onSave: (k:LicenseKey)=>void; }> = ({ licence, onClose, onSave }) => {
  const [feats, setFeats] = useState<PlanFeatures|null>(null);
  useEffect(() => { setFeats(licence ? { ...licence.features } : null); }, [licence]);
  if (!licence || !feats) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
          <h2 className="text-lg font-semibold"><GradientText>Edit Features — {licence.orgName}</GradientText></h2>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {(Object.keys(feats) as (keyof PlanFeatures)[]).map(k => (
            <div key={k}>
              <label className="block text-xs text-gray-400 mb-1.5">{FEATURE_LABELS[k]}</label>
              <input type="number" value={feats[k]} onChange={e => setFeats(p => p ? {...p,[k]:+e.target.value} : p)} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" min={-1} />
            </div>
          ))}
          <p className="col-span-2 text-xs text-gray-500 flex items-center gap-1"><Info className="h-3.5 w-3.5" /> -1 = Unlimited</p>
        </div>
        <div className="flex gap-3 p-5 border-t border-primary-500/10">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors">Cancel</button>
          <button onClick={() => { onSave({...licence,features:feats}); onClose(); }} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white">Save</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Add/Edit Offer Modal ───────────────────────────── */
const OfferModal: React.FC<{ offer: Offer|null; isNew: boolean; onClose: ()=>void; onSave: (o:Offer)=>void; }> = ({ offer, isNew, onClose, onSave }) => {
  const blank: Offer = { id:`of${Date.now()}`, name:'', code:'', discountPercent:10, applicablePlans:[], validFrom:'', validUntil:'', usageLimit:100, usedCount:0, is_active:true };
  const [form, setForm] = useState<Offer>(offer || blank);
  const togglePlan = (tier: string) => setForm(p => ({ ...p, applicablePlans: p.applicablePlans.includes(tier) ? p.applicablePlans.filter(t=>t!==tier) : [...p.applicablePlans,tier] }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
          <h2 className="text-lg font-semibold"><GradientText>{isNew ? 'Add Offer' : 'Edit Offer'}</GradientText></h2>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Offer Name</label>
              <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Early Bird" className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Coupon Code</label>
              <input value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="SAVE30" className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Discount (%)</label>
              <input type="number" value={form.discountPercent} onChange={e => setForm(p=>({...p,discountPercent:+e.target.value}))} min={1} max={100} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm(p=>({...p,usageLimit:+e.target.value}))} min={1} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Valid From</label>
              <input type="date" value={form.validFrom} onChange={e => setForm(p=>({...p,validFrom:e.target.value}))} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => setForm(p=>({...p,validUntil:e.target.value}))} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Applicable Plans</label>
            <div className="flex flex-wrap gap-2">
              {INITIAL_PLANS.map(p => (
                <button key={p.tier} onClick={() => togglePlan(p.tier)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.applicablePlans.includes(p.tier) ? 'bg-primary-500/20 border-primary-500/40 text-primary-300' : 'border-dark-400 text-gray-500 hover:border-primary-500/20'}`}>{p.name}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-primary-500/10">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} disabled={!form.name||!form.code} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white disabled:opacity-50">{isNew ? 'Add Offer' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Create Plan Modal ──────────────────────────────── */
const CreatePlanModal: React.FC<{ onClose: ()=>void; onSave: (p:Plan)=>void }> = ({ onClose, onSave }) => {
  const blankFeatures: PlanFeatures = { labadmins:1, trainers:2, students:10, batches:1, labs:3, catalogues:2 };
  const [form, setForm] = useState<Plan>({
    id: `p${Date.now()}`,
    tier: '',
    styleKey: 'starter',
    name: '',
    description: '',
    monthly_price: 0,
    annual_monthly_price: 0,
    annual_discount: 0,
    is_popular: false,
    is_active: true,
    features: { ...blankFeatures },
  });
  const handleDiscount = (discount: number) => {
    setForm(p => ({ ...p, annual_discount: discount, annual_monthly_price: Math.round(p.monthly_price * (1 - discount / 100)) }));
  };
  const isValid = form.name.trim() !== '' && form.description.trim() !== '' && form.tier.trim() !== '';
  const previewStyle = getPlanStyle(form);
  const PreviewIcon = previewStyle.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
          <h2 className="text-lg font-semibold"><GradientText>Create New Plan</GradientText></h2>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Live preview strip */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${previewStyle.border} bg-gradient-to-r ${previewStyle.bg}`}>
            <span className={`p-2 rounded-lg ${previewStyle.badge}`}><PreviewIcon className={`h-4 w-4 ${previewStyle.iconColor}`} /></span>
            <div>
              <p className="text-sm font-semibold text-white">{form.name || 'Plan Name'}</p>
              <p className="text-xs text-gray-400">{form.tier || 'tier-slug'} · {form.description || 'Description'}</p>
            </div>
          </div>

          {/* Tier identifier — dynamic, typed by admin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tier Identifier <span className="text-gray-500">(slug, e.g. gold)</span></label>
              <input
                value={form.tier}
                onChange={e => setForm(p => ({ ...p, tier: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="e.g. gold, platinum"
                className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Plan Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Gold" className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40" />
            </div>
          </div>

          {/* Color / Icon scheme selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Color Scheme</label>
            <div className="grid grid-cols-4 gap-2">
              {STYLE_OPTIONS.map(opt => {
                const s = PLAN_STYLES[opt.key];
                const Icon = s.icon;
                return (
                  <button key={opt.key} onClick={() => setForm(p => ({ ...p, styleKey: opt.key }))}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-[10px] font-medium transition-all ${
                      form.styleKey === opt.key ? opt.preview + ' border-current scale-105 shadow-md' : 'border-dark-400 text-gray-500 hover:border-primary-500/20'
                    }`}>
                    <Icon className="h-4 w-4" />{opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. For mid-size teams" className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Monthly Price ($)</label>
              <input type="number" value={form.monthly_price} onChange={e => setForm(p => ({ ...p, monthly_price: +e.target.value, annual_monthly_price: Math.round(+e.target.value * (1 - p.annual_discount / 100)) }))} min={0} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Annual Discount (%)</label>
              <input type="number" value={form.annual_discount} onChange={e => handleDiscount(+e.target.value)} min={0} max={100} className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
            </div>
          </div>
          {form.annual_discount > 0 && (
            <p className="text-xs text-emerald-400">Annual price: ${form.annual_monthly_price}/mo (${form.annual_monthly_price * 12}/yr)</p>
          )}

          {/* Trial days — only shown when plan is free (price = 0) */}
          {form.monthly_price === 0 && (
            <div className="bg-gray-500/5 border border-gray-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">Free Trial Duration</span>
                <span className="ml-auto text-[10px] text-gray-500">How long until the key expires</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.trial_days ?? 14}
                  onChange={e => setForm(p => ({ ...p, trial_days: +e.target.value }))}
                  className="w-28 px-3 py-2 text-sm bg-dark-400/50 border border-gray-500/30 rounded-lg text-gray-300 focus:outline-none focus:border-gray-400/60"
                />
                <span className="text-xs text-gray-400">days</span>
                <span className="text-xs text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded-full">{form.trial_days ?? 14}-day free trial</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPopularNew" checked={form.is_popular} onChange={e => setForm(p => ({ ...p, is_popular: e.target.checked }))} className="h-4 w-4 rounded" />
            <label htmlFor="isPopularNew" className="text-xs text-gray-400">Mark as Popular</label>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Feature Limits <span className="text-gray-500">(-1 = unlimited)</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(form.features) as (keyof PlanFeatures)[]).map(k => (
                <div key={k}>
                  <label className="block text-[10px] text-gray-500 mb-0.5">{FEATURE_LABELS[k]}</label>
                  <input type="number" value={form.features[k]} onChange={e => setForm(p => ({ ...p, features: { ...p.features, [k]: +e.target.value } }))} min={-1} className="w-full px-2 py-1.5 text-xs bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-primary-500/10">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors">Cancel</button>
          <button onClick={() => { if(isValid){ onSave(form); onClose(); } }} disabled={!isValid} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white disabled:opacity-50">
            <Check className="h-4 w-4 inline mr-1.5" />Create Plan
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────── */
export const SuperAdminSubscriptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans'|'keys'|'pricing'>('plans');
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<Plan[]>();
  const [keys, setKeys] = useState<LicenseKey[]>();
  const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS);
  const [keySearch, setKeySearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string|null>(null);
  // Modals
  const [assignPlan, setAssignPlan] = useState<Plan|null>(null);
  const [editPlan, setEditPlan] = useState<Plan|null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editKey, setEditKey] = useState<LicenseKey|null>(null);
  const [offerModal, setOfferModal] = useState<{offer:Offer|null;isNew:boolean}|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type:'plan'|'key'|'offer';id:string}|null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
const [deleting, setDeleting] = useState(false);

  const handleCopy = (key: string) => { navigator.clipboard?.writeText(key); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000); };

 useEffect(() => {
  const getPlans = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllPlans`
      );

      if (res.data?.success) {
        setPlans(res.data.data);
      } else {
        console.error("Failed to fetch plans");
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };
  const getLicenseKey = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllKeys`
        );
        if (res.data?.success && res.data?.data) {
          setKeys(res.data.data);
        } 
      } catch (error) {
        console.error('Error fetching license key:', error);
      } 
    };
    getLicenseKey();
  getPlans();
}, []);

  const confirmDelete = async() => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'plan') {
      
    try {
       setDeleting(true);
      setDeleteError(null);
      const deletePlan = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deletePlan/${deleteConfirm.id}`)
      if(deletePlan?.data?.success){
      setPlans(p => p?.filter(x=>x.id!==deleteConfirm.id))
    }
    } catch (error) {
         setDeleteError(error?.data?.message || "Failed to delete plan");
    }
    finally{
       setDeleting(false);}
    
    };
    if (deleteConfirm.type === 'key'){
       const deletekey = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteKey/${deleteConfirm.id}`);
       if(deletekey.data.success){
        setKeys(p => p.filter(x=>x.id!==deleteConfirm.id));
       }
       else{
        setDeleteError("Could not delete the key")
       }
      }
    if (deleteConfirm.type === 'offer') setOffers(p => p.filter(x=>x.id!==deleteConfirm.id));
    setDeleteConfirm(null);
  };
  
  const filteredKeys = keys?.filter(k => !keySearch || k.org_name.toLowerCase().includes(keySearch.toLowerCase()) || k?.license_key.toLowerCase().includes(keySearch.toLowerCase()) || k?.plan_name.toLowerCase().includes(keySearch.toLowerCase()));
  
  const TABS = [
    { id:'plans'   as const, label:'Subscription Plans', icon: Package },
    { id:'keys'    as const, label:'License Keys',        icon: Key },
    { id:'pricing' as const, label:'Pricing & Offers',    icon: Tag },
  ];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold"><GradientText>Subscriptions</GradientText></h1>
          <p className="mt-1 text-sm text-gray-400">Manage plans, license keys, and pricing offers</p>
        </div>
        <div className="flex items-center gap-1 bg-dark-300/50 p-1 rounded-xl border border-primary-500/10 w-fit">
          <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${!annual ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'}`}>Monthly</button>
          <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${annual ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'}`}>Annual <span className="text-emerald-400 font-bold">Save 25%</span></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Plans',   value: plans?.length,                             color:'text-primary-300', bg:'from-primary-500/10' },
          { label:'Active Keys',   value: keys?.filter(k=>k.status==='active').length, color:'text-emerald-300', bg:'from-emerald-500/10' },
          { label:'Active Offers', value: offers.filter(o=>o.is_active).length,       color:'text-amber-300',   bg:'from-amber-500/10' },
          { label:'Expired Keys',  value: keys?.filter(k=>k.status==='expired').length,color:'text-red-300',    bg:'from-red-500/10' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} to-transparent border border-primary-500/10 rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-300/40 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab===t.id ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ── PLANS TAB ── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreatePlan(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl text-sm font-semibold hover:from-primary-400 hover:to-secondary-400 transition-all shadow-lg shadow-primary-500/20"
            >
              <Plus className="h-4 w-4" />Create Plan
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans?.map(p => (
              <PlanCard key={p.id} plan={p} annual={annual}
                onAssign={setAssignPlan}
                onEdit={setEditPlan}
                onDelete={pl => setDeleteConfirm({type:'plan',id:pl.id})}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── LICENSE KEYS TAB ── */}
      {activeTab === 'keys' && (
        <div className="bg-dark-200/80 border border-primary-500/15 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-primary-500/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input value={keySearch} onChange={e => setKeySearch(e.target.value)} placeholder="Search org or key..." className="w-full pl-9 pr-4 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-xl text-gray-300 focus:outline-none focus:border-primary-400" />
            </div>
            <span className="text-xs text-gray-500">{filteredKeys?.length} key{filteredKeys?.length!==1?'s':''}</span>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-gray-500 border-b border-primary-500/10 bg-dark-300/20">
                {['Organization','License Key','Plan','Billing','Status','Expires','Actions'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-primary-500/5">
                {filteredKeys?.map(k => (
                  <tr key={k.id} className="hover:bg-dark-300/20 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0"><Building2 className="h-3.5 w-3.5 text-primary-400" /></div><span className="text-sm text-gray-200 font-medium">{k.org_name}</span></div></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><code className="text-xs text-primary-300 font-mono bg-primary-500/10 px-2 py-0.5 rounded">{k.license_key}</code><button onClick={()=>handleCopy(k.license_key)} className="text-gray-500 hover:text-primary-400 transition-colors">{copiedKey===k.license_key ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}</button></div></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_STYLES[k?.plan_tier]?.badge}`}>{k?.plan_name}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-400 capitalize">{k?.billing_cycle}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />{k.expires_at}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1">
                      <button onClick={()=>setEditKey(k)} className="p-1.5 hover:bg-primary-500/10 rounded-lg transition-colors" title="Edit features"><Edit2 className="h-3.5 w-3.5 text-primary-400" /></button>
                      <button onClick={()=>setDeleteConfirm({type:'key',id:k.id})} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Revoke key"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-primary-500/10">
            {filteredKeys.map(k => (
              <div key={k.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0"><Building2 className="h-4 w-4 text-primary-400" /></div><div><p className="text-sm font-semibold text-gray-200">{k.orgName}</p><span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PLAN_STYLES[k.planTier]?.badge}`}>{k.planName}</span></div></div>
                  <StatusBadge status={k.status} />
                </div>
                <div className="flex items-center gap-2 bg-dark-400/30 rounded-lg px-3 py-2">
                  <code className="text-xs text-primary-300 font-mono flex-1 truncate">{k.key}</code>
                  <button onClick={()=>handleCopy(k.key)}>{copiedKey===k.key ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-gray-500" />}</button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="capitalize">{k.billingCycle} · Expires {k.expiresAt}</span>
                  <div className="flex gap-1">
                    <button onClick={()=>setEditKey(k)} className="p-1.5 hover:bg-primary-500/10 rounded-lg"><Edit2 className="h-3.5 w-3.5 text-primary-400" /></button>
                    <button onClick={()=>setDeleteConfirm({type:'key',id:k.id})} className="p-1.5 hover:bg-red-500/10 rounded-lg"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredKeys.length === 0 && <div className="text-center py-16 text-gray-500 text-sm">No license keys found</div>}
        </div>
      )}

      {/* ── PRICING MANAGEMENT TAB ── */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Price Table */}
          <div className="bg-dark-200/80 border border-primary-500/15 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-primary-500/10 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Plan Pricing</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-xs text-gray-500 border-b border-primary-500/10 bg-dark-300/20">
                  <th className="px-4 sm:px-5 py-3">Plan</th>
                  <th className="px-4 sm:px-5 py-3">Monthly</th>
                  <th className="px-4 sm:px-5 py-3">Annual/mo</th>
                  <th className="px-4 sm:px-5 py-3">Discount</th>
                  <th className="px-4 sm:px-5 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-primary-500/5">
                  {plans?.map(p => {
                    const s = PLAN_STYLES[p?.tier] ?? PLAN_STYLES.default;
                    const Icon = s?.icon;
                    return (
                      <tr key={p?.id} className="hover:bg-dark-300/20 transition-colors">
                        <td className="px-4 sm:px-5 py-4"><div className="flex items-center gap-2"><span className={`p-1.5 rounded-lg ${s.badge}`}><Icon className={`h-3.5 w-3.5 ${s.iconColor}`} /></span><span className="text-sm font-medium text-gray-200">{p?.name}</span></div></td>
                        <td className="px-4 sm:px-5 py-4"><span className="text-sm font-semibold text-white">{p.monthly_price===0 ? 'Free' : `$${p.monthly_price}`}</span></td>
                        <td className="px-4 sm:px-5 py-4"><span className="text-sm text-gray-300">{p.annual_monthly_price===0 ? '—' : `$${p.annual_monthly_price}`}</span></td>
                        <td className="px-4 sm:px-5 py-4">{p.annual_discount > 0 ? <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><Percent className="h-3 w-3" />{p.annual_discount}% off</span> : <span className="text-gray-600 text-xs">—</span>}</td>
                        <td className="px-4 sm:px-5 py-4"><button onClick={() => setEditPlan(p)} className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 px-2 py-1.5 rounded-lg hover:bg-primary-500/10 transition-colors"><Edit2 className="h-3.5 w-3.5" />Edit Price</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Offers */}
          {/* <div className="bg-dark-200/80 border border-primary-500/15 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-primary-500/10 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Promotional Offers</h2>
              <button onClick={() => setOfferModal({offer:null,isNew:true})} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-300 rounded-xl text-sm font-medium transition-all"><Plus className="h-4 w-4" />Add Offer</button>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {offers.map(o => (
                <div key={o.id} className="bg-dark-300/40 border border-primary-500/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{o.name}</p>
                      <code className="text-xs text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">{o.code}</code>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setOfferModal({offer:o,isNew:false})} className="p-1.5 hover:bg-primary-500/10 rounded-lg transition-colors"><Edit2 className="h-3.5 w-3.5 text-primary-400" /></button>
                      <button onClick={() => setDeleteConfirm({type:'offer',id:o.id})} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold"><Percent className="h-3 w-3" />{o.discountPercent}% off</span>
                    <span>{o.usedCount}/{o.usageLimit} used</span>
                  </div>
                  <div className="w-full bg-dark-400/60 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{width:`${Math.min((o.usedCount/o.usageLimit)*100,100)}%`}} />
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{o.validFrom} → {o.validUntil}</div>
                  <div className="flex flex-wrap gap-1">
                    {o.applicablePlans.map(tier => <span key={tier} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PLAN_STYLES[tier]?.badge}`}>{plans.find(p=>p.tier===tier)?.name}</span>)}
                  </div>
                </div>
              ))}
              {offers.length === 0 && <p className="col-span-3 text-center text-gray-500 text-sm py-8">No offers yet</p>}
            </div>
          </div> */}
        </div>
      )}

      {/* ── Modals ── */}
      <AssignPlanModal plan={assignPlan} annual={annual} onClose={() => setAssignPlan(null)} onSuccess={k => { setKeys(p => [k,...p]); setAssignPlan(null); setActiveTab('keys'); }} />
      <EditPlanModal plan={editPlan} onClose={() => setEditPlan(null)} onSave={
        async (updated) => {
          const editPlan = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/editPlan`,{
            updated
          })
          if(editPlan?.data?.success){
          setPlans(p => p?.map(x => x.id===updated.id ? updated : x))
        }
          }} />
      {showCreatePlan && <CreatePlanModal onClose={() => setShowCreatePlan(false)} onSave={async(newPlan) => {
         const createPlan = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/createSubscriptionPlan`,{newPlan})
         if(createPlan?.data?.success){
          setPlans(p => [...p, createPlan?.data?.data])}}
         }
         />}
      <EditFeaturesModal licence={editKey} onClose={() => setEditKey(null)} onSave={async (updated) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateLicenseKey`,
        { updated }
      );

      setKeys((p) =>
        p.map((x) => (x.id === updated.id ? updated : x))
      );
    } catch (error) {
      console.error("Update failed:", error);
    }
  }} />
      {offerModal && <OfferModal offer={offerModal.offer} isNew={offerModal.isNew} onClose={() => setOfferModal(null)} onSave={o => { if(offerModal.isNew) setOffers(p=>[...p,o]); else setOffers(p=>p.map(x=>x.id===o.id?o:x)); }} />}

      {/* Delete Confirm */}
      {deleteConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="w-full max-w-sm bg-dark-200 rounded-2xl border border-red-500/20 shadow-2xl p-6 text-center space-y-4">

      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
        <Trash2 className="h-6 w-6 text-red-400" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Confirm Delete</h3>
        <p className="text-sm text-gray-400 mt-1">
          This action cannot be undone.
        </p>
      </div>

      {/* ❗ ERROR MESSAGE */}
      {deleteError && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          {deleteError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setDeleteConfirm(null);
            setDeleteError(null);
          }}
          disabled={deleting}
          className="flex-1 py-2 text-sm rounded-lg border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={confirmDelete}
          disabled={deleting}
          className="flex-1 py-2 text-sm font-semibold rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};
