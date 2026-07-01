import React, { useEffect, useState, useCallback } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Activity, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../../../store/authStore';

interface DayActivity {
  day: string;        // e.g. "Mon"
  date: string;       // e.g. "Mar 24"
  labs: number;       // labs created on this day
  users: number;      // users registered on this day
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the last 7 days as { dayLabel, dateLabel, isoDate } ordered oldest → newest */
const getLast7Days = () => {
  const days: { dayLabel: string; dateLabel: string; isoDate: string }[] = [];
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dayLabel: DAY_NAMES[d.getDay()],
      dateLabel: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
      isoDate: d.toISOString().split('T')[0], // "YYYY-MM-DD"
    });
  }
  return days;
};

/** Count records per ISO date string from a list of objects with created_at field */
const countByDay = (
  records: any[],
  last7: { isoDate: string }[]
): Record<string, number> => {
  const counts: Record<string, number> = {};
  last7.forEach(({ isoDate }) => (counts[isoDate] = 0));

  records.forEach((r) => {
    const raw = r.created_at || r.createdAt || r.createddate || r.created_date || r.purchased_at || r.enrolled_at || r.assigned_at || r.start_date;
    if (!raw) return;
    const isoDate = new Date(raw).toISOString().split('T')[0];
    if (isoDate in counts) {
      counts[isoDate]++;
    }
  });

  return counts;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ActivityChart: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<DayActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [labLabel, setLabLabel] = useState('Labs');
  const [userLabel, setUserLabel] = useState('Users');

  const fetchAndCompute = useCallback(async () => {
    setIsLoading(true);
    const last7 = getLast7Days();

    try {
      let labRecords: any[] = [];
      let userRecords: any[] = [];
      if (user?.role === 'superadmin') {
        // Superadmin: all labs + all users
        setLabLabel('Labs Created');
        setUserLabel('Users Registered');

        const [labsRes, usersRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabs`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/allUsers`),
        ]);
        
        labRecords = labsRes.status === 'fulfilled' ? (labsRes.value.data?.data || []) : [];
        userRecords = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || usersRes.value.data?.users || []) : [];

      } else if (user?.org_id) {
        // Org-scoped roles: org labs + org users
        setLabLabel('Labs Created');
        setUserLabel('Users Joined');

        const [labsRes, usersRes] = await Promise.allSettled([
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllOrgLabs`, { orgId: user.org_id }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user.org_id}`),
        ]);

        labRecords = labsRes.status === 'fulfilled' ? (labsRes.value.data?.data || []) : [];
        userRecords = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || []) : [];

      } else {
        // Regular user: labs enrolled + labs completed as sessions
        setLabLabel('Labs Enrolled');
        setUserLabel('Completed');

        const [labsRes, cloudRes] = await Promise.allSettled([
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getUserDashboardLabs`, { userId: user?.id }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserCloudSlices/${user?.id}`),
        ]);

        const dashLabs = labsRes.status === 'fulfilled' ? (labsRes.value.data?.data || []) : [];
        const cloudLabs = cloudRes.status === 'fulfilled'
          ? (cloudRes.value.data?.data || []).map((l: any) => ({
              ...l,
              assigned_at: l.startdate || l.start_date,
            }))
          : [];

        // Normalize date to enrollment date (assigned_at/start_date), not lab creation date
        labRecords = [...dashLabs, ...cloudLabs].map((l: any) => ({
          ...l,
          created_at: l.assigned_at || l.enrolled_at || l.start_date || l.startdate,
        }));

        // Sessions = labs the user completed, counted by completion/update date
        userRecords = [...dashLabs, ...cloudLabs]
          .filter((l: any) => l.status === 'completed')
          .map((l: any) => ({
            ...l,
            created_at: l.completed_at || l.updated_at || l.end_date || l.enddate,
          }));
      }

      // ── Count per day using created_at ────────────────────────────────────
      
      const labCounts = countByDay(labRecords, last7);
      const userCounts = countByDay(userRecords, last7);

      const result: DayActivity[] = last7.map(({ dayLabel, dateLabel, isoDate }) => ({
        day: dayLabel,
        date: dateLabel,
        labs: labCounts[isoDate] || 0,
        users: userCounts[isoDate] || 0,
      }));
      setData(result);
    } catch (err) {
      console.error('ActivityChart fetch error:', err);
      // Zero-fill fallback (no random data — honest empty state)
      setData(last7.map(({ dayLabel, dateLabel }) => ({ day: dayLabel, date: dateLabel, labs: 0, users: 0 })));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, user?.org_id]);

  useEffect(() => {
    fetchAndCompute();
  }, [fetchAndCompute]);

  const maxVal = Math.max(...data.map((d) => Math.max(d.labs, d.users)), 1);
  const totalLabs = data.reduce((s, d) => s + d.labs, 0);
  const totalUsers = data.reduce((s, d) => s + d.users, 0);
  const isEmpty = totalLabs === 0 && totalUsers === 0;

  return (
    <div className="glass-panel p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-base sm:text-xl font-semibold">
            <GradientText>Weekly Activity</GradientText>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 7 days · {user?.role === 'user' ? 'grouped by enrollment date' : 'grouped by creation date'}</p>
        </div>
        <Activity className="h-5 w-5 text-primary-400 flex-shrink-0" />
      </div>

      {/* Legend pills */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0" />
          <span className="text-xs text-gray-400">
            {labLabel} <span className="text-white font-semibold">{totalLabs}</span>
          </span>
        </div>
        {totalUsers > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-500 flex-shrink-0" />
            <span className="text-xs text-gray-400">
              {userLabel} <span className="text-white font-semibold">{totalUsers}</span>
            </span>
          </div>
        )}
        {!isEmpty && (
          <div className="flex items-center gap-1 ml-auto text-green-400 text-xs font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>This week</span>
          </div>
        )}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-40 sm:h-52 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : isEmpty ? (
        <div className="h-40 sm:h-52 flex flex-col items-center justify-center gap-2 text-gray-500">
          <Activity className="h-8 w-8 opacity-30" />
          <p className="text-sm">No activity this week</p>
        </div>
      ) : (
        <div className="h-40 sm:h-52 flex items-end justify-between gap-1 sm:gap-2 px-1">
          {data.map((d, i) => {
            const labH = maxVal > 0 ? (d.labs / maxVal) * 100 : 0;
            const userH = maxVal > 0 ? (d.users / maxVal) * 100 : 0;
            const isActive = activeBar === i;

            return (
              <div
                key={d.day + i}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group relative"
                onMouseEnter={() => setActiveBar(i)}
                onMouseLeave={() => setActiveBar(null)}
              >
                {/* Tooltip */}
                {isActive && (
                  <div className="absolute bottom-full mb-2 bg-dark-200 border border-primary-500/20 rounded-lg px-2.5 py-2 text-xs shadow-xl z-20 whitespace-nowrap pointer-events-none">
                    <p className="text-gray-400 font-medium mb-1">{d.date}</p>
                    <p className="text-primary-300">
                      {labLabel}: <span className="text-white font-bold">{d.labs}</span>
                    </p>
                    {totalUsers > 0 && (
                      <p className="text-secondary-300">
                        {userLabel}: <span className="text-white font-bold">{d.users}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Bars */}
                <div className="w-full flex items-end gap-0.5 sm:gap-1 h-36 sm:h-48">
                  {/* Labs bar */}
                  <div
                    className={`flex-1 rounded-t-md transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      }`}
                    style={{
                      height: `${Math.max(labH, d.labs > 0 ? 4 : 0)}%`,
                      background: isActive
                        ? 'linear-gradient(to top, #6366f1, #a78bfa)'
                        : 'linear-gradient(to top, #6366f1aa, #a78bfaaa)',
                    }}
                  />
                  {/* Users bar — only render if users data is meaningful */}
                  {totalUsers > 0 && (
                    <div
                      className={`flex-1 rounded-t-md transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                        }`}
                      style={{
                        height: `${Math.max(userH, d.users > 0 ? 4 : 0)}%`,
                        background: isActive
                          ? 'linear-gradient(to top, #06b6d4, #22d3ee)'
                          : 'linear-gradient(to top, #06b6d4aa, #22d3eeaa)',
                      }}
                    />
                  )}
                </div>

                {/* Day label */}
                <span className={`text-[10px] sm:text-xs mt-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};