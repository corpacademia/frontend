import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  Trash2, 
  Eye, 
  Pencil, 
  MoreVertical,
  Check,
  X,
  Loader,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface Workspace {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface OrgWorkspacesTabProps {
  orgId: string;
}

export const OrgWorkspacesTab: React.FC<OrgWorkspacesTabProps> = ({ orgId }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/getOrganizationWorkspaces/${orgId}`);
        if (response.data.success) {
          setWorkspaces(response.data.data);
        } else {
          // throw new Error('Failed to fetch workspaces');
          console.warn("No workspaces found. Setting workspace to an empty list.");
        }
      } catch (err) {
        if(err.response && err.response.status === 404){
          console.warn("No workspaces found. Setting workspace to an empty list.");
          setWorkspaces([]);

        }
        else{
          setError('Failed to load workspaces');
        }
        
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [orgId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorkspaces(workspaces.map(w => w.id));
    } else {
      setSelectedWorkspaces([]);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(workspaceId)
        ? prev.filter(id => id !== workspaceId)
        : [...prev, workspaceId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedWorkspaces.length) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`http://localhost:3000/api/v1/deleteOrganizationWorkspaces`, {
        orgId,
        workspaceIds: selectedWorkspaces
      });

      if (response.data.success) {
        setWorkspaces(prev => prev.filter(w => !selectedWorkspaces.includes(w.id)));
        setSelectedWorkspaces([]);
        setSuccess('Selected workspaces deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete workspaces');
      }
    } catch (err) {
      setError('Failed to delete selected workspaces');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          <GradientText>Workspaces</GradientText>
        </h2>
        <div className="flex space-x-4">
          {selectedWorkspaces.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-200">{success}</span>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                <th className="pb-4 pl-4">
                  <input
                    type="checkbox"
                    checked={workspaces.length > 0 && selectedWorkspaces.length === workspaces.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="pb-4">Name</th>
                <th className="pb-4">Description</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Created</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace) => (
                <tr 
                  key={workspace.id}
                  className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                >
                  <td className="py-4 pl-4">
                    <input
                      type="checkbox"
                      checked={selectedWorkspaces.includes(workspace.id)}
                      onChange={() => handleSelectWorkspace(workspace.id)}
                      className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-4">
                    <span className="font-medium text-gray-200">{workspace.name}</span>
                  </td>
                  <td className="py-4">
                    <p className="text-sm text-gray-400 line-clamp-1">{workspace.description}</p>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      workspace.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {workspace.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Eye className="h-4 w-4 text-primary-400" />
                      </button>
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Pencil className="h-4 w-4 text-primary-400" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};