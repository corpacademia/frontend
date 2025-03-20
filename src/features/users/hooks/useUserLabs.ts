import { useState, useEffect } from 'react';
import { UserLab } from '../types';
import axios from 'axios';

export const useUserLabs = (userId: string) => {
  const [labs, setLabs] = useState<UserLab[]>([]);
  const [labStatus, setLabStatus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  // First useEffect: Fetch admin details
  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile', {
          withCredentials: true,
        });
        setAdmin(response.data.user);
      } catch (error) {
        console.error('Failed to fetch admin details', error);
      }
    };
    getUserDetails();
  }, []);

  // Second useEffect: Fetch labs when admin is available and userId changes
  useEffect(() => {
    // Only run fetchLabs if admin is fetched and has an id
    if (!admin || !admin.id) return;

    const fetchLabs = async () => {
      try {
        const cataloguesResponse = await axios.post(
          'http://localhost:3000/api/v1/lab_ms/getLabsConfigured',
          { admin_id: admin.id }
        );
        const labsResponse = await axios.post(
          'http://localhost:3000/api/v1/lab_ms/getAssignedLabs',
          { userId }
        );
        const cats = cataloguesResponse.data.data;
        const labss = labsResponse.data.data;
        const filteredCatalogues = cats.filter((cat: any) =>
          labss.some((lab: any) => lab.lab_id === cat.lab_id)
        );
        setLabs(filteredCatalogues);
        setLabStatus(labss);
      } catch (error) {
        console.error('Error fetching labs', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabs();
  }, [userId, admin]);

  return { labs, labStatus, isLoading };
};
