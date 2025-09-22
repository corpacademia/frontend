import React from 'react';
import { Cloud, Building, Network, Server } from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';

interface PlatformSelectorProps {
  onSelect: (platform: string) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ onSelect }) => {
  const platforms = [
    {
      id: 'cloud',
      name: 'Cloud',
      description: 'Deploy on public cloud providers (AWS, Azure, GCP)',
      icon: Cloud,
      features: ['Auto-scaling', 'Global availability', 'Managed services']
    },
    {
      id: 'datacenter',
      name: 'Datacenter',
      description: 'Deploy on enterprise datacenter infrastructure',
      icon: Building,
      features: ['High security', 'Dedicated resources', 'Compliance ready']
    },
    {
      id: 'proxmox',
      name: 'Proxmox',
      description: 'Deploy on Proxmox Virtual Environment',
      icon: Server,
      features: ['Virtualization platform', 'Container support', 'Web-based management']
    },
    {
      id: 'hybrid',
      name: 'Hybrid',
      description: 'Combine cloud and on-premises resources',
      icon: Network,
      features: ['Flexible deployment', 'Cost optimization', 'Risk distribution']
    }
  ];

  const handleData=(platform)=>{
     const storedData = JSON.parse(localStorage.getItem('formData'))|| {}
     const updatedData = {...storedData,platform}
     localStorage.setItem('formData',JSON.stringify(updatedData))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>Choose Platform</GradientText>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => {onSelect(platform.id)
              handleData(platform.id)
            }}
            className="glass-panel hover:scale-[1.02] transition-transform text-left"
          >
            <div className="flex flex-col items-center text-center p-6">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary-500/10 to-secondary-500/10 mb-4">
                <platform.icon className="h-8 w-8 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">
                {platform.title}
              </h3>
              <p className="text-sm text-gray-400">
                {platform.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};