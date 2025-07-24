
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

export const OrgSuperAdminCataloguePage: React.FC = () => {
  const { user } = useAuthStore();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [filteredLabs, setFilteredLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
              <PublicCatalogueCard 
                key={lab.id} 
                lab={lab}
                onAssignUsers={handleAssignUsers}
                onCreateCatalogue={handleCreateCatalogue}
                onDelete={handleDeleteLab}
                showAdminControls={true}
              />
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
