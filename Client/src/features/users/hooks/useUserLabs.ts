import { useState, useEffect } from 'react';
import { UserLab } from '../types';
import axios from 'axios';

export const useUserLabs = (userId: string,user:any) => {
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
  if (!admin || !admin.id) return;

  let fetchLabs: (() => Promise<void>) | undefined;

  if (user.user.role === 'orgadmin') {
    fetchLabs = async () => {
      try {
        setIsLoading(true);

        const getSingleVMAws = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAssessments`,{
        admin_id:user?.user?.id
      })
      let singleVMAws = [];
      if(getSingleVMAws.data.success){
        const detailedLabs = await Promise.all(
          getSingleVMAws.data.data.map(async(lab:any)=>{
            try {
              const labDetails =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`,{
                labId:lab?.lab_id
              })
              if(labDetails?.data?.success){
                return{
                  ...labDetails.data.data,
                  ...lab,
                  
                  type:'singlevm'
                }
              }
            } catch (error) {
               console.log(error);
               return{
                ...lab,
                type:'singlevm'
               }
            }
              
            }
        ))
        singleVMAws = detailedLabs;
        
      }
      //singlevmdatacenter labs
      const getSingleVMDatacenter = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgAssignedSingleVMDatacenterLab`,{
        orgId:user?.user?.org_id,
        created_by:user?.user?.id
      })
      let singleVMDatacenter = [];
      if(getSingleVMDatacenter.data.success){
        const detailedLabs = await Promise.all(
          getSingleVMDatacenter.data.data.map(async(lab:any)=>{
            try {
              const labDetails =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabOnId`,{
                labId:lab?.labid
              })
              if(labDetails?.data?.success){
                return{
                  ...labDetails.data.data,
                  ...lab,
                  
                  type:'singlevm-datacenter'
                }
              }
            } catch (error) {
               console.log(error);
               return{
                ...lab,
                type:'singlevm-datacenter'
               }
            }
              
            }
        ))
        singleVMDatacenter = detailedLabs;
        
      }
      //vmcluster datacenter labs
      const getVMClusterDatacenter =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getOrglabs`,{
        orgId:user?.user?.org_id,
        admin_id:user?.user?.id
      })
      let vmclusterDatacenter = [];
      if(getVMClusterDatacenter.data.success){
        const detailedLabs = await Promise.all(
          getVMClusterDatacenter.data.data.map(async(lab:any)=>{
            try {
              const labDetails =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabOnId`,{
                labId:lab?.lab?.labid
              })
              if(labDetails?.data?.success){
                return{
                  ...labDetails.data.data,
                  ...lab.lab,
                  ...lab.org,
                  type:'vmcluster-datacenter'
                }
              }
            } catch (error) {
               console.log(error);
               return{
                ...lab,
                type:'vmcluster-datacenter'
               }
            }
              
            }
        ))
        vmclusterDatacenter = detailedLabs;
        
      }

      //cloudslice aws
      const getCloudSliceAws = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getOrgAssignedLabs`,{
        orgId:user?.user?.org_id,
        admin_id:user?.user?.id
      })
      let cloudSliceAws = [];
      if(getCloudSliceAws.data.success){
        const detailedLabs = await Promise.all(
          getCloudSliceAws.data.data.map(async(lab:any)=>{
            try {
              const labDetails =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${lab.labid}`)
              if(labDetails?.data?.success){
                return{
                  ...labDetails.data.data,
                  ...lab,
                  type:'cloudslice'
                }
              }
            } catch (error) {
               console.log(error);
               return{
                ...lab,
                type:'cloudslice'
               }
            }
              
            }
        ))
        cloudSliceAws = detailedLabs;
        
      }
      //merge all labs
      const allLabs = [
        ...singleVMAws,
        ...singleVMDatacenter,
        ...vmclusterDatacenter,
        ...cloudSliceAws
      ]
      //merge all lab status
      const labStatus = [
        ...getSingleVMAws.data.data,
        ...getSingleVMDatacenter.data.data,
        ...vmclusterDatacenter,
        ...getCloudSliceAws.data.data
      ]
      setLabs(allLabs);
      setLabStatus(labStatus);
      } catch (error) {
        console.log(error)
      }
      finally{
        setIsLoading(false);
      }
      
    };
  } else {
    fetchLabs = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch base labs
        const [cataloguesResponse, labsResponse] = await Promise.all([
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
            admin_id: admin.id,
          }),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAssignedLabs`, {
            userId,
          }),
        ]);

        const cats = cataloguesResponse.data.data;
        const labss = labsResponse.data.data;
        const filteredCatalogues = cats
  .filter((cat: any) =>
    labss.some((lab: any) => lab.lab_id === cat.lab_id)
  )
  .map((cat: any) => {
    const matchedLab = labss.find((lab: any) => lab.lab_id === cat.lab_id);
    return {
      ...cat,
      status:matchedLab?.status || null,
      startdate: matchedLab?.start_date || null,
      enddate: matchedLab?.completion_date  || null,
    };
  });


        const singleVMLabs = filteredCatalogues.map((lab: any) => ({
          ...lab,
          type: 'singlevm',
        }));

        // 2. CloudSlice Labs
        const cloudslicelabResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserCloudSlices/${userId}`
        );
        const cloudSliceLabs = (cloudslicelabResponse.data.success
          ? cloudslicelabResponse.data.data
          : []
        ).map((lab: any) => ({
          ...lab,
          type: 'cloudslice',
        }));

        // 3. Single-VM Datacenter Labs
        const singleVMDatacenterLabResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getUserAssignedSingleVmDatacenterLabs/${userId}`
        );
        let singleVMDatacenterLabs: any[] = [];
        if (singleVMDatacenterLabResponse.data.success) {
          const assignedLabs = singleVMDatacenterLabResponse.data.data;

          const detailedLabs = await Promise.all(
            assignedLabs.map(async (lab: any) => {
              try {
                const response = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabOnId`,
                  { labId: lab.labid }
                );

                if (response.data.success) {
                  return {
                    ...response.data.data,
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

        // 4. VMCluster Datacenter Labs
        const vmclusterDatacenter = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getUserAssignedClusterLabs/${userId}`
        );
        let vmClusterDatacenterLabs: any[] = [];

        if (vmclusterDatacenter.data.success) {
          const assignedLabs = vmclusterDatacenter.data.data;

          const detailedLabs = await Promise.all(
            assignedLabs.map(async (lab: any) => {
              try {
                const response = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabOnId`,
                  { labId: lab.labid }
                );

                if (response.data.success) {
                  return {
                    ...response.data.data[0].lab,
                    ...lab,
                    type: 'vmcluster-datacenter',
                  };
                } else {
                  return {
                    ...lab,
                    type: 'vmcluster-datacenter',
                  };
                }
              } catch (error) {
                console.log('Error fetching vmcluster datacenter lab');
                return {
                  ...lab,
                  type: 'vmcluster-datacenter',
                };
              }
            })
          );

          vmClusterDatacenterLabs = detailedLabs;
        }

        // Merge all labs
        const allLabs = [
          ...singleVMLabs,
          ...cloudSliceLabs,
          ...singleVMDatacenterLabs,
          ...vmClusterDatacenterLabs,
        ];
        setLabs(allLabs);

        // Merge all statuses
        const allStatuses = [
          ...labss,
          ...(cloudslicelabResponse.data.success ? cloudslicelabResponse.data.data : []),
          ...(singleVMDatacenterLabResponse.data.data ?? []),
          ...(vmclusterDatacenter.data.success ? vmclusterDatacenter.data.data : []),
        ];

        setLabStatus(allStatuses);
      } catch (error) {
        console.error('Error fetching labs:', error);
      } finally {
        setIsLoading(false);
      }
    };
  }

  // Call the fetchLabs function
  if (fetchLabs) fetchLabs();
}, [userId, admin]);

  return { labs, labStatus, isLoading,admin };
};
