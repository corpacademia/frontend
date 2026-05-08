import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowUpRight } from 'lucide-react';
import { useSubscription, FeatureKey } from '../../labs/hooks/useSubscription';

interface Props {
  /** Feature to check capacity against (optional) */
  feature?: FeatureKey;
  currentUsage?: number;
  children: React.ReactNode;
  /** If true, renders children but visually disables them instead of hiding */
  soft?: boolean;
}

export const SubscriptionGate: React.FC<Props> = ({ feature, currentUsage = 0, children, soft = false }) => {
  const { hasLicense, isLoading, canUse } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) return null;

  const allowed = feature ? (hasLicense && canUse(feature, currentUsage)) : hasLicense;

  if (allowed) return <>{children}</>;

  if (soft) {
    // Renders children but overlays a lock icon — good for buttons/cards
    return (
      <div className="relative pointer-events-none opacity-50 select-none">
        {children}
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary-400" />
        </div>
      </div>
    );
  }

  // Full gate — page-level or section-level block
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20">
        <Lock className="h-8 w-8 text-primary-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">Subscription Required</h3>
      <p className="text-sm text-gray-400 max-w-sm">
        {feature
          ? `You've reached the ${feature} limit on your current plan.`
          : 'Your organization does not have an active subscription.'}
        <br />Upgrade your plan to unlock this feature.
      </p>
      <button
        onClick={() => navigate('/dashboard/billing')}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500
                   text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
      >
        View Plans <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
};
