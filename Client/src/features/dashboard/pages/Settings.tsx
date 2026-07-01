import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon, CreditCard, User, Bell, Shield,
  Camera, Save, Edit3, X, Eye, EyeOff, Mail, Phone,
  MapPin, Lock, CheckCircle, AlertCircle, Monitor, Globe, Info
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { TransactionList } from '../../../components/transactions/TransactionList';
import { NotificationPreferences } from '../../../components/settings/NotificationPreferences';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';

/* ─── General Tab ─────────────────────────────────────────── */
const GeneralSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [language, setLanguage] = useState('en');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">General Settings</h2>
        <p className="text-sm text-gray-400">Basic platform configuration and preferences</p>
      </div>

      {/* Platform Info */}
      <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary-400" />Platform Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Logged in as', value: user?.name },
            { label: 'Role', value: user?.role?.replace('orgsuperadmin', 'Org Super Admin').replace('superadmin', 'Super Admin').replace('labadmin', 'Lab Admin').replace('trainer', 'Trainer').replace('user', 'Student') },
            { label: 'Email', value: user?.email },
            { label: 'Organization', value: user?.organization || '—' },
          ].map(item => (
            <div key={item.label} className="bg-dark-400/40 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
              <p className="text-gray-200 font-medium truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Localization */}
      <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary-400" />Localization
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-accent-400">
            <CheckCircle className="h-4 w-4" />Preferences saved
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl text-sm font-semibold hover:from-primary-400 hover:to-secondary-400 transition-all"
        >
          <Save className="h-4 w-4" />Save Preferences
        </button>
      </div>
    </div>
  );
};

/* ─── Profile Tab ─────────────────────────────────────────── */
const ProfileSettings: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });

  function extractFileName(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePreview(reader.result as string);
    reader.readAsDataURL(file);
    setProfilePhotoFile(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Valid email required';
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('userId', user?.id || '');
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('phone', formData.phone);
      fd.append('location', formData.location);
      if (profilePhotoFile) fd.append('profilePhoto', profilePhotoFile);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/update_profile`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setProfilePhotoFile(null);
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfilePreview(null);
    setProfilePhotoFile(null);
    setErrors({});
    setMessage(null);
    setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', location: user?.location || '' });
  };

  const profileSrc = profilePreview
    || (user?.profilephoto ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/uploads/${extractFileName(user.profilephoto)}` : null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Profile Settings</h2>
        <p className="text-sm text-gray-400">Manage your personal information</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-accent-500/10 border-accent-500/20 text-accent-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
            {profileSrc
              ? <img src={profileSrc} alt="Profile" className="w-full h-full object-cover" />
              : <User className="h-10 w-10 text-white" />}
          </div>
          {isEditing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-primary-500 hover:bg-primary-400 rounded-full transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{user?.name}</p>
          <p className="text-gray-400 text-sm capitalize">{user?.role}</p>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: 'name', label: 'Full Name', icon: User, type: 'text' },
          { key: 'email', label: 'Email Address', icon: Mail, type: 'email' },
          { key: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', placeholder: 'Optional' },
          { key: 'location', label: 'Location', icon: MapPin, type: 'text', placeholder: 'Optional' },
        ].map(({ key, label, icon: Icon, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
            {isEditing ? (
              <>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type={type}
                    value={formData[key as keyof typeof formData]}
                    onChange={e => { setFormData(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: '' })); }}
                    placeholder={placeholder}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-dark-400/50 border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40 ${errors[key] ? 'border-red-500/60' : 'border-primary-500/20'}`}
                  />
                </div>
                {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-dark-400/30 rounded-lg text-sm text-gray-300">
                <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                {formData[key as keyof typeof formData] || <span className="text-gray-500">Not provided</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Organization (read-only) */}
      {user?.organization && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Organization</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-400/20 border border-dashed border-primary-500/20 rounded-lg text-sm text-gray-400">
            <Info className="h-4 w-4 text-primary-400/60 flex-shrink-0" />
            {user.organization}
            <span className="ml-auto text-xs text-gray-600">read-only</span>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary-500/20 text-gray-400 rounded-xl hover:bg-dark-300 transition-colors">
            <X className="h-4 w-4" />Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-400 hover:to-secondary-400 transition-all disabled:opacity-50"
          >
            {isSaving ? <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save Changes</>}
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Security Tab ────────────────────────────────────────── */
const SecuritySettings: React.FC = () => {
  const { user } = useAuthStore();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = 'Current password is required';
    if (!form.newPassword) errs.newPassword = 'New password is required';
    else if (form.newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPassword))
      errs.newPassword = 'Min 8 chars with uppercase, lowercase and number';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm new password';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('userId', user?.id || '');
      fd.append('password', form.newPassword);
      fd.append('name', user?.name || '');
      fd.append('email', user?.email || '');
      fd.append('currentPassword', form.currentPassword);

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/update_profile`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to change password.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Security Settings</h2>
        <p className="text-sm text-gray-400">Manage your password and account security</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-accent-500/10 border-accent-500/20 text-accent-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Change Password */}
      <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary-400" />Change Password
        </h3>

        {/* Current password */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Current Password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={e => { setForm(p => ({ ...p, currentPassword: e.target.value })); setErrors(p => ({ ...p, currentPassword: '' })); }}
            className={`w-full px-3 py-2 text-sm bg-dark-400/50 border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40 ${errors.currentPassword ? 'border-red-500/60' : 'border-primary-500/20'}`}
            placeholder="Enter current password"
          />
          {errors.currentPassword && <p className="mt-1 text-xs text-red-400">{errors.currentPassword}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* New password */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => { setForm(p => ({ ...p, newPassword: e.target.value })); setErrors(p => ({ ...p, newPassword: '' })); }}
                className={`w-full px-3 py-2 pr-9 text-sm bg-dark-400/50 border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40 ${errors.newPassword ? 'border-red-500/60' : 'border-primary-500/20'}`}
                placeholder="Min 8 characters"
              />
              <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-xs text-red-400">{errors.newPassword}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => { setForm(p => ({ ...p, confirmPassword: e.target.value })); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                className={`w-full px-3 py-2 pr-9 text-sm bg-dark-400/50 border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/40 ${errors.confirmPassword ? 'border-red-500/60' : 'border-primary-500/20'}`}
                placeholder="Repeat new password"
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Password strength hint */}
        {form.newPassword && (
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: '8+ chars', pass: form.newPassword.length >= 8 },
              { label: 'Uppercase', pass: /[A-Z]/.test(form.newPassword) },
              { label: 'Lowercase', pass: /[a-z]/.test(form.newPassword) },
              { label: 'Number', pass: /\d/.test(form.newPassword) },
            ].map(({ label, pass }) => (
              <span key={label} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${pass ? 'bg-accent-500/10 border-accent-500/20 text-accent-300' : 'bg-dark-400/40 border-primary-500/10 text-gray-500'}`}>
                <CheckCircle className="h-3 w-3" />{label}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-400 hover:to-secondary-400 transition-all disabled:opacity-50"
          >
            {isSaving ? <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : <><Shield className="h-4 w-4" />Update Password</>}
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-dark-300/40 border border-primary-500/10 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <User className="h-4 w-4 text-primary-400" />Account Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Account Email', value: user?.email },
            { label: 'Role', value: user?.role },
          ].map(item => (
            <div key={item.label} className="bg-dark-400/40 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
              <p className="text-gray-200 font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Settings Page ──────────────────────────────────── */
export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general',       label: 'General',       icon: SettingsIcon },
    { id: 'profile',       label: 'Profile',        icon: User },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
    { id: 'security',      label: 'Security',       icon: Shield },
    ...(user?.role === 'superadmin' ? [{ id: 'transactions', label: 'Transactions', icon: CreditCard }] : [])
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <GradientText>Settings</GradientText>
        </h1>
        <p className="text-gray-400">Manage your system settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 bg-dark-200 rounded-lg p-4 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-dark-200 rounded-lg p-6">
          {activeTab === 'general'       && <GeneralSettings />}
          {activeTab === 'profile'       && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationPreferences />}
          {activeTab === 'security'      && <SecuritySettings />}
          {activeTab === 'transactions'  && user?.role === 'superadmin' && (
            <TransactionList title="System Transactions" />
          )}
        </div>
      </div>
    </div>
  );
};
