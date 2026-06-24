
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { GradientText } from '../../../components/ui/GradientText';
import { StatCard } from '../../../components/ui/StatCard';
import { ActivityChart } from '../components/charts/ActivityChart';
import { RecentOrganizations } from '../components/tables/RecentOrganizations';
import { RecentUsers } from '../components/tables/RecentUsers';
import axios from 'axios';
import {
  Building2,
  Users,
  BookOpen,
  Brain,
  Cloud,
  Award,
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
const StatsGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
    {children}
  </div>
);

const OrgBanner: React.FC<{ orgName: string; subtitle: string }> = ({ orgName, subtitle }) => (
  <div className="glass-panel">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-0.5">
          <GradientText>{orgName}</GradientText>
        </h2>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
      <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary-400 flex-shrink-0" />
    </div>
  </div>
);

const LoadingCards = () => (
  <StatsGrid>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass-panel p-4 sm:p-6 animate-pulse">
        <div className="h-4 w-24 bg-dark-400 rounded mb-3" />
        <div className="h-8 w-16 bg-dark-400 rounded" />
      </div>
    ))}
  </StatsGrid>
);

// ─────────────────────────────────────────────────────────────────────────────
// Trend helper: compares records created this week vs last week via created_at
// Returns { value: percentage, isPositive: bool }
// ─────────────────────────────────────────────────────────────────────────────
const computeTrend = (records: any[]): { value: number; isPositive: boolean } => {
  const now = new Date();
  const msPerDay = 86_400_000;

  const thisWeekStart = new Date(now.getTime() - 7 * msPerDay);
  const lastWeekStart = new Date(now.getTime() - 14 * msPerDay);

  let thisWeek = 0;
  let lastWeek = 0;

  records.forEach((r) => {
    const raw = r.created_at || r.createdAt || r.created_date || r.purchased_at || r.enrolled_at || r.assigned_at;
    if (!raw) return;
    const d = new Date(raw);
    if (d >= thisWeekStart) thisWeek++;
    else if (d >= lastWeekStart) lastWeek++;
  });

  if (lastWeek === 0 && thisWeek === 0) return { value: 0, isPositive: true };
  if (lastWeek === 0) return { value: 100, isPositive: true };  // new this week

  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { value: Math.abs(pct), isPositive: pct >= 0 };
};


// ─────────────────────────────────────────────────────────────────────────────
// Super Admin Overview
// ─────────────────────────────────────────────────────────────────────────────
const SuperAdminOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [orgsRes, usersRes, labsRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/allUsers`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabs`),
        ]);
        const orgList: any[] = orgsRes.status === 'fulfilled' ? (orgsRes.value.data?.data || []) : [];
        const userList: any[] = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || usersRes.value.data?.users || []) : [];
        const labList: any[] = labsRes.status === 'fulfilled' ? (labsRes.value.data?.data || []) : [];

        setStats([
          { label: 'Organizations', value: orgList.length, icon: Building2, gradient: 'from-primary-400 to-primary-600', trend: computeTrend(orgList) },
          { label: 'Total Users', value: userList.length, icon: Users, gradient: 'from-accent-400 to-accent-600', trend: computeTrend(userList) },
          { label: 'Active Labs', value: labList.length, icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600', trend: computeTrend(labList) },
          { label: 'Cloud Resources', value: '—', icon: Cloud, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } catch {
        setStats([
          { label: 'Organizations', value: '—', icon: Building2, gradient: 'from-primary-400 to-primary-600' },
          { label: 'Total Users', value: '—', icon: Users, gradient: 'from-accent-400 to-accent-600' },
          { label: 'Active Labs', value: '—', icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600' },
          { label: 'Cloud Resources', value: '—', icon: Cloud, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      {isLoading ? <LoadingCards /> : (
        <StatsGrid>
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </StatsGrid>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ActivityChart />
        <RecentOrganizations />
      </div>
      <RecentUsers />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Org Super Admin Overview
// ─────────────────────────────────────────────────────────────────────────────
const OrgSuperAdminOverview: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [usersRes, labsRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user?.org_id}`),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllOrgLabs`, { orgId: user?.org_id }),
        ]);

        const userList: any[] = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || []) : [];
        const labList: any[] = labsRes.status === 'fulfilled' ? (labsRes.value.data?.data || []) : [];
        const adminList = userList.filter((u: any) => u.role === 'labadmin');

        setStats([
          { label: 'Organization Users', value: userList.length, icon: Users, gradient: 'from-primary-400 to-primary-600', trend: computeTrend(userList) },
          { label: 'Lab Admins', value: adminList.length, icon: Building2, gradient: 'from-accent-400 to-accent-600', trend: computeTrend(adminList) },
          { label: 'Active Labs', value: labList.length, icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600', trend: computeTrend(labList) },
          { label: 'Lab Catalogue', value: labList.length, icon: Brain, gradient: 'from-primary-400 to-accent-600', trend: computeTrend(labList) },
        ]);
      } catch {
        setStats([
          { label: 'Organization Users', value: '—', icon: Users, gradient: 'from-primary-400 to-primary-600' },
          { label: 'Lab Admins', value: '—', icon: Building2, gradient: 'from-accent-400 to-accent-600' },
          { label: 'Active Labs', value: '—', icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600' },
          { label: 'Lab Catalogue', value: '—', icon: Brain, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user?.org_id]);

  return (
    <>
      <OrgBanner orgName={user?.organization || 'Your Organization'} subtitle="Organization Super Admin Dashboard" />
      {isLoading ? <LoadingCards /> : (
        <StatsGrid>
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </StatsGrid>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ActivityChart />
        <div className="glass-panel">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            <GradientText>Quick Actions</GradientText>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <button onClick={() => navigate('/dashboard/users')} className="w-full btn-secondary justify-start text-gray-200 text-sm">
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />Manage Lab Admins
            </button>
            <button onClick={() => navigate('/dashboard/labs/catalogue')} className="w-full btn-secondary justify-start text-gray-200 text-sm">
              <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />View Lab Catalogue
            </button>
            <button onClick={() => navigate('/dashboard/labs/ai-builder')} className="w-full btn-secondary justify-start text-gray-200 text-sm">
              <Brain className="h-4 w-4 mr-2 flex-shrink-0" />AI Lab Builder
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Org Admin (labadmin) Overview
// ─────────────────────────────────────────────────────────────────────────────
const OrgAdminOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<
    { icon: React.ReactNode; bg: string; text: string; time: string }[]
  >([]);

  // ── Helper: human-readable relative time ───────────────────────────────
  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [usersRes, labsRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user?.org_id}`),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllOrgLabs`, { orgId: user?.org_id }),
        ]);

        const userList: any[] = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || []) : [];
        const labList: any[] = labsRes.status === 'fulfilled' ? (labsRes.value.data?.data || []) : [];

        setStats([
          { label: 'Team Members', value: userList.length, icon: Users, gradient: 'from-primary-400 to-primary-600', trend: computeTrend(userList) },
          { label: 'Active Labs', value: labList.length, icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600', trend: computeTrend(labList) },
          { label: 'Assessments', value: '—', icon: Award, gradient: 'from-accent-400 to-accent-600' },
          { label: 'Workspaces', value: '—', icon: Cloud, gradient: 'from-primary-400 to-accent-600' },
        ]);

        // ── Build real recent activity from fetched data ──────────────────
        type ActivityEntry = { sortKey: number; icon: React.ReactNode; bg: string; text: string; time: string };
        const entries: ActivityEntry[] = [];

        // Recent users joined
        [...userList]
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 3)
          .forEach((u) => {
            const role = u.role === 'labadmin' ? 'Lab Admin' : u.role === 'trainer' ? 'Trainer' : 'Member';
            entries.push({
              sortKey: new Date(u.created_at || 0).getTime(),
              icon: <Users className="h-4 w-4 text-primary-400" />,
              bg: 'bg-primary-500/10',
              text: `${u.name || 'A user'} joined as ${role}`,
              time: u.created_at ? timeAgo(u.created_at) : 'recently',
            });
          });

        // Recent labs created
        [...labList]
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 3)
          .forEach((l) => {
            entries.push({
              sortKey: new Date(l.created_at || 0).getTime(),
              icon: <BookOpen className="h-4 w-4 text-secondary-400" />,
              bg: 'bg-secondary-500/10',
              text: `Lab "${l.title || 'Untitled'}" was created`,
              time: l.created_at ? timeAgo(l.created_at) : 'recently',
            });
          });

        // Sort all entries newest first, show top 5
        const sorted = entries
          .sort((a, b) => b.sortKey - a.sortKey)
          .slice(0, 5)
          .map(({ sortKey: _, ...rest }) => rest);

        setRecentActivity(
          sorted.length > 0
            ? sorted
            : [
              { icon: <Award className="h-4 w-4 text-accent-400" />, bg: 'bg-accent-500/10', text: 'No recent activity yet', time: '' },
            ]
        );
      } catch {
        setStats([
          { label: 'Team Members', value: '—', icon: Users, gradient: 'from-primary-400 to-primary-600' },
          { label: 'Active Labs', value: '—', icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600' },
          { label: 'Assessments', value: '—', icon: Award, gradient: 'from-accent-400 to-accent-600' },
          { label: 'Workspaces', value: '—', icon: Cloud, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user?.org_id]);

  return (
    <>
      <OrgBanner orgName={user?.organization || 'Your Team'} subtitle="Lab Admin Dashboard" />
      {isLoading ? <LoadingCards /> : (
        <StatsGrid>
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </StatsGrid>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ActivityChart />
        <div className="glass-panel">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            <GradientText>Recent Activity</GradientText>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className={`flex items-start space-x-3 ${i < 2 ? 'pb-3 border-b border-primary-500/10' : ''}`}>
                <div className={`p-2 ${item.bg} rounded-lg flex-shrink-0`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Trainer Overview
// ─────────────────────────────────────────────────────────────────────────────
const TrainerOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [usersRes, labsRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user?.org_id}`),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabCatalogues`, { user }),
        ]);
        const allOrgUsers: any[] = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || []) : [];
        const students = allOrgUsers.filter((u: any) => u.role === 'user');
        const labList: any[] = labsRes.status === 'fulfilled' ? (labsRes.value.data?.data || []) : [];

        setStats([
          { label: 'Students', value: students.length, icon: GraduationCap, gradient: 'from-primary-400 to-primary-600', trend: computeTrend(students) },
          { label: 'Active Labs', value: labList.length, icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600', trend: computeTrend(labList) },
          { label: 'Assessments', value: '—', icon: Award, gradient: 'from-accent-400 to-accent-600' },
          { label: 'Avg Progress', value: '67%', icon: TrendingUp, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } catch {
        setStats([
          { label: 'Students', value: '—', icon: GraduationCap, gradient: 'from-primary-400 to-primary-600' },
          { label: 'Active Labs', value: '—', icon: BookOpen, gradient: 'from-secondary-400 to-secondary-600' },
          { label: 'Assessments', value: '—', icon: Award, gradient: 'from-accent-400 to-accent-600' },
          { label: 'Avg Progress', value: '67%', icon: TrendingUp, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user?.org_id]);

  const students = [
    { initials: 'JS', name: 'John Smith', level: 'Advanced Labs', pct: '92%', color: 'text-primary-400' },
    { initials: 'ED', name: 'Emma Davis', level: 'Intermediate Labs', pct: '78%', color: 'text-secondary-400' },
  ];

  return (
    <>
      {isLoading ? <LoadingCards /> : (
        <StatsGrid>
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </StatsGrid>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-panel">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            <GradientText>Student Performance</GradientText>
          </h3>
          <div className="space-y-3">
            {students.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs sm:text-sm font-semibold">{s.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.level}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${s.color}`}>{s.pct}</p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            <GradientText>Quick Actions</GradientText>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full btn-secondary justify-start text-sm">
              <GraduationCap className="h-4 w-4 mr-2 flex-shrink-0" />View All Students
            </button>
            <button className="w-full btn-secondary justify-start text-sm">
              <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />Create New Lab
            </button>
            <button className="w-full btn-secondary justify-start text-sm">
              <Award className="h-4 w-4 mr-2 flex-shrink-0" />Manage Assessments
            </button>
          </div>
        </div>
      </div>
      <ActivityChart />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// User Overview
// ─────────────────────────────────────────────────────────────────────────────
const UserOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllUserPurchasedLabs`,
          { userId: user?.id }
        );
        const enrolledLabs: any[] = res.data?.data || [];
        const completed = enrolledLabs.filter((l: any) => l.status === 'completed').length;
        const inProgress = enrolledLabs.filter((l: any) => l.status !== 'completed').length;
        const pct = enrolledLabs.length > 0 ? Math.round((completed / enrolledLabs.length) * 100) : 0;

        const completedLabs = enrolledLabs.filter((l: any) => l.status === 'completed');
        const inProgressLabs = enrolledLabs.filter((l: any) => l.status !== 'completed');

        setStats([
          { label: 'Labs Enrolled', value: enrolledLabs.length, icon: BookOpen, gradient: 'from-primary-400 to-primary-600', trend: computeTrend(enrolledLabs) },
          { label: 'In Progress', value: inProgress, icon: Clock, gradient: 'from-accent-400 to-accent-600', trend: computeTrend(inProgressLabs) },
          { label: 'Completed', value: completed, icon: CheckCircle, gradient: 'from-secondary-400 to-secondary-600', trend: computeTrend(completedLabs) },
          { label: 'Learning Path', value: `${pct}%`, icon: TrendingUp, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } catch {
        setStats([
          { label: 'Labs Enrolled', value: '—', icon: BookOpen, gradient: 'from-primary-400 to-primary-600' },
          { label: 'In Progress', value: '—', icon: Clock, gradient: 'from-accent-400 to-accent-600' },
          { label: 'Completed', value: '—', icon: CheckCircle, gradient: 'from-secondary-400 to-secondary-600' },
          { label: 'Learning Path', value: '—', icon: TrendingUp, gradient: 'from-primary-400 to-accent-600' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  const activeLabs = [
    { name: 'AWS Cloud Fundamentals', pct: 65, badge: 'In Progress', badgeColor: 'text-primary-400 bg-primary-500/10' },
    { name: 'Docker & Kubernetes', pct: 40, badge: 'In Progress', badgeColor: 'text-secondary-400 bg-secondary-500/10' },
  ];

  const recommended = [
    { icon: <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary-400 flex-shrink-0" />, name: 'AI & Machine Learning', desc: 'Based on your progress' },
    { icon: <Cloud className="h-7 w-7 sm:h-8 sm:w-8 text-secondary-400 flex-shrink-0" />, name: 'Advanced Networking', desc: 'Next in learning path' },
  ];

  return (
    <>
      {isLoading ? <LoadingCards /> : (
        <StatsGrid>
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </StatsGrid>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-panel">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            <GradientText>My Active Labs</GradientText>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {activeLabs.map((lab) => (
              <div key={lab.name} className="p-3 sm:p-4 bg-dark-300/30 rounded-lg border border-primary-500/10 hover:border-primary-500/30 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-medium text-gray-200 text-sm truncate">{lab.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${lab.badgeColor}`}>{lab.badge}</span>
                </div>
                <div className="w-full bg-dark-400 rounded-full h-1.5 sm:h-2 mb-1.5">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${lab.pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{lab.pct}% Complete</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            <GradientText>Recommended Labs</GradientText>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {recommended.map((lab) => (
              <div key={lab.name} className="p-3 bg-dark-300/30 rounded-lg border border-primary-500/10 hover:border-primary-500/30 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  {lab.icon}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-200 truncate">{lab.name}</h4>
                    <p className="text-xs text-gray-400">{lab.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="glass-panel">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          <GradientText>My Learning Progress</GradientText>
        </h3>
        <ActivityChart />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Overview Component
// ─────────────────────────────────────────────────────────────────────────────
export const Overview: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  const renderOverview = () => {
    switch (user?.role) {
      case 'superadmin': return <SuperAdminOverview />;
      case 'orgsuperadmin': return <OrgSuperAdminOverview />;
      case 'labadmin': return <OrgAdminOverview />;
      case 'trainer': return <TrainerOverview />;
      case 'user': return <UserOverview />;
      default: return <UserOverview />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl text-gray-200 font-display font-bold leading-tight">
        Welcome back,{' '}
        <GradientText>{user?.name}</GradientText>!
      </h1>
      {renderOverview()}
    </div>
  );
};
