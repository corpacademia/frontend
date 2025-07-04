import React, { useEffect, useState } from 'react';
import { Brain, Check, DollarSign, Globe } from 'lucide-react';
import { GradientText } from '../../../../../components/ui/GradientText';
import axios from 'axios';

interface AIRecommendationsProps {
  config: any;
  onConfirm: (region: string, responseData: any) => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ config, onConfirm }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [user_cred, setUser] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false); // Loading state
  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(response.data.user);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    getUserDetails();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getInstances`, {
          cloud: config.cloudProvider,
          cpu: config.vmSize.cpu,
          ram: config.vmSize.ram,
          storage: config.vmSize.storage,
        });
        setRecommendations(response.data.result);
      } catch (err) {
        console.error('Error fetching instances:', err);
      }
    };
    fetchRecommendations();
  }, []);

  const deleteLabData = async (lab_id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deleteLab`, { data: { lab_id } });
    } catch (err) {
      console.error("Failed to delete lab data", err);
    }
  };

  const handleData = async (instanceName: string, region: string) => {
    setIsLoading(true); // Start loading
    const storedData = JSON.parse(localStorage.getItem("formData") || "{}");
    const updatedData = { ...storedData, instance: instanceName };
    localStorage.setItem("formData", JSON.stringify(updatedData));

    const data = JSON.parse(localStorage.getItem("formData") || "{}");

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/labconfig`, {
        data,
        user: user_cred,
      });

      if (!response.data.success) {
        throw new Error("labconfig API failed");
      }

      const lab_id = response.data.output.lab_id;
      const responseData = response.data.output;
      onConfirm(region, responseData); // Call onConfirm after successful response

      setIsLoading(false); // End loading after onConfirm is called

      const pythonRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/python`, {
        cloudPlatform: config.cloudProvider,
        lab_id,
      });

      const tfRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/pythontf`, { lab_id });

      if (!tfRes.data.success) {
        await deleteLabData(lab_id);
        throw new Error("Terraform apply failed");
      }

      const instancedetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/awsCreateInstanceDetails`, {
        lab_id,
      });

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/decryptPassword`, {
        lab_id,
        public_ip: instancedetails.data.result.public_ip,
        instance_id: instancedetails.data.result.instance_id,
      });

      localStorage.removeItem("formData");
    } catch (err) {
      console.error("Error in handleData:", err);
      setIsLoading(false); // Ensure loading state is reset on error
    }
  };

  const getPriceByOS = (instance: any) => {
    const os = config.vmSize.os?.toLowerCase();
    if (config.cloudProvider === 'aws') {
      switch (os) {
        case 'linux': return instance.ondemand_linux_base_pricing;
        case 'windows': return instance.ondemand_windows_base_pricing;
        case 'ubuntu': return instance.ondemand_ubuntu_pro_base_pricing;
        case 'suse': return instance.ondemand_suse_base_pricing;
        case 'rhel': return instance.ondemand_rhel_base_pricing;
        default: return 0;
      }
    } else if (config.cloudProvider === 'azure') {
      switch (os) {
        case 'linux': return instance.linux_vm_price;
        case 'windows': return instance.windows;
        default: return 0;
      }
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>AI Recommendations</GradientText>
      </h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader">Loading...</div> {/* Replace with your spinner component */}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-5 w-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-200">Recommended Instances</h3>
            </div>

            <div className="space-y-4">
              {recommendations.map((instance: any, index) => {
                const region = instance.region;
                const instanceName = config.cloudProvider === 'aws' ? instance.instancename : instance.instance;

                return (
                  <div key={index} className="p-4 bg-dark-300/50 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-200">{instanceName}</h4>
                        <p className="text-sm text-gray-400">{instance.provider} • {region}</p>
                      </div>
                      <div className="flex items-center text-emerald-400">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>{getPriceByOS(instance)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="block text-gray-400">CPU</span>
                        <span className="text-gray-200">{instance.vcpu}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400">Memory</span>
                        <span className="text-gray-200">{instance.memory}</span>
                      </div>
                      {config.cloudProvider === 'aws' && (
                        <div>
                          <span className="block text-gray-400">Network</span>
                          <span className="text-gray-200">{instance.networkperformance}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleData(instanceName, region)}
                      className="mt-4 w-full btn-primary"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select Instance
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="h-5 w-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-200">Recommended Regions</h3>
            </div>
            {/* Region info can go here */}
          </div>
        </div>
      )}
    </div>
  );
};
