
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { useAuthStore } from '../../../store/authStore';
import { useBatchStore } from '../../../store/batchStore';

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


export const AssignLabToBatchModal: React.FC<AssignLabToBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batchId,
  editLab
}) => {
  const { user } = useAuthStore();
  const { 
    fetchAvailableLabs, 
    fetchAvailableTrainers, 
    assignLabToBatch, 
    updateBatchLab,
    availableLabs, 
    availableTrainers,
    isLoadingLabs,
    isLoadingTrainers
  } = useBatchStore();
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
      fetchAvailableLabs(user?.id,user.org_id);
      if (user?.org_id) {
        fetchAvailableTrainers(user.org_id);
      }
      if (editLab) {
        setFormData({
          lab_id: editLab.lab_id,
          trainer_id: editLab.trainer_id || '',
          start_date: editLab.start_date?.slice(0, 16) || '',
          end_date: editLab.end_date?.slice(0, 16) || ''
        });
      }
    }
  }, [isOpen, editLab, user?.org_id]);

  useEffect(() => {
    if (formData.lab_id) {
      const lab = availableLabs.find(l => l.lab_id === formData.lab_id);
      setSelectedLab(lab || null);
    }
  }, [formData.lab_id, availableLabs]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user?.id) return;

  setError(null);
  setSuccess(null);
  setIsSubmitting(true);

  try {
    const selectedLabData = availableLabs.find(l => l.lab_id === formData.lab_id);
    const labTitle = selectedLabData ? selectedLabData.title : '';
    const type = selectedLabData ? selectedLabData?.type : '';
    const selectedTrainerData = availableTrainers.find(t => t.id === formData.trainer_id);
    const trainerName = selectedTrainerData?.name;

    // ✅ Convert datetime-local (which is local) into "YYYY-MM-DD HH:mm:ss"
    const formatForBackend = (datetime: string) => {
      if (!datetime) return '';
      const localDate = new Date(datetime);
      const offset = localDate.getTimezoneOffset();
      const corrected = new Date(localDate.getTime() - offset * 60000); // remove timezone offset
      return corrected.toISOString().slice(0, 19).replace('T', ' ');
    };

    const formattedStartDate = formatForBackend(formData.start_date);
    const formattedEndDate = formatForBackend(formData.end_date);

    const payload = {
      Id: selectedLabData?.id,
      batch_id: batchId,
      ...formData,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      lab_name: labTitle,
      assigned_by: user.id,
      trainer_name: trainerName,
      type,
      org_id:user?.org_id
    };

    const result = editLab
      ? await updateBatchLab(payload)
      : await assignLabToBatch(payload);

    if (result.success) {
      setSuccess(editLab ? 'Lab updated successfully!' : 'Lab assigned successfully!');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } else {
      setError(result.message || 'Failed to assign lab');
    }
  } catch (err: any) {
    setError('Failed to assign lab');
  } finally {
    setIsSubmitting(false);
  }
};


const formatDate = (dateValue: string | Date | null) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
              disabled={!!editLab || isLoadingLabs}
            >
              <option value="">Choose a lab...</option>
              {availableLabs.map((lab) => (
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

          {/* Trainer Assignment - Lab Specific */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign Trainer to This Lab (Optional)
            </label>
            <select
              value={formData.trainer_id}
              onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white focus:border-primary-500/40 focus:outline-none"
              disabled={isLoadingTrainers}
            >
              <option value="">No trainer assigned for this lab</option>
              {availableTrainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} ({trainer.email})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-400">
              Each lab can have its own trainer. This trainer will be responsible for this specific lab only.
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
               min={selectedLab?.start_date?.split('.')[0]}
               max={selectedLab?.end_date?.split('.')[0]}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none [color-scheme:dark] custom-date-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                max={selectedLab?.end_date?.split('.')[0]}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white focus:border-primary-500/40 focus:outline-none [color-scheme:dark] custom-date-input"
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
              {isSubmitting ? 'Processing...' : editLab ? 'Update Lab' : 'Assign Lab'}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};
