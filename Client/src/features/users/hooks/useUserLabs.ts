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
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`, {
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
    // 1. Fetch base labs
    const cataloguesResponse = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`,
      { admin_id: admin.id }
    );
    const labsResponse = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAssignedLabs`,
      { userId }
    );

    const cats = cataloguesResponse.data.data;
    const labss = labsResponse.data.data;

    const filteredCatalogues = cats.filter((cat: any) =>
      labss.some((lab: any) => lab.lab_id === cat.lab_id)
    );

    const singleVMLabs = filteredCatalogues.map((lab: any) => ({
      ...lab,
      type: 'singlevm',
    }));

    // 2. Fetch CloudSlice Labs
    const cloudslicelabResponse = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserCloudSlices/${userId}`
    );
    let cloudSliceLabs: any[] = [];
    if (cloudslicelabResponse.data.success) {
      cloudSliceLabs = cloudslicelabResponse.data.data.map((lab: any) => ({
        ...lab,
        type: 'cloudslice',
      }));
    }

    // 3. Fetch single-vm datacenter labs
    const singleVMDatacenterLabResponse = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getUserAssignedSingleVmDatacenterLabs/${userId}`
    );
    let singleVMDatacenterLabs: any[] = [];
  if (singleVMDatacenterLabResponse.data.success) {
  const assignedLabs = singleVMDatacenterLabResponse.data.data;

  // Fetch full lab details for each lab
  const detailedLabs = await Promise.all(
    assignedLabs.map(async (lab: any) => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabOnId`,{
            labId:lab.labid
          }
        );

        if (response.data.success) {
          return {
             ...response.data.data, // merge full details
            ...lab,
            type: 'singlevm-datacenter',
          };
        } else {
          return {
            ...lab,
            type: 'singlevm-datacenter',
            _detailError: 'Failed to fetch lab details',
          };
        }
      } catch (err) {
        console.error(`Error fetching lab details for lab_id=${lab.lab_id}`, err);
        return {
          ...lab,
          type: 'singlevm-datacenter',
          _detailError: 'API error',
        };
      }
    })
  );

  singleVMDatacenterLabs = detailedLabs;
}

  //get vmcluster datacenter labs
  const vmclusterDatacenter = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getUserAssignedClusterLabs/${userId}`)
  let vmClusterDatacenterLabs:any[] = [];
 
  if(vmclusterDatacenter.data.success){
    const assignedLabs = vmclusterDatacenter.data.data;

    //fetch full lab details for each assigned labs
    const detailedLabs = await Promise.all(
      assignedLabs.map(async(lab:any)=>{
        try {
           const response =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabOnId`,{
            labId:lab.labid
           })
           if(response.data.success){
            return {
               ...response?.data?.data[0].lab,
              ...lab,
              type:'vmcluster-datacenter'
            }
           }
           else{
            return {
            ...lab,
            type:"vmcluster-datacenter"
           }
           }
        } catch (error) {
           console.log("Error fetching vmcluster datacenter lab");
           return {
            ...lab,
            type:"vmcluster-datacenter"
           }
        }
      })
    )
    vmClusterDatacenterLabs = detailedLabs
  }

    // Merge all labs
    const allLabs = [...singleVMLabs, ...cloudSliceLabs, ...singleVMDatacenterLabs,...vmClusterDatacenterLabs];
    setLabs(allLabs);

    // 4. Merge all lab statuses
    const cloudSliceStatusResponse = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserLabStatus/${userId}`
    );
   // base status

   const allStatuses = [
  ...labss,
  ...singleVMDatacenterLabs,
  ...(cloudSliceStatusResponse.data.success ? cloudSliceStatusResponse.data.data : []),
  ...vmClusterDatacenterLabs
];


    setLabStatus(allStatuses); //  Set once with everything

  } catch (error) {
    console.error('Error fetching labs:', error);
  } finally {
    setIsLoading(false);
  }
    };
    fetchLabs();
  }, [userId, admin]);
  return { labs, labStatus, isLoading,admin };
};
