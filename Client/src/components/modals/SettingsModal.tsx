
import React, { useState, useRef } from 'react';
import { X, Camera, User, Mail, Lock, Eye, EyeOff, Loader, Check, AlertCircle, Bell, Phone, MapPin, Building2, CreditCard, FileText, Menu } from 'lucide-react';
import { GradientText } from '../ui/GradientText';
import { GlowingBorder } from '../ui/GlowingBorder';
import { useAuthStore } from '../../store/authStore';
import { NotificationPreferences } from '../settings/NotificationPreferences';
import axios from 'axios';

// Placeholder for TransactionList component - replace with your actual implementation
const TransactionList = ({ orgId, title }: { orgId?: string; title: string }) => {
  return (
    <div className="text-gray-300">
      <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">{title}</h3>
      <p>Transaction list will be displayed here.</p>
      {orgId && <p>Organization ID: {orgId}</p>}
      {/* Add your transaction fetching logic, table, pagination, and PDF download here */}
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, fetchUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'billing'>('profile');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    organization: user?.organization || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

    // Extract filename from path
function extractFileName(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

  // Mock data for profile and password, assuming these are managed elsewhere or will be fetched
  const [profileData, setProfileData] = useState({
    first_name: user?.name?.split(' ')[0] || '',
    last_name: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    organization: user?.organization || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate password fields if password section is visible
    if (showPasswordSection) {
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (formData.newPassword && !formData.currentPassword) {
        setError('Current password is required to set a new password');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('location', formData.location);

      if (showPasswordSection && formData.newPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
        formDataToSend.append('newPassword', formData.newPassword);
      }

      if (profilePhoto) {
        formDataToSend.append('profilePhoto', profilePhoto);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/updateProfile/${user.id}`,
        formDataToSend,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setSuccess('Profile updated successfully');
        await fetchUser(); // Refresh user data
        setTimeout(() => {
          onClose();
          setFormData({
            name: '',
            email: '',
            phone: '',
            location: '',
            organization: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setProfilePhoto(null);
          setPhotoPreview(null);
          setShowPasswordSection(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionTabs = [
    { id: 'profile' as const, label: 'Profile Settings', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    ...(user?.role === 'superadmin' || user?.role === 'orgadmin' || user?.role === 'orgsuperadmin' 
      ? [{ id: 'billing' as const, label: 'Billing & Transactions', icon: CreditCard }] 
      : []
    )
  ];

  const handleSectionChange = (section: 'profile' | 'notifications' | 'billing') => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Mobile and tablet optimized modal */}
      <div className="relative bg-dark-200/95 backdrop-blur-lg border border-primary-500/20 
                      w-full h-full sm:h-[95vh] sm:max-w-6xl sm:rounded-xl sm:max-h-[90vh] 
                      overflow-hidden shadow-2xl">
        
        {/* Mobile Header with hamburger menu */}
        <div className="flex lg:hidden items-center justify-between p-4 sm:p-6 border-b border-primary-500/20 bg-dark-300/50">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5 text-gray-400" />
            </button>
            <h2 className="text-lg sm:text-xl font-display font-bold">
              <GradientText>Settings</GradientText>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Mobile Tab Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-16 sm:top-20 left-0 right-0 bg-dark-300/95 border-b border-primary-500/20 z-20">
            <div className="p-4 space-y-2">
              {sectionTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSectionChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === tab.id
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 xl:w-72 bg-dark-300/50 border-r border-primary-500/20 p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-display font-bold">
                <GradientText>Settings</GradientText>
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Desktop Vertical Tabs */}
            <div className="space-y-2">
              {sectionTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === tab.id
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className={`p-4 sm:p-6 lg:p-8 ${isMobileMenuOpen ? 'mt-64 sm:mt-48' : ''} lg:mt-0`}>
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  {/* Profile Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo Section */}
                    <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-700">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden shadow-xl">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : user.profilephoto ? (
                            <img src={`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/uploads/${extractFileName(user.profilephoto)}`} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 p-2 bg-primary-500 hover:bg-primary-600 rounded-full transition-all duration-200 shadow-lg hover:shadow-primary-500/30"
                        >
                          <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 text-center px-4">Click the camera icon to update your profile photo</p>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Full Name */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-400/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-400/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-400/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Enter your location"
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-400/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Organization - Disabled */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Organization
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                          <input
                            type="text"
                            value={formData.organization}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-500/50 border border-gray-600/50 rounded-lg text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Organization cannot be changed from here. Contact your administrator.</p>
                      </div>
                    </div>

                    {/* Password Section */}
                    <div className="border-t border-gray-700 pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Security</h3>
                        <button
                          type="button"
                          onClick={() => setShowPasswordSection(!showPasswordSection)}
                          className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-lg text-primary-300 transition-all duration-200 text-sm sm:text-base"
                        >
                          {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                        </button>
                      </div>

                      {showPasswordSection && (
                        <div className="space-y-4 bg-dark-400/20 p-4 sm:p-6 rounded-lg border border-primary-500/10 mt-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Current Password
                              </label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <input
                                  type={showCurrentPassword ? "text" : "password"}
                                  name="currentPassword"
                                  value={formData.currentPassword}
                                  onChange={handleInputChange}
                                  className="w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-400/50 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                  {showCurrentPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  New Password
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                  <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-400/50 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                  >
                                    {showNewPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Confirm New Password
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                  <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-dark-400/50 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                  >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Messages */}
                    {error && (
                      <div className="p-3 sm:p-4 bg-red-900/30 border border-red-500/30 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                          <span className="text-red-200 text-sm sm:text-base">{error}</span>
                        </div>
                      </div>
                    )}

                    {success && (
                      <div className="p-3 sm:p-4 bg-emerald-900/30 border border-emerald-500/30 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                          <span className="text-emerald-200 text-sm sm:text-base">{success}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-700">
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 text-sm sm:text-base"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 rounded-lg text-white font-medium transition-all duration-200 shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader className="animate-spin h-4 w-4" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">Notification Settings</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Manage your notification preferences</p>
                  </div>
                  <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
                    <NotificationPreferences />
                  </div>
                </div>
              )}

              {activeSection === 'billing' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">Billing & Transaction Settings</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Manage your billing preferences and transaction settings</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Transaction Notifications */}
                    <div className="bg-dark-300/50 rounded-lg p-4 sm:p-6 border border-primary-500/20">
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-primary-400" />
                        Transaction Notifications
                      </h4>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <label className="text-sm font-medium text-gray-200">Payment Confirmations</label>
                            <p className="text-xs text-gray-400">Get notified when payments are processed</p>
                          </div>
                          <input type="checkbox" defaultChecked className="toggle-switch flex-shrink-0" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <label className="text-sm font-medium text-gray-200">Payment Failures</label>
                            <p className="text-xs text-gray-400">Get notified when payments fail</p>
                          </div>
                          <input type="checkbox" defaultChecked className="toggle-switch flex-shrink-0" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <label className="text-sm font-medium text-gray-200">Invoice Reminders</label>
                            <p className="text-xs text-gray-400">Get reminders for upcoming payments</p>
                          </div>
                          <input type="checkbox" defaultChecked className="toggle-switch flex-shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Receipt Settings */}
                    <div className="bg-dark-300/50 rounded-lg p-4 sm:p-6 border border-primary-500/20">
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary-400" />
                        Receipt Preferences
                      </h4>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <label className="text-sm font-medium text-gray-200">Auto-download Receipts</label>
                            <p className="text-xs text-gray-400">Automatically download receipt PDFs</p>
                          </div>
                          <input type="checkbox" className="toggle-switch flex-shrink-0" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <label className="text-sm font-medium text-gray-200">Email Receipts</label>
                            <p className="text-xs text-gray-400">Send receipt copies to your email</p>
                          </div>
                          <input type="checkbox" defaultChecked className="toggle-switch flex-shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-dark-300/50 rounded-lg p-4 sm:p-6 border border-primary-500/20">
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-primary-400" />
                        Quick Actions
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => window.open(user?.role === 'superadmin' ? '/dashboard/settings' : '/dashboard/organization', '_blank')}
                          className="btn-secondary flex items-center justify-center text-sm sm:text-base"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View All Transactions
                        </button>
                        <button
                          onClick={() => {
                            // Trigger export functionality
                            console.log('Exporting transactions...');
                          }}
                          className="btn-secondary flex items-center justify-center text-sm sm:text-base"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export Transactions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
