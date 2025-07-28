import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface ConvertToCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  sliceId: string;
}

export const ConvertToCatalogueModal: React.FC<ConvertToCatalogueModalProps> = ({
  isOpen,
  onClose,
  sliceId
}) => {
  const [catalogueName, setCatalogueName] = useState('');
  const [organization, setOrganization] = useState('');
  const [isPublic, setIsPublic] = useState('no');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // Get current user details
        const userResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        const user = userResponse.data.user;
        setCurrentUser(user);
        
        if (user?.role === 'orgsuperadmin') {
          // Fetch org admins for this organization
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user.org_id}`);
          if (response.data.success) {
            const orgAdmins = response.data.data.filter(admin => admin.role === 'orgadmin');
            setOrganizations(orgAdmins.map(admin => ({
              id: admin.id,
              organization_name: `${admin.name}  (${admin.email})`
            })));
          }
        } else {
          // For superadmin, fetch organizations
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
          if (response.data.success) {
            setOrganizations(response.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!catalogueName.trim()) {
      setError('Catalogue name and organization are required');
      setTimeout(() => setError(null), 1500);
      setIsLoading(false);
      return;
    }
    if(!organization){
        try {
          const updateCatalogue =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudsliceCatalogueDetails`,{
              catalogueName:catalogueName,
              catalogueType:isPublic ? 'public' :'private',
              labId:sliceId,
              level: level,
              category: category,
              price: price,
           })
           if(updateCatalogue?.data?.success){
            setSuccess("Successfully updated catalogue");
            setTimeout(()=>{
              onClose();
            },1000)
            // onClose();
           }
           else{
            setError("Failed to update catalogue");
             setTimeout(()=>{
            setError(null);
          },2000)
           }
        } catch (error:any) {
          console.log(error);
          setError("Failed to update catalogue");
          setTimeout(()=>{
            setError(null);
          },2000)
        }
        finally{
          setIsLoading(false);
        }
    }
   else{
     try {
      const user_profile = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      const updateCatalogue =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateCloudsliceCatalogueDetails`,{
        catalogueName:catalogueName,
        catalogueType:isPublic ? 'public' :'private',
        labId:sliceId,
        level: level,
        category: category,
        price: price,
      })
    
      let credAssignmentPayload ={
              sliceId:sliceId,
              organizationId: organization,
              userId: user_profile.data.user.id,
              startDate:updateCatalogue?.data?.data?.startdate,
              endDate:updateCatalogue?.data?.data?.enddate
      }
      if(currentUser?.role === 'orgsuperadmin'){
        credAssignmentPayload = {
          ...credAssignmentPayload,
          organizationId:user_profile.data.user.org_id,
          admin_id: organization
        };
      } 
      if(updateCatalogue?.data?.success){
         const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/cloudSliceOrgAssignment`, credAssignmentPayload);

      if (response.data.success) {
        setSuccess('Cloud slice converted to catalogue successfully');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to convert to catalogue');
        setTimeout(() => setError(null), 1500);
      }
      }
     
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to convert to catalogue');
      setTimeout(() => setError(null), 1500);
    } finally {
      setIsLoading(false);
    }
   }
   
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-dark-200 rounded-lg w-full max-w-md p-6 z-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              <GradientText>Convert to Catalogue</GradientText>
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
                Catalogue Name
              </label>
              <input
                type="text"
                value={catalogueName}
                onChange={(e) => setCatalogueName(e.target.value)}
                placeholder="Enter catalogue name"
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {currentUser?.role === 'orgsuperadmin' ? 'Assign to Org Admin' : 'Organization'}
              </label>
              <select
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              >
                <option value="">
                  {currentUser?.role === 'orgsuperadmin' ? 'Select an org admin' : 'Select an organization'}
                </option>
                <option value="none">None</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.organization_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Make Public
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isPublic"
                    value="yes"
                    checked={isPublic === 'yes'}
                    onChange={() => setIsPublic('yes')}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isPublic"
                    value="no"
                    checked={isPublic === 'no'}
                    onChange={() => setIsPublic('no')}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Security">Security</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Development">Development</option>
                  <option value="Networking">Networking</option>
                  <option value="Database">Database</option>
                </select>
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

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                <GradientText>
                  Cancel
                </GradientText>
                
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary"
              ><GradientText>
                 {isLoading ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Converting...
                  </span>
                ) : (
                  'Submit'
                )}
              </GradientText>
               
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
