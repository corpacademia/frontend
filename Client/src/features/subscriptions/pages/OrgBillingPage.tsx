import React, { useEffect, useState } from 'react';
import {
  CreditCard, Key, Shield, Zap, Crown, Clock,
  Users, BookOpen, GraduationCap, Layers, FolderOpen,
  CheckCircle2, Calendar, ArrowUpRight, Percent,
  RefreshCw, Info, Sparkles, ChevronRight, Award,
  XCircle, Copy, CheckCircle, Mail, ArrowUp, Lock, ExternalLink,
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

/* ─── Types ──────────────────────────────────────────────────── */
interface PlanFeatures { labadmins: number; trainers: number; students: number; batches: number; labs: number; catalogues: number; }
interface ActiveLicense {
  key: string; plan_name: string;
  plan_tier: 'free_trial' | 'starter' | 'standard' | 'enterprise'; // raw backend field
  planTier:  'free_trial' | 'starter' | 'standard' | 'enterprise'; // camelCase alias (mapLicense)
  billing_cycle: 'monthly' | 'annual';                              // raw backend field
  billingCycle:  'monthly' | 'annual';                              // camelCase alias
  monthly_price: number;
  annual_monthly_price: number; annual_discount: number;
  issued_at: string; expires_at: string;
  status: 'active' | 'expired' | 'suspended';
  features: PlanFeatures; usage: PlanFeatures;
  [key: string]: any;                                               // allow extra raw fields
}

/* ─── Map backend snake_case to camelCase ─────────────────────── */
const mapLicense = (raw: any): ActiveLicense => ({
  key:                  raw.key,
  plan_name:             raw.plan_name   ?? raw.plan_name,
  planTier:             raw.planTier   ?? raw.plan_tier,
  billingCycle:         raw.billingCycle ?? raw.billing_cycle,
  monthly_price:        raw.monthly_price,
  annual_monthly_price: raw.annual_monthly_price,
  annual_discount:      raw.annual_discount,
  issued_at:             raw.issued_at   ?? raw.issued_at,
  expires_at:            raw.expires_at  ?? raw.expires_at,
  status:               raw.status,
  features:             raw.features   ?? { labadmins: 0, trainers: 0, students: 0, batches: 0, labs: 0, catalogues: 0 },
  usage:                raw.usage      ?? { labadmins: 0, trainers: 0, students: 0, batches: 0, labs: 0, catalogues: 0 },
});
interface Plan { id: string; tier: 'free_trial' | 'starter' | 'standard' | 'enterprise'; name: string; description: string; monthly_price: number; annual_monthly_price: number; annual_discount: number; features: PlanFeatures; is_popular: boolean; trialDays?: number; }

/* ─── Constants — ONLY STATIC TAILWIND CLASSES ───────────────── */
const PLAN_STYLES: Record<string, { border: string; bg: string; badge: string; icon: React.ElementType; iconColor: string; activeBorder: string; }> = {
  free_trial: { border: 'border-gray-500/30',   bg: 'from-gray-500/10 to-transparent',   badge: 'bg-gray-500/20 text-gray-300',    icon: Clock,   iconColor: 'text-gray-400',   activeBorder: 'border-gray-400/60' },
  starter:    { border: 'border-primary-500/30', bg: 'from-primary-500/10 to-transparent', badge: 'bg-primary-500/20 text-primary-300',icon: Zap,    iconColor: 'text-primary-400',activeBorder: 'border-primary-400/60' },
  standard:   { border: 'border-secondary-500/30', bg: 'from-secondary-500/10 to-transparent', badge: 'bg-secondary-500/20 text-secondary-300', icon: Shield, iconColor: 'text-secondary-400', activeBorder: 'border-secondary-400/60' },
  enterprise: { border: 'border-amber-500/30',  bg: 'from-amber-500/10 to-transparent',  badge: 'bg-amber-500/20 text-amber-300',   icon: Crown,  iconColor: 'text-amber-400',  activeBorder: 'border-amber-400/60' },
  default: {
    border: 'border-gray-400/20',
    bg: 'from-gray-400/5 to-transparent',
    badge: 'bg-gray-400/10 text-gray-200',
    icon: Clock,
    iconColor: 'text-gray-300',
    activeBorder: 'border-gray-400/60'
  },
};
const TIER_STAT_COLORS: Record<string, { color: string; bg: string }> = {
  free_trial: { color: 'text-gray-300',      bg: 'from-gray-500/10' },
  starter:    { color: 'text-primary-300',   bg: 'from-primary-500/10' },
  standard:   { color: 'text-secondary-300', bg: 'from-secondary-500/10' },
  enterprise: { color: 'text-amber-300',     bg: 'from-amber-500/10' },
  default: { color: 'text-gray-300',      bg: 'from-gray-500/10' },
};
const FEATURE_ICONS: Record<string, React.ElementType> = { labadmins: Shield, trainers: GraduationCap, students: Users, batches: Layers, labs: BookOpen, catalogues: FolderOpen };
const FEATURE_LABELS: Record<string, string> = { labadmins: 'Lab Admins', trainers: 'Trainers', students: 'Students', batches: 'Batches', labs: 'Labs', catalogues: 'Catalogues' };
const fmt = (v: number) => v === -1 ? '∞' : v.toLocaleString();
const TIER_ORDER: Record<string, number> = { none: -1, free_trial: 0, starter: 1, default: 3, standard: 2, gold: 3 , enterprise: 4 };



/* ─── Activate Key Modal ─────────────────────────────────────── */
const ActivateKeyModal: React.FC<{ onClose: () => void; onActivate: (key: string) => void }> = ({ onClose, onActivate }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  
  const handleActivate = () => {
    if (!key.trim()) { setError('Please enter a license key'); return; }
    if (!key.startsWith('GOLAB-')) { setError('Invalid key format — keys start with GOLAB-'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onActivate(key.trim()); }, 1000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
          <div>
            <h2 className="text-lg font-semibold"><GradientText>Activate License Key</GradientText></h2>
            <p className="text-xs text-gray-500 mt-0.5">Enter the key you received by email from GoLabing</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg transition-colors"><XCircle className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-primary-500/5 border border-primary-500/15 rounded-xl p-3 flex items-start gap-2">
            <Mail className="h-3.5 w-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400">After purchasing a plan, GoLabing sends a license key to your registered email. Paste it below to activate your subscription.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">License Key</label>
            <input
              value={key}
              onChange={e => { setKey(e.target.value.toUpperCase()); setError(''); }}
              placeholder="GOLAB-STD-XXXX-XXXX"
              className="w-full px-3 py-2.5 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-primary-300 font-mono focus:outline-none focus:border-primary-500/40 tracking-widest"
            />
            {error && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><Info className="h-3 w-3" />{error}</p>}
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-primary-500/10">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors">Cancel</button>
          <button onClick={handleActivate} disabled={loading} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Activating...</> : <><CheckCircle className="h-3.5 w-3.5" />Activate</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Feature Usage Row ──────────────────────────────────────── */
const FeatureUsageRow: React.FC<{ featureKey: string; limit: number; used: number }> = ({ featureKey, limit, used }) => {
  const Icon = FEATURE_ICONS[featureKey];
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(Math.round((used / limit) * 100), 100);
  const barColor = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-accent-400';
  const textColor = pct >= 90 ? 'text-red-300' : pct >= 70 ? 'text-amber-300' : 'text-accent-300';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-gray-400">
          <Icon className="h-3.5 w-3.5 text-primary-400" />{FEATURE_LABELS[featureKey]}
        </span>
        <span className={`font-semibold ${isUnlimited ? 'text-accent-400' : textColor}`}>
          {isUnlimited ? 'Unlimited' : `${used} / ${fmt(limit)}`}
        </span>
      </div>
      {!isUnlimited
        ? <div className="w-full h-1.5 bg-dark-400/60 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} /></div>
        : <div className="w-full h-1.5 bg-gradient-to-r from-accent-500/40 to-accent-500/10 rounded-full" />
      }
    </div>
  );
};

/* ─── Cashfree Payment Modal ─────────────────────────────────── */
const CashfreePaymentModal: React.FC<{
  plan: Plan; annual: boolean; activeTier: string;
  onClose: () => void; onSuccess: () => void;
}> = ({ plan, annual, activeTier, onClose, onSuccess }) => {
  
  const [step, setStep] = useState<'summary' | 'redirecting' | 'success'>('summary');
  const {user,organizations} = useAuthStore();

  

  // GST rate from environment variable (e.g. VITE_GST_AMOUNT=18)
  const gstPercent = Number(import.meta.env.VITE_GST_AMOUNT ?? 18);

  const baseAmount = annual ? plan.annual_monthly_price * 12 : plan.monthly_price;
  const gstAmount  = parseFloat(((baseAmount * gstPercent) / 100).toFixed(2));
  const grandTotal = parseFloat((baseAmount + gstAmount).toFixed(2));
  const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[activeTier];
  const s = PLAN_STYLES[plan.tier] ?? PLAN_STYLES['starter'];

  const generateKey = (tier: string ) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const randomBlock = (length = 4) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  return `GOLAB-${tier.toLocaleUpperCase()}-${randomBlock()}-${randomBlock()}`;
};  
  const handleProceed = async () => {
    setStep('redirecting');
    if(plan.tier === 'free_trial'){
      const generate = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/generateAndMailKey`,{
      key: generateKey(plan?.tier),
      planId:plan?.id,
      billingCycle:annual,
      orgId:user?.org_id,
      organization:user?.organization,
      userId:user?.id,
      orgEmail:organizations.find(org=>org.id === user?.org_id)?.org_email || ""
    })
    }
    // In production: call backend → get payment_session_id → load Cashfree SDK → redirect
    const data = {
            key : generateKey(plan?.tier),planName: plan?.name, planTier: plan?.tier,
      billingCycle: annual, monthly_price:plan?.monthly_price, annual_monthly_price: plan?.annual_monthly_price, annual_discount: plan?.annual_discount,
      features: plan?.features,
      usage:    { labadmins: 0,  trainers: 0,  students: 0,  batches: 0,  labs: 0, catalogues: 0 },
      planId:plan?.id,
      user:user,
      total:grandTotal
        }
   
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/subscriptionCheckout`,{
      data
    })
    if(response.data.success){
       const cashfree = Cashfree({ mode: "sandbox" });
         const data = response?.data;
            cashfree.checkout({
              paymentSessionId: data.payment_session_id,
              redirectTarget: "_self",
            });
    }
    // cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
    setTimeout(() => { setStep('success'); setTimeout(onSuccess, 1800); }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl overflow-hidden">

        {/* ── Success ── */}
        {step === 'success' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-accent-400" />
            </div>
            <p className="text-lg font-bold text-white">Payment Successful!</p>
            <p className="text-sm text-gray-400">Your <strong className="text-white">{plan.name}</strong> plan is now active.<br />License key sent to your registered email.</p>
          </div>
        )}

        {/* ── Redirecting ── */}
        {step === 'redirecting' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="h-8 w-8 text-primary-400 animate-spin" />
            </div>
            <p className="text-base font-semibold text-white">Redirecting to Cashfree...</p>
            <p className="text-xs text-gray-400">Please do not close this window</p>
          </div>
        )}

        {/* ── Summary ── */}
        {step === 'summary' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
              <div>
                <h2 className="text-base font-semibold"><GradientText>Order Summary</GradientText></h2>
                <p className="text-xs text-gray-500 mt-0.5">Review your order before proceeding to Cashfree</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg transition-colors">
                <XCircle className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">

              {/* Plan badge */}
              <div className={`rounded-xl border ${s.border} bg-gradient-to-br ${s.bg} p-4`}>
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl ${s.badge} flex-shrink-0`}>
                    {React.createElement(s.icon, { className: `h-5 w-5 ${s.iconColor}` })}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{plan.name} Plan</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {annual ? 'Annual billing' : 'Monthly billing'}
                      {' · '}
                      <span className={isUpgrade ? 'text-accent-400' : 'text-gray-400'}>
                        {isUpgrade ? 'Upgrade' : 'Switch Plan'}
                      </span>
                    </p>
                  </div>
                  {annual && plan.annual_discount > 0 && (
                    <span className="text-[10px] font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Percent className="h-2.5 w-2.5" />{plan.annual_discount}% off
                    </span>
                  )}
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl overflow-hidden">
                <div className="divide-y divide-primary-500/10">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400">Base amount ({annual ? 'Annual' : 'Monthly'})</span>
                    <span className="text-sm font-semibold text-white">${baseAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Info className="h-3 w-3 text-primary-400" />
                      GST ({gstPercent}%)
                    </span>
                    <span className="text-sm font-semibold text-amber-300">+${gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5 bg-primary-500/5">
                    <span className="text-sm font-bold text-white">Total Payable</span>
                    <span className="text-xl font-extrabold text-white">${grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {annual && plan.annual_discount > 0 && (
                <p className="text-xs text-accent-400 text-center flex items-center justify-center gap-1">
                  <Percent className="h-3 w-3" />
                  You save ${((plan.monthly_price - plan.annual_monthly_price) * 12).toLocaleString()} vs monthly billing
                </p>
              )}

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-dark-300/30 rounded-xl p-3">
                <Lock className="h-3.5 w-3.5 text-accent-400 flex-shrink-0" />
                <span>256-bit SSL encryption · Secured & powered by <strong className="text-gray-400">Cashfree Payments</strong></span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-primary-500/10">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm rounded-xl border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-400 hover:to-secondary-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Proceed to Pay &nbsp;<span className="opacity-80 font-normal text-xs">${grandTotal}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
/* ─── Plan Option Card ───────────────────────────────────────── */
const PlanOptionCard: React.FC<{
  plan: Plan; annual: boolean; isCurrent: boolean;
  activeTier: string; onPurchase: (plan: Plan) => void;
}> = ({ plan, annual, isCurrent, activeTier, onPurchase }) => {
  const s = PLAN_STYLES[plan.tier] ?? PLAN_STYLES.default;
  const Icon = s?.icon;
  const price = annual ? plan.annual_monthly_price : plan.monthly_price;
  const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[activeTier];
  return (
    <div className={`relative flex flex-col rounded-2xl border ${isCurrent ? s.activeBorder + ' ring-2 ring-primary-500/20' : s.border} bg-gradient-to-b ${s.bg} bg-dark-200/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      {(plan.is_popular || isCurrent) && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500" />}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-xl ${s.badge} flex-shrink-0`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">{plan.name}</h3>
              {isCurrent && <span className="text-[10px] bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded-full font-semibold">Current</span>}
              {plan.is_popular && !isCurrent && <span className="text-[10px] bg-secondary-500/20 text-secondary-300 border border-secondary-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />Popular</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">${price}</span>
            <span className="text-xs text-gray-400 mb-1">/mo</span>
          </div>
          {annual && plan.annual_discount > 0 && (
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] text-gray-500 line-through">${plan.monthly_price}/mo</span>
              <span className="text-[10px] text-accent-400 font-semibold flex items-center gap-0.5"><Percent className="h-2.5 w-2.5" />Save {plan.annual_discount}%</span>
            </div>
          )}
          {annual && <p className="text-[10px] text-gray-500 mt-0.5">billed ${(plan.annual_monthly_price * 12).toLocaleString()}/year</p>}
        </div>
        <div className="flex-1 border-t border-white/5 pt-3 space-y-1.5 mb-4">
          {Object.entries(plan.features).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-400">{React.createElement(FEATURE_ICONS[k], { className: 'h-3 w-3 text-primary-400' })}{FEATURE_LABELS[k]}</span>
              <span className={`font-semibold ${v === -1 ? 'text-accent-400' : 'text-gray-200'}`}>{fmt(v)}</span>
            </div>
          ))}
        </div>
        {isCurrent ? (
          <button disabled className="w-full py-2.5 text-xs font-semibold rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/30 cursor-default flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />Active Plan
          </button>
        ) : (
          <button onClick={() => onPurchase(plan)}
            className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isUpgrade
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-400 hover:to-secondary-400'
                : 'bg-dark-400/60 border border-primary-500/20 text-gray-300 hover:bg-dark-300'
            }`}>
            <ArrowUp className="h-3.5 w-3.5" />{isUpgrade ? 'Upgrade Plan' : 'Switch Plan'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ───  Upgrade Prorated Modal  ────────────────────────────────*/
const UpgradeProratedModal: React.FC<{
  plan: Plan;
  annual: boolean;
  currentLicense: ActiveLicense;
  currentPlanObj: Plan | undefined;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ plan, annual, currentLicense, currentPlanObj, onClose, onSuccess }) => {

  const [step, setStep] = useState<'summary' | 'redirecting' | 'success'>('summary');
  const { user } = useAuthStore();
  const gstPercent = Number(import.meta.env.VITE_GST_AMOUNT ?? 18);

  /* ── Prorated credit from current plan ── */
  const issuedMs      = new Date(currentLicense.issued_at).getTime();
  const expiresMs     = new Date(currentLicense.expires_at).getTime();
  const nowMs         = Date.now();
  const totalDays     = Math.max(1, Math.ceil((expiresMs - issuedMs) / 86_400_000));
  const remainingDays = Math.max(0, Math.ceil((expiresMs - nowMs)    / 86_400_000));

  /* current plan credit — must use the ACTUAL billing cycle of the existing
     license, not the `annual` toggle which only affects the NEW plan */
  const currentIsAnnual =
    currentLicense?.billing_cycle === 'annual' ||
    currentLicense?.billingCycle  === 'annual';
  const currentPrice = currentIsAnnual
    ? (currentPlanObj?.annual_monthly_price ?? 0) * 12
    : (currentPlanObj?.monthly_price ?? 0);

  /* new plan price — correctly uses the user's chosen billing toggle */
  const newPrice = annual
    ? plan.annual_monthly_price * 12
    : plan.monthly_price;

  const creditAmount  = parseFloat(((remainingDays / totalDays) * currentPrice).toFixed(2));
  const netBeforeGst  = parseFloat(Math.max(0, newPrice - creditAmount).toFixed(2));
  const gstAmount     = parseFloat(((netBeforeGst * gstPercent) / 100).toFixed(2));
  const grandTotal    = parseFloat((netBeforeGst + gstAmount).toFixed(2));

  const s = PLAN_STYLES[plan.tier] ?? PLAN_STYLES.default;

  const generateKey = (tier: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBlock = (length = 4) =>
      Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `GOLAB-${tier.toUpperCase()}-${randomBlock()}-${randomBlock()}`;
  };

  const handleProceed = async () => {
    setStep('redirecting');
    const data = {
      key: generateKey(plan.tier),
      planName: plan.name,
      planTier: plan.tier,
      billingCycle: annual,
      monthly_price: plan.monthly_price,
      annual_monthly_price: plan.annual_monthly_price,
      annual_discount: plan.annual_discount,
      features: plan.features,
      usage: { labadmins: 0, trainers: 0, students: 0, batches: 0, labs: 0, catalogues: 0 },
      planId: plan.id,
      user,
      total: grandTotal,
      isUpgrade: true,
      creditAmount,
      remainingDays,
    };
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/subscriptionCheckout`,
        { data }
      );
      if (response.data?.success) {
        const cashfree = Cashfree({ mode: 'sandbox' });
        cashfree.checkout({
          paymentSessionId: response.data.payment_session_id,
          redirectTarget: '_self',
        });
      }
      setTimeout(() => { setStep('success'); setTimeout(onSuccess, 1800); }, 2500);
    } catch (err) {
      console.error('Upgrade checkout error:', err);
      setStep('summary');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-200 rounded-2xl border border-primary-500/20 shadow-2xl overflow-hidden">

        {/* ── Success ── */}
        {step === 'success' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-accent-400" />
            </div>
            <p className="text-lg font-bold text-white">Upgrade Successful!</p>
            <p className="text-sm text-gray-400">
              Your plan is now <strong className="text-white">{plan.name}</strong>.<br />
              License key sent to your registered email.
            </p>
          </div>
        )}

        {/* ── Redirecting ── */}
        {step === 'redirecting' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="h-8 w-8 text-primary-400 animate-spin" />
            </div>
            <p className="text-base font-semibold text-white">Redirecting to Cashfree...</p>
            <p className="text-xs text-gray-400">Please do not close this window</p>
          </div>
        )}

        {/* ── Summary ── */}
        {step === 'summary' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-primary-500/10">
              <div>
                <h2 className="text-base font-semibold"><GradientText>Upgrade Summary</GradientText></h2>
                <p className="text-xs text-gray-500 mt-0.5">Prorated credit from your current plan applied</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg transition-colors">
                <XCircle className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">

              {/* Plan badge */}
              <div className={`rounded-xl border ${s.border} bg-gradient-to-br ${s.bg} p-4`}>
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl ${s.badge} flex-shrink-0`}>
                    {React.createElement(s.icon, { className: `h-5 w-5 ${s.iconColor}` })}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{plan.name} Plan</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {annual ? 'Annual billing' : 'Monthly billing'}{' · '}
                      <span className="text-accent-400">Upgrade</span>
                    </p>
                  </div>
                  {annual && plan.annual_discount > 0 && (
                    <span className="text-[10px] font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Percent className="h-2.5 w-2.5" />{plan.annual_discount}% off
                    </span>
                  )}
                </div>
              </div>

              {/* Prorated breakdown */}
              <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl overflow-hidden">
                <div className="divide-y divide-primary-500/10">
                  {/* New plan full price */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400">New plan price ({annual ? 'Annual' : 'Monthly'})</span>
                    <span className="text-sm font-semibold text-white">${newPrice.toLocaleString()}</span>
                  </div>
                  {/* Prorated credit */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Info className="h-3 w-3 text-accent-400" />
                      Current plan credit ({remainingDays} of {totalDays} days remaining)
                    </span>
                    <span className="text-sm font-semibold text-accent-300">−${creditAmount.toLocaleString()}</span>
                  </div>
                  {/* GST */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Info className="h-3 w-3 text-primary-400" />
                      GST ({gstPercent}%)
                    </span>
                    <span className="text-sm font-semibold text-amber-300">+${gstAmount.toLocaleString()}</span>
                  </div>
                  {/* Total */}
                  <div className="flex items-center justify-between px-4 py-3.5 bg-primary-500/5">
                    <span className="text-sm font-bold text-white">Total Payable</span>
                    <span className="text-xl font-extrabold text-white">${grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Savings callout */}
              {creditAmount > 0 && (
                <p className="text-xs text-accent-400 text-center flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  You save ${creditAmount.toLocaleString()} with prorated credit from your current plan
                </p>
              )}

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-dark-300/30 rounded-xl p-3">
                <Lock className="h-3.5 w-3.5 text-accent-400 flex-shrink-0" />
                <span>256-bit SSL encryption · Secured &amp; powered by <strong className="text-gray-400">Cashfree Payments</strong></span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-primary-500/10">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm rounded-xl border border-primary-500/20 text-gray-400 hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-400 hover:to-secondary-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Pay ${grandTotal} &amp; Upgrade
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Downgrade Prorated Modal ──────────────────────────────── */
const DowngradeProratedModal: React.FC<{
  plan: Plan;
  annual: boolean;
  currentLicense: ActiveLicense;
  currentPlanObj: Plan | undefined;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ plan, annual, currentLicense, currentPlanObj, onClose, onSuccess }) => {
  const [step, setStep] = useState<'summary' | 'redirecting' | 'success'>('summary');
  const { user , organizations } = useAuthStore();
  const gstPercent = Number(import.meta.env.VITE_GST_AMOUNT ?? 18);

  /* ── Prorated credit calculation ── */
  const issuedMs  = new Date(currentLicense.issued_at).getTime();
  const expiresMs = new Date(currentLicense.expires_at).getTime();
  const nowMs     = Date.now();
  const totalDays     = Math.max(1, Math.ceil((expiresMs - issuedMs)   / 86_400_000));
  const remainingDays = Math.max(0, Math.ceil((expiresMs - nowMs)      / 86_400_000));

  /* current plan credit — must use the ACTUAL billing cycle of the existing
     license, not the `annual` toggle which only affects the NEW plan */
  const currentIsAnnual =
    currentLicense?.billing_cycle === 'annual' ||
    currentLicense?.billingCycle  === 'annual';
  const currentPrice = currentIsAnnual
    ? (currentPlanObj?.annual_monthly_price ?? 0) * 12
    : (currentPlanObj?.monthly_price ?? 0);

  /* new plan price — correctly uses the user's chosen billing toggle */
  const newPrice = annual
    ? plan.annual_monthly_price * 12
    : plan.monthly_price;

  const creditAmount  = parseFloat(((remainingDays / totalDays) * currentPrice).toFixed(2));
  const netBeforeGst  = parseFloat(Math.max(0, newPrice - creditAmount).toFixed(2));
  const gstAmount     = parseFloat(((netBeforeGst * gstPercent) / 100).toFixed(2));
  const grandTotal    = parseFloat((netBeforeGst + gstAmount).toFixed(2));
  const nothingToPay  = grandTotal <= 0;

  const s = PLAN_STYLES[plan.tier] ?? PLAN_STYLES.default;

  const generateKey = (tier: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBlock = (length = 4) =>
      Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `GOLAB-${tier.toUpperCase()}-${randomBlock()}-${randomBlock()}`;
  };

  const handleProceed = async () => {
    setStep('redirecting');
    const data = {
      key: generateKey(plan.tier),
      planName: plan.name,
      planTier: plan.tier,
      billingCycle: annual,
      monthly_price: plan.monthly_price,
      annual_monthly_price: plan.annual_monthly_price,
      annual_discount: plan.annual_discount,
      features: plan.features,
      usage: { labadmins: 0, trainers: 0, students: 0, batches: 0, labs: 0, catalogues: 0 },
      planId: plan.id,
      user,
      orgId:user?.org_id,
      userId:user?.id,
      organiztion:user?.organization,
      orgEmail:organizations.find(org=>org.id === user?.org_id)?.org_email || "",
      total: grandTotal,
      isDowngrade: true,
      creditAmount,
      remainingDays,
    };
    try {
      if (nothingToPay) {
        /* No payment needed — directly provision the downgrade */
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/generateAndMailKey`, {  key: generateKey(plan.tier),
      planName: plan.name,
      planTier: plan.tier,
      billingCycle: annual,
      monthly_price: plan.monthly_price,
      annual_monthly_price: plan.annual_monthly_price,
      annual_discount: plan.annual_discount,
      features: plan.features,
      usage: { labadmins: 0, trainers: 0, students: 0, batches: 0, labs: 0, catalogues: 0 },
      planId: plan.id,
      user,
      orgId:user?.org_id,
      userId:user?.id,
      organiztion:user?.organization,
      orgEmail:organizations.find(org=>org.id === user?.org_id)?.org_email || "",
      total: grandTotal,
      isDowngrade: true,
      creditAmount,
      remainingDays, });
        setStep('success');
        setTimeout(onSuccess, 1800);
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/subscriptionCheckout`,
          { data }
        );
        if (response.data?.success) {
          const cashfree = Cashfree({ mode: 'sandbox' });
          cashfree.checkout({
            paymentSessionId: response.data.payment_session_id,
            redirectTarget: '_self',
          });
        }
        setTimeout(() => { setStep('success'); setTimeout(onSuccess, 1800); }, 2500);
      }
    } catch (err) {
      console.error('Downgrade checkout error:', err);
      setStep('summary');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-200 rounded-2xl border border-amber-500/20 shadow-2xl overflow-hidden">

        {/* ── Success ── */}
        {step === 'success' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-accent-400" />
            </div>
            <p className="text-lg font-bold text-white">Plan Downgraded!</p>
            <p className="text-sm text-gray-400">
              Your plan has been switched to <strong className="text-white">{plan.name}</strong>.<br />
              {creditAmount > 0 && `A credit of $${creditAmount.toLocaleString()} was applied from your remaining balance.`}
            </p>
          </div>
        )}

        {/* ── Redirecting ── */}
        {step === 'redirecting' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
            </div>
            <p className="text-base font-semibold text-white">
              {nothingToPay ? 'Processing your downgrade...' : 'Redirecting to Cashfree...'}
            </p>
            <p className="text-xs text-gray-400">Please do not close this window</p>
          </div>
        )}

        {/* ── Summary ── */}
        {step === 'summary' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-amber-500/10">
              <div>
                <h2 className="text-base font-semibold"><GradientText>Downgrade Summary</GradientText></h2>
                <p className="text-xs text-gray-500 mt-0.5">Prorated credit applied from your current plan</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-dark-300 rounded-lg transition-colors">
                <XCircle className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">

              {/* Plan badge */}
              <div className={`rounded-xl border ${s.border} bg-gradient-to-br ${s.bg} p-4`}>
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl ${s.badge} flex-shrink-0`}>
                    {React.createElement(s.icon, { className: `h-5 w-5 ${s.iconColor}` })}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{plan.name} Plan</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {annual ? 'Annual billing' : 'Monthly billing'}{' · '}
                      <span className="text-amber-400">Downgrade</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Prorated breakdown */}
              <div className="bg-dark-300/40 border border-amber-500/10 rounded-xl overflow-hidden">
                <div className="divide-y divide-amber-500/10">
                  {/* New plan base price */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400">New plan price ({annual ? 'Annual' : 'Monthly'})</span>
                    <span className="text-sm font-semibold text-white">${newPrice.toLocaleString()}</span>
                  </div>
                  {/* Prorated credit */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Info className="h-3 w-3 text-amber-400" />
                      Prorated credit ({remainingDays} of {totalDays} days remaining)
                    </span>
                    <span className="text-sm font-semibold text-amber-300">−${creditAmount.toLocaleString()}</span>
                  </div>
                  {/* Net before GST */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Info className="h-3 w-3 text-primary-400" />
                      GST ({gstPercent}%)
                    </span>
                    <span className="text-sm font-semibold text-amber-300">+${gstAmount.toLocaleString()}</span>
                  </div>
                  {/* Grand total */}
                  <div className="flex items-center justify-between px-4 py-3.5 bg-amber-500/5">
                    <span className="text-sm font-bold text-white">Total Payable</span>
                    <span className={`text-xl font-extrabold ${nothingToPay ? 'text-accent-400' : 'text-white'}`}>
                      {nothingToPay ? 'Free' : `$${grandTotal.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Credit-covers-all notice */}
              {nothingToPay && (
                <div className="flex items-start gap-2 text-xs text-accent-300 bg-accent-500/10 border border-accent-500/20 rounded-xl p-3">
                  <CheckCircle className="h-3.5 w-3.5 text-accent-400 flex-shrink-0 mt-0.5" />
                  <span>Your remaining credit fully covers this downgrade. No payment is required — the plan will switch immediately.</span>
                </div>
              )}

              {/* Security note */}
              {!nothingToPay && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-dark-300/30 rounded-xl p-3">
                  <Lock className="h-3.5 w-3.5 text-accent-400 flex-shrink-0" />
                  <span>256-bit SSL encryption · Secured &amp; powered by <strong className="text-gray-400">Cashfree Payments</strong></span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-amber-500/10">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm rounded-xl border border-amber-500/20 text-gray-400 hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {nothingToPay
                  ? <><CheckCircle className="h-3.5 w-3.5" />Confirm Downgrade</>
                  : <><ExternalLink className="h-3.5 w-3.5" />Pay ${grandTotal} &amp; Downgrade</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────── */
export const OrgBillingPage: React.FC = () => {
  const {user} = useAuthStore();
  const [annual, setAnnual] = useState(false);
  const [license, setLicense] = useState<ActiveLicense | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');
  const [paymentPlan, setPaymentPlan] = useState<Plan | null>(null);

  const [plans, setPlans] = useState<Plan[]>();
  const [paymentData, setPaymentData] = useState<any>();


  useEffect(() => {
    const getPlans = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllPlans`
        );
        if (res.data?.success) {
          setPlans(res.data.data);
        } else {
          console.error('Failed to fetch plans');
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    getPlans();
  }, []);

  useEffect(() => {
    const getLicenseKey = async () => {
      try {
        setLicenseLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getActiveLicenseKey/${user?.org_id}`
        );
        if (res.data?.success && res.data?.data) {
          setLicense(res.data.data);
          setPaymentData(res.data.paymentData);
        } else {
          setLicense(null);
        }
      } catch (error) {
        console.error('Error fetching license key:', error);
        setLicense(null);
      } finally {
        setLicenseLoading(false);
      }
    };
    if (user?.org_id) getLicenseKey();
    else setLicenseLoading(false);
  }, [user?.org_id]);
 
  const handleCopy = () => {
    if (license?.license_key) navigator.clipboard?.writeText(license?.license_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const daysLeft = license?.expires_at
    ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / 86_400_000)
    : 0;
  const s = PLAN_STYLES[license?.plan_tier ?? 'default'] ?? PLAN_STYLES['default'];
  const PlanIcon = s?.icon ?? PLAN_STYLES.default.icon;
  const tierStat = TIER_STAT_COLORS[license?.plan_tier ?? 'default'] ?? TIER_STAT_COLORS['default'];

  /* ── Derive current active tier safely ──
     Use plan_id (same as existing display code at line 1078) to find the
     plan object, then read .tier from it. Fallback chain handles any
     field-name mismatch between backend and interface. */
  const currentActivePlan  = plans?.find(p => p.id === license?.plan_id);
  const currentActiveTier: string =
    currentActivePlan?.tier ??
    currentActivePlan?.plan_tier ??
    license?.plan_tier ??
    license?.planTier ??
    'none';


  const TABS = [
    { id: 'overview' as const, label: 'Billing Overview', icon: CreditCard },
    { id: 'plans'    as const, label: 'Available Plans',  icon: Award },
  ];

  /* ── Loading skeleton ── */
  if (licenseLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-dark-300/60 rounded-xl" />
        <div className="h-36 bg-dark-300/40 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-dark-300/40 rounded-xl" />)}
        </div>
      </div>
    );
  }
  /* ── No active license — show plans so user can purchase ── */
  if (!license) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold"><GradientText>Billing &amp; Plans</GradientText></h1>
            <p className="mt-1 text-sm text-gray-400">Manage your organization's subscription and license key</p>
          </div>
          <button
          disabled={license?.activated  }
            onClick={() => setShowKeyModal(true)}
             
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl transition-all text-sm font-semibold hover:from-primary-400 hover:to-secondary-400 self-start sm:self-auto shadow-lg shadow-primary-500/20"
          >
            <Key className="h-4 w-4" />{`${license?.activated  ? "Activated" : "Activate License Key"}`}
          </button>
        </div>

        {/* No license banner */}
        <div className="relative overflow-hidden rounded-2xl border border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-transparent bg-dark-200/80 p-5 sm:p-6 flex items-center gap-4">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500" />
          <div className="p-3 rounded-2xl bg-primary-500/10 flex-shrink-0">
            <Key className="h-6 w-6 text-primary-400" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">No Active License</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Choose a plan below to get started. After payment, you'll receive a license key by email — use <strong className="text-gray-300">Activate License Key</strong> to apply it.
            </p>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-1 bg-dark-300/50 p-1 rounded-xl border border-primary-500/10 w-fit">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              !annual ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'
            }`}
          >Monthly</button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              annual ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'
            }`}
          >Annual <span className="text-accent-400 font-bold">Save 25%</span></button>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans?.map(plan => (
            <PlanOptionCard
              key={plan.id}
              plan={plan}
              annual={annual}
              isCurrent={false}
              activeTier="none"
              onPurchase={setPaymentPlan}
            />
          ))}
        </div>

        <div className="bg-dark-300/30 border border-primary-500/10 rounded-xl p-4 text-sm text-gray-400 flex items-start gap-2">
          <Mail className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
          <span>After payment, your license key will be sent to your registered email. Use <strong className="text-gray-300">Activate License Key</strong> to apply it.</span>
        </div>

        {/* Modals */}
        {showKeyModal && (
          <ActivateKeyModal
            onClose={() => setShowKeyModal(false)}
            onActivate={async (key) => {
              const activateKey = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/activateLicenseKey`,{key});
              console.log(activateKey)
              if(activateKey.data.success){
              setShowKeyModal(false);
              alert(`License key "${key}" submitted for activation. Your plan will be updated shortly.`);
            }

            }}
          />
        )}
        {paymentPlan && (
          <CashfreePaymentModal
            plan={paymentPlan}
            annual={annual}
            activeTier="none"
            onClose={() => setPaymentPlan(null)}
            onSuccess={() => setPaymentPlan(null)}
          />
        )}
      </div>
    );
  }
  console.log("PaymentPlan:",paymentPlan);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold"><GradientText>Billing & Plans</GradientText></h1>
          <p className="mt-1 text-sm text-gray-400">Manage your organization's subscription and license key</p>
        </div>
        <button
          disabled = {license?.activated}
          onClick={() => setShowKeyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl transition-all text-sm font-semibold hover:from-primary-400 hover:to-secondary-400 self-start sm:self-auto shadow-lg shadow-primary-500/20"
        >
          <Key className="h-4 w-4" />{`${license?.activated  ? "Activated" : "Activate License Key"}`}
        </button>
      </div>

      {/* Active Plan Banner */}
      <div className={`relative overflow-hidden rounded-2xl border ${s?.activeBorder} bg-gradient-to-br ${s?.bg} bg-dark-200/80 p-5 sm:p-6`}>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500" />
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className={`p-3 rounded-2xl ${s?.badge} flex-shrink-0 w-fit`}>
            <PlanIcon className={`h-6 w-6 ${s?.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-white">{license?.plan_name} Plan</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${license?.status === 'active' ? 'bg-accent-500/20 text-accent-300 border-accent-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                {license?.status?.charAt(0)?.toUpperCase() + license?.status?.slice(1)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 capitalize">{license?.billing_cycle}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Issued: {license?.issued_at}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-amber-400" />Expires: {license?.expires_at}</span>
              {daysLeft > 0 && daysLeft <= 30
                ? <span className="text-amber-400 font-semibold flex items-center gap-1"><Info className="h-3 w-3" />{daysLeft} days left — renew soon</span>
                : <span className="text-accent-400">{daysLeft} days remaining</span>}
            </div>
            {/* License Key display */}
            <div className="mt-3 flex items-center gap-3 bg-dark-400/40 rounded-xl px-4 py-3 border border-primary-500/10 max-w-lg">
              <Key className="h-4 w-4 text-primary-400 flex-shrink-0" />
              <code className="text-sm text-primary-300 font-mono flex-1 truncate tracking-wider">{license?.license_key}</code>
              <button onClick={handleCopy} className="text-gray-400 hover:text-primary-300 transition-colors flex items-center gap-1 text-xs flex-shrink-0">
                {copied ? <><CheckCircle2 className="h-4 w-4 text-accent-400" /><span className="text-accent-400">Copied!</span></> : <><Copy className="h-4 w-4" />Copy</>}
              </button>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-bold text-white">${plans?.find(p=>p.id === license?.plan_id)?.annual_monthly_price}<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <p className="text-xs text-gray-500 mt-0.5">billed ${(plans?.find(p=>p.id === license?.plan_id)?.annual_monthly_price * 12).toLocaleString()}/yr</p>
            {license?.annual_discount > 0 && (
              <p className="text-xs text-accent-400 font-semibold mt-1 flex items-center justify-end gap-1"><Percent className="h-3 w-3" />{license?.annual_discount}% annual discount</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row — all STATIC classes, no interpolation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Billing Cycle', value: license?.billing_cycle === 'annual' ? 'Annual' : 'Monthly', color: 'text-primary-300',  bg: 'from-primary-500/10' },
          { label: 'Annual Saving', value: plans?.find(p=>p.id === license?.plan_id)?.annual_discount > 0 ? `${plans?.find(p=>p.id === license?.plan_id).annual_discount}% off` : '—',  color: 'text-accent-300',   bg: 'from-accent-500/10' },
          { label: 'Plan Tier',    value: license?.plan_name, color: tierStat?.color, bg: tierStat?.bg },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} to-transparent border border-primary-500/10 rounded-xl p-4`}>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-300/40 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ── BILLING OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Feature Usage */}
          <div className="bg-dark-200/80 border border-primary-500/15 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-primary-500/10">
              <h2 className="text-base font-semibold text-white">Feature Usage</h2>
              <p className="text-xs text-gray-500 mt-0.5">Your plan limits vs current consumption</p>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(license?.features ?? {}) as (keyof PlanFeatures)[]).map(k => (
                <FeatureUsageRow key={k} featureKey={k} limit={license?.features[k]} used={license?.usage[k]} />
              ))}
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-dark-200/80 border border-primary-500/15 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-primary-500/10">
              <h2 className="text-base font-semibold text-white">Billing History</h2>
            </div>
            <div className="divide-y divide-primary-500/5">
              {paymentData?.map(inv => (
                <div key={inv.date} className="px-4 sm:px-5 py-3.5 flex items-center justify-between hover:bg-dark-300/20 transition-colors">
                  <div>
                    <p className="text-sm text-gray-200">{inv.desc}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{inv.amount}</span>
                    <span className="text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30 px-2 py-0.5 rounded-full">{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-br from-primary-500/10 to-secondary-500/5 border border-primary-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary-400" />Need more capacity?</h3>
              <p className="text-sm text-gray-400 mt-1">Purchase a higher plan to unlock more users, labs, and features. You'll receive the license key by email.</p>
            </div>
            <button onClick={() => setActiveTab('plans')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl text-sm font-semibold hover:from-primary-400 hover:to-secondary-400 transition-all flex-shrink-0">
              View Plans<ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── AVAILABLE PLANS TAB ── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Billing toggle — pill selector */}
          <div className="flex items-center gap-1 bg-dark-300/50 p-1 rounded-xl border border-primary-500/10 w-fit">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                !annual ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'
              }`}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                annual ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow' : 'text-gray-400 hover:text-gray-300'
              }`}
            >Annual <span className="text-accent-400 font-bold">Save 25%</span></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans?.map(plan => (
              <PlanOptionCard
                key={plan.id} plan={plan} annual={annual}
                isCurrent={plan.tier === license.plan_tier}
                activeTier={license.plan_tier}
                onPurchase={setPaymentPlan}
              />
            ))}
          </div>

          <div className="bg-dark-300/30 border border-primary-500/10 rounded-xl p-4 text-sm text-gray-400 flex items-start gap-2">
            <Mail className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
            <span>After payment, your license key will be sent to your registered email. Use <strong className="text-gray-300">Activate License Key</strong> to apply it.</span>
          </div>
        </div>
      )}

      {/* Activate Key Modal */}
      {showKeyModal && (
        <ActivateKeyModal
          onClose={() => setShowKeyModal(false)}
          onActivate={async (key) => {const activateKey = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/activateLicenseKey`,{key});
              console.log(activateKey)
              if(activateKey.data.success){
              setShowKeyModal(false);
              alert(`License key "${key}" submitted for activation. Your plan will be updated shortly.`);
            }
          }}
        />
      )}

      {/* Cashfree Payment Modal — same-tier switches only */}
      {paymentPlan && (() => {
        const selectedTier: string = paymentPlan.tier ?? (paymentPlan as any).plan_tier ?? 'none';
        return TIER_ORDER[selectedTier] === TIER_ORDER[currentActiveTier];
      })() && (
        <CashfreePaymentModal
          plan={paymentPlan}
          annual={annual}
          activeTier={currentActiveTier}
          onClose={() => setPaymentPlan(null)}
          onSuccess={() => {
            setPaymentPlan(null);
            setActiveTab('overview');
          }}
        />
      )}

      {/* Upgrade Prorated Modal — higher-tier with existing license */}
      {paymentPlan && (() => {
        const selectedTier: string = paymentPlan.tier ?? (paymentPlan as any).plan_tier ?? 'none';
        return TIER_ORDER[selectedTier] > TIER_ORDER[currentActiveTier];
      })() && (
        <UpgradeProratedModal
          plan={paymentPlan}
          annual={annual}
          currentLicense={license}
          currentPlanObj={currentActivePlan}
          onClose={() => setPaymentPlan(null)}
          onSuccess={() => {
            setPaymentPlan(null);
            setActiveTab('overview');
          }}
        />
      )}

      {/* Downgrade Prorated Modal — lower-tier switches only */}
      {paymentPlan && (() => {
        const selectedTier: string = paymentPlan.tier ?? (paymentPlan as any).plan_tier ?? 'none';
        return TIER_ORDER[selectedTier] < TIER_ORDER[currentActiveTier];
      })() && (
        <DowngradeProratedModal
          plan={paymentPlan}
          annual={annual}
          currentLicense={license}
          currentPlanObj={currentActivePlan}
          onClose={() => setPaymentPlan(null)}
          onSuccess={() => {
            setPaymentPlan(null);
            setActiveTab('overview');
          }}
        />
      )}
    </div>
  );
};
