import React from 'react';
import { MoreVertical, Eye, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Workspace {
  id: string;
  name: string;
  description: string;
  type: string;
  createdAt: Date;
}

interface WorkspaceListProps {
  workspaces: Workspace[];
  selectedWorkspaces: string[];
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onDelete: (ids: string[]) => void;
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  selectedWorkspaces,
  onSelect,
  onSelectAll,
  onDelete,
}) => {
  const navigate = useNavigate();

  const handleAction = (action: 'view' | 'edit' | 'delete' | 'create-lab', workspace: Workspace) => {
    switch (action) {
      case 'view':
        navigate(`/dashboard/labs/workspace/${workspace.id}`);
        break;
      case 'edit':
        navigate(`/dashboard/labs/workspace/${workspace.id}/edit`);
        break;
      case 'create-lab':
        navigate(`/dashboard/labs/create?workspace=${workspace.id}`);
        break;
      case 'delete':
        onDelete([workspace.id]);
        break;
    }
  };

  return (
    <div className="glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
              <th className="pb-4 pl-4">
                <input
                  type="checkbox"
                  checked={selectedWorkspaces.length === workspaces.length}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                />
              </th>
              <th className="pb-4">Lab Name</th>
              <th className="pb-4">Description</th>
              <th className="pb-4">Lab Type</th>
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
                    onChange={() => onSelect(workspace.id)}
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
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                    {workspace.type}
                  </span>
                </td>
                <td className="py-4 text-sm text-gray-400">
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleAction('view', workspace)}
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleAction('edit', workspace)}
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleAction('create-lab', workspace)}
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleAction('delete', workspace)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
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
    </div>
  );
};