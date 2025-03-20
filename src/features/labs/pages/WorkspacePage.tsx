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

  // Mock data for development - remove this when API is ready
  const mockWorkspaces: Workspace[] = [
    {
      id: '1',
      name: 'AWS Cloud Architecture Lab',
      description: 'Hands-on lab for learning AWS cloud architecture patterns',
      type: 'single-vm',
      status: 'active',
      createdAt: new Date('2024-03-01'),
    },
    {
      id: '2',
      name: 'Kubernetes Cluster Lab',
      description: 'Multi-node Kubernetes cluster setup and management',
      type: 'vm-cluster',
      status: 'pending',
      createdAt: new Date('2024-03-05'),
    },
    {
      id: '3',
      name: 'Azure DevOps Environment',
      description: 'Complete DevOps pipeline setup in Azure',
      type: 'cloud-slice',
      status: 'inactive',
      createdAt: new Date('2024-03-10'),
    }
  ];

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        // TODO: Replace with actual API call when ready
        // const response = await axios.get('/api/workspaces', {
        //   params: { userId: user?.id }
        // });
        // setWorkspaces(response.data);
        
        // Using mock data for now


        const response = await axios.get(`http://localhost:3000/api/v1/workspace_ms/getWorkspaceOnUserId/${user.id}`);
        if(response.data.success){
          setWorkspaces(response.data.data);
        }

        // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        // setWorkspaces(mockWorkspaces);
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
      const delete_workspace = await axios.post(`http://localhost:3000/api/v1/workspace_ms/deleteWorkspace`,{
        ids
      });
       
      
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
      console.log('Creating workspace:', data.values); 
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "files" && Array.isArray(value)) {
          // Ensure `files` contains actual `File` objects
          value.forEach(fileObj => {
            if (fileObj instanceof File) {
              formData.append("files", fileObj); // Correct way to append files
            } else if (fileObj.file instanceof File) {
              formData.append("files", fileObj.file); // Handle cases where `fileObj.file` contains the `File`
            } else {
              console.warn(" Skipping non-File object in files array:", fileObj);
            }
          });
        } else if (Array.isArray(value)) {
          // Append other arrays (e.g., `urls`)
          value.forEach(item => {
            formData.append(key, item);
          });
        } else {
          // Append normal key-value pairs
          formData.append(key, String(value));
        }
      });

      // TODO: Replace with actual API call when ready
      // const response = await axios.post('/api/workspaces', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //   }
      // });

      //api call to store the workspace
      const response = await axios.post("http://localhost:3000/api/v1/workspace_ms/createWorkspace", data, {
        headers: { "Content-Type": "multipart/form-data" },
    });
      // Mock response
      const newWorkspace: Workspace = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        description: data.description,
        type: data.type,
        status: 'pending',
        createdAt: new Date(),
      };

      setWorkspaces(prev => [...prev, newWorkspace]);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
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
          user={user}
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