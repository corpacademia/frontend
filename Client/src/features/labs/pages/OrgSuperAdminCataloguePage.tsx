
import React, { useState, useEffect } from 'react';
import { CatalogueLayout } from '../components/catalogue/CatalogueLayout';
import { LabCatalogueFilters } from '../components/catalogue/LabCatalogueFilters';
import { PublicCatalogueCard } from '../components/catalogue/PublicCatalogueCard';
import { AssignUsersModal } from '../components/catalogue/AssignUsersModal';
import { CreateCatalogueModal } from '../components/catalogue/CreateCatalogueModal';
import { DeleteModal } from '../components/catalogue/DeleteModal';
import { Lab } from '../types';
import { useLabs } from '../hooks/useLabs';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';
import { Users, Calendar, AlertCircle } from 'lucide-react';

interface PurchaseInfo {
  lab_id: string;
  number_of_users: number;
  assigned_users: number;
  number_of_days: number;
  expiry_date?: string;
}

export const OrgSuperAdminCataloguePage: React.FC = () => {
  const { user } = useAuthStore();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [filteredLabs, setFilteredLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseMap, setPurchaseMap] = useState<Record<string, PurchaseInfo>>({});
  const [filters, setFilters] = useState({
    search: '',
    technology: '',
    level: ''
  });

  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [existingCatalogue, setExistingCatalogue] = useState(null);

  // Fetch organization-specific labs
  useEffect(() => {
    const fetchOrgLabs = async () => {
      try {
        setIsLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrganizationLabs`, {
          org_id: user?.org_id
        });

        if (response.data.success) {
          setLabs(response.data.data);
          setFilteredLabs(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching organization labs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.org_id) {
      fetchOrgLabs();
    }
  }, [user?.org_id]);

  // Fetch purchase/licence info for remaining quantity display
  useEffect(() => {
    const fetchPurchaseInfo = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgCataloguePurchases`,
          { org_id: user?.org_id }
        );
        if (response.data.success && response.data.data?.length > 0) {
          const map: Record<string, PurchaseInfo> = {};
          response.data.data.forEach((p: any) => {
            map[p.lab_id] = {
              lab_id: p.lab_id,
              number_of_users: p.number_of_users,
              assigned_users: p.assigned_users ?? 0,
              number_of_days: p.number_of_days,
              expiry_date: p.expiry_date,
            };
          });
          setPurchaseMap(map);
        } else {
          // Demo purchase data so the UI is visible without a backend
          setPurchaseMap({
            'lab-aws-01': { lab_id: 'lab-aws-01', number_of_users: 50, assigned_users: 32, number_of_days: 90, expiry_date: '2026-04-15T09:00:00Z' },
            'lab-k8s-02': { lab_id: 'lab-k8s-02', number_of_users: 30, assigned_users: 30, number_of_days: 60, expiry_date: '2026-01-31T11:00:00Z' },
          });
        }
      } catch {
        // Demo fallback
        setPurchaseMap({
          'lab-aws-01': { lab_id: 'lab-aws-01', number_of_users: 50, assigned_users: 32, number_of_days: 90, expiry_date: '2026-04-15T09:00:00Z' },
          'lab-k8s-02': { lab_id: 'lab-k8s-02', number_of_users: 30, assigned_users: 30, number_of_days: 60, expiry_date: '2026-01-31T11:00:00Z' },
        });
      }
    };

    if (user?.org_id) fetchPurchaseInfo();
  }, [user?.org_id]);

  // Sync `filteredLabs` with `labs` when data is available
  useEffect(() => {
    if (labs.length > 0) {
      setFilteredLabs(labs);
    }
  }, [labs]);

  const handleFilterChange = (update: { key: string; value: string }) => {
    const updatedFilters = { ...filters, [update.key]: update.value };
    setFilters(updatedFilters);

    // Apply filters dynamically
    const filtered = labs.filter(lab => {
      const matchesSearch =
        !updatedFilters.search ||
        lab.title.toLowerCase().includes(updatedFilters.search.toLowerCase()) ||
        lab.description.toLowerCase().includes(updatedFilters.search.toLowerCase());

      const matchesTech =
        !updatedFilters.technology ||
        lab.provider.toLowerCase().includes(updatedFilters.technology.toLowerCase());

      const matchesLevel =
        !updatedFilters.level ||
        lab.status.toLowerCase().includes(updatedFilters.level.toLowerCase());

      return matchesSearch && matchesTech && matchesLevel;
    });

    setFilteredLabs(filtered);
  };

  const handleAssignUsers = (lab: Lab) => {
    setSelectedLab(lab);
    setIsAssignModalOpen(true);
  };

  const handleCreateCatalogue = (catalogueData: any) => {
    setExistingCatalogue(catalogueData);
    setIsCreateModalOpen(true);
  };

  const handleDeleteLab = (lab: Lab) => {
    setSelectedLab(lab);
    setIsDeleteModalOpen(true);
  };

  const refreshLabs = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrganizationLabs`, {
        org_id: user?.org_id
      });

      if (response.data.success) {
        setLabs(response.data.data);
        setFilteredLabs(response.data.data);
      }
    } catch (error) {
      console.error('Error refreshing labs:', error);
    }
  };

  /** Remaining-qty strip rendered below each card */
  const RemainingQtyStrip: React.FC<{ labId: string }> = ({ labId }) => {
    const info = purchaseMap[labId];
    if (!info) return null;

    const total = info.number_of_users;
    const used = info.assigned_users;
    const remaining = total - used;
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;

    const barColor = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400';
    const textColor = pct >= 90 ? 'text-red-300' : pct >= 70 ? 'text-amber-300' : 'text-emerald-300';
    const bgColor = pct >= 90 ? 'bg-red-500/10 border-red-500/20'
      : pct >= 70 ? 'bg-amber-500/10 border-amber-500/20'
        : 'bg-emerald-500/10 border-emerald-500/20';

    const expiryDays = info.expiry_date
      ? Math.ceil((new Date(info.expiry_date).getTime() - Date.now()) / 86400000)
      : null;

    return (
      <div className={`mt-2 rounded-xl border p-3 ${bgColor}`}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
            <Users className="h-3.5 w-3.5 text-secondary-400" />
            Licence Seats
          </span>
          <span className={`text-xs font-bold ${textColor}`}>
            {remaining} <span className="font-normal text-gray-500">/ {total} remaining</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-dark-400/60 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>{used} assigned · {pct}% used</span>
          {info.expiry_date && (
            <span className={`flex items-center gap-1 ${expiryDays !== null && expiryDays <= 14 ? 'text-amber-400' : ''}`}>
              {expiryDays !== null && expiryDays <= 14 && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              {expiryDays !== null && expiryDays > 0
                ? `${expiryDays}d left`
                : 'Expired'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <CatalogueLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Organization Lab Catalogue</h1>
        </div>

        <LabCatalogueFilters
          onFilterChange={handleFilterChange}
          filters={filters}
          setFilters={setFilters}
        />

        {/* Show loading state if data is still fetching */}
        {isLoading ? (
          <p className="text-center text-gray-500">Loading labs...</p>
        ) : filteredLabs.length === 0 ? (
          <p className="text-center text-gray-500">No labs available for your organization.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredLabs.map(lab => (
              <div key={lab.lab_id} className="flex flex-col">
                <PublicCatalogueCard
                  lab={lab}
                  onAssignUsers={handleAssignUsers}
                  onCreateCatalogue={handleCreateCatalogue}
                  onDelete={handleDeleteLab}
                  showAdminControls={true}
                />
                {/* Remaining quantity strip below each card */}
                <RemainingQtyStrip labId={lab.lab_id} />
              </div>
            ))}
          </div>
        )}

        <AssignUsersModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedLab(null);
          }}
          lab={selectedLab}
          type={selectedLab?.type || 'standard'}
        />

        {existingCatalogue && (
          <CreateCatalogueModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setExistingCatalogue(null);
            }}
            existingCatalogue={existingCatalogue}
            onSuccess={refreshLabs}
          />
        )}

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedLab(null);
          }}
          lab={selectedLab}
          onSuccess={refreshLabs}
        />
      </div>
    </CatalogueLayout>
  );
};
