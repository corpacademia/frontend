
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus, Search, Filter, Users, Calendar, BookOpen } from 'lucide-react';
import { CreateBatchModal } from '../components/CreateBatchModal';
import { BatchCard } from '../components/BatchCard';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  user_count: number;
  lab_count: number;
  trainer_id?: string;
  trainer_name?: string;
  start_date?: string;
  end_date?: string;
}

export const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    filterBatches();
  }, [searchTerm, filterStatus, batches]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/getBatches/${user?.org_id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setBatches(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

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
    fetchBatches();
    setIsCreateModalOpen(false);
  };

  if (loading) {
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
            Create and manage student batches
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Batch
        </button>
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
    </div>
  );
};
