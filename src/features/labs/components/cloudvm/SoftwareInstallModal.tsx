import React, { useState } from 'react';
import { X, Plus, Minus, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

interface SoftwareInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (software: string[]) => void;
  isLoading: boolean;
}

export const SoftwareInstallModal: React.FC<SoftwareInstallModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [software, setSoftware] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  const handleAddSoftware = () => {
    setSoftware([...software, '']);
  };

  const handleRemoveSoftware = (index: number) => {
    const newSoftware = software.filter((_, i) => i !== index);
    setSoftware(newSoftware);
  };

  const handleSoftwareChange = (index: number, value: string) => {
    const newSoftware = [...software];
    newSoftware[index] = value;
    setSoftware(newSoftware);
  };

  const handleSubmit = () => {
    const validSoftware = software.filter(s => s.trim() !== '');
    if (validSoftware.length === 0) {
      setError('Please enter at least one software');
      return;
    }
    setError(null);
    onSubmit(validSoftware);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Install Software</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {software.map((s, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={s}
                onChange={(e) => handleSoftwareChange(index, e.target.value)}
                placeholder="Enter software name"
                className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none
                         focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
              {software.length > 1 && (
                <button
                  onClick={() => handleRemoveSoftware(index)}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                  <Minus className="h-4 w-4 text-red-400" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={handleAddSoftware}
            className="flex items-center space-x-2 text-sm text-primary-400 hover:text-primary-300"
          >
            <Plus className="h-4 w-4" />
            <span>Add More Software</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Installing...' : software.length > 1 ? 'Install Softwares' : 'Install Software'}
          </button>
        </div>
      </div>
    </div>
  );
};