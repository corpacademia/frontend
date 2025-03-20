import React, { useEffect, useState } from 'react';
import { CatalogueLayout } from '../components/catalogue/CatalogueLayout';
import { LabCatalogueFilters } from '../components/catalogue/LabCatalogueFilters';
import { CatalogueGrid } from '../components/catalogue/CatalogueGrid';
import { useLabs } from '../hooks/useLabs';

export const CataloguePage: React.FC = () => {
  const { labs, isLoading } = useLabs();
  const [filteredLabs,setFilteredLabs] = useState([])
  const [filters,setFilters] = useState({
    search:'',
    technology:'',
    level:''
  })
  useEffect(() => {
    if (labs && labs.length > 0) {
        setFilteredLabs(labs); // Set filteredLabs only after labs are loaded
    }
}, [labs]);
  const handleChange=(update: { key: string; value: string })=>{
    const updateFilters = {...filters,[update.key]: update.value}
    setFilters(updateFilters)
  }
  useEffect(()=>{
    const filter = labs.filter((lab)=>{
      const matchesSearch = !filters.search || lab.title.toLowerCase().includes(filters.search.toLowerCase())
      const matchesTech = !filters.technology || lab.provider.toLowerCase().includes(filters.technology.toLowerCase())
      const matchesLevel = !filters.level || lab.status.toLowerCase().includes(filters.level.toLowerCase())
      return matchesSearch && matchesTech && matchesLevel
    })
    setFilteredLabs(filter)
  },[filters])

  return (
    <CatalogueLayout>
      <div className="space-y-6">
        <LabCatalogueFilters onFilterChange={handleChange} filters={filters} setFilters={setFilters} />
        <CatalogueGrid labs={filteredLabs} isLoading={isLoading} />
      </div>
    </CatalogueLayout>
  );
};