import React, { useState } from 'react';
import { CloudResourceOverview } from '../../superadmin/components/cloud/CloudResourceOverview';
import { CloudProviderUsage } from '../../superadmin/components/cloud/CloudProviderUsage';
import { ResourceAllocationChart } from '../../superadmin/components/cloud/ResourceAllocationChart';
import { CloudResourceFilters, CloudResourceFilters as FilterType } from '../../superadmin/components/cloud/CloudResourceFilters';
import { GradientText } from '../../../components/ui/GradientText';

// Mock data - Replace with actual API calls
const mockMetrics = {
  totalResources: 1248,
  activeResources: 856,
  idleResources: 392,
  compute: {
    usage: 78,
    vcpus: 2456,
    ram: 8192
  },
  storage: {
    used: 524,
    total: 1000,
    available: 476
  },
  network: {
    bandwidth: 10,
    ingress: 256,
    egress: 128
  }
};

const mockProviders = [
  {
    name: 'AWS',
    resourceCount: 486,
    cost: 12500,
    utilizationPercentage: 75,
    metrics: { cpu: 82, memory: 76, storage: 68 }
  },
  {
    name: 'Azure',
    resourceCount: 324,
    cost: 8900,
    utilizationPercentage: 65,
    metrics: { cpu: 71, memory: 68, storage: 55 }
  },
  {
    name: 'GCP',
    resourceCount: 256,
    cost: 7200,
    utilizationPercentage: 58,
    metrics: { cpu: 64, memory: 59, storage: 48 }
  }
];

const mockAllocation = [
  { name: 'Compute', value: 45 },
  { name: 'Storage', value: 25 },
  { name: 'Network', value: 20 },
  { name: 'Other', value: 10 }
];

export const CloudResources: React.FC = () => {
  const [filteredMetrics, setFilteredMetrics] = useState(mockMetrics);
  const [filteredProviders, setFilteredProviders] = useState(mockProviders);
  const [filteredAllocation, setFilteredAllocation] = useState(mockAllocation);

  const handleFilterChange = (filters: FilterType) => { 
    // In a real application, you would:
    // 1. Make API calls with the filter parameters
    // 2. Update the state with the filtered data
    // 3. Handle loading states
    
    console.log('Applying filters:', filters);
    
    // For demo purposes, we'll just simulate filtering
    if (filters.provider) {
      const filtered = mockProviders.filter(p => 
        p.name.toLowerCase() === filters.provider?.toLowerCase()
      );
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(mockProviders);
    }
    if(filters.resourceType){
      const filtered = mockAllocation.filter(r=>
        r.name.toLowerCase() === filters.resourceType?.toLowerCase()
      );
      setFilteredAllocation(filtered)
    }
    else{
      setFilteredAllocation(mockAllocation)
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">
          <GradientText>Cloud Resources</GradientText>
        </h1>
        <button className="btn-primary">
          Add Cloud Provider
        </button>
      </div>

      <CloudResourceFilters onFilterChange={handleFilterChange} />

      <CloudResourceOverview metrics={filteredMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CloudProviderUsage providers={filteredProviders} />
        <ResourceAllocationChart data={filteredAllocation} />
      </div>
    </div>
  );
};