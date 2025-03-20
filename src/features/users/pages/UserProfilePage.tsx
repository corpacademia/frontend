import React, { useState ,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserProfileHeader } from '../components/profile/UserProfileHeader';
import { UserLabsSection } from '../components/profile/UserLabsSection';
import { UserAssessmentsSection } from '../components/profile/UserAssessmentsSection';
import { UserProgressSection } from '../components/profile/UserProgressSection';
import { UserPurchaseHistory } from '../components/profile/UserPurchaseHistory';
import { TrainerStats } from '../components/profile/TrainerStats';
import { OrgAdminStats } from '../components/profile/OrgAdminStats';
import { UserRoleUpgrade } from '../components/profile/UserRoleUpgrade';
import { OrganizationAssignment } from '../components/profile/OrganizationAssignment';
import { EditProfileModal } from '../components/EditProfileModal';
import { useUserProfile } from '../hooks/useUserProfile';
import { Pencil } from 'lucide-react';
import axios from 'axios';

export const UserProfilePage: React.FC = () => {

  const [user_cred,setUser] = useState({});  

  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setUser(response.data.user);
    };
    getUserDetails();
  }, []);

  const { userId } = useParams();
  const { user, isLoading, error } = useUserProfile(userId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const currentUser = user_cred;
  const isOrgAdmin = currentUser?.role === 'orgadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
 
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading user profile</div>;
  if (!user) return <div>User not found</div>;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <UserProfileHeader user={user.user} />
        {isOrgAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn-secondary"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrganizationAssignment 
            userId={userId!}
            currentOrganization={user.user.organization}
          />
          <UserRoleUpgrade 
            userId={userId!}
            currentRole={user.user.role}
          />
        </div>
      )}

      {user.user.role === 'trainer' ? (
        <TrainerStats userId={userId!} />
      ) : user.user.role === 'orgadmin' ? (
        <OrgAdminStats userId={userId!} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserLabsSection userId={userId!} />
            <UserAssessmentsSection userId={userId!} />
          </div>
          <UserProgressSection userId={userId!} />
          <UserPurchaseHistory userId={userId!} />
        </>
      )}

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user.user}
      />
    </div>
  );
};