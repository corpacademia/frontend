import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader, Calendar, MapPin } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface CloudSlice {
  labid: string;
  title: string;
  description: string;
  provider: 'aws' | 'azure' | 'gcp' | 'oracle' | 'ibm' | 'alibaba';
  region: string;
  services: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  cleanupPolicy: string;
  credits: number;
  modules: 'without-modules' | 'with-modules';
}

interface EditCloudSliceModalProps {
  isOpen: boolean;
  onClose: () => void;
  slice: CloudSlice | null;
  onSuccess: () => void;
}

// Simplified regions list
const awsRegions = [
  { code: 'us-east-1', name: 'US East (N. Virginia)' },
  { code: 'us-west-2', name: 'US West (Oregon)' },
  { code: 'eu-west-1', name: 'Europe (Ireland)' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
  { code: 'sa-east-1', name: 'South America (São Paulo)' }
];

export const EditCloudSliceModal: React.FC<EditCloudSliceModalProps> = ({
  isOpen,
  onClose,
  slice,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    region: '',
    startDate: '',
    endDate: '',
    cleanupPolicy: '',
    credits: 0,
    modules:''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSliceDetails = async () => {
      if (!isOpen || !slice?.labid) return;
      
      setIsLoading(true);
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${slice.labid}`);
        if (response.data.success) {
          const sliceData = response.data.data;
          setFormData({
            title: sliceData.title || '',
            description: sliceData.description || '',
            status: sliceData.status || '',
            region: sliceData.region || '',
            startDate: formatDateForInput(sliceData.startdate) || '',
            endDate: formatDateForInput(sliceData.enddate) || '',
            cleanupPolicy: sliceData.cleanuppolicy || '',
            credits: sliceData.credits || 0,
            modules: sliceData.modules || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch slice details:', err);
        setError('Failed to load cloud slice details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSliceDetails();
  }, [isOpen, slice?.id]);

  const formatDateForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 16);
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.startDate || !formData.endDate || !formData.region) {
      setError('Start date, end date and region are required');
      return;
    }

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Invalid date format');
        return;
      }
      
      if (startDate >= endDate) {
        setError('End date must be after start date');
        return;
      }
    } catch (e) {
      setError('Invalid date format');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudSlice/${slice?.labid}`, {
        ...formData
      });
      
      if (response.data.success) {
        setSuccess('Cloud slice updated successfully');
        setTimeout(() => {
          setSuccess(null);
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to update cloud slice');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update cloud slice');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !slice) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-dark-200 rounded-lg p-6 flex items-center space-x-3">
          <Loader className="animate-spin h-6 w-6 text-primary-400" />
          <span className="text-gray-200">Loading cloud slice details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            <GradientText>Edit Cloud Slice</GradientText>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Region</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              >
                <option value="">Select Region</option>
                {awsRegions.map(region => (
                  <option key={region.code} value={region.code}>
                    {region.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Only show cleanup policy for labs without modules (standard labs) */}
          {slice.modules === 'without-modules' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cleanup Policy</label>
                <select
                  name="cleanupPolicy"
                  value={formData.cleanupPolicy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                >
                  <option value="1">1-day cleanup</option>
                  <option value="2">2-day cleanup</option>
                  <option value="3">3-day cleanup</option>
                  <option value="7">7-day cleanup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-200 text-sm">{success}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <GradientText>
              <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 px-4 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            </GradientText>
            <GradientText>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </span>
              ) : (
                'Update'
              )}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};