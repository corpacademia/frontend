import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  Trash2, 
  Eye, 
  AlertCircle,
  BarChart,
  Download,
  Check,
  X,
  Loader
} from 'lucide-react';
import axios from 'axios';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  type: string;
  description: string;
  timestamp: string;
}

interface OrgActivityTabProps {
  orgId: string;
}

export const OrgActivityTab: React.FC<OrgActivityTabProps> = ({ orgId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [orgId]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/organization_ms/getOrganizationActivities/${orgId}`);
      if (response.data.success) {
        setActivities(response.data.data);
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (err) {
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedActivities(activities.map(a => a.id));
    } else {
      setSelectedActivities([]);
    }
  };

  const handleSelectActivity = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedActivities.length) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`http://localhost:3000/api/v1/organization_ms/deleteOrganizationActivities`, {
        orgId,
        activityIds: selectedActivities
      });

      if (response.data.success) {
        setActivities(prev => prev.filter(a => !selectedActivities.includes(a.id)));
        setSelectedActivities([]);
        setSuccess('Selected activities deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete activities');
      }
    } catch (err) {
      setError('Failed to delete selected activities');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportLog = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/organization_ms/exportActivityLog/${orgId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_log_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export activity log');
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
          <GradientText>Activity Log</GradientText>
        </h2>
        <div className="flex space-x-4">
          {selectedActivities.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </button>
          )}
          <button 
            onClick={handleExportLog}
            className="btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Log
          </button>
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
                    checked={activities.length > 0 && selectedActivities.length === activities.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="pb-4">User</th>
                <th className="pb-4">Activity</th>
                <th className="pb-4">Timestamp</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr 
                  key={activity.id}
                  className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                >
                  <td className="py-4 pl-4">
                    <input
                      type="checkbox"
                      checked={selectedActivities.includes(activity.id)}
                      onChange={() => handleSelectActivity(activity.id)}
                      className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-4">
                    <span className="font-medium text-gray-200">{activity.userName}</span>
                  </td>
                  <td className="py-4">
                    <div>
                      <span className="text-gray-200">{activity.type}</span>
                      <p className="text-sm text-gray-400">{activity.description}</p>
                    </div>
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Eye className="h-4 w-4 text-primary-400" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <BarChart className="h-4 w-4 text-gray-400" />
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