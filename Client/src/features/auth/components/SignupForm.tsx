import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSignupForm } from '../hooks/useSignupForm';
import { FormInput } from './FormInput';
import { BeakerIcon, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { AddOrganizationModal } from '../../../features/organizations/components/AddOrganizationModal';
import axios from 'axios';

export const SignupForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  
  // Redirect to signup if no email is provided
  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }
  }, [email, navigate]);

  const { formData, setFormData, errors, loading, handleChange, handleSubmit } = useSignupForm();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);

  // Set email from navigation state
  useEffect(() => {
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [email, setFormData]);

  useEffect(() => {
    // Fetch organizations when component mounts
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
        if (response.data.success) {
          setOrganizations(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedOrg(value);
    const organizationValue = organizations.find((org)=> org.id === value);
    setFormData((prev) => ({
        ...prev,
        organization: organizationValue,
      }));

    // If "Add New Organization" is selected, open the modal
    if (value === 'new') {
      setIsAddOrgModalOpen(true);
       setFormData((prev) => ({
        ...prev,
        isNewOrganization: true,
      }));
    }
  };

  const handleOrgModalSuccess = () => {
    // Refresh the organizations list after adding a new one
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
        if (response.data.success) {
          setOrganizations(response.data.data);
          // Select the most recently added organization (last in the list)
          if (response.data.data.length > 0) {
            setSelectedOrg(response.data.data[response.data.data.length - 1].id);
            setFormData((prev) => ({
                 ...prev,
                 organization: response.data.data[response.data.data.length - 1],
         }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    fetchOrganizations();
  };
  return (
    <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <BeakerIcon className="h-12 w-12 text-primary-400" />
          <h2 className="mt-6 text-center text-4xl font-display font-bold">
            <GradientText>Complete Your Profile</GradientText>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Almost there! Fill in your details to get started
          </p>
          {email && (
            <p className="mt-1 text-center text-sm text-primary-400">
              {email}
            </p>
          )}
        </div>

        <GlowingBorder>
          <form className="glass-panel p-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <FormInput
                id="name"
                name="name"
                type="text"
                label="Full Name"
                value={formData.name}
                error={errors.name}
                onChange={handleChange}
                required
              />

              <FormInput
                id="password"
                name="password"
                type="password"
                label="Password"
                value={formData.password}
                error={errors.password}
                onChange={handleChange}
                required
              />

              <FormInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                error={errors.confirmPassword}
                onChange={handleChange}
                required
              />

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Organization (Optional)
                </label>
                <select
                   name="organization" 
                   value={selectedOrg}
                  onChange={(e) => {
                       handleOrgChange(e); 
                          }}
                  className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                           text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none
                           focus:ring-2 focus:ring-primary-500/30 transition-colors"
                >
                  <option value="" className="bg-dark-400 text-white">Select an organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id} className="bg-dark-400 text-white">
                      {org?.organization_name}
                    </option>
                  ))}
                  <option value="new" className="bg-dark-400 text-white">+ Add New Organization</option>
                </select>
              </div>
            </div>

            {errors.submit && (
              <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-200">{errors.submit}</h3>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </GlowingBorder>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Sign in
            </Link>
          </p>
          <p className="text-gray-400 mt-2">
            Want to use a different email?{' '}
            <Link to="/signup" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Go back
            </Link>
          </p>
        </div>
      </div>

      <AddOrganizationModal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
        onSuccess={handleOrgModalSuccess}
      />
    </div>
  );
};

// This component is imported from another file
const GlowingBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`glow ${className}`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};