import React, { useState } from 'react';
import { X, AlertCircle, Check, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface DeleteCloudSliceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sliceId: string | null;
  sliceName: string | null;
  onSuccess: () => void;
  cloudSlices:any;
}

export const DeleteCloudSliceModal: React.FC<DeleteCloudSliceModalProps> = ({
  isOpen,
  onClose,
  sliceId,
  sliceName,
  cloudSlices,
  onSuccess
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const handleDelete = async () => {
    if (!sliceId) return;
    
    setIsDeleting(true);
    setError(null);
    setSuccess(null);
    const slice = cloudSlices.find((slice: any) => slice.labid === sliceId);
    try {
      let deleteIam;
      if(slice.username != null) {
         // 1. Delete IAM account
       deleteIam = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deleteIamAccount`, {
        userName: slice.username
      });
      }
      
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteCloudSlice/${sliceId}`);

      if (response.data.success) {
        setSuccess('Cloud slice deleted successfully');
        setTimeout(() => {
          setSuccess(null);
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete cloud slice');
      }
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || 'Failed to delete cloud slice');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !sliceId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Delete Cloud Slice</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
            <p className="text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-white">{sliceName}</span>? This action cannot be undone.
            </p>
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
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-primary bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                'Delete Cloud Slice'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};