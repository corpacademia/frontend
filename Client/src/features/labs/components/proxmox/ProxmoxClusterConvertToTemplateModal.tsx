/**
 * ProxmoxClusterConvertToTemplateModal
 *
 * 3-step flow:
 *   1. select    : choose credentials
 *                  - superadmin    → only global credentials (free, no payment)
 *                  - orgsuperadmin → org credentials (free) OR global (paid via Cashfree)
 *   2. payment   : Cashfree checkout — only when orgsuperadmin picks global cloud
 *   3. processing: convert ALL VMs in the cluster to Proxmox templates
 */

import React, { useEffect, useState } from 'react';
import {
  X, Loader, Check, AlertCircle, Server, Globe, Building2,
  ChevronRight, ChevronLeft, CreditCard, ShieldCheck, Users,
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { useCloudCredentialsStore, CloudCredential } from '../../../../store/cloudCredentialsStore';
import axios from 'axios';

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  lab:        any;
  onSuccess?: () => void;
}

type CredentialSource = 'org' | 'global';
type Step = 'select' | 'payment' | 'processing';

const GST_RATE = Number(import.meta.env.VITE_GST_AMOUNT ?? 18);

// ── Credential Card ───────────────────────────────────────────────────────────
const CredentialCard: React.FC<{
  cred:       CloudCredential;
  isSelected: boolean;
  source:     CredentialSource;
  onSelect:   () => void;
}> = ({ cred, isSelected, source, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full text-left p-4 rounded-xl border transition-all duration-200
      ${isSelected
        ? 'border-primary-500/60 bg-primary-500/10'
        : 'border-primary-500/20 bg-dark-300/40 hover:border-primary-500/40 hover:bg-dark-300/60'
      }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg flex-shrink-0 ${source === 'global' ? 'bg-amber-500/10' : 'bg-primary-500/10'}`}>
          {source === 'global'
            ? <Globe className="h-4 w-4 text-amber-400" />
            : <Building2 className="h-4 w-4 text-primary-400" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">{cred.name}</p>
          <p className="text-xs text-gray-400 capitalize">{cred.provider}</p>
          {cred.credentials?.api_url && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{cred.credentials.api_url}</p>
          )}
          {cred.credentials?.node && (
            <p className="text-xs text-gray-500">Node: {cred.credentials.node}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {source === 'global' && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 whitespace-nowrap">
            ⚡ Paid
          </span>
        )}
        {source === 'org' && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 whitespace-nowrap">
            Free
          </span>
        )}
        {isSelected && <Check className="h-4 w-4 text-primary-400 mt-1" />}
      </div>
    </div>
  </button>
);

// ── Main Modal ────────────────────────────────────────────────────────────────
export const ProxmoxClusterConvertToTemplateModal: React.FC<Props> = ({
  isOpen, onClose, lab, onSuccess,
}) => {
  const { user } = useAuthStore();
  const { globalCredentials, orgCredentials, isLoading, fetchGlobalCredentials, fetchOrgCredentials } =
    useCloudCredentialsStore();

  const [step,           setStep]           = useState<Step>('select');
  const [selectedCred,   setSelectedCred]   = useState<CloudCredential | null>(null);
  const [selectedSource, setSelectedSource] = useState<CredentialSource>('org');
  const [seats,          setSeats]          = useState<number>(1);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [notification,   setNotification]   = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin    = user?.role === 'superadmin';
  const isOrgSuperAdmin = user?.role === 'orgsuperadmin';

  // Price: per-VM price × seats × VM count
  const vmCount    = lab?.vmConfigs?.length || 1;
  const unitPrice  = Number(lab?.catalogue_price ?? lab?.price ?? 0);
  const basePrice  = unitPrice * seats * vmCount;
  const gstAmount  = Math.round(basePrice * (GST_RATE / 100));
  const totalPrice = basePrice + gstAmount;

  // ── Fetch credentials on open ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setStep('select');
    setSelectedCred(null);
    setSeats(1);
    setNotification(null);

    if (isSuperAdmin) {
      fetchGlobalCredentials();                       // superadmin → global only
    } else if (isOrgSuperAdmin) {
      fetchGlobalCredentials();                       // orgsuperadmin → both
      fetchOrgCredentials(user.org_id);
    }
  }, [isOpen]);

  const proxmoxGlobal = globalCredentials.filter(c => c.provider === 'proxmox');
  const proxmoxOrg    = orgCredentials.filter(c => c.provider === 'proxmox');

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCredentialSelect = (cred: CloudCredential, source: CredentialSource) => {
    setSelectedCred(cred);
    setSelectedSource(source);
    if (source === 'org') setSeats(1);
  };

  const handleNext = () => {
    if (!selectedCred) return;
    // Only orgsuperadmin selecting global cloud needs to pay
    if (selectedSource === 'global' && isOrgSuperAdmin) {
      setStep('payment');
    } else {
      // superadmin (global, free) or orgsuperadmin (org, free) → skip payment
      handleConvertToTemplate(null);
    }
  };

  // Step 3: hit the backend to convert all cluster VMs
  const handleConvertToTemplate = async (paymentOrderId: string | null) => {
    setStep('processing');
    setIsProcessing(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/convertProxmoxClusterVMsToTemplates`,
        {
          labId:            lab.labid,
          credentialId:     selectedCred?.id,
          credentialSource: selectedSource,
          seats,
          ...(paymentOrderId ? { paymentOrderId } : {}),
        }
      );

      if (res.data.success) {
        setNotification({ type: 'success', message: `All ${vmCount} VM(s) converted to templates!` });
        setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
      } else {
        throw new Error(res.data.message || 'Failed to convert to templates');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Template conversion failed',
      });
      setStep('select');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Cashfree payment — only for orgsuperadmin selecting global cloud
  const handlePayWithCashfree = async () => {
    setIsProcessing(true);
    try {
      const orderRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/templateCheckout`,
        {
          userId:             user?.id,
          orgId:              user?.org_id,
          targetCredentialId: selectedCred?.id,
          sourceCredentialId: lab?.credential_id,
          seats,
          cartItems: {
            lab_id:   lab.labid,
            name:     lab.title,
            quantity: seats,
            price:    unitPrice,
            currency: 'INR',
            duration: 1,
            proxmoxType:'proxmox-cluster',
            type:     'template-creation',
          },
          org: true,
        }
      );

      if (orderRes.data.payment_session_id) {
        const cashfree = (window as any).Cashfree({ mode: 'sandbox' });
        cashfree.checkout({
          paymentSessionId: orderRes.data.payment_session_id,
          redirectTarget:   '_self',
        });
        // After redirect back, template creation is triggered via the payment
        // success callback on the backend using the stored order details.
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Payment initiation failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl shadow-black/40">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-primary-500/20">
          <div>
            <h2 className="text-xl font-semibold">
              <GradientText>Convert to Template</GradientText>
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {lab?.title} — {vmCount} VM{vmCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} disabled={isProcessing}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-5 mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {notification.type === 'success'
              ? <Check className="h-4 w-4 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── STEP: PROCESSING ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader className="h-10 w-10 text-primary-400 animate-spin" />
              <p className="text-gray-300">Converting {vmCount} VM(s) to templates on Proxmox…</p>
              <p className="text-xs text-gray-500">This may take a few minutes. Do not close this window.</p>
            </div>
          )}

          {/* ── STEP: SELECT CREDENTIALS ── */}
          {step === 'select' && (
            <>
              <p className="text-sm text-gray-400">
                Select which Proxmox environment to use for template creation.
                All {vmCount} VM(s) in this cluster will be converted.
              </p>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="h-6 w-6 text-primary-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* ── SUPERADMIN: global credentials only (free) ── */}
                  {isSuperAdmin && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-4 w-4 text-amber-400" />
                        <h3 className="text-sm font-medium text-gray-300">Global Proxmox Credentials</h3>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300">Free</span>
                      </div>
                      {proxmoxGlobal.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Server className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p>No global Proxmox credentials configured.</p>
                          <p className="text-xs mt-1">Add them in Settings → Cloud Credentials.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {proxmoxGlobal.map(cred => (
                            <CredentialCard
                              key={cred.id}
                              cred={cred}
                              isSelected={selectedCred?.id === cred.id}
                              source="global"
                              onSelect={() => handleCredentialSelect(cred, 'global')}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ORGSUPERADMIN: org (free) + global (paid) ── */}
                  {isOrgSuperAdmin && (
                    <>
                      {/* Org credentials — free */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4 text-primary-400" />
                          <h3 className="text-sm font-medium text-gray-300">Your Organization's Credentials</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300">Free</span>
                        </div>
                        {proxmoxOrg.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-primary-500/20 rounded-lg">
                            No org Proxmox credentials. Add them in Cloud Settings.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {proxmoxOrg.map(cred => (
                              <CredentialCard
                                key={cred.id}
                                cred={cred}
                                isSelected={selectedCred?.id === cred.id && selectedSource === 'org'}
                                source="org"
                                onSelect={() => handleCredentialSelect(cred, 'org')}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-primary-500/20" />
                        <span className="text-xs text-gray-500">or use GoLab Cloud</span>
                        <div className="flex-1 h-px bg-primary-500/20" />
                      </div>

                      {/* Global credentials — paid */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="h-4 w-4 text-amber-400" />
                          <h3 className="text-sm font-medium text-gray-300">GoLab Global Credentials</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300">⚡ Requires Payment</span>
                        </div>
                        {proxmoxGlobal.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-amber-500/20 rounded-lg">
                            No GoLab global credentials available.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {proxmoxGlobal.map(cred => (
                              <CredentialCard
                                key={cred.id}
                                cred={cred}
                                isSelected={selectedCred?.id === cred.id && selectedSource === 'global'}
                                source="global"
                                onSelect={() => handleCredentialSelect(cred, 'global')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Seats input — shown on select step when orgsuperadmin picks global */}
                  {isOrgSuperAdmin && selectedCred && selectedSource === 'global' && (
                    <div className="pt-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Number of Seats
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                          <input
                            type="number"
                            min={1}
                            value={seats}
                            onChange={e => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-dark-300/60 border border-primary-500/20
                                       text-sm text-gray-200
                                       focus:outline-none focus:border-primary-500/50 focus:bg-dark-300/80
                                       transition-all duration-150"
                          />
                        </div>
                        {unitPrice > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Total (incl. GST)</p>
                            <p className="text-sm font-semibold text-primary-300">₹{totalPrice.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── STEP: PAYMENT SUMMARY ── */}
          {step === 'payment' && selectedCred && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary-400" />
                <h3 className="text-sm font-medium text-gray-300">Order Summary</h3>
              </div>

              <div className="bg-dark-300/50 rounded-xl p-4 space-y-3 border border-primary-500/20">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Lab</span>
                  <span className="text-gray-200 truncate max-w-[180px]">{lab?.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">VMs in Cluster</span>
                  <span className="text-gray-200">{vmCount} VM{vmCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Credential</span>
                  <span className="text-gray-200">{selectedCred.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cloud</span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <Globe className="h-3 w-3" /> GoLab Cloud
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Seats</span>
                  <span className="text-gray-200 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {seats}
                  </span>
                </div>

                <div className="border-t border-primary-500/10 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price per Seat per VM</span>
                    <span className="text-gray-200">₹{unitPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Base ({seats} × {vmCount} VMs × ₹{unitPrice.toLocaleString()})</span>
                    <span className="text-gray-200">₹{basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">GST ({GST_RATE}%)</span>
                    <span className="text-gray-200">₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-primary-500/10 pt-2">
                    <span className="text-gray-200">Total</span>
                    <span className="text-primary-300">₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Payment is processed securely via Cashfree. All {vmCount} VM(s) in the cluster
                  will be converted to templates automatically after successful payment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'processing' && (
          <div className="p-5 border-t border-primary-500/20 flex items-center justify-between gap-3">
            {step === 'payment' ? (
              <>
                <button
                  onClick={() => setStep('select')}
                  disabled={isProcessing}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handlePayWithCashfree}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium
                             bg-gradient-to-r from-primary-500 to-secondary-500
                             hover:from-primary-400 hover:to-secondary-400
                             text-white transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? <Loader className="h-4 w-4 animate-spin" />
                    : <CreditCard className="h-4 w-4" />}
                  Pay ₹{totalPrice.toLocaleString()} with Cashfree
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200
                             hover:bg-dark-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedCred || isProcessing}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium
                             bg-gradient-to-r from-primary-500 to-secondary-500
                             hover:from-primary-400 hover:to-secondary-400
                             text-white transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOrgSuperAdmin && selectedCred && selectedSource === 'global'
                    ? 'Next — Review Payment'
                    : 'Convert Templates'}
                  {!(isOrgSuperAdmin && selectedCred && selectedSource === 'global') && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
