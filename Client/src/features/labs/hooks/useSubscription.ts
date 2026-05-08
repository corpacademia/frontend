import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

export type FeatureKey = 'labadmins' | 'trainers' | 'students' | 'batches' | 'labs' | 'catalogues';

/**
 * Maps the role of the user being ADDED to the correct plan FeatureKey.
 * null means that role is not subscription-limited (e.g. superadmin).
 */
export const ROLE_TO_FEATURE: Record<string, FeatureKey | null> = {
  labadmin:      'labadmins',
  trainer:       'trainers',
  user:          'students',   // 'user' role = student seat in the plan
  orgsuperadmin: null,         // not counted against any limit
  superadmin:    null,
};

export interface SubscriptionState {
  hasLicense: boolean;
  isExpired: boolean;
  isLoading: boolean;
  license: ReturnType<any> | null;
  licenseKey: String;
  /** Returns true if org has capacity for `count` more of `feature` */
  canUse: (feature: FeatureKey, currentUsage?: number) => boolean;
  updateUsage:(licenseKey: String , feature:FeatureKey ,quantity?: number) => void;
}

export const useSubscription = (): SubscriptionState => {
  const { user } = useAuthStore();
  const [license, setLicense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.org_id) { setIsLoading(false); return; }
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getActiveLicenseKey/${user.org_id}`)
      .then(res => {
        if (res.data?.success && res.data?.data) setLicense(res.data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user?.org_id]);

  const hasLicense = !!license && license?.status !== 'expired' && license.status !== 'suspended' && license?.activated;
  const isExpired  = !!license && license?.status === 'expired';

  const canUse = (feature: FeatureKey, currentUsage = 0): boolean => {
    if (!hasLicense) return false;
    const limit = license!.features[feature];
    return limit === -1 || currentUsage < limit;          // -1 = unlimited
  };

  const updateUsage = async (licenseKey , feature:FeatureKey ,quantity=0)=>{
    if(!licenseKey || !feature) return false;
      const update = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateUsage`,{
       licenseKey,featureKey:feature,quantity 
      })
  }

  return { hasLicense, isExpired, isLoading, license, canUse,updateUsage };
};
