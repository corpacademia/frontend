
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { useAuthStore } from '../../../store/authStore';
import { useBatchStore } from '../../../store/batchStore';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const { createBatch } = useBatchStore();
  const [formData, setFormData] = useState({
    batchName: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !user?.org_id) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await createBatch({
        batchName: formData.batchName,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        org_id: user.org_id,
        createdBy: user.id
      });

      if (result.success) {
        setSuccess('Batch created successfully!');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to create batch');
      }
    } catch (err: any) {
      setError('Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ batchName: '', description: '', startDate: '', endDate: '' });
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
              <GradientText>Create New Batch</GradientText>
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
          {/* Batch Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Batch Name *
            </label>
            <input
              type="text"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
              placeholder="e.g., DevOps Batch 2024"
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the batch..."
              rows={3}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none resize-none"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none"
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
              {isSubmitting ? 'Creating...' : 'Create Batch'}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};
