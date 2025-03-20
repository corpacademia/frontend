import axios from 'axios';
import { Lab } from '../../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const labsApi = {
  getLabs: async (): Promise<Lab[]> => {
    const response = await axios.get(`${API_URL}/api/labs`);
    return response.data;
  },
  
  getLabById: async (id: string): Promise<Lab> => {
    const response = await axios.get(`${API_URL}/api/labs/${id}`);
    return response.data;
  },
  
  createLab: async (lab: Omit<Lab, 'id'>): Promise<Lab> => {
    const response = await axios.post(`${API_URL}/api/labs`, lab);
    return response.data;
  },
  
  updateLab: async (id: string, lab: Partial<Lab>): Promise<Lab> => {
    const response = await axios.patch(`${API_URL}/api/labs/${id}`, lab);
    return response.data;
  },
  
  deleteLab: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/labs/${id}`);
  }
};