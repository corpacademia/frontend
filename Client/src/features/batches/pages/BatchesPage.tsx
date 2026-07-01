
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus, Search, Filter, Users, Calendar, BookOpen, Trash2 } from 'lucide-react';
import { CreateBatchModal } from '../components/CreateBatchModal';
import { BatchCard } from '../components/BatchCard';
import { DeleteBatchModal } from '../components/DeleteBatchModal';
import { useAuthStore } from '../../../store/authStore';
import { useBatchStore } from '../../../store/batchStore';
import { useSubscription } from '../../labs/hooks/useSubscription';

interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  user_count: number;
  lab_count: number;
  trainer_count?: number;
  start_date?: string;
  end_date?: string;
}


export const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user,orgUsers } = useAuthStore();
  const { 
    deleteBatch, 
    fetchBatches, 
    batches, 
    isLoading,
    selectedBatchIds,
    toggleBatchSelection,
    selectAllBatches,
    clearSelection,
    deleteSelectedBatches
  } = useBatchStore();
  const { canUse,updateUsage,license } = useSubscription();
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; batchId: string; batchName: string }>({
    isOpen: false,
    batchId: '',
    batchName: ''
  });
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  let ids = orgUsers
        .filter(u => u.role === "labadmin")
        .map(u => u.id);
      ids = [...ids,user?.id];

  useEffect(() => {
    if (user?.id) {
      fetchBatches(user?.role === 'orgsuperadmin'  && ids.length ? ids : user?.id,user?.role );
    }
  }, [user?.id]);

  useEffect(() => {
    filterBatches();
  }, [searchTerm, filterStatus, batches]);


  const filterBatches = () => {
    let filtered = [...batches];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      const now = new Date();
      filtered = filtered.filter(batch => {
        if (!batch.enddate) return filterStatus === 'active';
        const endDate = new Date(batch.enddate);
        if (filterStatus === 'active') {
          return endDate >= now;
        } else {
          return endDate < now;
        }
      });
    }

    setFilteredBatches(filtered);
  };
  const handleBatchCreated = () => {
    if (user?.id) {
      fetchBatches(user?.role === 'orgsuperadmin'  && ids.length ? ids : user?.id,user?.role);
    }
    setIsCreateModalOpen(false);
  };

  const handleDeleteBatch = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBatch(deleteModal.batchId);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete batch');
      }
      await updateUsage(license?.id,'batches',-1)
      setDeleteModal({ isOpen: false, batchId: '', batchName: '' });
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSelectedBatches();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete batches');
      }
      
      setBulkDeleteModal(false);
      setSelectionMode(false);
    } catch (error: any) {
      console.error('Error deleting batches:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      clearSelection();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            <GradientText>Batch Management</GradientText>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-400">
            {selectionMode 
              ? `${selectedBatchIds.length} batch${selectedBatchIds.length !== 1 ? 'es' : ''} selected`
              : 'Create and manage student batches'
            }
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {selectionMode ? (
            <>
              <button
                onClick={selectAllBatches}
                className="btn-secondary flex-1 sm:flex-initial text-gray-200"
                disabled={selectedBatchIds.length === batches.length}
              >
                Select All
              </button>
              <button
                onClick={() => setBulkDeleteModal(true)}
                className="btn-primary bg-red-500 hover:bg-red-600 flex-1 sm:flex-initial"
                disabled={selectedBatchIds.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedBatchIds.length})
              </button>
              <button
                onClick={handleToggleSelectionMode}
                className="btn-secondary flex-1 sm:flex-initial text-gray-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleSelectionMode}
                className="btn-secondary text-gray-200"
              >
                Select
              </button>
              <button
                disabled={(!canUse('batches', batches?.length) && user?.role !== 'superadmin')}
               title={(!canUse('batches', batches?.length) && user?.role !=='superadmin') ? 'Upgrade/Activate plan to create more labs' : ''}
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary text-gray-200"
              >
                <Plus className="h-4 w-4 mr-2 text-gray-200" />
                Create Batch
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'completed')}
              className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-white focus:border-primary-500/40 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Batches</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div className="glass-panel text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Batches Found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first batch to get started'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button  disabled={!canUse('batches', batches?.length) && user?.role !=='superadmin'}
               title={(!canUse('batches', batches?.length) && user?.role !=='superadmin') ? 'Upgrade/Activate plan to create more labs' : ''}
              
             onClick={() => setIsCreateModalOpen(true)} className="btn-primary text-gray-200">
              <Plus className="h-4 w-4 mr-2 text-gray-200" />
              Create Your First Batch
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onClick={() => navigate(`/dashboard/batches/${batch.id}`)}
              onDelete={() => setDeleteModal({ isOpen: true, batchId: batch.id, batchName: batch.name })}
              isSelected={selectedBatchIds.includes(batch.id)}
              onToggleSelect={() => toggleBatchSelection(batch.id)}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      <CreateBatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleBatchCreated}
      />

      {/* Delete Batch Modal */}
      <DeleteBatchModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, batchId: '', batchName: '' })}
        onConfirm={handleDeleteBatch}
        isDeleting={isDeleting}
        batchName={deleteModal.batchName}
      />

      {/* Bulk Delete Modal */}
      <DeleteBatchModal
        isOpen={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
        batchName={`${selectedBatchIds.length} batch${selectedBatchIds.length !== 1 ? 'es' : ''}`}
      />
    </div>
  );
};
