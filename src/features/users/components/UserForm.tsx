import React from 'react';
import { useUserForm } from '../hooks/useUserForm';
import { FormInput } from './FormInput';
import { AlertCircle } from 'lucide-react';

interface UserFormProps {
  onSubmit: (userData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export const UserForm: React.FC<UserFormProps> = ({ 
  onSubmit,
  onCancel,
  initialData
}) => {
  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit
    
  } = useUserForm(initialData, onSubmit);

  // const handleRefresh = async()=>{
  //     location.reload(true);
  // }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormInput
          id="name"
          name="name"
          label="Full Name"
          value={formData.name}
          error={errors.name}
          onChange={handleChange}
          required
        />

        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          error={errors.email}
          onChange={handleChange}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
          >
            <option value="user">User</option>
            <option value="trainer">Trainer</option>
            <option value="orgadmin">Organization Admin</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-400">{errors.role}</p>
          )}
        </div>

        <FormInput
          id="organization"
          name="organization"
          label="Organization"
          value={formData.organization}
          error={errors.organization}
          onChange={handleChange}
        />
      </div>

      {errors.submit && (
        <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-200">
                {errors.submit}
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Adding User...' : 'Add User'}
        </button>
      </div>
    </form>
  );
};