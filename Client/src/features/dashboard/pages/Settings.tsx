import React from 'react';
import { Settings as SettingsIcon, CreditCard, User, Bell, Shield } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { TransactionList } from '../../../components/transactions/TransactionList';
import { useAuthStore } from '../../../store/authStore';
import { useState } from 'react';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
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
        <div className="lg:w-64 bg-dark-200 rounded-lg p-4">
          <nav className="space-y-2">
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
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-dark-200 rounded-lg p-6">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">General Settings</h2>
              <p className="text-gray-400">Basic system configuration and preferences</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Profile Settings</h2>
              <p className="text-gray-400">Manage your profile information</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Notification Settings</h2>
              <p className="text-gray-400">Configure your notification preferences</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
              <p className="text-gray-400">Manage security settings and access controls</p>
            </div>
          )}

          {activeTab === 'transactions' && user?.role === 'superadmin' && (
            <div>
              <TransactionList title="System Transactions" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};