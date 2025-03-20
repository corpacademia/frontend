import React from 'react';
import { LabType } from '../types';
import { 
  BookOpen, 
  Cloud, 
  Server, 
  Network, 
  Database,
  Terminal,
  FolderOpen
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

interface LabTypeCardProps {
  type: LabType;
  count: number;
  onSelect: (type: LabType) => void;
}

const labTypeInfo: Record<LabType, { 
  title: string; 
  description: string; 
  icon: React.FC; 
  gradient: string;
}> = {
  workspace: {
    title: 'Workspaces',
    description: 'Manage and organize your lab environments',
    icon: FolderOpen,
    gradient: 'from-primary-500 to-accent-500'
  },
  catalogue: {
    title: 'Lab Catalogues',
    description: 'Pre-built labs with AI-recommended learning paths',
    icon: BookOpen,
    gradient: 'from-primary-500 to-primary-600'
  },
  'cloud-vm': {
    title: 'Cloud VMs',
    description: 'Web/RDP access to cloud-hosted virtual machines',
    icon: Cloud,
    gradient: 'from-secondary-500 to-secondary-600'
  },
  'dedicated-vm': {
    title: 'Dedicated VMs',
    description: '24/7 access to VMs with nested virtualization',
    icon: Server,
    gradient: 'from-accent-500 to-accent-600'
  },
  cluster: {
    title: 'Clustered VM Labs',
    description: 'Multi-VM lab environments with consistent networking',
    icon: Network,
    gradient: 'from-primary-500 to-accent-500'
  },
  'cloud-slice': {
    title: 'Cloud Slices',
    description: 'Managed cloud accounts with AI-optimized resources',
    icon: Database,
    gradient: 'from-secondary-500 to-accent-500'
  },
  emulator: {
    title: 'Environment Emulators',
    description: 'Network and security lab environments',
    icon: Terminal,
    gradient: 'from-primary-500 to-secondary-500'
  }
};

export const LabTypeCard: React.FC<LabTypeCardProps> = ({
  type,
  count,
  onSelect
}) => {
  const info = labTypeInfo[type];
  const Icon = info.icon;

  return (
    <div 
      onClick={() => onSelect(type)}
      className="glass-panel hover:scale-[1.02] cursor-pointer transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            <GradientText>{info.title}</GradientText>
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {info.description}
          </p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${info.gradient} bg-opacity-10`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      <div className="mt-4">
        <span className="text-2xl font-semibold text-gray-200">
          {count}
        </span>
        <span className="ml-2 text-sm text-gray-400">available labs</span>
      </div>
    </div>
  );
};