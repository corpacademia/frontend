import React, { useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting: boolean;
  moduleId?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting,
  moduleId
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async () => {
    // Determine what type of item we're deleting based on the title
    const isModule = title.includes('Module');
    const isExercise = title.includes('Exercise');
    const isLabContent = title.includes('Lab Content');
    const isQuiz = title.includes('Quiz');

    // If it's not a module or exercise, use the original onConfirm function
    if (!isModule && !isExercise && !isLabContent && !isQuiz) {
      onConfirm();
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let response;

      if (isModule && moduleId) {
        // Delete module
        response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteModule/${moduleId}`);
      } else if (isExercise) {
        // Delete exercise
        const exerciseId = moduleId; // In this case, moduleId is actually the exerciseId
        response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteExercise/${exerciseId}`);
      } else if (isLabContent) {
        // Delete lab exercise content
        const exerciseId = moduleId; // In this case, moduleId is actually the exerciseId
        response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteLabExercise/${exerciseId}`);
      } else if (isQuiz) {
        // Delete quiz content
        const exerciseId = moduleId; // In this case, moduleId is actually the exerciseId
        response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteQuizExercise/${exerciseId}`);
      } else {
        // Fallback to the original onConfirm if we can't determine the type
        onConfirm();
        return;
      }
      
      if (response && response.data.success) {
        onConfirm();
      } else if (response) {
        setError(response.data.message || 'Failed to delete item');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while deleting the item');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>{title}</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">{message}</p>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isDeleting || isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || isProcessing}
            className="btn-primary bg-red-500 hover:bg-red-600"
          >
            {isDeleting || isProcessing ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};