import React, { useState, useEffect } from 'react';
import { Clock, Tag, BookOpen, Star, Cpu, Settings, Play, Image } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Lab } from '../../types';
import { ConfigurationModal } from './ConfigurationModal';
import axios from 'axios';

interface CatalogueCardProps {
  lab: Lab;
}

export const CatalogueCard: React.FC<CatalogueCardProps> = ({ lab }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showPreviewDetails, setShowPreviewDetails] = useState(false);
  const [instanceDetails, setInstanceDetails] = useState();
  const [instanceCost, setInstanceCost] = useState();
  const [isGoldenImageReady, setIsGoldenImageReady] = useState(false);
  const user = JSON.parse(localStorage.getItem('auth') || '{}');

  // Calculate storage cost
  const storageCost = 0.08 * (lab.storage);

  // Fetch instance details when component mounts
  useEffect(() => {
    const fetchInstanceDetails = async () => {
      try {
        const data = await axios.post('http://localhost:3000/api/v1/getInstanceDetails', {
          provider: lab.provider,
          instance: lab.instance,
          cpu: lab.cpu,
          ram: lab.ram,
        });
        
        if (data.data.success) {
          setInstanceDetails(data.data.data);
          const price = getPriceByOS(data.data.data, lab.os);
          setInstanceCost(price);
        }
      } catch (error) {
        console.error("Error fetching instance details:", error);
      }
    };

    fetchInstanceDetails();
  }, [lab]);

  // Function to get price based on OS
  const getPriceByOS = (instance, os) => {
    if(lab.provider === 'aws'){
      switch (os.toLowerCase()) {
        case 'linux':
          return instance.ondemand_linux_base_pricing;
        case 'windows':
          return instance.ondemand_windows_base_pricing;
        case 'ubuntu':
          return instance.ondemand_ubuntu_pro_base_pricing;
        case 'suse':
          return instance.ondemand_suse_base_pricing;
        case 'rhel':
          return instance.ondemand_rhel_base_pricing;
        default:
          return 0;
      }
    }
    else if(lab.provider === 'azure'){
      switch(os.toLowerCase()){
        case 'windows':
          return instance.windows;
        case 'linux':
          return instance.linux_vm_price;
        default:
          return 0;
      }
    }
  };

  const handleRun = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/runLab', {
        labId: lab.lab_id,
        userId: user?.result?.id,
        provider: lab.provider,
        instance: lab.instance
      });

      if (response.data.success) {
        setIsGoldenImageReady(true);
      }
    } catch (error) {
      console.error("Error running lab:", error);
    }
  };

  const handleGoldenImage = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/createGoldenImage', {
        labId: lab.lab_id,
        userId: user?.result?.id
      });
      
      if (response.data.success) {
        // Handle success
      }
    } catch (error) {
      console.error("Error creating golden image:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-primary-500/10 
                    hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
                    hover:translate-y-[-2px] group">
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">
                <GradientText>{lab.title}</GradientText>
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">{lab.description}</p>
            </div>
            <div className="flex items-center text-amber-400">
              <Star className="h-4 w-4 mr-1 fill-current" />
              <span className="text-sm">{lab.rating || 4.5}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-medium text-gray-300">Cloud</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                {lab.provider}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
              <span className="truncate">{lab.duration} mins</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Tag className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
              <span className="truncate">{lab.type}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <BookOpen className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
              <span className="truncate">Lab #{lab.lab_id}</span>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setIsConfigOpen(true)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                         bg-dark-300/50 hover:bg-dark-300
                         border border-primary-500/20 hover:border-primary-500/40
                         text-primary-400 hover:text-primary-300
                         transition-all duration-300"
              >
                <Settings className="h-4 w-4 inline-block mr-2" />
                Convert Catalogue
              </button>

              <div className="relative">
                <button 
                  onMouseEnter={() => setShowPreviewDetails(true)}
                  onMouseLeave={() => setShowPreviewDetails(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                           bg-gradient-to-r from-primary-500 to-secondary-500
                           hover:from-primary-400 hover:to-secondary-400
                           transform hover:scale-105 transition-all duration-300
                           text-white shadow-lg shadow-primary-500/20"
                >
                  {user?.result?.role === 'user' ? 'Buy Lab' : 'Preview'}
                </button>
                
                {showPreviewDetails && instanceDetails && user?.result?.role !== 'user' && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64
                                bg-dark-200/95 backdrop-blur-sm border border-primary-500/20 
                                rounded-lg p-3 shadow-lg text-sm z-50">
                    <div className="text-gray-300 font-medium mb-2">Instance Details</div>
                    <div className="space-y-1.5 text-gray-400">
                      <div className="flex justify-between">
                        <span>Instance:</span>
                        <span className="text-primary-400">{lab.provider === 'aws' ? instanceDetails.instancename : instanceDetails.instance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Provider:</span>
                        <span className="text-primary-400">{lab.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CPU:</span>
                        <span className="text-primary-400">{instanceDetails.vcpu} Cores</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RAM:</span>
                        <span className="text-primary-400">{instanceDetails.memory} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span className="text-primary-400">{instanceDetails.storage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OS:</span>
                        <span className="text-primary-400">{lab.os}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2
                                  w-3 h-3 bg-dark-200/95 border-r border-b border-primary-500/20
                                  rotate-45"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                         bg-accent-500/20 hover:bg-accent-500/30
                         border border-accent-500/20 hover:border-accent-500/40
                         text-accent-300 hover:text-accent-200
                         transition-all duration-300"
              >
                <Play className="h-4 w-4 inline-block mr-2" />
                Run
              </button>

              {isGoldenImageReady && (
                <button
                  onClick={handleGoldenImage}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                           bg-secondary-500/20 hover:bg-secondary-500/30
                           border border-secondary-500/20 hover:border-secondary-500/40
                           text-secondary-300 hover:text-secondary-200
                           transition-all duration-300"
                >
                  <Image className="h-4 w-4 inline-block mr-2" />
                  VM-GoldenImage
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfigurationModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        lab={lab}
        instanceCost={instanceCost}
        storageCost={storageCost}
      />
    </>
  );
};