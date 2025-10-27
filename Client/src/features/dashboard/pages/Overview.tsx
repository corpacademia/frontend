
import React from 'react';
import { useAuthStore } from '../../../store/authStore';
import { GradientText } from '../../../components/ui/GradientText';
import { StatCard } from '../../../components/ui/StatCard';
import { ActivityChart } from '../components/charts/ActivityChart';
import { RecentOrganizations } from '../components/tables/RecentOrganizations';
import { RecentUsers } from '../components/tables/RecentUsers';
import { Building2, Users, BookOpen, Brain, Cloud, Award, GraduationCap, TrendingUp, Clock, CheckCircle } from 'lucide-react';

// Super Admin Overview
const SuperAdminOverview: React.FC = () => {
  const stats = [
    { 
      label: 'Organizations', 
      value: '24', 
      icon: Building2, 
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 12, isPositive: true }
    },
    { 
      label: 'Total Users', 
      value: '2.4k', 
      icon: Users, 
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 8, isPositive: true }
    },
    { 
      label: 'Active Labs', 
      value: '156', 
      icon: BookOpen, 
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 24, isPositive: true }
    },
    { 
      label: 'Cloud Resources', 
      value: '1.2k', 
      icon: Cloud, 
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 5, isPositive: false }
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        <RecentOrganizations />
      </div>

      <RecentUsers />
    </>
  );
};

// Org Super Admin Overview
const OrgSuperAdminOverview: React.FC = () => {
  const { user } = useAuthStore();
  
  const stats = [
    { 
      label: 'Organization Users', 
      value: '186', 
      icon: Users, 
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 15, isPositive: true }
    },
    { 
      label: 'Org Admins', 
      value: '12', 
      icon: Building2, 
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 2, isPositive: true }
    },
    { 
      label: 'Active Workspaces', 
      value: '45', 
      icon: BookOpen, 
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 8, isPositive: true }
    },
    { 
      label: 'Lab Catalogue', 
      value: '89', 
      icon: Brain, 
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 12, isPositive: true }
    },
  ];

  return (
    <>
      <div className="glass-panel mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              {user?.organization || 'Your Organization'}
            </h2>
            <p className="text-gray-400">Organization Super Admin Dashboard</p>
          </div>
          <Building2 className="h-12 w-12 text-primary-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-4">
            <GradientText>Quick Actions</GradientText>
          </h3>
          <div className="space-y-3">
            <button className="w-full btn-secondary justify-start">
              <Users className="h-4 w-4 mr-2" />
              Manage Lab Admins
            </button>
            <button className="w-full btn-secondary justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              View Lab Catalogue
            </button>
            <button className="w-full btn-secondary justify-start">
              <Brain className="h-4 w-4 mr-2" />
              AI Lab Builder
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Org Admin Overview
const OrgAdminOverview: React.FC = () => {
  const { user } = useAuthStore();
  
  const stats = [
    { 
      label: 'Team Members', 
      value: '48', 
      icon: Users, 
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 6, isPositive: true }
    },
    { 
      label: 'Active Labs', 
      value: '23', 
      icon: BookOpen, 
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 4, isPositive: true }
    },
    { 
      label: 'Assessments', 
      value: '15', 
      icon: Award, 
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 3, isPositive: true }
    },
    { 
      label: 'Workspaces', 
      value: '12', 
      icon: Cloud, 
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 2, isPositive: true }
    },
  ];

  return (
    <>
      <div className="glass-panel mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              {user?.organization || 'Your Team'}
            </h2>
            <p className="text-gray-400">Lab Admin Dashboard</p>
          </div>
          <Building2 className="h-12 w-12 text-primary-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-4">
            <GradientText>Recent Activity</GradientText>
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 pb-3 border-b border-primary-500/10">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <Users className="h-4 w-4 text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-200">New team member added</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 pb-3 border-b border-primary-500/10">
              <div className="p-2 bg-secondary-500/10 rounded-lg">
                <BookOpen className="h-4 w-4 text-secondary-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-200">Lab workspace created</p>
                <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-accent-500/10 rounded-lg">
                <Award className="h-4 w-4 text-accent-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-200">Assessment completed</p>
                <p className="text-xs text-gray-400 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Trainer Overview
const TrainerOverview: React.FC = () => {
  const stats = [
    { 
      label: 'Students', 
      value: '34', 
      icon: GraduationCap, 
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 8, isPositive: true }
    },
    { 
      label: 'Active Labs', 
      value: '12', 
      icon: BookOpen, 
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 3, isPositive: true }
    },
    { 
      label: 'Assessments', 
      value: '8', 
      icon: Award, 
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 2, isPositive: true }
    },
    { 
      label: 'Avg Progress', 
      value: '67%', 
      icon: TrendingUp, 
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 12, isPositive: true }
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-4">
            <GradientText>Student Performance</GradientText>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">JS</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">John Smith</p>
                  <p className="text-xs text-gray-400">Advanced Labs</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary-400">92%</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">ED</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Emma Davis</p>
                  <p className="text-xs text-gray-400">Intermediate Labs</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-secondary-400">78%</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-4">
            <GradientText>Quick Actions</GradientText>
          </h3>
          <div className="space-y-3">
            <button className="w-full btn-secondary justify-start">
              <GraduationCap className="h-4 w-4 mr-2" />
              View All Students
            </button>
            <button className="w-full btn-secondary justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              Create New Lab
            </button>
            <button className="w-full btn-secondary justify-start">
              <Award className="h-4 w-4 mr-2" />
              Manage Assessments
            </button>
          </div>
        </div>
      </div>

      <ActivityChart />
    </>
  );
};

// User Overview
const UserOverview: React.FC = () => {
  const stats = [
    { 
      label: 'Labs Enrolled', 
      value: '8', 
      icon: BookOpen, 
      gradient: 'from-primary-400 to-primary-600',
      trend: { value: 2, isPositive: true }
    },
    { 
      label: 'In Progress', 
      value: '3', 
      icon: Clock, 
      gradient: 'from-accent-400 to-accent-600',
      trend: { value: 1, isPositive: true }
    },
    { 
      label: 'Completed', 
      value: '5', 
      icon: CheckCircle, 
      gradient: 'from-secondary-400 to-secondary-600',
      trend: { value: 2, isPositive: true }
    },
    { 
      label: 'Learning Path', 
      value: '62%', 
      icon: TrendingUp, 
      gradient: 'from-primary-400 to-accent-600',
      trend: { value: 15, isPositive: true }
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-4">
            <GradientText>My Active Labs</GradientText>
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-dark-300/30 rounded-lg border border-primary-500/10 hover:border-primary-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-200">AWS Cloud Fundamentals</h4>
                <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-1 rounded">In Progress</span>
              </div>
              <div className="w-full bg-dark-400 rounded-full h-2 mb-2">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-gray-400">65% Complete</p>
            </div>
            <div className="p-4 bg-dark-300/30 rounded-lg border border-primary-500/10 hover:border-primary-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-200">Docker & Kubernetes</h4>
                <span className="text-xs text-secondary-400 bg-secondary-500/10 px-2 py-1 rounded">In Progress</span>
              </div>
              <div className="w-full bg-dark-400 rounded-full h-2 mb-2">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
              <p className="text-xs text-gray-400">40% Complete</p>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-4">
            <GradientText>Recommended Labs</GradientText>
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-dark-300/30 rounded-lg border border-primary-500/10 hover:border-primary-500/30 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8 text-primary-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-200">AI & Machine Learning</h4>
                  <p className="text-xs text-gray-400">Based on your progress</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-dark-300/30 rounded-lg border border-primary-500/10 hover:border-primary-500/30 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <Cloud className="h-8 w-8 text-secondary-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-200">Advanced Networking</h4>
                  <p className="text-xs text-gray-400">Next in learning path</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 className="text-lg font-semibold mb-4">
          <GradientText>My Learning Progress</GradientText>
        </h3>
        <ActivityChart />
      </div>
    </>
  );
};

// Main Overview Component
export const Overview: React.FC = () => {
  const { user } = useAuthStore();

  const renderOverview = () => {
    switch (user?.role) {
      case 'superadmin':
        return <SuperAdminOverview />;
      case 'orgsuperadmin':
        return <OrgSuperAdminOverview />;
      case 'labadmin':
        return <OrgAdminOverview />;
      case 'trainer':
        return <TrainerOverview />;
      case 'user':
        return <UserOverview />;
      default:
        return <UserOverview />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-gray-200 font-display font-bold">
        Welcome back, <GradientText>{user?.name}</GradientText>!
      </h1>
      
      {renderOverview()}
    </div>
  );
};
