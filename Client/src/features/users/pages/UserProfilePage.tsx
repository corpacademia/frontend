import React, { useState, useEffect } from 'react';
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
import { EditUserModal } from '../components/EditUserModal';
import { useUserProfile } from '../hooks/useUserProfile';
import { Pencil } from 'lucide-react';
import axios from 'axios';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams();
  const { user, isLoading, error } = useUserProfile(userId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading user profile</div>;
  if (!user) return <div className="text-gray-300">User not found</div>;

  const isOrgAdmin = currentUser?.role === 'orgadmin';
  const isOrgSuperAdmin = currentUser?.role === 'orgsuperadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const canEditUser = isOrgAdmin || isOrgSuperAdmin || isSuperAdmin;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <UserProfileHeader user={user.user} />
        {canEditUser && (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserLabsSection userId={userId!} user={user!}/>
        <OrgAdminStats userId={userId!} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserLabsSection userId={userId!} user={user!}/>
            <UserAssessmentsSection userId={userId!} />
          </div>
          <UserProgressSection userId={userId!} />
          <UserPurchaseHistory userId={userId!} />
        </>
      )}

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user.user}
      />
    </div>
  );
};