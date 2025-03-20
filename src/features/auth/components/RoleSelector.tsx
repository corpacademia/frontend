import React from 'react';
import { UserRole } from '../../../types/auth';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  error?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  const roles = [
    { value: 'user', label: 'Individual User' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'orgadmin', label: 'Organization Admin' },
  ] as const;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Account Type
      </label>
      <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={`relative border rounded-lg p-4 flex cursor-pointer focus:outline-none ${
              value === role.value
                ? 'border-primary-500 ring-2 ring-primary-500'
                : 'border-gray-300'
            }`}
          >
            <div className="flex flex-col">
              <span className="block text-sm font-medium text-gray-900">
                {role.label}
              </span>
            </div>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};