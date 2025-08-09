
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Save,
  Moon,
  AlertCircle,
  Check
} from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { NotificationTypeLabels, RoleNotificationTypes, NotificationType } from '../../types/notifications';
import { GradientText } from '../ui/GradientText';

export const NotificationPreferences: React.FC = () => {
  const { user } = useAuthStore();
  const { preferences, fetchPreferences, updatePreferences } = useNotificationStore();
  
  const [localPreferences, setLocalPreferences] = useState({
    emailNotifications: {} as Record<NotificationType, boolean>,
    pushNotifications: {} as Record<NotificationType, boolean>,
    inAppNotifications: {} as Record<NotificationType, boolean>,
    digestFrequency: 'daily' as 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        emailNotifications: preferences.emailNotifications || {},
        pushNotifications: preferences.pushNotifications || {},
        inAppNotifications: preferences.inAppNotifications || {},
        digestFrequency: preferences.digestFrequency || 'daily',
        quietHours: preferences.quietHours || {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      });
    }
  }, [preferences]);

  const availableNotificationTypes = user?.role ? RoleNotificationTypes[user.role] || [] : [];

  const handleNotificationToggle = (
    category: 'emailNotifications' | 'pushNotifications' | 'inAppNotifications',
    type: NotificationType,
    enabled: boolean
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: enabled
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);
    
    try {
      await updatePreferences(localPreferences);
      setNotification({ type: 'success', message: 'Notification preferences saved successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save preferences. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkToggle = (
    category: 'emailNotifications' | 'pushNotifications' | 'inAppNotifications',
    enableAll: boolean
  ) => {
    const updatedCategory = availableNotificationTypes.reduce((acc, type) => {
      acc[type] = enableAll;
      return acc;
    }, {} as Record<NotificationType, boolean>);
    
    setLocalPreferences(prev => ({
      ...prev,
      [category]: updatedCategory
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-700 pb-6">
        <h2 className="text-2xl font-bold mb-2">
          <GradientText>Notification Preferences</GradientText>
        </h2>
        <p className="text-gray-400">
          Configure how and when you want to receive notifications
        </p>
      </div>

      {/* Notification Methods */}
      <div className="space-y-6">
        {/* In-App Notifications */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-primary-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">In-App Notifications</h3>
                <p className="text-sm text-gray-400">Notifications within the application</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkToggle('inAppNotifications', true)}
                className="text-xs px-3 py-1 bg-primary-500/20 text-primary-300 rounded hover:bg-primary-500/30"
              >
                Enable All
              </button>
              <button
                onClick={() => handleBulkToggle('inAppNotifications', false)}
                className="text-xs px-3 py-1 bg-gray-500/20 text-gray-300 rounded hover:bg-gray-500/30"
              >
                Disable All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableNotificationTypes.map(type => (
              <label key={type} className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg hover:bg-dark-400/50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-300">{NotificationTypeLabels[type]}</span>
                <input
                  type="checkbox"
                  checked={localPreferences.inAppNotifications[type] || false}
                  onChange={(e) => handleNotificationToggle('inAppNotifications', type, e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-dark-400 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Email Notifications */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
                <p className="text-sm text-gray-400">Receive notifications via email</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkToggle('emailNotifications', true)}
                className="text-xs px-3 py-1 bg-primary-500/20 text-primary-300 rounded hover:bg-primary-500/30"
              >
                Enable All
              </button>
              <button
                onClick={() => handleBulkToggle('emailNotifications', false)}
                className="text-xs px-3 py-1 bg-gray-500/20 text-gray-300 rounded hover:bg-gray-500/30"
              >
                Disable All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableNotificationTypes.map(type => (
              <label key={type} className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg hover:bg-dark-400/50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-300">{NotificationTypeLabels[type]}</span>
                <input
                  type="checkbox"
                  checked={localPreferences.emailNotifications[type] || false}
                  onChange={(e) => handleNotificationToggle('emailNotifications', type, e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-dark-400 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-6 w-6 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
                <p className="text-sm text-gray-400">Browser push notifications</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkToggle('pushNotifications', true)}
                className="text-xs px-3 py-1 bg-primary-500/20 text-primary-300 rounded hover:bg-primary-500/30"
              >
                Enable All
              </button>
              <button
                onClick={() => handleBulkToggle('pushNotifications', false)}
                className="text-xs px-3 py-1 bg-gray-500/20 text-gray-300 rounded hover:bg-gray-500/30"
              >
                Disable All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableNotificationTypes.map(type => (
              <label key={type} className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg hover:bg-dark-400/50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-300">{NotificationTypeLabels[type]}</span>
                <input
                  type="checkbox"
                  checked={localPreferences.pushNotifications[type] || false}
                  onChange={(e) => handleNotificationToggle('pushNotifications', type, e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-dark-400 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digest Frequency */}
        <div className="glass-panel p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Email Digest</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { value: 'immediate', label: 'Immediate' },
              { value: 'hourly', label: 'Hourly' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'never', label: 'Never' }
            ].map(option => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="digestFrequency"
                  value={option.value}
                  checked={localPreferences.digestFrequency === option.value}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    digestFrequency: e.target.value as any
                  }))}
                  className="w-4 h-4 text-primary-500 bg-dark-400 border-gray-600 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="glass-panel p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Moon className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Quiet Hours</h3>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.quietHours.enabled}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  quietHours: {
                    ...prev.quietHours,
                    enabled: e.target.checked
                  }
                }))}
                className="w-4 h-4 text-primary-500 bg-dark-400 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm text-gray-300">Enable quiet hours</span>
            </label>
            
            {localPreferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                  <input
                    type="time"
                    value={localPreferences.quietHours.startTime}
                    onChange={(e) => setLocalPreferences(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        startTime: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">To</label>
                  <input
                    type="time"
                    value={localPreferences.quietHours.endTime}
                    onChange={(e) => setLocalPreferences(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        endTime: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/20 border border-emerald-500/20' 
            : 'bg-red-500/20 border border-red-500/20'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
          <span className={`text-sm ${
            notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {notification.message}
          </span>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
