import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Building2, AlertCircle, UserX } from 'lucide-react';
import axios from 'axios';

interface OrganizationAssignmentProps {
  userId: string;
  currentOrganization?: string;
}



// Mock organizations - Replace with API call
// const availableOrganizations = [
//   { id: 'none', name: 'None (Individual User)', type: 'individual' },
//   { id: '1', name: 'TechCorp Solutions', type: 'enterprise' },
//   { id: '2', name: 'EduTech Institute', type: 'education' },
//   { id: '3', name: 'CloudSkills Academy', type: 'training' }
// ];



export const OrganizationAssignment: React.FC<OrganizationAssignmentProps> = ({
  userId,
  currentOrganization
}) => {
  const [selectedOrg, setSelectedOrg] = useState({});
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableOrganizations, setAvailableOrganizations] = useState([]);
  const [isloading, setIsLoading] = useState(true);



  useEffect(() => {
    // Fetch organizations from API
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/organization_ms/organizations');
        setAvailableOrganizations(response.data.data);
        
      } catch (err) {
        console.error('Failed to fetch organizations', err);
      }
      finally{
        // setIsLoading(false);
      }
    };
  
    fetchOrganizations();
  },[]);
  

  const handleAssign = async () => {
    if (!selectedOrg) {
      setError('Please select an organization');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      // TODO: Implement API call
      // await new Promise(resolve => setTimeout(resolve, 1000));
      const update_user_field = await axios.put('http://localhost:3000/api/v1/user_ms/updateUserOrganization',{
        userId:userId,
        values:selectedOrg,
      })
      if(!update_user_field.data.success){
        setError('Failed to assign organization. Please try again.')
      }
      location.reload(true)
      // Refresh user data after successful assignment
    } catch (err) {
      setError('Failed to assign organization. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  if(!isloading){
    return <div>Loading...</div>
  }

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-semibold mb-6">
        <GradientText>Organization Assignment</GradientText>
      </h2>

      {currentOrganization ? (
        <div className="mb-6 p-4 bg-dark-300/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {currentOrganization === 'None' ? (
              <UserX className="h-5 w-5 text-primary-400" />
            ) : (
              <Building2 className="h-5 w-5 text-primary-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-200">Current Organization</h3>
              <p className="text-sm text-gray-400">
                {currentOrganization === 'None' ? 'Individual User (No Organization)' : currentOrganization}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-gray-400">User is not assigned to any organization</p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Organization
          </label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
          >
            <option value="">Select an organization</option>
            {availableOrganizations.map(org => (
              <option key={org.id} value={[org.organization_name,org.org_type,org.id]}>
                {org.organization_name} ({org.org_type})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleAssign}
            disabled={isAssigning || !selectedOrg}
            className="btn-primary"
          >
            {isAssigning ? 'Assigning...' : 'Assign Organization'}
          </button>
        </div>
      </div>
    </div>
  );
};