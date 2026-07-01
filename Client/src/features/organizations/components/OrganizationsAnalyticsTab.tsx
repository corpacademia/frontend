import React, { useEffect, useState } from 'react';
import { Building2, Users, BookOpen, CreditCard, TrendingUp, Activity, Loader } from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';
import axios from 'axios';
import { useSubscription } from '../../labs/hooks/useSubscription';

interface OrgWithCounts {
  id: string;
  org_id?: string;
  organization_name?: string;
  name?: string;
  status?: string;
  subscription_plan?: string;
  subscriptionTier?: string;
  plan_tier?: string;
  revenue?: number;
  usersCount: number;
  labsCount: number;
}

interface OrganizationsAnalyticsTabProps {
  organizations: any[];
  stats: {
    totalOrganizations: number;
    activeUsers: number;
    totalLabs: number;
    monthlyRevenue: number;
  };
}

const statusColor: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  suspended: 'bg-red-500/20 text-red-400',
};

const tierColor: Record<string, string> = {
  basic: 'bg-gray-500/20 text-gray-400',
  professional: 'bg-primary-500/20 text-primary-400',
  enterprise: 'bg-accent-500/20 text-accent-400',
};

export const OrganizationsAnalyticsTab: React.FC<OrganizationsAnalyticsTabProps> = ({
  organizations,
  stats,
}) => {
  
  const [enrichedOrgs, setEnrichedOrgs] = useState<OrgWithCounts[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [totals, setTotals] = useState({ activeUsers: 0, totalLabs: 0 });
  
  
  useEffect(() => {
    if (!organizations.length) return;

    const fetchCounts = async () => {
      setIsFetching(true);
      try {
        const results = await Promise.all(
          organizations.map(async (org: any) => {
            const orgId = org.id || org.org_id;
            let usersCount = org.usersCount || 0;
            let labsCount = org.labsCount || 0;

            try {
              const usersRes = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgUsersCount/${orgId}`
              );
              if (usersRes.data.success) {
                const d = usersRes.data.data;
                if (typeof d === 'number') {
                  usersCount = d;
                } else if (d && typeof d === 'object') {
                  // API returns {users: n, admins: m} — sum all numeric values
                  usersCount = Object.values(d).reduce(
                    (sum: number, v) => sum + (typeof v === 'number' ? v : 0),
                    0
                  );
                }
              }
            } catch {}

            try {
              const labsRes = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgAssignedLabs/${orgId}`
              );
              if (labsRes.data.success) {
                const labData = labsRes.data.data || labsRes.data.labs || [];
                labsCount = Array.isArray(labData) ? labData.length : labsCount;
              }
            } catch {}

            let plan_tier: string | undefined;
            try {
              const licenseRes = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getActiveLicenseKey/${orgId}`
              );
              if (licenseRes.data?.success && licenseRes.data?.data) {
                plan_tier = licenseRes.data.data.plan_tier;
              }
            } catch {}

            return { ...org, usersCount, labsCount, plan_tier } as OrgWithCounts;
          })
        );

        setEnrichedOrgs(results);
        setTotals({
          activeUsers: results.reduce((a, o) => a + o.usersCount, 0),
          totalLabs: results.reduce((a, o) => a + o.labsCount, 0),
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchCounts();
  }, [organizations]);

  const displayOrgs = enrichedOrgs.length ? enrichedOrgs : organizations;
  const maxUsers = Math.max(...displayOrgs.map((o: any) => o.usersCount || 0), 1);

  const activeCount = organizations.filter((o: any) => o.status === 'active').length;
  const pendingCount = organizations.filter((o: any) => o.status === 'pending').length;
  const suspendedCount = organizations.filter((o: any) => o.status === 'suspended').length;

  const metrics = [
    {
      label: 'Total Organizations',
      value: stats.totalOrganizations,
      icon: Building2,
      gradient: 'from-primary-400 to-primary-600',
    },
    {
      label: 'Active Users',
      value: isFetching ? '...' : totals.activeUsers || stats.activeUsers,
      icon: Users,
      gradient: 'from-accent-400 to-accent-600',
    },
    {
      label: 'Total Labs',
      value: isFetching ? '...' : totals.totalLabs || stats.totalLabs,
      icon: BookOpen,
      gradient: 'from-secondary-400 to-secondary-600',
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      gradient: 'from-primary-400 to-accent-600',
    },
  ];

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-shrink-0">
        {metrics.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="glass-panel p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-200">Organization Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Active', count: activeCount, color: 'bg-green-500' },
              { label: 'Pending', count: pendingCount, color: 'bg-yellow-500' },
              { label: 'Suspended', count: suspendedCount, color: 'bg-red-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-dark-400 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{
                      width: stats.totalOrganizations
                        ? `${(count / stats.totalOrganizations) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-300 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users per Org */}
        <div className="glass-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-400" />
              <h3 className="text-sm font-semibold text-gray-200">Users per Organization</h3>
            </div>
            {isFetching && <Loader className="h-3 w-3 text-primary-400 animate-spin" />}
          </div>
          {organizations.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available.</p>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500/20 scrollbar-track-dark-300">
              {displayOrgs.map((org: any) => (
                <div key={org.id || org.org_id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 truncate w-28 flex-shrink-0">
                    {org.organization_name || org.name}
                  </span>
                  <div className="flex-1 bg-dark-400 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${((org.usersCount || 0) / maxUsers) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-6 text-right">
                    {org.usersCount ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-organization table */}
      <div className="glass-panel p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">Organization Breakdown</h3>
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader className="h-3 w-3 animate-spin" />
              Loading counts…
            </div>
          )}
        </div>
        {organizations.length === 0 ? (
          <p className="text-gray-500 text-sm">No organizations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-400">
                  <th className="pb-2 text-left text-xs font-medium text-gray-400">Organization</th>
                  <th className="pb-2 text-left text-xs font-medium text-gray-400">Status</th>
                  <th className="pb-2 text-left text-xs font-medium text-gray-400">Tier</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-400">Users</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-400">Labs</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-400">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-400/50">
                {displayOrgs.map((org: any) => (
                  <tr key={org.id || org.org_id} className="hover:bg-dark-300/30 transition-colors">
                    <td className="py-2.5 text-gray-300 font-medium max-w-[160px] truncate">
                      {org.organization_name || org.name || '—'}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColor[org.status] || 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {org.status || '—'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tierColor[org.plan_tier || org.subscription_plan || org.subscriptionTier] ||
                          'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {org.plan_tier || org.subscription_plan || org.subscriptionTier || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {isFetching && !enrichedOrgs.length ? (
                        <span className="text-gray-500">…</span>
                      ) : (
                        org.usersCount ?? 0
                      )}
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {isFetching && !enrichedOrgs.length ? (
                        <span className="text-gray-500">…</span>
                      ) : (
                        org.labsCount ?? 0
                      )}
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {org.revenue != null ? `$${org.revenue.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
