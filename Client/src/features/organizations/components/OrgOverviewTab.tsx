import React, { useEffect, useState } from 'react';
import {
  Building2, Mail, Phone, MapPin, Users, CreditCard,
  Activity, Shield, Cloud, Loader, AlertTriangle, Check, X
} from 'lucide-react';
import axios from 'axios';
import { GradientText } from '../../../components/ui/GradientText';
import { useAuthStore } from '../../../store/authStore';

interface OrgOverviewTabProps {
  orgId: string;
}

const getUploadedFilePath = (fullPath: string) => {
  const normalizedPath = fullPath.replace(/\\/g, '/');
  const uploadIndex = normalizedPath.indexOf('uploads/');
  if (uploadIndex === -1) return null;
  return normalizedPath.substring(uploadIndex + 8);
};

export const OrgOverviewTab: React.FC<OrgOverviewTabProps> = ({ orgId }) => {
  const { user } = useAuthStore();
  const [org, setOrg] = useState<any>(null);
  const [userCount, setUserCount] = useState<{ users: number; admins: number }>({ users: 0, admins: 0 });
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [labsCount, setLabsCount] = useState(0);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [byocSuccess, setByocSuccess] = useState<string | null>(null);
  const [byocError, setByocError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [detailRes, usersRes, labsRes, licenseRes] = await Promise.allSettled([
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, { org_id: orgId }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgUsersCount/${orgId}`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgAssignedLabs/${orgId}`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getActiveLicenseKey/${orgId}`),
        ]);

        if (detailRes.status === 'fulfilled' && detailRes.value.data.success) {
          const data = detailRes.value.data.data;
          setOrg(data);

          // fetch workspace count using internal id
          try {
            const wsRes = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/workspace_ms/workspaceCount/${data.id}`
            );
            if (wsRes.data.success) setWorkspaceCount(wsRes.data.data?.count ?? 0);
          } catch {}
        } else {
          setError('Failed to load organization data');
        }

        if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
          const d = usersRes.value.data.data;
          if (typeof d === 'object' && d !== null) {
            setUserCount({ users: d.users ?? 0, admins: d.admins ?? 0 });
          } else if (typeof d === 'number') {
            setUserCount({ users: d, admins: 0 });
          }
        }

        if (labsRes.status === 'fulfilled' && labsRes.value.data.success) {
          const labData = labsRes.value.data.data || labsRes.value.data.labs || [];
          setLabsCount(Array.isArray(labData) ? labData.length : 0);
        }

        if (licenseRes.status === 'fulfilled' && licenseRes.value.data?.success) {
          setPlanTier(licenseRes.value.data.data?.plan_tier ?? null);
        }
      } catch {
        setError('Failed to load organization data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orgId]);

  const handleByocToggle = async (newValue: boolean) => {
    setOrg((prev: any) => ({ ...prev, bring_your_own_cloud: newValue }));
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/updateBringYourOwnCloud`,
        { orgId, bring_your_own_cloud: newValue }
      );
      if (res.data.success) {
        setByocSuccess('Cloud configuration updated');
        setTimeout(() => setByocSuccess(null), 3000);
      } else {
        setOrg((prev: any) => ({ ...prev, bring_your_own_cloud: !newValue }));
        setByocError('Failed to update');
        setTimeout(() => setByocError(null), 3000);
      }
    } catch {
      setOrg((prev: any) => ({ ...prev, bring_your_own_cloud: !newValue }));
      setByocError('Failed to update');
      setTimeout(() => setByocError(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader className="h-6 w-6 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="text-gray-400 text-sm">{error || 'No organization data'}</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: userCount.users, sub: `${userCount.admins} admins`, icon: Users, color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { label: 'Active Workspaces', value: workspaceCount, sub: null, icon: Activity, color: 'text-secondary-400', bg: 'bg-secondary-500/10' },
    { label: 'Assigned Labs', value: labsCount, sub: null, icon: CreditCard, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Subscription Plan', value: planTier || org.subscription_plan || '—', sub: null, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 overflow-y-auto">
      {/* Header card */}
      <div className="glass-panel flex items-center gap-4">
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center flex-shrink-0">
          {org.logo
            ? <img src={`http://localhost:3004/uploads/${getUploadedFilePath(org.logo)}`} alt={org.organization_name} className="h-full w-full rounded-lg object-cover" />
            : <Building2 className="h-6 w-6 text-primary-400" />
          }
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold truncate">
            <GradientText>{org.organization_name}</GradientText>
          </h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-400">ID: {org.org_id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              org.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
              org.status === 'suspended' ? 'bg-red-500/20 text-red-300' :
              org.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {org.status ? org.status.charAt(0).toUpperCase() + org.status.slice(1) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="glass-panel">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm text-gray-400">{label}</span>
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-200">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Contact information */}
      <div className="glass-panel">
        <h3 className="text-sm sm:text-base font-semibold mb-4">
          <GradientText>Contact Information</GradientText>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 flex-shrink-0">
              <Mail className="h-4 w-4 text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-gray-200 text-sm truncate">{org.org_email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary-500/10 flex-shrink-0">
              <Phone className="h-4 w-4 text-secondary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-gray-200 text-sm">{org.phone_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <div className="p-2 rounded-lg bg-accent-500/10 flex-shrink-0">
              <MapPin className="h-4 w-4 text-accent-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-gray-200 text-sm">{org.address || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BYOC — superadmin only */}
      {user?.role === 'superadmin' && (
        <div className="glass-panel">
          <h3 className="text-sm sm:text-base font-semibold mb-4">
            <GradientText>Cloud Configuration</GradientText>
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-dark-300/50 rounded-lg border border-primary-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10 flex-shrink-0">
                <Cloud className="h-4 w-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">Bring Your Own Cloud</p>
                <p className="text-xs text-gray-400">Allow organization to use their own cloud credentials</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={org?.bring_your_own_cloud || false}
                onChange={(e) => handleByocToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
            </label>
          </div>
          {byocSuccess && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
              <Check className="h-3 w-3" /> {byocSuccess}
            </div>
          )}
          {byocError && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
              <X className="h-3 w-3" /> {byocError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
