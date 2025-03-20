import React from 'react';
import { Download, Eye, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Report } from '../types';

interface ReportsListProps {
  reports: Report[];
  onDownload: (report: Report) => void;
  onDelete: (report: Report) => void;
  onPreview: (report: Report) => void;
}

export const ReportsList: React.FC<ReportsListProps> = ({
  reports,
  onDownload,
  onDelete,
  onPreview
}) => {
  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'generating':
        return <Loader className="h-5 w-5 text-primary-400 animate-spin" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
    }
  };

  return (
    <div className="glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-primary-500/10">
              <th className="pb-4 text-sm font-medium text-gray-400">Report Name</th>
              <th className="pb-4 text-sm font-medium text-gray-400">Type</th>
              <th className="pb-4 text-sm font-medium text-gray-400">Date</th>
              <th className="pb-4 text-sm font-medium text-gray-400">Format</th>
              <th className="pb-4 text-sm font-medium text-gray-400">Status</th>
              <th className="pb-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {reports.map((report) => (
              <tr 
                key={report.id} 
                className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
              >
                <td className="py-4 text-gray-300">{report.name}</td>
                <td className="py-4 text-gray-300">{report.type}</td>
                <td className="py-4 text-gray-400">
                  {report.createdAt.toLocaleDateString()}
                </td>
                <td className="py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                    {report.format.toUpperCase()}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(report.status)}
                    <span className="text-gray-400">
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    {report.status === 'ready' && (
                      <>
                        <button
                          onClick={() => onDownload(report)}
                          className="p-1 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4 text-primary-400" />
                        </button>
                        <button
                          onClick={() => onPreview(report)}
                          className="p-1 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 text-primary-400" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDelete(report)}
                      className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
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