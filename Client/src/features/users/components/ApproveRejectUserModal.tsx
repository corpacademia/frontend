
import React, { useState } from 'react';
import { X, Check, XCircle, Loader, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

interface ApproveRejectUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string) => Promise<void>;
}

export const ApproveRejectUserModal: React.FC<ApproveRejectUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onApprove,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onApprove(user?.id);
    } catch (err: any) {
      setError(err.message || 'Failed to approve user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onReject(user.id);
    } catch (err: any) {
      setError(err.message || 'Failed to reject user');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Approve or Reject User</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <div className="p-4 bg-dark-300/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Name:</span>
              <span className="text-sm text-gray-300 font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Email:</span>
              <span className="text-sm text-gray-300 font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Role:</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                user.role === 'labadmin' ? 'bg-primary-500/20 text-primary-300' :
                user.role === 'trainer' ? 'bg-accent-500/20 text-accent-300' :
                'bg-secondary-500/20 text-secondary-300'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="btn-secondary text-red-400 hover:text-red-300"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2 text-gray-200" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center text-gray-200">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </span>
            )}
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="btn-primary"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2 text-gray-200" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-gray-200" />
                Approve
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
