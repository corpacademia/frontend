
import React from 'react';
import ReactDOM from 'react-dom';
import { X, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

interface ProxmoxDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vmTitle: string;
  isDeleting: boolean;
}

export const ProxmoxDeleteModal: React.FC<ProxmoxDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  vmTitle,
  isDeleting
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 left-0 right-0 top-0 bottom-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Confirm Deletion</GradientText>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-white">{vmTitle}</span>? 
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn-primary bg-red-500 hover:bg-red-600 px-4 py-2"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
