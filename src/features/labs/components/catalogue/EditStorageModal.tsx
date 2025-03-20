import React, { useState } from 'react';
import { X, AlertCircle, Check, Loader, HardDrive, Plus } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface EditStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStorage: number;
  assessmentId: string;
  lab_id: string;
  onSuccess: () => void;
}

export const EditStorageModal: React.FC<EditStorageModalProps> = ({
  isOpen,
  onClose,
  currentStorage,
  assessmentId,
  lab_id,
  onSuccess
}) => {
  const [storageChange, setStorageChange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async () => {
    if (storageChange === 0) {
      setNotification({ type: 'error', message: 'Please specify a storage change amount' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await axios.post(`http://localhost:3000/api/v1/updateLabStorage`, {
        new_volume_size: currentStorage + storageChange,
        lab_id: lab_id,
      });

      if (response.data.success) {
        setNotification({ type: 'success', message: 'Storage updated successfully' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to update storage');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update storage'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Modify Storage</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Current Storage</span>
              <HardDrive className="h-5 w-5 text-primary-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-200">{currentStorage} GB</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Additional Storage (GB)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="0"
                value={storageChange}
                onChange={(e) => setStorageChange(Number(e.target.value))}
                className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none text-center"
              />
              <button
                onClick={() => setStorageChange(prev => prev + 1)}
                className="p-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 text-emerald-400 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 text-center">
              New Total: {currentStorage + storageChange} GB
            </p>
          </div>

          {notification && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              notification.type === 'success' 
                ? 'bg-emerald-500/20 border border-emerald-500/20' 
                : 'bg-red-500/20 border border-red-500/20'
            }`}>
              {notification.type === 'success' ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <span className={`text-sm ${
                notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {notification.message}
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || storageChange === 0}
              className="btn-primary bg-emerald-500 hover:bg-emerald-600"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </span>
              ) : (
                'Add Storage'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};