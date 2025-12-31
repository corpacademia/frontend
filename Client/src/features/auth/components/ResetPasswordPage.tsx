
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { GlowingBorder } from '../../../components/ui/GlowingBorder';
import axios from 'axios';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetToken } = location.state || {};

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    submit: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if no email or token
  React.useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, resetToken, navigate]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      submit: '',
    });

    // Validate old password
    if (!formData.oldPassword) {
      setErrors((prev) => ({ ...prev, oldPassword: 'Old password is required' }));
      return;
    }

    // Validate new password
    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setErrors((prev) => ({ ...prev, newPassword: passwordErrors[0] }));
      return;
    }

    // Check if new password is same as old password
    if (formData.oldPassword === formData.newPassword) {
      setErrors((prev) => ({ ...prev, newPassword: 'New password must be different from old password' }));
      return;
    }

    // Validate confirm password
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/reset-password`,
        {
          email,
          resetToken,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrors((prev) => ({ ...prev, submit: response.data.message || 'Failed to reset password' }));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      if (errorMessage.toLowerCase().includes('old password')) {
        setErrors((prev) => ({ ...prev, oldPassword: errorMessage }));
      } else {
        setErrors((prev) => ({ ...prev, submit: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-emerald-400" />
            <h2 className="mt-6 text-center text-4xl font-display font-bold">
              <GradientText>Password Reset Successful!</GradientText>
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Your password has been updated successfully
            </p>
          </div>

          <GlowingBorder>
            <div className="glass-panel p-8 space-y-6 text-center">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-emerald-300 font-medium">
                  You can now sign in with your new password
                </p>
              </div>

              <div className="text-sm text-gray-400">
                <p>Redirecting to login page in a few seconds...</p>
                <div className="mt-4">
                  <Link to="/login" className="btn-primary inline-block">
                    Go to Login
                  </Link>
                </div>
              </div>
            </div>
          </GlowingBorder>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Shield className="h-12 w-12 text-primary-400" />
          <h2 className="mt-6 text-center text-4xl font-display font-bold">
            <GradientText>Set New Password</GradientText>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Create a strong password for {email}
          </p>
        </div>

        <GlowingBorder>
          <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-6">
            <div className="space-y-4">
              {/* Old Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Old Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.oldPassword ? 'text' : 'password'}
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 bg-dark-400/70 border ${
                      errors.oldPassword ? 'border-red-500/50' : 'border-primary-500/30'
                    } rounded-lg text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors`}
                    placeholder="Enter your old password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('oldPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPasswords.oldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.oldPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.oldPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.newPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 bg-dark-400/70 border ${
                      errors.newPassword ? 'border-red-500/50' : 'border-primary-500/30'
                    } rounded-lg text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors`}
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPasswords.newPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 bg-dark-400/70 border ${
                      errors.confirmPassword ? 'border-red-500/50' : 'border-primary-500/30'
                    } rounded-lg text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors`}
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPasswords.confirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
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
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </GlowingBorder>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
