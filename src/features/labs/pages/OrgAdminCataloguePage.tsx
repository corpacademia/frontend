import React, { useState, useEffect } from 'react';
import { CatalogueLayout } from '../components/catalogue/CatalogueLayout';
import { LabCatalogueFilters } from '../components/catalogue/LabCatalogueFilters';
import { OrgAdminCatalogueCard } from '../components/catalogue/OrgAdminCatalogueCard';
import { AssignUsersModal } from '../components/catalogue/AssignUsersModal';
import { Lab } from '../types';
import { useLabs } from '../hooks/useLabs';

export const OrgAdminCataloguePage: React.FC = () => {
  const { labs, isLoading } = useLabs(); // Assuming useLabs() provides `isLoading`
  const [filteredLabs, setFilteredLabs] = useState<Lab[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    technology: '',
    level: ''
  });

  // Sync `filteredLabs` with `labs` when data is available
  useEffect(() => {
    if (labs.length > 0) {
      setFilteredLabs(labs);
    }
  }, [labs]);


  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

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
        (lab.config_details?.software || []).some(tech =>
          tech.toLowerCase().includes(updatedFilters.technology.toLowerCase())
        );

      return matchesSearch && matchesTech;
    });

    setFilteredLabs(filtered);
  };

  const handleAssignUsers = (lab: Lab) => {
    setSelectedLab(lab);
    setIsAssignModalOpen(true);
  };

  return (
    <CatalogueLayout>
      <div className="space-y-4 sm:space-y-6">
        <LabCatalogueFilters 
          onFilterChange={handleFilterChange} 
          filters={filters}
          setFilters={setFilters}
        />

        {/* Show loading state if data is still fetching */}
        {isLoading ? (
          <p className="text-center text-gray-500">Loading labs...</p>
        ) : filteredLabs.length === 0 ? (
          <p className="text-center text-gray-500">No labs available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {filteredLabs.map(lab => (
              <OrgAdminCatalogueCard 
                key={lab.id} 
                lab={lab}
                onAssignUsers={handleAssignUsers}
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
        />
      </div>
    </CatalogueLayout>
  );
};
