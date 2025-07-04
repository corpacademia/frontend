import React, { useEffect, useState } from 'react';
import { 
  Star, 
  Cpu, 
  Users,
  Tag,
  HardDrive,
  Server
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Lab } from '../../types';

interface OrgAdminCatalogueCardProps {
  lab: Lab;
  onAssignUsers: (lab: Lab) => void;
}

export const OrgAdminCatalogueCard: React.FC<OrgAdminCatalogueCardProps> = ({ 
  lab,
  onAssignUsers
}) => {
  const [software, setSoftware] = useState<string[]>([]);

  // Fetch software details
  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSoftwareDetails`);
        if (response.data.success) {
          const labSoftware = response.data.data.find((s: any) => s.lab_id === lab.lab_id);
          if (labSoftware) {
            const softwareList = labSoftware.software; 
            setSoftware(softwareList)
          }
        }
      } catch (error) {
        console.error('Error fetching software details:', error);
      }
    };

    fetchSoftware();
  }, [lab.lab_id]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-primary-500/10 
                    hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
                    hover:translate-y-[-2px] group relative">
      <div className="flex flex-col h-full p-4">
        {/* Header Section - Fixed Height */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1 truncate">
              <GradientText>{lab.title}</GradientText>
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">{lab.description}</p>
          </div>
          <div className="flex items-center text-amber-400 flex-shrink-0">
            <Star className="h-4 w-4 mr-1 fill-current" />
            <span className="text-sm">{lab.rating || 4.5}</span>
          </div>
        </div>

        {/* Specs Grid - Fixed Height */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center text-sm text-gray-400">
            <Cpu className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
            <span className="truncate">{lab.cpu} vCPU</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Tag className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
            <span className="truncate">{lab.ram}GB RAM</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Server className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
            <span className="truncate">{lab.instance}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <HardDrive className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
            <span className="truncate">{lab.storage}GB Storage</span>
          </div>
        </div>

        {/* Technologies Section - Scrollable if needed */}
        <div className="flex-1 min-h-0 mb-3">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Technologies:</h4>
          <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto scrollbar-thin">
            {software.map((tech, index) => (
              <span 
                key={index} 
                className="px-2 py-1 text-xs font-medium rounded-full 
                         bg-primary-500/20 text-primary-300 whitespace-nowrap"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Button Section - Fixed at Bottom */}
        <div className="pt-3 mt-auto border-t border-primary-500/10">
          <button 
            onClick={() => onAssignUsers(lab)}
            className="w-full h-9 px-4 rounded-lg text-sm font-medium
                     bg-gradient-to-r from-primary-500 to-secondary-500
                     hover:from-primary-400 hover:to-secondary-400
                     transform hover:scale-105 transition-all duration-300
                     text-white shadow-lg shadow-primary-500/20
                     flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Assign Users</span>
          </button>
        </div>
      </div>
    </div>
  );
};