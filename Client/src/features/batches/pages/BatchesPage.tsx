
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus, Search, Filter, Users, Calendar, BookOpen, Trash2 } from 'lucide-react';
import { CreateBatchModal } from '../components/CreateBatchModal';
import { BatchCard } from '../components/BatchCard';
import { DeleteBatchModal } from '../components/DeleteBatchModal';
import { useAuthStore } from '../../../store/authStore';
import { useBatchStore } from '../../../store/batchStore';

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

// Mock data
const mockBatches: Batch[] = [
  {
    id: '1',
    name: 'DevOps Batch 2024',
    description: 'Advanced DevOps training with AWS and Kubernetes',
    created_at: '2024-01-15T10:00:00Z',
    created_by: 'admin1',
    user_count: 25,
    lab_count: 8,
    trainer_count: 3,
    start_date: '2024-02-01T00:00:00Z',
    end_date: '2024-05-31T23:59:59Z'
  },
  {
    id: '2',
    name: 'Cloud Computing Fundamentals',
    description: 'Introduction to cloud platforms and services',
    created_at: '2024-01-20T10:00:00Z',
    created_by: 'admin1',
    user_count: 30,
    lab_count: 6,
    trainer_count: 2,
    start_date: '2024-03-01T00:00:00Z',
    end_date: '2024-06-30T23:59:59Z'
  },
  {
    id: '3',
    name: 'Cybersecurity Bootcamp',
    description: 'Comprehensive security training and penetration testing',
    created_at: '2024-02-01T10:00:00Z',
    created_by: 'admin1',
    user_count: 20,
    lab_count: 12,
    trainer_count: 4,
    start_date: '2024-04-01T00:00:00Z',
    end_date: '2024-07-31T23:59:59Z'
  },
  {
    id: '4',
    name: 'Data Science & ML',
    description: 'Machine Learning and AI fundamentals',
    created_at: '2023-12-10T10:00:00Z',
    created_by: 'admin1',
    user_count: 18,
    lab_count: 10,
    trainer_count: 2,
    start_date: '2024-01-15T00:00:00Z',
    end_date: '2024-03-15T23:59:59Z'
  },
  {
    id: '5',
    name: 'Full Stack Development',
    description: 'MERN stack web development course',
    created_at: '2024-02-15T10:00:00Z',
    created_by: 'admin1',
    user_count: 35,
    lab_count: 15,
    trainer_count: 5,
    start_date: '2024-05-01T00:00:00Z',
    end_date: '2024-08-31T23:59:59Z'
  }
];

export const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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

  useEffect(() => {
    if (user?.id) {
      fetchBatches(user.id);
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
        if (!batch.end_date) return filterStatus === 'active';
        const endDate = new Date(batch.end_date);
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
      fetchBatches(user.id);
    }
    setIsCreateModalOpen(false);
  };

  const handleDeleteBatch = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBatch(deleteModal.batchId);
      
      if (result.success) {
        setDeleteModal({ isOpen: false, batchId: '', batchName: '' });
      } else {
        console.error('Failed to delete batch:', result.message);
        alert(result.message || 'Failed to delete batch');
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('An error occurred while deleting the batch');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSelectedBatches();
      
      if (result.success) {
        setBulkDeleteModal(false);
        setSelectionMode(false);
      } else {
        console.error('Failed to delete batches:', result.message);
        alert(result.message || 'Failed to delete batches');
      }
    } catch (error) {
      console.error('Error deleting batches:', error);
      alert('An error occurred while deleting the batches');
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
                className="btn-secondary flex-1 sm:flex-initial"
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
                className="btn-secondary flex-1 sm:flex-initial"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleSelectionMode}
                className="btn-secondary"
              >
                Select
              </button>
              <button
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
            <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
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
