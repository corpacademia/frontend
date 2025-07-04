
import React, { useEffect, useState } from 'react';
import { X, Settings, AlertCircle, Check } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Lab } from '../../types';
import axios from 'axios';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: Lab;
  instanceCost: string;
  storageCost: number;
}

interface ServiceRow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  monthlyCost: number;
  configSummary: string;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  isOpen,
  onClose,
  lab,
  instanceCost,
  storageCost,
}) => {
  const [showConfigColumn, setShowConfigColumn] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [cost,setCost] = useState();
  const [user,setUser] = useState({});
  const [configDetails, setConfigDetails] = useState({
    numberOfUsers: 1,
    numberOfDays: 1
  });

  const mockServices: ServiceRow[] = [
    {
      id: '1',
      name: 'EC2 Instance',
      status: 'active',
      monthlyCost: instanceCost,
      configSummary: `${lab.instance}, ${lab.ram} RAM, ${lab.cpu} VCPU`
    },
    {
      id: '2',
      name: 'EBS Volume',
      status: 'active',
      monthlyCost: storageCost,
      configSummary: `${lab.storage}GB`
    },
  ];

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfigDetails(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const costOfInstance = mockServices.reduce((total, service) => total + service.monthlyCost, 0);

  useEffect(()=>{
    const totalCost = costOfInstance * configDetails.numberOfUsers * configDetails.numberOfDays;
    setCost(totalCost)
  },[configDetails])
  

  const handleConfigurations = async () => {
    

    // const admin = JSON.parse(localStorage.getItem('auth') ?? '{}').result || {};
    useEffect(() => {
      const getUserDetails = async () => {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(response.data.user);
      };
      getUserDetails();
    }, []);
    try {
      const configs = {
        'instance': lab.instance,
        'cpu': lab.cpu,
        'ram': lab.ram,
        'users': configDetails.numberOfUsers,
        'days': configDetails.numberOfDays
      };
      
      const updateConfig = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateConfigOfLabs`, {
        lab_id: lab.lab_id,
        admin_id: user.id,
        config_details: configs,
      });
      
      if (updateConfig.data.success) {
        onClose();
      }
      try {
        const ami = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiInformation`,{lab_id:lab.lab_id})
        
        if(ami.data.success){
          try {
            const golden_instance = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/goldenToInstance`,{
              instance_type : lab.instance,
              ami_id:ami.data.result.ami_id,
              no_instance:configDetails.numberOfUsers,
              termination_period:configDetails.numberOfDays
  
            })
          } catch (error) {
            console.log("Error in converting golden image to instance")
          }
          

        }
      } catch (error) {
        console.log("error in getting ami information")
      }

    } catch (error) {
      console.error("Error updating configuration:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl w-full max-w-4xl">
        {/* Header */}
        <div className="p-6 border-b border-primary-500/10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                <GradientText>Configure Lab Environment</GradientText>
              </h2>
              <p className="mt-1 text-sm text-gray-400">{lab.title}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Users
              </label>
              <input
                type="number"
                name="numberOfUsers"
                min="1"
                value={configDetails.numberOfUsers}
                onChange={handleConfigChange}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Days
              </label>
              <input
                type="number"
                name="numberOfDays"
                min="1"
                value={configDetails.numberOfDays}
                onChange={handleConfigChange}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Services Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-primary-500/10">
                  <th className="pb-3 text-sm font-medium text-gray-400">Service</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Per Hour Cost</th>
                  {showConfigColumn && (
                    <th className="pb-3 text-sm font-medium text-gray-400">Configuration</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {mockServices.map((service) => (
                  <tr 
                    key={service.id}
                    className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center">
                        <span className="text-gray-300">{service.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        service.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-primary-400">${service.monthlyCost}</span>
                    </td>
                    {showConfigColumn && (
                      <td className="py-4 text-sm text-gray-400">
                        {service.configSummary}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-primary-500/10 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            <AlertCircle className="h-4 w-4 inline-block mr-2" />
            Total Cost: ${cost.toFixed(2)}
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 
                       hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              className="px-6 py-2 rounded-lg text-sm font-medium
                       bg-gradient-to-r from-primary-500 to-secondary-500
                       hover:from-primary-400 hover:to-secondary-400
                       text-white shadow-lg shadow-primary-500/20
                       transition-all duration-300"
              onClick={handleConfigurations}
            >
              Configure AMI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};