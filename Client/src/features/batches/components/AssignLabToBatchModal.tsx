
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

interface AssignLabToBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchId: string;
  editLab?: any;
}

interface Lab {
  lab_id: string;
  title: string;
  is_purchased: boolean;
  quantity?: number;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
}

// Mock data
const mockLabs: Lab[] = [
  { lab_id: 'l1', title: 'Docker Fundamentals', is_purchased: true, quantity: 30 },
  { lab_id: 'l2', title: 'Kubernetes Deployment', is_purchased: true, quantity: 30 },
  { lab_id: 'l3', title: 'AWS EC2 & S3', is_purchased: true, quantity: 25 },
  { lab_id: 'l4', title: 'Azure Basics', is_purchased: true, quantity: 35 },
  { lab_id: 'l5', title: 'GCP Introduction', is_purchased: false },
  { lab_id: 'l6', title: 'Network Security', is_purchased: true, quantity: 25 },
  { lab_id: 'l7', title: 'Penetration Testing', is_purchased: false },
  { lab_id: 'l8', title: 'CI/CD with Jenkins', is_purchased: true, quantity: 20 }
];

const mockTrainers: Trainer[] = [
  { id: 't1', name: 'John Smith', email: 'john@example.com' },
  { id: 't2', name: 'Sarah Johnson', email: 'sarah@example.com' },
  { id: 't3', name: 'Mike Davis', email: 'mike@example.com' },
  { id: 't4', name: 'Emma Wilson', email: 'emma@example.com' },
  { id: 't5', name: 'Alex Brown', email: 'alex@example.com' }
];

export const AssignLabToBatchModal: React.FC<AssignLabToBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batchId,
  editLab
}) => {
  const { user } = useAuthStore();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formData, setFormData] = useState({
    lab_id: '',
    trainer_id: '',
    start_date: '',
    end_date: ''
  });
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLabs();
      fetchTrainers();
      
      if (editLab) {
        setFormData({
          lab_id: editLab.lab_id,
          trainer_id: editLab.trainer_id || '',
          start_date: editLab.start_date?.split('T')[0] || '',
          end_date: editLab.end_date?.split('T')[0] || ''
        });
      }
    }
  }, [isOpen, editLab]);

  useEffect(() => {
    if (formData.lab_id) {
      const lab = labs.find(l => l.lab_id === formData.lab_id);
      setSelectedLab(lab || null);
    }
  }, [formData.lab_id, labs]);

  const fetchLabs = async () => {
    try {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      setLabs(mockLabs);
      
      /* Real API call - uncomment when backend is ready
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCatalogues`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setLabs(response.data.data);
      }
      */
    } catch (error) {
      console.error('Error fetching labs:', error);
      setLabs(mockLabs);
    }
  };

  const fetchTrainers = async () => {
    try {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      setTrainers(mockTrainers);
      
      /* Real API call - uncomment when backend is ready
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getTrainers/${user?.org_id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setTrainers(response.data.data);
      }
      */
    } catch (error) {
      console.error('Error fetching trainers:', error);
      setTrainers(mockTrainers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const endpoint = editLab
        ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/updateBatchLab`
        : `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/assignLabToBatch`;

      const response = await axios.post(
        endpoint,
        {
          batch_id: batchId,
          ...formData,
          assigned_by: user?.id
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(editLab ? 'Lab updated successfully!' : 'Lab assigned successfully!');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign lab');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ lab_id: '', trainer_id: '', start_date: '', end_date: '' });
    setSelectedLab(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-200 border-b border-primary-500/10 p-6 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              <GradientText>{editLab ? 'Edit Lab Assignment' : 'Assign Lab to Batch'}</GradientText>
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lab Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Lab *
            </label>
            <select
              value={formData.lab_id}
              onChange={(e) => setFormData({ ...formData, lab_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white focus:border-primary-500/40 focus:outline-none"
              required
              disabled={!!editLab}
            >
              <option value="">Choose a lab...</option>
              {labs.map((lab) => (
                <option key={lab.lab_id} value={lab.lab_id}>
                  {lab.title}
                  {lab.is_purchased ? ` (Purchased - ${lab.quantity} licenses)` : ' (Not Purchased)'}
                </option>
              ))}
            </select>
            
            {selectedLab && (
              <div className="mt-2 p-3 bg-dark-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Purchase Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      selectedLab.is_purchased
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {selectedLab.is_purchased ? 'Purchased' : 'Not Purchased'}
                  </span>
                </div>
                {selectedLab.is_purchased && (
                  <div className="mt-2 text-sm text-gray-400">
                    Available Licenses: <span className="text-white font-semibold">{selectedLab.quantity}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trainer Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign Trainer (Optional)
            </label>
            <select
              value={formData.trainer_id}
              onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white focus:border-primary-500/40 focus:outline-none"
            >
              <option value="">No trainer assigned</option>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} ({trainer.email})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-200">{success}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : editLab ? 'Update Lab' : 'Assign Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
