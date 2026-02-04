
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Edit,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AssignLabToBatchModal } from '../components/AssignLabToBatchModal';
import { EditBatchModal } from '../components/EditBatchModal';
import { AddUsersToBatchModal } from '../components/AddUsersToBatchModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { DeleteBatchModal } from '../components/DeleteBatchModal';
import { useAuthStore } from '../../../store/authStore';
import { useBatchStore } from '../../../store/batchStore';

interface BatchDetails {
  id: string;
  name: string;
  description?: string;
  startdate?: string;
  enddate?: string;
  created_at: string;
  trainer_id?: string;
  trainer_name?: string;
}

interface BatchUser {
  id: string;
  name: string;
  email: string;
  labs_started: number;
  labs_completed: number;
  total_labs: number;
}

interface BatchLab {
  id: string;
  lab_id: string;
  lab_name: string;
  startdate: string;
  enddate: string;
  users_started: number;
  users_completed: number;
  total_users: number;
  remaining_days: number;
  is_purchased: boolean;
  quantity?: number;
  trainer_id?: string;
  trainer_name?: string;
}



export const BatchDetailsPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    deleteBatch, 
    fetchBatchDetails, 
    removeUserFromBatch, 
    removeLabFromBatch,
    currentBatch,
    batchUsers,
    batchLabs,
    isLoadingDetails
  } = useBatchStore();
  const [isAssignLabModalOpen, setIsAssignLabModalOpen] = useState(false);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [isAddUsersModalOpen, setIsAddUsersModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<BatchLab | null>(null);
  // Delete modals state
  const [deleteUserModal, setDeleteUserModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });
  const [deleteLabModal, setDeleteLabModal] = useState<{ isOpen: boolean; labId: string; labName: string }>({
    isOpen: false,
    labId: '',
    labName: ''
  });
  const [deleteBatchModal, setDeleteBatchModal] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isDeletingLab, setIsDeletingLab] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails(batchId);
    }
  }, [batchId]);

  

  const handleRemoveUser = async () => {
    if (!batchId) return;
    
    setIsDeletingUser(true);
    try {
      const labIds = batchLabs.map(lab=>lab.lab_id)
      const result = await removeUserFromBatch(batchId,labIds, deleteUserModal.userId);
      
      if (result.success) {
        setDeleteUserModal({ isOpen: false, userId: '', userName: '' });
      } else {
        console.error('Failed to remove user:', result.message);
        alert(result.message || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('An error occurred while removing the user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleRemoveLab = async () => {
    if (!batchId) return;
    setIsDeletingLab(true);
    try {
      const result = await removeLabFromBatch(batchId, deleteLabModal.labId);
      
      if (result.success) {
        fetchBatchDetails(batchId)
        setDeleteLabModal({ isOpen: false, labId: '', labName: '' });

      } else {
        console.error('Failed to remove lab:', result.message);
        alert(result.message || 'Failed to remove lab');
      }
    } catch (error) {
      console.error('Error removing lab:', error);
      alert('An error occurred while removing the lab');
    } finally {
      setIsDeletingLab(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchId) return;
    
    setIsDeletingBatch(true);
    try {
      const result = await deleteBatch(batchId);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete batch');
      }
      
      // Navigate back to batches page after successful deletion
      navigate('/dashboard/batches');
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      throw error;
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const formatDate = (dateString?: string) => {

    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  if (isLoadingDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!currentBatch) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300">Batch not found</h3>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/batches')}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              <GradientText>{currentBatch.name}</GradientText>
            </h1>
            {currentBatch.description && (
              <p className="mt-1 text-sm text-gray-400">{currentBatch.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsEditBatchModalOpen(true)}
            className="btn-secondary text-gray-200"
          >
            <Edit className="h-4 w-4 mr-2 text-gray-200" />
            Edit Batch
          </button>
          <button
            onClick={() => setIsAddUsersModalOpen(true)}
            className="btn-secondary text-gray-200"
          >
            <Plus className="h-4 w-4 mr-2 text-gray-200" />
            Add Users
          </button>
          <button
            onClick={() => setIsAssignLabModalOpen(true)}
            className="btn-primary text-gray-200"
          >
            <Plus className="h-4 w-4 mr-2 text-gray-200" />
            Assign Lab
          </button>
          <button
            onClick={() => setDeleteBatchModal(true)}
            className="btn-secondary bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Batch
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-500/10 rounded-lg">
              <Users className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-white">{batchUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-secondary-500/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-secondary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Labs</p>
              <p className="text-2xl font-bold text-white">{batchLabs.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-accent-500/10 rounded-lg">
              <Calendar className="h-6 w-6 text-accent-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Start Date</p>
              <p className="text-sm font-semibold text-white">{formatDate(currentBatch.startdate)}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Calendar className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">End Date</p>
              <p className="text-sm font-semibold text-white">{formatDate(currentBatch.enddate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Labs Section */}
      <div className="glass-panel">
        <h3 className="text-lg font-semibold mb-4">
          <GradientText>Assigned Labs</GradientText>
        </h3>
        
        {batchLabs.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">No labs assigned yet</p>
            <button
              onClick={() => setIsAssignLabModalOpen(true)}
              className="btn-primary mt-4 text-gray-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign First Lab
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-500/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Lab Details</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Progress</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Remaining</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchLabs.map((lab) => (
                  <tr key={lab.id} className="border-b border-primary-500/5 hover:bg-dark-300/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-white">{lab.lab_name}</p>
                        <div className="flex flex-col gap-1 mt-1">
                          {lab.is_purchased && (
                            <span className="text-xs text-emerald-400">
                              Purchased ({lab.quantity} licenses)
                            </span>
                          )}
                          {lab.trainer_name && (
                            <span className="text-xs text-primary-400">
                              Trainer: {lab.trainer_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          lab.remaining_days > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {lab.remaining_days > 0 ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-dark-400 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                            style={{
                              width: `${calculateProgress(lab.users_completed, lab.total_users)}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">
                          {calculateProgress(lab.users_completed, lab.total_users)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {lab.users_completed}/{lab.total_users} completed
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">{formatDate(lab.start_date)}</span>
                        <span className="text-xs text-gray-400">to {formatDate(lab.end_date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-accent-400" />
                        <span className="text-sm text-gray-300">
                          {lab.remaining_days > 0 ? `${lab.remaining_days}d` : 'Expired'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedLab(lab);
                            setIsAssignLabModalOpen(true);
                          }}
                          className="p-2 hover:bg-dark-400 rounded-lg transition-colors"
                          title="Edit Lab"
                        >
                          <Edit className="h-4 w-4 text-primary-400" />
                        </button>
                        <button
                          onClick={() => setDeleteLabModal({ isOpen: true, labId: lab.lab_id, labName: lab.lab_name })}
                          className="p-2 hover:bg-dark-400 rounded-lg transition-colors"
                          title="Remove Lab"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Section */}
      <div className="glass-panel">
        <h3 className="text-lg font-semibold mb-4">
          <GradientText>Students</GradientText>
        </h3>

        {batchUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">No students added yet</p>
            <button
              onClick={() => setIsAddUsersModalOpen(true)}
              className="btn-primary mt-4 text-gray-200"
            >
              <Plus className="h-4 w-4 mr-2 text-gray-200" />
              Add Students
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-500/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Labs Started</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Completed</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Progress</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchUsers.map((student) => (
                  <tr key={student.id} className="border-b border-primary-500/5 hover:bg-dark-300/30">
                    <td className="py-3 px-4 text-sm font-medium text-white">{student.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{student.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {student.labs_started}/{student.total_labs}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-gray-300">{student.labs_completed}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-dark-400 rounded-full h-2 w-24">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                            style={{
                              width: `${calculateProgress(student.labs_completed, student.total_labs)}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {calculateProgress(student.labs_completed, student.total_labs)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setDeleteUserModal({ isOpen: true, userId: student.user_id, userName: student.name })}
                          className="p-2 hover:bg-dark-400 rounded-lg transition-colors"
                          title="Remove Student"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AssignLabToBatchModal
        isOpen={isAssignLabModalOpen}
        onClose={() => {
          setIsAssignLabModalOpen(false);
          setSelectedLab(null);
        }}
        onSuccess={() => batchId && fetchBatchDetails(batchId)}
        batchId={batchId!}
        editLab={selectedLab}
      />

      <EditBatchModal
        isOpen={isEditBatchModalOpen}
        onClose={() => setIsEditBatchModalOpen(false)}
        onSuccess={() => batchId && fetchBatchDetails(batchId)}
        batchDetails={currentBatch}
      />

      <AddUsersToBatchModal
        isOpen={isAddUsersModalOpen}
        onClose={() => setIsAddUsersModalOpen(false)}
        onSuccess={() => batchId && fetchBatchDetails(batchId)}
        batchId={batchId!}
      />

      {/* Delete Modals */}
      <DeleteConfirmModal
        isOpen={deleteUserModal.isOpen}
        onClose={() => setDeleteUserModal({ isOpen: false, userId: '', userName: '' })}
        onConfirm={handleRemoveUser}
        isDeleting={isDeletingUser}
        title="Remove Student"
        message={`Are you sure you want to remove ${deleteUserModal.userName} from this batch? This action cannot be undone.`}
      />

      <DeleteConfirmModal
        isOpen={deleteLabModal.isOpen}
        onClose={() => setDeleteLabModal({ isOpen: false, labId: '', labName: '' })}
        onConfirm={handleRemoveLab}
        isDeleting={isDeletingLab}
        title="Remove Lab"
        message={`Are you sure you want to remove ${deleteLabModal.labName} from this batch? This action cannot be undone.`}
      />

      <DeleteBatchModal
        isOpen={deleteBatchModal}
        onClose={() => setDeleteBatchModal(false)}
        onConfirm={handleDeleteBatch}
        isDeleting={isDeletingBatch}
        batchName={currentBatch?.name || ''}
      />
    </div>
  );
};
