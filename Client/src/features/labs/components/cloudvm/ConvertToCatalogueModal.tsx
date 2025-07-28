import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertCircle, Calendar, Loader, Check, Clock } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface ConvertToCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  vmId: string;
  amiId?: string;
  isDatacenterVM?: boolean;
  isClusterDatacenterVM?: boolean;
}

interface Organization {
  id: string;
  name: string;
}

interface org {
  id: string;
  organization_name: string;
  org_id: string;
  org_admin: string;
  org_type: string;
}

type CatalogueType = 'private' | 'public';

interface FormData {
  catalogueName: string;
  organizationId: string;
  numberOfDays: number;
  hoursPerDay: number;
  expiresIn: string;
  software: string[];
  catalogueType: CatalogueType;
  level: string;
  category: string;
  price: string;
}

interface CleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hours: number) => void;
}

const CleanupModal: React.FC<CleanupModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [hours, setHours] = useState(1);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (hours < 1) {
      setError('Please enter at least 1 hour');
      return;
    }
    onConfirm(hours);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Cleanup Configuration</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cleanup Duration (hours)
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary-400" />
              <input
                type="number"
                min="1"
                value={hours}
                onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
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

          <div className="flex justify-end space-x-4">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const initialFormData: FormData = {
  catalogueName: '',
  organizationId: '',
  numberOfDays: 1,
  hoursPerDay: 1,
  expiresIn: '',
  software: [''],
  catalogueType: 'private',
  level: '',
  category: '',
  price: '',
};

export const ConvertToCatalogueModal: React.FC<ConvertToCatalogueModalProps> = ({
  isOpen,
  onClose,
  vmId,
  amiId,
  isDatacenterVM = false,
  isClusterDatacenterVM = false,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [software, setSoftware] = useState<string[]>(['']);
  const [Org_details, setOrg_details] = useState<org | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);

  const [admin,setAdmin] = useState({});
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // Check if user is orgsuperadmin
        if (admin?.role === 'orgsuperadmin') {
          // Fetch org admins for this organization
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${admin.org_id}`);
          if (response.data.success) {
            const orgAdmins = response.data.data.filter(user => user.role === 'orgadmin');
            setOrganizations(orgAdmins.map((admin: any) => ({
              id: admin.id,
              name: `${admin.name} (${admin.email})`
            })));
          }
        } else {
          // For superadmin, fetch organizations
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
          if (response.data.success) {
            setOrganizations(response.data.data.map((org: org) => ({
              id: org.id,
              name: org.organization_name
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    if (isOpen && admin?.id) {
      fetchOrganizations();
    }
  }, [isOpen, admin]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setSoftware(['']);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSoftware = () => {
    setSoftware([...software, '']);
  };

  const handleRemoveSoftware = (index: number) => {
    setSoftware(software.filter((_, i) => i !== index));
  };

  const handleSoftwareChange = (index: number, value: string) => {
    const newSoftware = [...software];
    newSoftware[index] = value;
    setSoftware(newSoftware);
  };

  const handleCleanup = (hours: number) => {
    // Handle cleanup operation with the specified hours
    console.log('Cleanup initiated for', hours, 'hours');
    // Add your cleanup logic here
  };

  const validateForm = (): boolean => {
    if (!formData.catalogueName) {
      setError('Catalogue name is required');
      return false;
    }
    // if (!formData.organizationId) {
    //   setError('Organization is required');
    //   return false;
    // }
    if (!isDatacenterVM && !isClusterDatacenterVM) {
      if (formData.numberOfDays < 1) {
        setError('Number of days must be at least 1');
        return false;
      }
      if (formData.hoursPerDay < 1) {
        setError('Hours per day must be at least 1');
        return false;
      }
      if (!formData.expiresIn) {
        setError('Expiration date is required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if(formData.organizationId){
      try {
        // Only fetch org details if user is superadmin (not orgsuperadmin)
        // For orgsuperadmin, formData.organizationId contains admin_id, not org_id
        let org_details = null;
        if (admin.role !== 'orgsuperadmin') {
          org_details = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
            org_id: formData.organizationId
          });

          if (!org_details.data.success) {
            throw new Error('Failed to fetch organization details');
          }
          setOrg_details(org_details.data.data);
        }
        if(isDatacenterVM){
            const labUpdate = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updatesinglevmdatacenter`, {
                software:software.filter(s => s.trim() !== ''), 
                catalogueType: formData.catalogueType, 
                labId: vmId,
                catalogueName: formData.catalogueName,
                level: formData.level,
                category: formData.category,
                price: formData.price,
            })
            if(labUpdate.data.success){
              const orgAssignmentPayload = {
                labId: vmId,
                orgId: admin.role === 'orgsuperadmin' ? admin.org_id : formData.organizationId, 
                assignedBy: admin.id,
                startDate: labUpdate?.data?.data?.startdate,
                endDate: labUpdate?.data?.data?.enddate
              };

              // Add admin_id if org admin is selected (organizationId contains the admin ID when orgsuperadmin selects an org admin)
              if (admin.role === 'orgsuperadmin' && formData.organizationId) {
                orgAssignmentPayload.admin_id = formData.organizationId;
              }

              const orgAssignment = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/singleVMDatacenterLabOrgAssignment`, orgAssignmentPayload)
              if(orgAssignment.data.success){
                const credAssignmentPayload = {
                labId: vmId,
                orgAssigned: admin.role === 'orgsuperadmin' ? admin.org_id : formData.organizationId, 
                assignedBy: admin.id,
              };

              // Add admin_id if org admin is selected (organizationId contains the admin ID when orgsuperadmin selects an org admin)
              if (admin.role === 'orgsuperadmin' && formData.organizationId) {
                credAssignmentPayload.admin_id = formData.organizationId;
              }

              const assingCredsToOrg = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignLabCredsToOrg`, credAssignmentPayload)
              if(assingCredsToOrg.data.success){
                setSuccess('Successfully converted to catalogue');
                setTimeout(() => {
                  onClose();
                }, 2000);
              } else {
                throw new Error('Failed to assign lab credentials to organization');
              }
              }
            }
             else {
            throw new Error('Failed to update lab configuration');
          }
         }
         else if(isClusterDatacenterVM){
           const updateCatalogueDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateVMClusterDatacenterCatalogueDetails`,{
                catalogueName:formData.catalogueName,
                catalogueType:formData.catalogueType,
                software:software.filter(s => s.trim() !== ''),
                labId:vmId,
                level: formData.level,
                category: formData.category,
                price: formData.price,
              })
          if(updateCatalogueDetails?.data?.success){
            const clusterAssignmentPayload = {
              labId: vmId,
              orgId: admin.role === 'orgsuperadmin' ? admin.org_id : formData.organizationId,
              assignedBy: admin?.id,
              startDate: updateCatalogueDetails?.data?.data?.startdate,
              endDate: updateCatalogueDetails?.data?.data?.enddate
            };

            // Add admin_id if org admin is selected (organizationId contains the admin ID when orgsuperadmin selects an org admin)
            if (admin.role === 'orgsuperadmin' && formData.organizationId) {
              clusterAssignmentPayload.admin_id = formData.organizationId;
            }

            const vmClusterDataCenter = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/assignToOrganization`, clusterAssignmentPayload)
           if (vmClusterDataCenter.data.success) {
            setSuccess('Successfully converted to catalogue');
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            throw new Error('Failed to update lab configuration');
          }
          }

         }

        else{
          const updateCatalogueDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateCatalogueDetails`,{
            catalogueName:formData.catalogueName,
            numberOfDays:formData.numberOfDays,
            hoursPerDay:formData.hoursPerDay,
            expiresIn:formData.expiresIn,
            software:software.filter(s => s.trim() !== ''),
            catalogueType:formData.catalogueType,
            labId:vmId,
            level: formData.level,
            category: formData.category,
            price: formData.price,
          })
          let batch;
          if(formData.organizationId && updateCatalogueDetails.data.success){
              const batchAssignmentPayload = {
                lab_id: vmId,
                admin_id: admin.role === 'orgsuperadmin' ? formData.organizationId : org_details.data.data.org_admin,
                org_id: admin.role === 'orgsuperadmin' ? admin.org_id : org_details.data.data.id,
                configured_by: admin?.id,
                enddate: formData.expiresIn
              };

              batch = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/batchAssignment`, batchAssignmentPayload);
          }

        if (batch?.data.success) {
          const updateLabConfig = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateConfigOfLabs`, {
            lab_id: vmId,
            admin_id: admin?.id,
            config_details: {
              ...formData,
              numberOfInstances: formData.hoursPerDay // Map hoursPerDay to numberOfInstances
            }
          });

          if (updateLabConfig.data.success) {
            setSuccess('Successfully converted to catalogue');
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            throw new Error('Failed to update lab configuration');
          }
        } else {
          throw new Error(batch?.data?.error || batch?.data?.message || 'Failed to create batch assignment');
        }
        }

      } catch (error: any) {
        setError(error.message || 'Failed to convert to catalogue');
      } finally {
        setIsLoading(false);
      }
    }
    else{
      try {
          if(isDatacenterVM){
            const labUpdate = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updatesinglevmdatacenter`, {
                software:software.filter(s => s.trim() !== ''), 
                catalogueType: formData.catalogueType, 
                labId: vmId,
                catalogueName: formData.catalogueName,
                level: formData.level,
                category: formData.category,
                price: formData.price,
            });
            if(labUpdate.data.success){
              setSuccess("Successfully converted to catalogue");
              setTimeout(()=>{
                onClose();
              },2000)
            }
            else{
              setError("Failed to convert to catalogue");
              setTimeout(()=>{
                setError(null)
              },2000)
            }
          }
          else if(isClusterDatacenterVM){
              const updateCatalogueDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateVMClusterDatacenterCatalogueDetails`,{
                catalogueName:formData.catalogueName,
                catalogueType:formData.catalogueType,
                software:software.filter(s => s.trim() !== ''),
                labId:vmId,
                level: formData.level,
                category: formData.category,
                price: formData.price,
              })
              if(updateCatalogueDetails.data.success){
                setSuccess("Successfully updated catalogue");
                setTimeout(()=>{
                  setSuccess(null)
                  onClose();
                },2000)
              }
              else{
                setError('Failed to update catalogue');
                setTimeout(()=>{
                  setError(null);
                },2000)
              }
           }
          else{
           const updateCatalogueDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateCatalogueDetails`,{
            catalogueName:formData.catalogueName,
            numberOfDays:formData.numberOfDays,
            hoursPerDay:formData.hoursPerDay,
            expiresIn:formData.expiresIn,
            software:software.filter(s => s.trim() !== ''),
            catalogueType:formData.catalogueType,
            labId:vmId,
            level: formData.level,
            category: formData.category,
            price: formData.price,
          });
          if(updateCatalogueDetails.data.success){
            setSuccess("Successfully converted to catalogue");
            setTimeout(()=>{
              onClose();
            },2000)
          }
          else{
            setError("Failed to convert to catalogue");
            setTimeout(()=>{
              setError(null);
            },2000)
          }
          }

      } catch (error:any) {
        setError(error?.message || 'Failed to convert to catalogue')
      }
      finally{
        setIsLoading(false);
      }
    }

  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-dark-200 p-6 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              <GradientText>Convert to Catalogue</GradientText>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Catalogue Name
              </label>
              <input
                type="text"
                name="catalogueName"
                value={formData.catalogueName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {admin?.role === 'orgsuperadmin' ? 'Assign to Org Admin' : 'Organization'}
              </label>
              <select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              >
                <option value="">
                  {admin?.role === 'orgsuperadmin' ? 'Select an org admin' : 'Select an organization'}
                </option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catalogue Type
                </label>
                <select
                  name="catalogueType"
                  value={formData.catalogueType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            {(!isDatacenterVM && !isClusterDatacenterVM) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Days
                    </label>
                    <input
                      type="number"
                      name="numberOfDays"
                      min="1"
                      value={formData.numberOfDays}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hours per Day
                    </label>
                    <input
                      type="number"
                      name="hoursPerDay"
                      min="1"
                      max="24"
                      value={formData.hoursPerDay}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expires In
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="expiresIn"
                      value={formData.expiresIn}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </>
            )}
             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">Select Level</option>
                  <option value="Foundation">Foundation</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="Devops">Devops</option>
                  <option value="Security">Security</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Development">Development</option>
                  <option value="Networking">Networking</option>
                  <option value="Database">Database</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Software
              </label>
              <div className="space-y-2">
                {software.map((s, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={s}
                      onChange={(e) => handleSoftwareChange(index, e.target.value)}
                      placeholder="Enter software name"
                      className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                    {software.length > 1 && (
                      <button
                        onClick={() => handleRemoveSoftware(index)}
                        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Minus className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddSoftware}
                  className="flex items-center text-sm text-primary-400 hover:text-primary-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Software
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

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsCleanupModalOpen(true)}
                className="btn-secondary"
              >
                Cleanup
              </button>
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                <GradientText>Cancel</GradientText>

              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary"
              >
                <GradientText>
                   {isLoading ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Converting...
                  </span>
                ) : (
                  'Create Catalogue'
                )}
                </GradientText>

              </button>
            </div>
          </div>
        </div>
      </div>

      <CleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        onConfirm={handleCleanup}
      />
    </div>
  );
};