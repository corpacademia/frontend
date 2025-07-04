import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { GradientText } from '../components/ui/GradientText';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Shield,
  BookOpen,
  Activity
} from 'lucide-react';
import axios from 'axios';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    organization: user?.organization || '',
    profileImage: user?.profilephoto || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [passwordVisibility, setPasswordVisibility] = useState({
    new: false,
    confirm: false
  });

  // Extract filename from path
function extractFileName(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phone === '' || phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Location validation (optional but minimum length if provided)
    if (formData.location && formData.location.trim().length < 2) {
      newErrors.location = 'Location must be at least 2 characters';
    }

    // Password validation (only if changing password)
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (!validatePassword(formData.newPassword)) {
        newErrors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, and number';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
      setFormData(prev => ({
        ...prev,
        profileImage: file.name 
      }));
    };
    reader.readAsDataURL(file);
    setProfilePhotoFile(file); 
  }
};

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the validation errors below.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id', formData.id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('organization', formData.organization);
      formDataToSend.append('password', formData.newPassword);

      // Add profile photo if selected
      if (profilePhotoFile) {
        formDataToSend.append('profilePhoto', profilePhotoFile);
      }
      const updateUserProfile = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/update_profile`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      });
      // Simulate saving data — replace this with your API call
      await new Promise(res => setTimeout(res, 1000));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setShowPasswordFields(false);
      setErrors({});
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowPasswordFields(false);
    setMessage(null);
    setErrors({});
    setFormData({
      id: user?.id || '',
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      organization: user?.organization || '',
      profileImage: user?.profilephoto || '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-400 via-dark-300 to-dark-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <GradientText>Profile Settings</GradientText>
          </h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/20 rounded-xl p-6 text-center">
              <div className="relative mx-auto mb-4 w-32 h-32">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
                 {profileImage ? (
                <img
                    src={profileImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                />
                ) : formData.profileImage ? (
                <img
                    src={`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/uploads/${extractFileName(formData.profileImage)}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                />
                ) : (
                <User className="h-16 w-16 text-white" />
                )}

                </div>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-primary-500 hover:bg-primary-600 rounded-full"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">{formData.name}</h2>
              <p className="text-gray-400 capitalize mb-2">{user?.role}</p>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500 mb-4">
                <Shield className="h-4 w-4" />
                <span>Member since {new Date().getFullYear()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary-400">12</div>
                  <div className="text-xs text-gray-500">Labs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-secondary-400">8.5</div>
                  <div className="text-xs text-gray-500">Avg Score</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/20 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-500/20 border border-primary-400/50 rounded-lg hover:bg-primary-500/30"
                  >
                    <Edit3 className="h-4 w-4 text-primary-400" />
                    <span className="text-primary-400">Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600/20 border border-gray-500/50 rounded-lg hover:bg-gray-600/30"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/50 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent"></div>
                          <span className="text-emerald-400">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback Message */}
              {message && (
                <div
                  className={`mb-4 px-4 py-2 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/30'
                      : 'bg-red-500/10 text-red-400 border border-red-400/30'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg text-gray-300 ${
                          errors.name ? 'border-red-500' : 'border-primary-500/20'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white bg-dark-400/30 px-4 py-2 rounded-lg">{formData.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg text-gray-300 ${
                          errors.email ? 'border-red-500' : 'border-primary-500/20'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white bg-dark-400/30 px-4 py-2 rounded-lg">{formData.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg text-gray-300 ${
                          errors.phone ? 'border-red-500' : 'border-primary-500/20'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white bg-dark-400/30 px-4 py-2 rounded-lg">{formData.phone || 'Not provided'}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className={`w-full px-4 py-2 bg-dark-400/50 border rounded-lg text-gray-300 ${
                          errors.location ? 'border-red-500' : 'border-primary-500/20'
                        }`}
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-400">{errors.location}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white bg-dark-400/30 px-4 py-2 rounded-lg">{formData.location || 'Not provided'}</p>
                  )}
                </div>

                {/* Organization (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Organization</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      disabled
                      className="w-full px-4 py-2 bg-dark-400/40 border border-gray-500/30 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                  ) : (
                    <p className="text-white bg-dark-400/30 px-4 py-2 rounded-lg">{formData.organization}</p>
                  )}
                </div>
              </div>

              {/* Password change (optional) */}
              {isEditing && (
                <div className="mt-6 border-t border-gray-600 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-white">Change Password</h4>
                    <button
                      type="button"
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                      className="flex items-center space-x-2 px-3 py-1 bg-primary-500/20 border border-primary-400/50 rounded-lg hover:bg-primary-500/30 transition-colors"
                    >
                      <Shield className="h-4 w-4 text-primary-400" />
                      <span className="text-primary-400 text-sm">
                        {showPasswordFields ? 'Cancel' : 'Change Password'}
                      </span>
                    </button>
                  </div>
                  {showPasswordFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['new', 'confirm'].map(field => (
                      <div key={field} className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                          {field} Password
                        </label>
                        <div>
                          <input
                            type={passwordVisibility[field as 'new' | 'confirm'] ? 'text' : 'password'}
                            name={`${field}Password`}
                            value={formData[`${field}Password` as keyof typeof formData]}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 pr-10 bg-dark-400/50 border rounded-lg text-gray-300 ${
                              errors[`${field}Password`] ? 'border-red-500' : 'border-primary-500/20'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field as 'new' | 'confirm')}
                            className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                          >
                            {passwordVisibility[field as 'new' | 'confirm'] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          {errors[`${field}Password`] && (
                            <p className="mt-1 text-sm text-red-400">{errors[`${field}Password`]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};