import React from 'react';
import { LabType } from '../../types';
import { 
  Settings, 
  Users, 
  AlertCircle,
  BarChart
} from 'lucide-react';

interface LabManagementTabsProps {
  type: LabType;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const LabManagementTabs: React.FC<LabManagementTabsProps> = ({
  type,
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'monitoring', label: 'Monitoring', icon: BarChart },
    { id: 'incidents', label: 'Incidents', icon: AlertCircle }
  ];

  return (
    <div className="flex space-x-4 border-b border-primary-500/10">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeTab === tab.id
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
        >
          <tab.icon className="h-4 w-4 mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};