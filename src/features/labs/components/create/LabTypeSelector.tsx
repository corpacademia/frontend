import React from 'react';
import { Server, Cpu, Network, Cloud, Terminal, GitBranch } from 'lucide-react';
import { LabType } from '../../types';

interface LabTypeOption {
  type: LabType;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const labTypes: LabTypeOption[] = [
  {
    type: 'single-vm',
    title: 'Single VM',
    description: 'Deploy individual virtual machines for basic lab scenarios',
    icon: Server
  },
  {
    type: 'dedicated-vm',
    title: 'Dedicated VM',
    description: 'High-performance VMs with dedicated resources',
    icon: Cpu
  },
  {
    type: 'vm-cluster',
    title: 'VM Cluster',
    description: 'Multi-VM environments with networking',
    icon: Network
  },
  {
    type: 'cloud-slice',
    title: 'Cloud Slice',
    description: 'Managed cloud environments with quota limits',
    icon: Cloud
  },
  {
    type: 'emulated',
    title: 'Emulated Environment',
    description: 'Network and security lab emulation',
    icon: Terminal
  },
  {
    type: 'hybrid',
    title: 'Hybrid Lab',
    description: 'Combined physical and virtual resources',
    icon: GitBranch
  }
];

interface LabTypeSelectorProps {
  onSelect: (type: LabType) => void;
}

export const LabTypeSelector: React.FC<LabTypeSelectorProps> = ({ onSelect }) => {

  const handleData=(type)=>{
    localStorage.setItem('formData',JSON.stringify({type}))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {labTypes.map((option) => (
        <button
          key={option.type}
          onClick={() => {onSelect(option.type),
                 handleData(option.type)
           }}

          className="glass-panel hover:scale-[1.02] transition-transform text-left"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
              <option.icon className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">
                {option.title}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {option.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}