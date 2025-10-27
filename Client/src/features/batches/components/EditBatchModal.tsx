
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchDetails: any;
}

export const EditBatchModal: React.FC<EditBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batchDetails
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && batchDetails) {
      setFormData({
        name: batchDetails.name || '',
        description: batchDetails.description || '',
        start_date: batchDetails.start_date?.split('T')[0] || '',
        end_date: batchDetails.end_date?.split('T')[0] || ''
      });
    }
  }, [isOpen, batchDetails]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/updateBatch`,
        {
          batch_id: batchDetails.id,
          ...formData
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess('Batch updated successfully!');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-200 border-b border-primary-500/10 p-6 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              <GradientText>Edit Batch</GradientText>
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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Batch Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none"
              />
            </div>
          </div>

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

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <GradientText>
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            </GradientText>
            <GradientText>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Batch'}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};
