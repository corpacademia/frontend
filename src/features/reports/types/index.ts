import { UserRole } from '../../../types/auth';

export type ReportType = 'user' | 'trainer' | 'organization' | 'lab' | 'cloud' | 'revenue';
export type ReportFormat = 'pdf' | 'csv' | 'excel';
export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface ReportFilter {
  type: ReportType;
  dateRange: DateRange;
  customRange?: { start: Date; end: Date };
  organization?: string;
  status?: string;
  role?: UserRole;
}

export interface ReportColumn {
  id: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  createdAt: Date;
  format: ReportFormat;
  url?: string;
  status: 'generating' | 'ready' | 'failed';
}