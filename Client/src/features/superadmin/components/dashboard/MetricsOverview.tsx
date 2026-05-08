import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Cloud, CreditCard, Building2, Loader } from 'lucide-react';
import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetricCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  details: { label: string; value: string | number }[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MetricsOverview: React.FC = () => {
  const [cards, setCards] = useState<MetricCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const [orgsRes, usersRes, labsRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/allUsers`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabs`),
        ]);

        // ── Organizations ────────────────────────────────────────────────────
        const orgList: any[] =
          orgsRes.status === 'fulfilled' ? orgsRes.value.data?.data || [] : [];

        // ── Users ─────────────────────────────────────────────────────────────
        const userList: any[] =
          usersRes.status === 'fulfilled'
            ? usersRes.value.data?.data || usersRes.value.data?.users || []
            : [];

        const trainers = userList.filter((u) => u.role === 'trainer').length;
        const labAdmins = userList.filter((u) => u.role === 'labadmin').length;
        const orgAdmins = userList.filter((u) => u.role === 'orgsuperadmin').length;
        const regularUsers = userList.filter((u) => u.role === 'user').length;

        // ── Labs ──────────────────────────────────────────────────────────────
        const labList: any[] =
          labsRes.status === 'fulfilled' ? labsRes.value.data?.data || [] : [];

        const totalLabs = labList.length;
        const freeLabs = labList.filter((l) => l.isfree).length;
        const paidLabs = labList.filter((l) => !l.isfree).length;

        // ── Revenue (computed from paid lab prices) ───────────────────────────
        const totalRevenue = labList.reduce((sum, l) => {
          const price = parseFloat(l.price) || 0;
          const enrollments = l.total_enrollments || 0;
          return sum + price * enrollments;
        }, 0);

        setCards([
          {
            title: 'Total Users',
            value: userList.length.toLocaleString(),
            change: '+12%',
            isPositive: true,
            icon: Users,
            details: [
              { label: 'Trainers', value: trainers },
              { label: 'Lab Admins', value: labAdmins },
              { label: 'Org Admins', value: orgAdmins },
              { label: 'Learners', value: regularUsers },
            ],
          },
          {
            title: 'Organizations',
            value: orgList.length.toLocaleString(),
            change: '+8%',
            isPositive: true,
            icon: Building2,
            details: [
              { label: 'Total', value: orgList.length },
              { label: 'Active', value: orgList.filter((o) => o.status !== 'inactive').length },
            ],
          },
          {
            title: 'Lab Catalogue',
            value: totalLabs.toLocaleString(),
            change: '+5%',
            isPositive: true,
            icon: BookOpen,
            details: [
              { label: 'Free Labs', value: freeLabs },
              { label: 'Paid Labs', value: paidLabs },
            ],
          },
          {
            title: 'Est. Revenue',
            value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            change: '+15%',
            isPositive: true,
            icon: CreditCard,
            details: [
              { label: 'From Labs', value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
              { label: 'Paid Enroll', value: labList.reduce((s, l) => s + (l.total_enrollments || 0), 0) },
            ],
          },
        ]);
      } catch (err) {
        console.error('MetricsOverview fetch error:', err);
        // Fallback: all zeros
        setCards([
          { title: 'Total Users', value: '0', change: '—', isPositive: true, icon: Users, details: [] },
          { title: 'Organizations', value: '0', change: '—', isPositive: true, icon: Building2, details: [] },
          { title: 'Lab Catalogue', value: '0', change: '—', isPositive: true, icon: BookOpen, details: [] },
          { title: 'Est. Revenue', value: '₹0', change: '—', isPositive: true, icon: CreditCard, details: [] },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // ── Skeleton loader ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="dashboard-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="data-card animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-dark-400 rounded" />
                <div className="h-8 w-16 bg-dark-400 rounded" />
                <div className="h-3 w-10 bg-dark-400 rounded" />
              </div>
              <div className="p-3 rounded-lg bg-dark-400 h-12 w-12" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {[1, 2].map((k) => (
                <div key={k} className="space-y-1">
                  <div className="h-2.5 w-16 bg-dark-400 rounded" />
                  <div className="h-3.5 w-10 bg-dark-400 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-grid">
      {cards.map((card) => (
        <div key={card.title} className="data-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{card.title}</p>
              <p className="stat-value mt-2">{card.value}</p>
              <span
                className={`inline-flex items-center text-sm mt-1 ${card.isPositive ? 'text-green-400' : 'text-red-400'
                  }`}
              >
                {card.change}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary-500/10 to-secondary-500/10 group-hover:from-primary-500/20 group-hover:to-secondary-500/20 transition-colors">
              <card.icon className="h-6 w-6 text-primary-400 group-hover:text-primary-300 transition-colors" />
            </div>
          </div>

          {card.details.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {card.details.map((detail) => (
                <div key={detail.label} className="text-sm">
                  <p className="text-gray-500">{detail.label}</p>
                  <p className="font-medium text-gray-300">{detail.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};