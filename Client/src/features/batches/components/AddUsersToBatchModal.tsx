
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

interface AddUsersToBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const AddUsersToBatchModal: React.FC<AddUsersToBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batchId
}) => {
  const { user } = useAuthStore();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    }
  }, [isOpen]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/getAvailableUsers/${batchId}/${user?.org_id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setAvailableUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/addUsersToBatch`,
        {
          batch_id: batchId,
          user_ids: selectedUsers
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(`${selectedUsers.length} user(s) added successfully!`);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchTerm('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-primary-500/10 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              <GradientText>Add Students to Batch</GradientText>
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No users available</p>
              ) : (
                filteredUsers.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center space-x-3 p-3 bg-dark-400/30 rounded-lg hover:bg-dark-400/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => handleToggleUser(u.id)}
                      className="w-4 h-4 text-primary-500 bg-dark-300 border-primary-500/30 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    <span className="text-xs text-gray-500 uppercase">{u.role}</span>
                  </label>
                ))
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <p className="text-sm text-primary-300">
                  {selectedUsers.length} user(s) selected
                </p>
              </div>
            )}

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
          </div>
        </div>

        <div className="border-t border-primary-500/10 p-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary w-full sm:w-auto"
              disabled={isSubmitting || selectedUsers.length === 0}
            >
              {isSubmitting ? 'Adding...' : `Add ${selectedUsers.length || ''} User(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
