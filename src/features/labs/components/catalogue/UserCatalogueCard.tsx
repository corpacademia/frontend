import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Tag, 
  BookOpen, 
  Star, 
  Cpu, 
  Settings, 
  Play, 
  AlertCircle, 
  Check,
  Square,
  Loader,
  HardDrive,
  Server
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface UserCatalogueCardProps {
  lab: any;
}

export const UserCatalogueCard: React.FC<UserCatalogueCardProps> = ({ lab }) => {
  const [isLabPurchased, setIsLabPurchased] = useState(false);
  const [isVMLaunched, setIsVMLaunched] = useState(false); 
  const [isLabStarted, setIsLabStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [software, setSoftware] = useState<string[]>([]);

  const [user,setUser] = useState({});

  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setUser(response.data.user);
    };
    getUserDetails();
  }, []);

  // Fetch software details
  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/lab_ms/getSoftwareDetails');
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
  // Check initial lab status
  useEffect(() => {
    const checkLabStatus = async () => {
      try {
        const response = await axios.post('localhost:3000/api/v1/aws_ms/checkLabStatus', {
          lab_id: lab.lab_id,
          user_id: user.id
        });
        
        if (response.data.success) {
          setIsLabPurchased(true);
          setIsVMLaunched(true);
          setIsLabStarted(response.data.isRunning || false);
        }
      } catch (error) {
        console.error('Error checking lab status:', error);
      }
    };

    checkLabStatus();
  }, [lab.lab_id, user.id]);

  const handleBuyLab = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/v1/purchaseLab', {
        lab_id: lab.lab_id,
        user_id: user.id
      });

      if (response.data.success) {
        setIsLabPurchased(true);
        setNotification({ type: 'success', message: 'Lab purchased successfully' });
      }
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to purchase lab'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLaunchVM = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/v1/launchVM', {
        lab_id: lab.lab_id,
        user_id: user.id
      });

      if (response.data.success) {
        setIsVMLaunched(true);
        setNotification({ type: 'success', message: 'VM launched successfully' });
      }
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to launch VM'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleStartStopLab = async () => {
    setIsLoading(true);
    try {
      const endpoint = isLabStarted ? 'stopLab' : 'startLab';
      const response = await axios.post(`http://localhost:3000/api/v1/${endpoint}`, {
        lab_id: lab.lab_id,
        user_id: user.id
      });

      if (response.data.success) {
        setIsLabStarted(!isLabStarted);
        setNotification({ 
          type: 'success', 
          message: `Lab ${isLabStarted ? 'stopped' : 'started'} successfully` 
        });
      }
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || `Failed to ${isLabStarted ? 'stop' : 'start'} lab`
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-primary-500/10 
                    hover:border-primary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 
                    hover:translate-y-[-2px] group relative">
      {notification && (
        <div className={`absolute top-2 right-2 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
          notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}
      
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

        <div className="grid grid-cols-2 gap-4 mb-4">
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
            <span className="truncate">Instance: {lab.instance}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <HardDrive className="h-4 w-4 mr-2 text-primary-400 flex-shrink-0" />
            <span className="truncate">Storage: {lab.storage}GB</span>
          </div>
        </div>

        {/* Software Details Section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Software Installed:</h4>
          <div className="flex flex-wrap gap-2">
            {software.map((sw, index) => (
              <span key={index} className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                {sw}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-primary-500/10">
          {!isLabPurchased ? (
            <button
              onClick={handleBuyLab}
              disabled={isLoading}
              className="w-full h-9 px-4 rounded-lg text-sm font-medium
                       bg-gradient-to-r from-primary-500 to-secondary-500
                       hover:from-primary-400 hover:to-secondary-400
                       transform hover:scale-105 transition-all duration-300
                       text-white shadow-lg shadow-primary-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center"
            >
              {isLoading ? (
                <Loader className="animate-spin h-4 w-4" />
              ) : (
                'Buy Lab'
              )}
            </button>
          ) : !isVMLaunched ? (
            <button
              onClick={handleLaunchVM}
              disabled={isLoading}
              className="w-full h-9 px-4 rounded-lg text-sm font-medium
                       bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30
                       transition-colors flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="animate-spin h-4 w-4" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Launch VM
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStartStopLab}
              disabled={isLoading}
              className={`w-full h-9 px-4 rounded-lg text-sm font-medium
                       ${isLabStarted 
                         ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                         : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                       }
                       transition-colors flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <Loader className="animate-spin h-4 w-4" />
              ) : (
                <>
                  {isLabStarted ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Lab
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Lab
                    </>
                  )}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};