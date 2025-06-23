
import React from 'react';
import { X, LogIn } from 'lucide-react';
import { GradientText } from '../ui/GradientText';
import { useNavigate } from 'react-router-dom';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6 border border-primary-500/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Session Expired</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 text-center mb-4">
            Your session has expired. Please sign in again to continue.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSignIn}
            className="w-full h-12 px-6 rounded-lg text-sm font-medium
                     bg-gradient-to-r from-primary-500 to-secondary-500
                     hover:from-primary-400 hover:to-secondary-400
                     transform hover:scale-105 transition-all duration-300
                     text-white shadow-lg shadow-primary-500/20
                     flex items-center justify-center"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
