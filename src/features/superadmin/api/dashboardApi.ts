import axios from 'axios';
import { DashboardMetrics, ActivityItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL;


export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await axios.get(`${API_URL}/api/admin/metrics`);
    return response.data;
  },

  getRecentActivity: async (): Promise<ActivityItem[]> => {
    const response = await axios.get(`${API_URL}/api/admin/activity`);
    return response.data;
  },

  getCloudMetrics: async () => {
    const response = await axios.get(`${API_URL}/api/admin/cloud/metrics`);
    return response.data;
  },

  getRevenueMetrics: async () => {
    const response = await axios.get(`${API_URL}/api/admin/revenue/metrics`);
    return response.data;
  }
};