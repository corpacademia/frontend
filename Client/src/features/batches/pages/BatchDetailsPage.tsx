
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
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

interface BatchDetails {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
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
  start_date: string;
  end_date: string;
  users_started: number;
  users_completed: number;
  total_users: number;
  remaining_days: number;
  is_purchased: boolean;
  quantity?: number;
}

// Mock data
const mockBatchDetails: Record<string, BatchDetails> = {
  '1': {
    id: '1',
    name: 'DevOps Batch 2024',
    description: 'Advanced DevOps training with AWS and Kubernetes',
    start_date: '2024-02-01T00:00:00Z',
    end_date: '2024-05-31T23:59:59Z',
    created_at: '2024-01-15T10:00:00Z',
    trainer_id: 't1',
    trainer_name: 'John Smith'
  },
  '2': {
    id: '2',
    name: 'Cloud Computing Fundamentals',
    description: 'Introduction to cloud platforms and services',
    start_date: '2024-03-01T00:00:00Z',
    end_date: '2024-06-30T23:59:59Z',
    created_at: '2024-01-20T10:00:00Z',
    trainer_id: 't2',
    trainer_name: 'Sarah Johnson'
  },
  '3': {
    id: '3',
    name: 'Cybersecurity Bootcamp',
    description: 'Comprehensive security training and penetration testing',
    start_date: '2024-04-01T00:00:00Z',
    end_date: '2024-07-31T23:59:59Z',
    created_at: '2024-02-01T10:00:00Z',
    trainer_id: 't3',
    trainer_name: 'Mike Davis'
  }
};

const mockBatchUsers: Record<string, BatchUser[]> = {
  '1': [
    { id: 'u1', name: 'Alice Cooper', email: 'alice@example.com', labs_started: 6, labs_completed: 4, total_labs: 8 },
    { id: 'u2', name: 'Bob Wilson', email: 'bob@example.com', labs_started: 5, labs_completed: 3, total_labs: 8 },
    { id: 'u3', name: 'Carol Martinez', email: 'carol@example.com', labs_started: 7, labs_completed: 5, total_labs: 8 },
    { id: 'u4', name: 'David Lee', email: 'david@example.com', labs_started: 4, labs_completed: 2, total_labs: 8 },
    { id: 'u5', name: 'Emma Thompson', email: 'emma@example.com', labs_started: 8, labs_completed: 6, total_labs: 8 }
  ],
  '2': [
    { id: 'u6', name: 'Frank Harris', email: 'frank@example.com', labs_started: 4, labs_completed: 3, total_labs: 6 },
    { id: 'u7', name: 'Grace Kim', email: 'grace@example.com', labs_started: 5, labs_completed: 4, total_labs: 6 },
    { id: 'u8', name: 'Henry Chen', email: 'henry@example.com', labs_started: 3, labs_completed: 2, total_labs: 6 }
  ],
  '3': [
    { id: 'u9', name: 'Ivy Rodriguez', email: 'ivy@example.com', labs_started: 8, labs_completed: 5, total_labs: 12 },
    { id: 'u10', name: 'Jack Brown', email: 'jack@example.com', labs_started: 10, labs_completed: 7, total_labs: 12 }
  ]
};

const mockBatchLabs: Record<string, BatchLab[]> = {
  '1': [
    {
      id: 'bl1',
      lab_id: 'l1',
      lab_name: 'Docker Fundamentals',
      start_date: '2024-02-01T00:00:00Z',
      end_date: '2024-02-15T23:59:59Z',
      users_started: 20,
      users_completed: 18,
      total_users: 25,
      remaining_days: 0,
      is_purchased: true,
      quantity: 30
    },
    {
      id: 'bl2',
      lab_id: 'l2',
      lab_name: 'Kubernetes Deployment',
      start_date: '2024-02-16T00:00:00Z',
      end_date: '2024-03-15T23:59:59Z',
      users_started: 15,
      users_completed: 10,
      total_users: 25,
      remaining_days: 45,
      is_purchased: true,
      quantity: 30
    },
    {
      id: 'bl3',
      lab_id: 'l3',
      lab_name: 'AWS EC2 & S3',
      start_date: '2024-03-16T00:00:00Z',
      end_date: '2024-04-15T23:59:59Z',
      users_started: 12,
      users_completed: 5,
      total_users: 25,
      remaining_days: 75,
      is_purchased: true,
      quantity: 25
    }
  ],
  '2': [
    {
      id: 'bl4',
      lab_id: 'l4',
      lab_name: 'Azure Basics',
      start_date: '2024-03-01T00:00:00Z',
      end_date: '2024-03-31T23:59:59Z',
      users_started: 25,
      users_completed: 20,
      total_users: 30,
      remaining_days: 60,
      is_purchased: true,
      quantity: 35
    },
    {
      id: 'bl5',
      lab_id: 'l5',
      lab_name: 'GCP Introduction',
      start_date: '2024-04-01T00:00:00Z',
      end_date: '2024-04-30T23:59:59Z',
      users_started: 10,
      users_completed: 0,
      total_users: 30,
      remaining_days: 90,
      is_purchased: false
    }
  ],
  '3': [
    {
      id: 'bl6',
      lab_id: 'l6',
      lab_name: 'Network Security',
      start_date: '2024-04-01T00:00:00Z',
      end_date: '2024-04-30T23:59:59Z',
      users_started: 18,
      users_completed: 12,
      total_users: 20,
      remaining_days: 90,
      is_purchased: true,
      quantity: 25
    }
  ]
};

export const BatchDetailsPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [users, setUsers] = useState<BatchUser[]>([]);
  const [labs, setLabs] = useState<BatchLab[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAssignLabModalOpen, setIsAssignLabModalOpen] = useState(false);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [isAddUsersModalOpen, setIsAddUsersModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<BatchLab | null>(null);

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data
      if (batchId && mockBatchDetails[batchId]) {
        setBatchDetails(mockBatchDetails[batchId]);
        setUsers(mockBatchUsers[batchId] || []);
        setLabs(mockBatchLabs[batchId] || []);
      }
      
      /* Real API call - uncomment when backend is ready
      const [detailsRes, usersRes, labsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/getBatch/${batchId}`, {
          withCredentials: true
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/getBatchUsers/${batchId}`, {
          withCredentials: true
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/getBatchLabs/${batchId}`, {
          withCredentials: true
        })
      ]);

      if (detailsRes.data.success) setBatchDetails(detailsRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (labsRes.data.success) setLabs(labsRes.data.data);
      */
    } catch (error) {
      console.error('Error fetching batch details:', error);
      // Fallback to mock data on error
      if (batchId && mockBatchDetails[batchId]) {
        setBatchDetails(mockBatchDetails[batchId]);
        setUsers(mockBatchUsers[batchId] || []);
        setLabs(mockBatchLabs[batchId] || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the batch?')) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/removeUserFromBatch`,
        { batch_id: batchId, user_id: userId },
        { withCredentials: true }
      );

      if (response.data.success) {
        fetchBatchDetails();
      }
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handleRemoveLab = async (labId: string) => {
    if (!confirm('Are you sure you want to remove this lab from the batch?')) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/batch_ms/removeLabFromBatch`,
        { batch_id: batchId, lab_id: labId },
        { withCredentials: true }
      );

      if (response.data.success) {
        fetchBatchDetails();
      }
    } catch (error) {
      console.error('Error removing lab:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!batchDetails) {
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
              <GradientText>{batchDetails.name}</GradientText>
            </h1>
            {batchDetails.description && (
              <p className="mt-1 text-sm text-gray-400">{batchDetails.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsEditBatchModalOpen(true)}
            className="btn-secondary"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Batch
          </button>
          <button
            onClick={() => setIsAddUsersModalOpen(true)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Users
          </button>
          <button
            onClick={() => setIsAssignLabModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Lab
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
              <p className="text-2xl font-bold text-white">{users.length}</p>
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
              <p className="text-2xl font-bold text-white">{labs.length}</p>
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
              <p className="text-sm font-semibold text-white">{formatDate(batchDetails.start_date)}</p>
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
              <p className="text-sm font-semibold text-white">{formatDate(batchDetails.end_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Labs Section */}
      <div className="glass-panel">
        <h3 className="text-lg font-semibold mb-4">
          <GradientText>Assigned Labs</GradientText>
        </h3>
        
        {labs.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">No labs assigned yet</p>
            <button
              onClick={() => setIsAssignLabModalOpen(true)}
              className="btn-primary mt-4"
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Lab Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Progress</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Remaining</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab.id} className="border-b border-primary-500/5 hover:bg-dark-300/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-white">{lab.lab_name}</p>
                        {lab.is_purchased && (
                          <span className="text-xs text-emerald-400">
                            Purchased ({lab.quantity} licenses)
                          </span>
                        )}
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
                          onClick={() => handleRemoveLab(lab.lab_id)}
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

        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">No students added yet</p>
            <button
              onClick={() => setIsAddUsersModalOpen(true)}
              className="btn-primary mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
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
                {users.map((student) => (
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
                          onClick={() => handleRemoveUser(student.id)}
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
        onSuccess={fetchBatchDetails}
        batchId={batchId!}
        editLab={selectedLab}
      />

      <EditBatchModal
        isOpen={isEditBatchModalOpen}
        onClose={() => setIsEditBatchModalOpen(false)}
        onSuccess={fetchBatchDetails}
        batchDetails={batchDetails}
      />

      <AddUsersToBatchModal
        isOpen={isAddUsersModalOpen}
        onClose={() => setIsAddUsersModalOpen(false)}
        onSuccess={fetchBatchDetails}
        batchId={batchId!}
      />
    </div>
  );
};
