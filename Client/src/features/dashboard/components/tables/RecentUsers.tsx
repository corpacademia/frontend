import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Users, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../../../store/authStore';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
}

const roleBadge = (role: string) => {
  const base = 'px-2 py-0.5 text-xs font-medium rounded-full capitalize';
  if (role === 'labadmin') return `${base} bg-primary-500/20 text-primary-300`;
  if (role === 'trainer') return `${base} bg-accent-500/20 text-accent-300`;
  if (role === 'superadmin') return `${base} bg-red-500/20 text-red-300`;
  if (role === 'orgsuperadmin') return `${base} bg-yellow-500/20 text-yellow-300`;
  return `${base} bg-secondary-500/20 text-secondary-300`;
};

export const RecentUsers: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let res;
        if (user?.role === 'superadmin') {
          res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/allUsers`
          );
          const raw = res.data?.data || res.data?.users || [];
          setUsers(raw.slice(0, 5));
        } else if (user?.org_id) {
          res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user.org_id}`
          );
          const raw = res.data?.data || [];
          setUsers(raw.slice(0, 5));
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [user?.id, user?.org_id]);

  return (
    <div className="glass-panel p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-xl font-semibold">
          <GradientText>Recent Users</GradientText>
        </h2>
        <Users className="h-5 w-5 text-primary-400 flex-shrink-0" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader className="h-6 w-6 animate-spin text-primary-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No users found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400">
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4">Organization</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-primary-500/10">
                    <td className="py-3 text-gray-200 font-medium">{u.name}</td>
                    <td className="py-3 text-gray-400 truncate max-w-[160px]">{u.email}</td>
                    <td className="py-3">
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td className="py-3 text-gray-400 truncate max-w-[140px]">
                      {u.organization || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg border border-primary-500/10 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                  {u.organization && (
                    <p className="text-xs text-gray-500 truncate">{u.organization}</p>
                  )}
                </div>
                <span className={`${roleBadge(u.role)} flex-shrink-0`}>{u.role}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};