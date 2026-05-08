import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Building2, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../../../store/authStore';

interface OrgRecord {
  id: string;
  organization_name: string;
  user_count?: number;
  lab_count?: number;
  status?: string;
}

export const RecentOrganizations: React.FC = () => {
  const { user } = useAuthStore();
  const [orgs, setOrgs] = useState<OrgRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`
        );
        const raw: OrgRecord[] = (res.data?.data || []).slice(0, 5);

        // Fetch users AND labs for each org in parallel (both run at the same time per org)
        const [userCountResults, labCountResults] = await Promise.all([
          Promise.allSettled(
            raw.map((org) =>
              axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${org.id}`
              )
            )
          ),
          Promise.allSettled(
            raw.map((org) =>
              axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllOrgLabs`,{orgId:org?.id}
              )
            )
          ),
        ]);

        // Merge both counts back into each org record
        const enriched: OrgRecord[] = raw.map((org, i) => {
          const userResult = userCountResults[i];
          const labResult = labCountResults[i];

          const user_count =
            userResult.status === 'fulfilled'
              ? (userResult.value.data?.data?.length ?? 0)
              : 0;

          const lab_count =
            labResult.status === 'fulfilled'
              ? (labResult.value.data?.data?.length ?? labResult.value.data?.count ?? 0)
              : 0;

          return { ...org, user_count, lab_count };
        });

        setOrgs(enriched);
      } catch (err) {
        console.error('Failed to fetch organizations', err);
        setOrgs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrgs();
  }, [user?.id]);

  const statusBadge = (status?: string) => {
    const base = 'px-2 py-0.5 text-xs font-medium rounded-full capitalize';
    if (status === 'active' || !status) return `${base} bg-primary-500/20 text-primary-300`;
    if (status === 'pending') return `${base} bg-accent-500/20 text-accent-300`;
    return `${base} bg-gray-500/20 text-gray-300`;
  };

  return (
    <div className="glass-panel p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-xl font-semibold">
          <GradientText>Recent Organizations</GradientText>
        </h2>
        <Building2 className="h-5 w-5 text-primary-400 flex-shrink-0" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader className="h-6 w-6 animate-spin text-primary-400" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No organizations found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400">
                  <th className="pb-4">Organization</th>
                  <th className="pb-4">Users</th>
                  <th className="pb-4">Labs</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orgs.map((org) => (
                  <tr key={org.id} className="border-t border-primary-500/10">
                    <td className="py-3 text-gray-200 font-medium truncate max-w-[150px]">
                      {org.organization_name}
                    </td>
                    <td className="py-3 text-gray-400">{org.user_count ?? '—'}</td>
                    <td className="py-3 text-gray-400">{org.lab_count ?? '—'}</td>
                    <td className="py-3">
                      <span className={statusBadge(org.status)}>{org.status || 'active'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {orgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg border border-primary-500/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {org.organization_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {org.user_count ?? 0} users · {org.lab_count ?? 0} labs
                  </p>
                </div>
                <span className={`ml-2 flex-shrink-0 ${statusBadge(org.status)}`}>
                  {org.status || 'active'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};