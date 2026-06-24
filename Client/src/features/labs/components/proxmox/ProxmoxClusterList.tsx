import React, { useState, useEffect } from 'react';
import { AlertCircle, FolderX, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { ProxmoxClusterCard } from './ProxmoxClusterCard';
import { ProxmoxClusterUserCard } from './ProxmoxClusterUserCard';
import { useAuthStore } from '../../../../store/authStore';
import { useBatchStore } from '../../../../store/batchStore';
import axios from 'axios';

export const ProxmoxClusterList: React.FC = () => {
  const { user, orgUsers } = useAuthStore();
  const { trainerBatchLabs, fetchTrainerBatchLabs } = useBatchStore();

  const [adminLabs, setAdminLabs] = useState<any[]>([]);
  const [userLabs,  setUserLabs]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // trainer is an admin-role variant: sees batch-assigned labs read-only
  const isAdminRole = ['superadmin', 'orgsuperadmin', 'labadmin', 'trainer'].includes(user?.role || '');

  // ── Mirrors ClusterList.tsx fetchClusters exactly ──────────────────────────
  const fetchLabs = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdminRole) {
        const userId = user?.impersonating ? user?.impersonatedUserId : user?.id;

        let ownLabs:  any[] = [];
        let orgLabs:  any[] = [];

        const promises: Promise<any>[] = [];

        // All admin roles fetch their own created labs
        if (
          user?.role === 'superadmin' ||
          user?.role === 'orgsuperadmin' ||
          user?.role === 'labadmin'
        ) {
          promises.push(
            axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterLabs`,
              { userId, role: user?.role, orgId: user?.org_id }
            )
          );
        }

        // Org roles also fetch labs assigned/purchased for their org
        if (
          (user?.role === 'orgsuperadmin' || user?.role === 'labadmin') &&
          user?.org_id
        ) {
          promises.push(
            axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgProxmoxClusterLabs`,
              { orgId: user.org_id }
            )
          );
          if(user?.role === 'orgsuperadmin'){
            const ids = orgUsers.filter(user => user?.role === 'labadmin');
            if(ids?.length){
              promises.push(
            axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterLabAdminsLab`,
              { ids: ids }
            )
          );
            }
          }
        }

        const responses = await Promise.allSettled(promises);
        for (const res of responses) {
          if (res.status === 'fulfilled' && res.value.data.success) {
            const data = res.value.data.data || [];

            if (res.value.config?.url?.includes('getOrgProxmoxClusterLabs')) {
              // getOrgProxmoxClusterLabs returns: [{ orgAssignment, lab, vmConfigs }]
              // Mirror ClusterList.tsx: spread lab, add vmConfigs + assessment:true
              orgLabs = [
                ...orgLabs,
                ...data
                  .filter((item: any) => item.lab?.labid)  // skip items with missing lab
                  .map((item: any) => ({
                    ...item.lab,                           // spreads labid, title, user_id, etc.
                    vmConfigs:  item.vmConfigs || [],
                    assessment: true,                      // org-assigned → shows "Assign Lab"
                  }))
              ];
            } else {
              // getProxmoxClusterLabs returns flat lab objects — use directly
              ownLabs = [...ownLabs, ...data];
            }
          }
        }

        // Merge, deduplicate by labid (own lab takes precedence)
        const seen = new Set<string>();
        const merged: any[] = [];

        for (const lab of [...ownLabs, ...orgLabs]) {
          const id = lab?.labid || lab?.lab?.labid;
          if (id && !seen.has(id)) {
            seen.add(id);
            merged.push(lab);
          }
        }
        setAdminLabs(merged);

      } else {
        // Regular user sees their assigned labs
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getUserProxmoxClusterLabs`,
          { userId: user?.id }
        );
        if (res.data.success) setUserLabs(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch Proxmox cluster labs');
    } finally {
      setLoading(false);
    }
  };

  // ── Trainer: fetch batch-assigned proxmox-cluster labs ───────────────────
  const fetchTrainerClusterLabs = async (batchLabs: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const clusterLabs = batchLabs.filter((l: any) => l.type === 'proxmox-cluster');
      const results = await Promise.allSettled(
        clusterLabs.map((l: any) =>
          axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getProxmoxClusterLabOnId`,
            { labId: l.lab_id }
          )
        )
      );
      const labs: any[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.data.success) {
          const d = r.value.data.data;
          labs.push({
            ...d,
            vmConfigs:  d.vmConfigs  || [],
            // assessment: true,   // trainer cannot edit/delete/convert
          });
        }
      });
      setAdminLabs(labs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch trainer cluster labs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    if (user.role === 'trainer') {
      fetchTrainerBatchLabs(user.id).then(() => {
        // trainerBatchLabs will be populated; fetchTrainerClusterLabs is called
        // in the dependent effect below once the store updates.
      });
    } else {
      fetchLabs();
    }
  }, [user?.id]);

  // Run trainer cluster fetch whenever trainerBatchLabs changes (store update)
  useEffect(() => {
    if (user?.role === 'trainer' && trainerBatchLabs.length > 0) {
      fetchTrainerClusterLabs(trainerBatchLabs);
    }
  }, [trainerBatchLabs]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-primary-500" />
        <span className="ml-3 text-gray-400">Loading Proxmox cluster labs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-400 text-center">{error}</p>
        <button onClick={fetchLabs} className="mt-4 btn-primary">Retry</button>
      </div>
    );
  }

  // ── User view ─────────────────────────────────────────────────────────────
  if (!isAdminRole) {
    if (!userLabs.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FolderX className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Proxmox cluster labs assigned</h3>
          <p className="text-gray-400 text-center max-w-md">
            Your instructor hasn't assigned any Proxmox cluster labs to you yet.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">{userLabs.length} lab{userLabs.length !== 1 ? 's' : ''} assigned</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userLabs.map(item => (
            <ProxmoxClusterUserCard
              key={item.assignment?.id}
              assignment={item.assignment}
              lab={item.lab}
              vms={item.vms || []}
              onDelete={() => setUserLabs(prev => prev.filter(u => u.assignment?.id !== item.assignment?.id))}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Admin view ────────────────────────────────────────────────────────────
  if (!adminLabs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FolderX className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Proxmox cluster labs found</h3>
        <p className="text-gray-400 text-center max-w-md">
          Create your first Proxmox VM Cluster lab using the "New Cluster" button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        {adminLabs.length} Proxmox cluster lab{adminLabs.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminLabs.map(lab => (
          <ProxmoxClusterCard
            key={lab.labid}
            lab={lab}
            onDelete={() => setAdminLabs(prev => prev.filter(l => l.labid !== lab.labid))}
          />
        ))}
      </div>
    </div>
  );
};
