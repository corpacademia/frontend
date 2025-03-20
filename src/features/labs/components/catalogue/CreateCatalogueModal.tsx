import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader, Cpu, MemoryStick as Memory, HardDrive, Server, Camera } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import { platform } from 'os';

interface CreateCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCatalogue: {
    cpu: number;
    ram: number;
    storage: number;
    instance: string;
  };
  onSuccess?: () => void;
}

export const CreateCatalogueModal: React.FC<CreateCatalogueModalProps> = ({
  isOpen,
  onClose,
  existingCatalogue,
  onSuccess
}) => {
  const initialFormData = {
    name: '',
    cpu: existingCatalogue.cpu,
    ram: existingCatalogue.ram,
    storage: existingCatalogue.storage,
    instance: existingCatalogue.instance,
    snapshotType: 'snapshot' as 'snapshot' | 'hibernate'
  };
  const [formData, setFormData] = useState(initialFormData);
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInstances, setIsFetchingInstances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [admin, setAdmin] = useState({});

  // Custom RAM values array for snapping
  const ramValues = [2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64];

  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchInstances();
  }, [formData.cpu, formData.ram]);

  const fetchInstances = async () => {
    if (!formData.cpu || !formData.ram) return;

    setIsFetchingInstances(true);
    try {
      const response = await axios.post('http://localhost:3000/api/v1/lab_ms/getInstances', {
        cloud: 'aws',
        cpu: formData.cpu,
        ram: formData.ram,
        storage: formData.storage
      });

      if (response.data.success) {
        setAvailableInstances(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
      setError('Failed to fetch available instances');
    } finally {
      setIsFetchingInstances(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleRamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Find the closest RAM value from our predefined array
    const closestRam = ramValues.reduce((prev, curr) => {
      return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });
    setFormData(prev => ({ ...prev, ram: closestRam }));
  };
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Catalogue name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:3000/api/v1/lab_ms/createCatalogue', {
        name: formData.name,
        cpu: formData.cpu,
        ram: formData.ram,
        storage: formData.storage,
        instance: formData.instance,
        snapshotType: formData.snapshotType,
        os:existingCatalogue.os,
        os_version:existingCatalogue.os_version,
        platform:existingCatalogue.platform,
        provider:existingCatalogue.provider,
        description:existingCatalogue.description,
        duration:existingCatalogue.duration,
        user: admin.id
      });
      
      if (response.data.success) {

        const createNewInstance = await axios.post('http://localhost:3000/api/v1/aws_ms/createNewInstance',{
          instance_type:formData.instance,
          ami_id:existingCatalogue.ami,
          storage_size:formData.storage,
          lab_id:response.data.output.lab_id,
          prev_labId:existingCatalogue.lab_id
        })

        if(createNewInstance.data.success){

          setSuccess('Catalogue created successfully');
          setTimeout(() => {
            onSuccess?.();
            handleClose();
          }, 1500);

        //   const instancedetails = await axios.post('http://localhost:3000/api/v1/awsCreateInstanceDetails',{
        //   lab_id:response.data.output.lab_id
        // })
        // const decrypt_password = await axios.post("http://localhost:3000/api/v1/decryptPassword",{
        //   lab_id:response.data.output.lab_id,
        //   public_ip:instancedetails.data.result.public_ip,
        //   instance_id:instancedetails.data.result.instance_id,
        // });
        }

        

      
      } else {
        throw new Error(response.data.message || 'Failed to create catalogue');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Create New Catalogue</GradientText>
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Catalogue Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              placeholder="Enter catalogue name"
            />
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <Cpu className="h-4 w-4 mr-2" />
                CPU Cores: {formData.cpu}
              </label>
              <input
                type="range"
// <<<<<<< HEAD
                min="2"
                max="16"
                step="2"
// =======
                min="1"
                max="16"
/* >>>>>>> 26034a342b5ef48680663fe86b7ed3597cc0866b */
                value={formData.cpu}
                onChange={(e) => setFormData(prev => ({ ...prev, cpu: parseInt(e.target.value) }))}
                className="w-full h-2 bg-dark-400 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-primary-500
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-all
                         [&::-webkit-slider-thumb]:duration-150
                         [&::-webkit-slider-thumb]:ease-in-out
                         [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
{/* <<<<<<< HEAD */}
                <span>2 Cores</span>
{/* // =======
//                 <span>1 Core</span>
// >>>>>>> 26034a342b5ef48680663fe86b7ed3597cc0866b */}
                <span>16 Cores</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <Memory className="h-4 w-4 mr-2" />
                Memory (RAM): {formData.ram} GB
              </label>
              <input
                type="range"
                min="2"
                max="64"
                value={formData.ram}
                onChange={handleRamChange}

//                 step="2"
//                 value={formData.ram}
//                 onChange={(e) => setFormData(prev => ({ ...prev, ram: parseInt(e.target.value) }))}
// >>>>>>> 26034a342b5ef48680663fe86b7ed3597cc0866b
                className="w-full h-2 bg-dark-400 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-primary-500
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-all
                         [&::-webkit-slider-thumb]:duration-150
                         [&::-webkit-slider-thumb]:ease-in-out
                         [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2 GB</span>
                <span>64 GB</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <HardDrive className="h-4 w-4 mr-2" />
                Storage: {formData.storage} GB
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={formData.storage}
                onChange={(e) => setFormData(prev => ({ ...prev, storage: parseInt(e.target.value) }))}
                className="w-full h-2 bg-dark-400 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-primary-500
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-all
                         [&::-webkit-slider-thumb]:duration-150
                         [&::-webkit-slider-thumb]:ease-in-out
                         [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50 GB</span>
                <span>1000 GB</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <Server className="h-4 w-4 mr-2" />
                Instance Type
              </label>
              <select
                value={formData.instance}
                onChange={(e) => setFormData(prev => ({ ...prev, instance: e.target.value }))}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                disabled={isFetchingInstances}
              >
                <option value="">Select Instance</option>
                {availableInstances.map((instance, index) => (
                  <option key={index} value={instance.instancename}>
                    {instance.instancename} ({instance.vcpu} vCPU, {instance.memory} RAM)
                  </option>
                ))}
              </select>
              {isFetchingInstances && (
                <p className="mt-1 text-xs text-gray-500 flex items-center">
                  <Loader className="animate-spin h-3 w-3 mr-1" />
                  Fetching available instances...
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <Camera className="h-4 w-4 mr-2" />
                Snapshot Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="snapshotType"
                    value="snapshot"
                    checked={formData.snapshotType === 'snapshot'}
                    onChange={(e) => setFormData(prev => ({ ...prev, snapshotType: e.target.value as 'snapshot' | 'hibernate' }))}
                    className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Snapshot</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="snapshotType"
                    value="hibernate"
                    checked={formData.snapshotType === 'hibernate'}
                    onChange={(e) => setFormData(prev => ({ ...prev, snapshotType: e.target.value as 'snapshot' | 'hibernate' }))}
                    className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Hibernate</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-200">{success}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.name || !formData.instance}
              className="btn-primary"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Creating...
                </span>
              ) : (
                'Create Catalogue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};