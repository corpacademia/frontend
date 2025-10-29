
import React, { useState } from 'react';
import { X, Loader, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

interface DeleteBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  batchName: string;
}

export const DeleteBatchModal: React.FC<DeleteBatchModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  batchName
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await onConfirm();
      setSuccess('Batch deleted successfully!');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to delete batch. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Confirm Deletion</GradientText>
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-400 font-medium mb-1">
                  Warning: This action cannot be undone
                </p>
                <p className="text-sm text-gray-300">
                  Are you sure you want to delete <span className="font-semibold">{batchName}</span>? 
                  All associated data including user assignments and lab assignments will be removed.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-200 text-sm">{success}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleClose}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="btn-primary bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                'Delete Batch'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
