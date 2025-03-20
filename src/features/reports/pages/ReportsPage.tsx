import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { ReportFilters } from '../components/ReportFilters';
import { ReportsList } from '../components/ReportsList';
import { Report, ReportType, ReportFilter } from '../types';
import { GradientText } from '../../../components/ui/GradientText';

// Mock data - Replace with actual API calls
const mockReports: Report[] = [
  {
    id: '1',
    name: 'Monthly User Activity Report',
    type: 'user',
    createdAt: new Date(),
    format: 'pdf',
    status: 'ready'
  },
  {
    id: '2',
    name: 'Q1 Revenue Analysis',
    type: 'revenue',
    createdAt: new Date(),
    format: 'excel',
    status: 'generating'
  },
  {
    id: '3',
    name: 'Cloud Resource Usage',
    type: 'cloud',
    createdAt: new Date(),
    format: 'csv',
    status: 'ready'
  }
];

export const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [reports, setReports] = useState(mockReports);

  // Available report types based on user role
  const getAvailableReportTypes = (): ReportType[] => {
    switch (user?.role) {
      case 'superadmin':
        return ['user', 'trainer', 'organization', 'lab', 'cloud', 'revenue'];
      case 'orgadmin':
        return ['user', 'trainer', 'lab', 'cloud'];
      case 'trainer':
        return ['user', 'lab'];
      default:
        return ['lab'];
    }
  };

  const handleFilterChange = (filters: ReportFilter) => {
    console.log('Applying filters:', filters);
    // TODO: Apply filters to reports
  };

  const handleDownload = (report: Report) => {
    console.log('Downloading report:', report);
    // TODO: Implement download logic
  };

  const handleDelete = (report: Report) => {
    console.log('Deleting report:', report);
    setReports(reports.filter(r => r.id !== report.id));
  };

  const handlePreview = (report: Report) => {
    console.log('Previewing report:', report);
    // TODO: Implement preview logic
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">
          <GradientText>Reports</GradientText>
        </h1>
      </div>

      <ReportFilters
        onFilterChange={handleFilterChange}
        availableTypes={getAvailableReportTypes()}
      />

      <ReportsList
        reports={reports}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onPreview={handlePreview}
      />
    </div>
  );
};