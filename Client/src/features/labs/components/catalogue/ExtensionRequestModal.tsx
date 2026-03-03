import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  Calendar,
  Users,
  Send,
  AlertCircle,
  Check,
  Loader,
  Clock,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { useAuthStore } from '../../../../store/authStore';
import { stripePromise } from '../../../../utils/stripe';
import { useCatalogueStore } from '../../../../store/catalogueStore';

interface PurchasedLab {
  purchased_id?: string;
  lab_id: string;
  lab_title: string;
  org_id: string;
  org_name?: string;
  number_of_days: number;
  number_of_users: number;
  purchase_date?: string;
  expiry_date?: string;
  status?: string;
}

interface ExtensionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasedLab: PurchasedLab | null;
  adminId: string;
  onSuccess?: () => void;
}

// ── Pricing constants (match your backend pricing) ──────────────────────────
const PRICE_PER_DAY = 10;       // ₹ per additional day
const PRICE_PER_USER = 50;      // ₹ per additional user
const GST_RATE = 0.18;          // 18 % GST

// ── Helpers ─────────────────────────────────────────────────────────────────
const calcSubtotal = (days: number, users: number, catalogue: any,existingUsers:any) => {
  if (!catalogue) return 0;

  const perDayPrice = catalogue.price / catalogue.duration;

  return (
   ( existingUsers * days * perDayPrice) +
    users * perDayPrice +
    users * catalogue.price
  );
};
const calcGST = (subtotal: number) => subtotal * GST_RATE;

const calcTotal = (days: number, users: number,catalogue:any,existingUsers:any) => {
  const sub = calcSubtotal(days, users,catalogue,existingUsers);
  return sub + calcGST(sub);
};

// ────────────────────────────────────────────────────────────────────────────

export const ExtensionRequestModal: React.FC<ExtensionRequestModalProps> = ({
  isOpen,
  onClose,
  purchasedLab,
  adminId,
  onSuccess,
}) => {
  const {catalogues} = useCatalogueStore();
  // ── Step: 'details' | 'payment' ──────────────────────────────────────────
  const [step, setStep] = useState<'details' | 'payment'>('details');

  // ── Form fields ───────────────────────────────────────────────────────────
  const [additionalDays, setAdditionalDays] = useState<number>(30);
  const [additionalUsers, setAdditionalUsers] = useState<number>(0);
  const [reason, setReason] = useState('');

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [catalogue, setCatalogue] = useState<any>(null);

 useEffect(() => {
  if (!catalogues || !purchasedLab) return;

  setCatalogue(
    catalogues.find((cat: any) => cat.id === purchasedLab.lab_id) || null
  );
}, [catalogues, purchasedLab]);
   
  // ── Derived pricing ───────────────────────────────────────────────────────
  const subtotal = calcSubtotal(additionalDays, additionalUsers,catalogue,purchasedLab?.number_of_users);
  const gst = calcGST(subtotal);
  const total = subtotal + gst;

  // ── Validation ────────────────────────────────────────────────────────────
  const hasValidRequest = additionalDays > 0 || additionalUsers > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep('details');
    setAdditionalDays(30);
    setAdditionalUsers(0);
    setReason('');
    setNotification(null);
    onClose();
  };

  const handleProceedToPayment = () => {
    if (!hasValidRequest) {
      setNotification({
        type: 'error',
        message: 'Please specify additional days or users to request.',
      });
      return;
    }
    setNotification(null);
    setStep('payment');
  };

  /**
   * Calls the backend to:
   *  1. Record the extension request (status = 'pending')
   *  2. Create a Stripe Checkout Session for the extension fee
   * Then redirects the user to Stripe's hosted checkout page.
   * On payment success (via webhook), the backend marks the request as paid.
   */
  const handlePayAndSubmit = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/extensionStripeCheckout`,
        {
          purchased_id: purchasedLab?.purchased_id,
          lab_id: purchasedLab?.lab_id,
          lab_title: purchasedLab?.lab_title,
          org_id: purchasedLab?.org_id,
          org_name: purchasedLab?.org_name,
          admin_id: adminId,
          admin_name: user?.name,
          additional_days: additionalDays,
          additional_users: additionalUsers,
          reason: reason,
          current_days: purchasedLab?.number_of_days,
          current_users: purchasedLab?.number_of_users,
          // Payment metadata sent to backend so it can build the Stripe session
          payment: {
            subtotal,
            gst,
            total,
            currency: 'inr',
          },
        }
      );

      if (response.data.success) {
        // ── Path A: backend returns a Stripe session ID ──────────────────
        const sessionId = response.data.sessionId;
        if (sessionId) {
          const stripe = await stripePromise;
          if (stripe) {
            await stripe.redirectToCheckout({ sessionId });
            // Page navigates away; no further UI update needed.
            return;
          }
        }

        // ── Path B: backend handled payment internally (e.g. already paid) ─
        setNotification({
          type: 'success',
          message: 'Extension request submitted successfully!',
        });
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to submit request');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message:
          err.response?.data?.message || 'Failed to submit extension request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !purchasedLab) return null;

  // ── Modal ─────────────────────────────────────────────────────────────────
  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-dark-200 rounded-2xl w-full max-w-lg shadow-2xl shadow-primary-500/10 border border-primary-500/20 overflow-hidden">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-r from-primary-500/20 to-secondary-500/20 px-6 py-5 border-b border-primary-500/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">
                <GradientText>
                  {step === 'details' ? 'Request Extension' : 'Confirm & Pay'}
                </GradientText>
              </h2>
              <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                {purchasedLab.lab_title}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-dark-300 rounded-xl transition-colors ml-4 flex-shrink-0"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {(['details', 'payment'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${step === s ? 'text-primary-300' : i < (['details', 'payment'].indexOf(step)) ? 'text-emerald-400' : 'text-gray-500'
                  }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${step === s
                      ? 'border-primary-400 bg-primary-500/20 text-primary-300'
                      : i < (['details', 'payment'].indexOf(step))
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-gray-600 bg-dark-400/50 text-gray-500'
                    }`}>
                    {i < (['details', 'payment'].indexOf(step)) ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  {s === 'details' ? 'Request Details' : 'Payment'}
                </div>
                {i < 1 && <div className="flex-1 h-px bg-dark-400/60 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── STEP 1: Details ─────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'details' && (
          <div className="px-6 py-5 space-y-5">
            {/* Current Plan Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-300/50 rounded-xl p-3 flex items-center gap-3 border border-primary-500/10">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Days</p>
                  <p className="text-white font-semibold">{purchasedLab.number_of_days} days</p>
                </div>
              </div>
              <div className="bg-dark-300/50 rounded-xl p-3 flex items-center gap-3 border border-secondary-500/10">
                <div className="p-2 bg-secondary-500/20 rounded-lg">
                  <Users className="h-4 w-4 text-secondary-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Users</p>
                  <p className="text-white font-semibold">{purchasedLab.number_of_users} users</p>
                </div>
              </div>
            </div>

            {/* Additional Days */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Clock className="h-4 w-4 text-primary-400" />
                Additional Days Requested
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={additionalDays}
                  onChange={(e) => setAdditionalDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-2.5 bg-dark-400/50 border border-primary-500/20 rounded-xl
                             text-gray-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/30
                             transition-all"
                  placeholder="0"
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">days</span>
              </div>
              {additionalDays > 0 && (
                <p className="text-xs text-primary-400 mt-1.5">
                  New total: {purchasedLab.number_of_days + additionalDays} days
                  <span className="text-gray-500 ml-2">· ₹{additionalDays * PRICE_PER_DAY} for days</span>
                </p>
              )}
            </div>

            {/* Additional Users */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Users className="h-4 w-4 text-secondary-400" />
                Additional Users Requested
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={additionalUsers}
                  onChange={(e) => setAdditionalUsers(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-2.5 bg-dark-400/50 border border-primary-500/20 rounded-xl
                             text-gray-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/30
                             transition-all"
                  placeholder="0"
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">users</span>
              </div>
              {additionalUsers > 0 && (
                <p className="text-xs text-secondary-400 mt-1.5">
                  New total: {purchasedLab.number_of_users + additionalUsers} users
                  <span className="text-gray-500 ml-2">· ₹{additionalUsers * PRICE_PER_USER} for users</span>
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Extension <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-dark-400/50 border border-primary-500/20 rounded-xl
                           text-gray-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/30
                           transition-all resize-none placeholder-gray-600"
                placeholder="Explain why you need the extension..."
              />
            </div>

            {/* Price Preview strip */}
            {hasValidRequest && (
              <div className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-primary-400" />
                  Estimated total (incl. 18% GST)
                </span>
                <span className="text-base font-bold text-primary-300">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            )}

            {/* Notification */}
            {notification && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${notification.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}>
                {notification.type === 'success'
                  ? <Check className="h-5 w-5 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                <span className="text-sm">{notification.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-dark-300/50 hover:bg-dark-300 text-gray-300
                           rounded-xl border border-primary-500/20 transition-all font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={!hasValidRequest}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500
                           hover:from-primary-400 hover:to-secondary-400
                           text-white rounded-xl transition-all font-medium text-sm
                           shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── STEP 2: Payment ─────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'payment' && (
          <div className="px-6 py-5 space-y-5">

            {/* Order summary */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Order Summary
              </p>
              <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl overflow-hidden">
                <div className="divide-y divide-primary-500/10">
                  {additionalDays > 0 && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary-400" />
                        <div>
                          <p className="text-sm text-gray-300 font-medium">
                            {additionalDays} Additional Days
                          </p>
                          <p className="text-[11px] text-gray-500">
                            ₹{PRICE_PER_DAY} × {additionalDays} days
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-200">
                        ₹{(additionalDays * PRICE_PER_DAY).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {additionalUsers > 0 && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-secondary-400" />
                        <div>
                          <p className="text-sm text-gray-300 font-medium">
                            {additionalUsers} Additional Users
                          </p>
                          <p className="text-[11px] text-gray-500">
                            ₹{PRICE_PER_USER} × {additionalUsers} users
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-200">
                        ₹{(additionalUsers * PRICE_PER_USER).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 bg-dark-400/20">
                    <span className="text-xs text-gray-500">Subtotal</span>
                    <span className="text-sm text-gray-300">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-dark-400/20">
                    <span className="text-xs text-gray-500">GST (18%)</span>
                    <span className="text-sm text-gray-300">₹{gst.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-t border-primary-500/20">
                  <span className="text-sm font-bold text-white">Total Payable</span>
                  <span className="text-xl font-bold text-primary-300">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Extension details recap */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl p-3">
                <p className="text-[11px] text-gray-500 mb-0.5">Lab</p>
                <p className="text-xs text-gray-300 font-medium line-clamp-2">{purchasedLab.lab_title}</p>
              </div>
              <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl p-3">
                <p className="text-[11px] text-gray-500 mb-0.5">Extension</p>
                <p className="text-xs text-gray-300 font-medium">
                  {additionalDays > 0 && `+${additionalDays}d`}
                  {additionalDays > 0 && additionalUsers > 0 && ' · '}
                  {additionalUsers > 0 && `+${additionalUsers}u`}
                </p>
              </div>
            </div>

            {/* Stripe badge */}
            <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Secured by
              <span className="font-bold text-gray-300 tracking-wide">Stripe</span>
              — 256-bit TLS encryption
            </div>

            {/* Notification */}
            {notification && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${notification.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}>
                {notification.type === 'success'
                  ? <Check className="h-5 w-5 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                <span className="text-sm">{notification.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setStep('details'); setNotification(null); }}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-dark-300/50 hover:bg-dark-300 text-gray-300
                           rounded-xl border border-primary-500/20 transition-all font-medium text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handlePayAndSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500
                           hover:from-primary-400 hover:to-secondary-400
                           text-white rounded-xl transition-all font-medium text-sm
                           shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Redirecting to Stripe…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay ₹{total.toFixed(2)} &amp; Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
