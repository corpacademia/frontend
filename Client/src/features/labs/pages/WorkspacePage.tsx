import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { WorkspaceFilters } from '../components/workspace/WorkspaceFilters';
import { WorkspaceList } from '../components/workspace/WorkspaceList';
import { CreateWorkspaceForm } from '../components/workspace/CreateWorkspaceForm';
import { Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';

interface Workspace {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'pending';
  documents?: string[];
  createdAt: Date;
}

export const WorkspacePage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get('/api/workspaces', {
          params: { userId: user?.id }
        });
        setWorkspaces(response.data);
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user?.id]);

  const handleFilterChange = (filters: any) => {
    // Implement filtering logic
    console.log('Filters:', filters);
  };

  const handleSelect = (id: string) => {
    setSelectedWorkspaces(prev =>
      prev.includes(id)
        ? prev.filter(wId => wId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedWorkspaces(
      selected ? workspaces.map(w => w.id) : []
    );
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        axios.delete(`/api/workspaces/${id}`)
      ));
      setWorkspaces(prev =>
        prev.filter(workspace => !ids.includes(workspace.id))
      );
      setSelectedWorkspaces([]);
    } catch (error) {
      console.error('Failed to delete workspaces:', error);
    }
  };

  const handleCreateWorkspace = async (data: any) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'documents' && value instanceof FileList) {
          Array.from(value).forEach(file => {
            formData.append('documents', file);
          });
        } else {
          formData.append(key, value as string);
        }
      });

      const response = await axios.post('/api/workspaces', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setWorkspaces(prev => [...prev, response.data]);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isCreating ? (
        <CreateWorkspaceForm
          onSubmit={handleCreateWorkspace}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold">
                <GradientText>Workspaces</GradientText>
              </h1>
              <p className="mt-2 text-gray-400">
                Manage your lab workspaces and environments
              </p>
            </div>
            <div className="flex space-x-4">
              {selectedWorkspaces.length > 0 && (
                <button
                  onClick={() => handleDelete(selectedWorkspaces)}
                  className="btn-secondary text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </button>
              )}
              <button
                onClick={() => setIsCreating(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </button>
            </div>
          </div>

          <WorkspaceFilters onFilterChange={handleFilterChange} />
          
          <WorkspaceList
            workspaces={workspaces}
            selectedWorkspaces={selectedWorkspaces}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
};