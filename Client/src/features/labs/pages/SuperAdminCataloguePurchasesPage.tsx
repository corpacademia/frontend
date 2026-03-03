import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2,
    BookOpen,
    Calendar,
    Users,
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Filter,
    Loader,
    ShoppingBag,
    ArrowUpRight,
    Bell,
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { ApproveExtensionModal, ExtensionRequest } from '../components/catalogue/ApproveExtensionModal';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';
import { initSocket } from '../../../store/socketService';

/* ── Demo / mock data shown when backend is unavailable ── */
// const DEMO_PURCHASES: PurchaseRecord[] = [
//     {
//         purchased_id: 'purch-001',
//         lab_id: 'lab-aws-01',
//         lab_title: 'AWS Cloud Fundamentals',
//         org_id: 'org-001',
//         org_name: 'TechCorp Solutions',
//         number_of_days: 90,
//         number_of_users: 50,
//         assigned_users: 32,
//         purchase_date: '2026-01-15T09:00:00Z',
//         expiry_date: '2026-04-15T09:00:00Z',
//         status: 'active',
//     },
//     {
//         purchased_id: 'purch-002',
//         lab_id: 'lab-k8s-02',
//         lab_title: 'Kubernetes & Docker Mastery',
//         org_id: 'org-002',
//         org_name: 'Innovate Labs Pvt Ltd',
//         number_of_days: 60,
//         number_of_users: 30,
//         assigned_users: 30,
//         purchase_date: '2025-12-01T11:00:00Z',
//         expiry_date: '2026-01-31T11:00:00Z',
//         status: 'expired',
//     },
//     {
//         purchased_id: 'purch-003',
//         lab_id: 'lab-cyber-03',
//         lab_title: 'Cybersecurity Bootcamp – Red Team',
//         org_id: 'org-003',
//         org_name: 'SecureNet Academy',
//         number_of_days: 180,
//         number_of_users: 100,
//         assigned_users: 67,
//         purchase_date: '2026-02-01T08:30:00Z',
//         expiry_date: '2026-08-01T08:30:00Z',
//         status: 'active',
//     },
//     {
//         purchased_id: 'purch-004',
//         lab_id: 'lab-mlai-04',
//         lab_title: 'Machine Learning with Python',
//         org_id: 'org-001',
//         org_name: 'TechCorp Solutions',
//         number_of_days: 45,
//         number_of_users: 20,
//         assigned_users: 5,
//         purchase_date: '2026-02-10T14:00:00Z',
//         expiry_date: '2026-03-27T14:00:00Z',
//         status: 'active',
//     },
// ];

const DEMO_EXTENSION_REQUESTS: ExtensionRequest[] = [
    {
        request_id: 'req-001',
        purchased_id: 'purch-001',
        lab_id: 'lab-aws-01',
        lab_title: 'AWS Cloud Fundamentals',
        org_id: 'org-001',
        org_name: 'TechCorp Solutions',
        admin_id: 'admin-01',
        admin_name: 'Ravi Sharma',
        current_days: 90,
        current_users: 50,
        additional_days: 30,
        additional_users: 10,
        reason: 'New batch of trainees joining next month, need extra seats and time.',
        requested_at: '2026-02-20T10:15:00Z',
        status: 'pending',
    },
    {
        request_id: 'req-002',
        purchased_id: 'purch-003',
        lab_id: 'lab-cyber-03',
        lab_title: 'Cybersecurity Bootcamp – Red Team',
        org_id: 'org-003',
        org_name: 'SecureNet Academy',
        admin_id: 'admin-03',
        admin_name: 'Priya Mehta',
        current_days: 180,
        current_users: 100,
        additional_days: 60,
        additional_users: 0,
        reason: 'Extended curriculum requires additional lab time.',
        requested_at: '2026-02-18T09:00:00Z',
        status: 'approved',
    },
];

interface PurchaseRecord {
    purchased_id: string;
    lab_id: string;
    lab_title: string;
    org_id: string;
    org_name: string;
    number_of_days: number;
    number_of_users: number;
    assigned_users?: number;
    purchase_date: string;
    expiry_date?: string;
    status: 'active' | 'expired' | 'pending';
    extension_requests?: ExtensionRequest[];
}

type SortKey = 'org_name' | 'lab_title' | 'purchase_date' | 'number_of_days' | 'number_of_users';
type SortDir = 'asc' | 'desc';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
        active: {
            cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            label: 'Active',
            icon: <CheckCircle className="h-3.5 w-3.5" />,
        },
        expired: {
            cls: 'bg-red-500/20 text-red-300 border-red-500/30',
            label: 'Expired',
            icon: <XCircle className="h-3.5 w-3.5" />,
        },
        pending: {
            cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            label: 'Pending',
            icon: <Clock className="h-3.5 w-3.5" />,
        },
    };
    const cfg = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

const RequestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export const SuperAdminCataloguePurchasesPage: React.FC = () => {
    const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
    const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'pending'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('purchase_date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'purchases' | 'requests'>('purchases');
    const {user} = useAuthStore();

    // Extension request approval modal
    const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

     //get the real time data
        useEffect(() => {
        if (!user?.id ) return;
    
        const socket = initSocket(user?.id, user?.org_id,user?.role);
        socket.on("cataloguePurchase", (data) => {
            console.log("Data:",data);
            setPurchases(prev =>
                prev.map(p =>
                    p.purchased_id === data.purchased_id 
                        ? { ...data }
                        : p
                )
            );
        });
        return () => {
            socket.off("cataloguePurchase");
        };
    }, [user]);

    const fetchPurchases = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllCataloguePurchases`,{
                    role:user?.role
                }
            );
            if (response.data.success && response.data.data?.length > 0) {
                setPurchases(response.data.data);
            } else {
                setPurchases([]);
            }
        } catch {
            // Backend not yet implemented – use demo data
            setPurchases([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchExtensionRequests = useCallback(async () => {
        setIsLoadingRequests(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getExtensionRequest`,
                {role:user?.role}
            );
            if (response.data.success && response.data.data?.length > 0) {
                setExtensionRequests(response.data.data);
            } else {
                setExtensionRequests([]);
            }
        } catch {
            // Backend not yet implemented – use demo data
            setExtensionRequests([]);
        } finally {
            setIsLoadingRequests(false);
        }
    }, []);

    useEffect(() => {
        fetchPurchases();
        fetchExtensionRequests();
    }, [fetchPurchases, fetchExtensionRequests]);

    /* ── Filtering & Sorting ── */
    const filteredPurchases = purchases
        .filter((p) => {
            const matchesSearch =
                !searchTerm ||
                p.lab_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.org_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let valA: any = a[sortKey];
            let valB: any = b[sortKey];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const pendingRequests = extensionRequests.filter((r) => r.status === 'pending');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const SortIcon: React.FC<{ col: SortKey }> = ({ col }) =>
        sortKey === col ? (
            sortDir === 'asc' ? (
                <ChevronUp className="h-3.5 w-3.5 inline ml-1 text-primary-400" />
            ) : (
                <ChevronDown className="h-3.5 w-3.5 inline ml-1 text-primary-400" />
            )
        ) : (
            <ChevronDown className="h-3.5 w-3.5 inline ml-1 text-gray-600" />
        );

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    /* ── Summary Stats ── */
    const totalOrgs = new Set(purchases.map((p) => p.org_id)).size;
    const totalPurchases = purchases.length;
    const activePurchases = purchases.filter((p) => p.status === 'active').length;
    const pendingCount = pendingRequests.length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold">
                        <GradientText>Catalogue Purchases</GradientText>
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Monitor all organization lab purchases, days, users, and extension requests.
                    </p>
                </div>
                <button
                    onClick={() => { fetchPurchases(); fetchExtensionRequests(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30
                     border border-primary-500/30 text-primary-300 rounded-xl transition-all text-sm font-medium self-start sm:self-auto"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    {
                        label: 'Organizations',
                        value: totalOrgs,
                        icon: <Building2 className="h-5 w-5" />,
                        gradient: 'from-blue-500/20 to-blue-600/10',
                        border: 'border-blue-500/20',
                        iconColor: 'text-blue-400',
                        valueColor: 'text-blue-300',
                    },
                    {
                        label: 'Total Purchases',
                        value: totalPurchases,
                        icon: <ShoppingBag className="h-5 w-5" />,
                        gradient: 'from-primary-500/20 to-primary-600/10',
                        border: 'border-primary-500/20',
                        iconColor: 'text-primary-400',
                        valueColor: 'text-primary-300',
                    },
                    {
                        label: 'Active Licences',
                        value: activePurchases,
                        icon: <CheckCircle className="h-5 w-5" />,
                        gradient: 'from-emerald-500/20 to-emerald-600/10',
                        border: 'border-emerald-500/20',
                        iconColor: 'text-emerald-400',
                        valueColor: 'text-emerald-300',
                    },
                    {
                        label: 'Pending Requests',
                        value: pendingCount,
                        icon: <Bell className="h-5 w-5" />,
                        gradient: 'from-amber-500/20 to-amber-600/10',
                        border: 'border-amber-500/20',
                        iconColor: 'text-amber-400',
                        valueColor: 'text-amber-300',
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        className={`bg-gradient-to-br ${card.gradient} backdrop-blur-sm rounded-xl p-4 border ${card.border}`}
                    >
                        <div className={`${card.iconColor} mb-2`}>{card.icon}</div>
                        <div className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-dark-300/40 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'purchases'
                        ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30 shadow'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    <BookOpen className="h-4 w-4 inline mr-2" />
                    Purchases
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Extension Requests
                    {pendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {pendingCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── PURCHASES TABLE ── */}
            {activeTab === 'purchases' && (
                <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/15 rounded-2xl overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 sm:p-5 border-b border-primary-500/10 flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by org or lab name..."
                                className="w-full pl-9 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-xl
                           text-gray-300 text-sm focus:border-primary-400 focus:outline-none transition-all"
                            />
                        </div>
                        {/* Status filter */}
                        <div className="relative sm:w-44">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full pl-9 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-xl
                           text-gray-300 text-sm focus:border-primary-400 focus:outline-none appearance-none cursor-pointer transition-all"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader className="h-8 w-8 text-primary-400 animate-spin" />
                        </div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="text-center py-20">
                            <ShoppingBag className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No purchases found</p>
                            <p className="text-gray-600 text-sm mt-1">
                                {searchTerm || statusFilter !== 'all'
                                    ? 'Try adjusting your filters.'
                                    : 'No organizations have purchased catalogues yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs text-gray-500 border-b border-primary-500/10 bg-dark-300/20">
                                            <th
                                                className="px-5 py-3.5 cursor-pointer hover:text-gray-300 transition-colors select-none"
                                                onClick={() => handleSort('org_name')}
                                            >
                                                Organization <SortIcon col="org_name" />
                                            </th>
                                            <th
                                                className="px-5 py-3.5 cursor-pointer hover:text-gray-300 transition-colors select-none"
                                                onClick={() => handleSort('lab_title')}
                                            >
                                                Lab <SortIcon col="lab_title" />
                                            </th>
                                            <th
                                                className="px-5 py-3.5 cursor-pointer hover:text-gray-300 transition-colors select-none text-center"
                                                onClick={() => handleSort('number_of_days')}
                                            >
                                                Days <SortIcon col="number_of_days" />
                                            </th>
                                            <th
                                                className="px-5 py-3.5 cursor-pointer hover:text-gray-300 transition-colors select-none"
                                                onClick={() => handleSort('number_of_users')}
                                            >
                                                Remaining Qty <SortIcon col="number_of_users" />
                                            </th>
                                            <th
                                                className="px-5 py-3.5 cursor-pointer hover:text-gray-300 transition-colors select-none"
                                                onClick={() => handleSort('purchase_date')}
                                            >
                                                Purchase Date <SortIcon col="purchase_date" />
                                            </th>
                                            <th className="px-5 py-3.5 text-center">Status</th>
                                            <th className="px-5 py-3.5 text-center">Ext. Requests</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary-500/5">
                                        {filteredPurchases.map((purchase) => {
                                            const reqsForPurchase = extensionRequests.filter(
                                                (r) => r.purchased_id === purchase.purchased_id || r.lab_id === purchase.lab_id && r.org_id === purchase.org_id
                                            );
                                            const pendingReqs = reqsForPurchase.filter((r) => r.status === 'pending');
                                            const isExpanded = expandedRow === purchase.purchased_id;

                                            return (
                                                <React.Fragment key={purchase.purchased_id}>
                                                    <tr
                                                        className="hover:bg-dark-300/30 transition-colors group cursor-pointer"
                                                        onClick={() =>
                                                            setExpandedRow(isExpanded ? null : purchase.purchased_id)
                                                        }
                                                    >
                                                        {/* Org */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                                                    <Building2 className="h-4 w-4 text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-200">{purchase.org_name}</p>
                                                                    <p className="text-xs text-gray-600 font-mono">{purchase.org_id.slice(0, 12)}...</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Lab */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <BookOpen className="h-4 w-4 text-primary-400 flex-shrink-0" />
                                                                <span className="text-sm text-gray-300 font-medium">{purchase.lab_title}</span>
                                                            </div>
                                                        </td>
                                                        {/* Days */}
                                                        <td className="px-5 py-4 text-center">
                                                            <div className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-300 px-3 py-1 rounded-full text-sm font-semibold border border-primary-500/20">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                {purchase.number_of_days}
                                                            </div>
                                                        </td>
                                                        {/* Users / Remaining Qty */}
                                                        <td className="px-5 py-4">
                                                            {(() => {
                                                                const total = purchase.number_of_users;
                                                                const used = purchase.assigned_users ?? 0;
                                                                const remaining = total - used;
                                                                const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                                                                const barColor = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400';
                                                                return (
                                                                    <div className="min-w-[110px]">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className="text-xs text-gray-400">
                                                                                <Users className="h-3 w-3 inline mr-1 text-secondary-400" />
                                                                                <span className="font-semibold text-secondary-300">{remaining}</span>
                                                                                <span className="text-gray-600"> / {total} left</span>
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-600">{pct}%</span>
                                                                        </div>
                                                                        <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all ${barColor}`}
                                                                                style={{ width: `${pct}%` }}
                                                                            />
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-600 mt-0.5">{used} assigned</p>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                        {/* Purchase Date */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-1.5 text-sm text-gray-400">
                                                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                                {formatDate(purchase.purchase_date)}
                                                            </div>
                                                            {purchase.expiry_date && (
                                                                <p className="text-xs text-gray-600 mt-0.5 pl-5">
                                                                    Expires: {formatDate(purchase.expiry_date)}
                                                                </p>
                                                            )}
                                                        </td>
                                                        {/* Status */}
                                                        <td className="px-5 py-4 text-center">
                                                            <StatusBadge status={purchase.status} />
                                                        </td>
                                                        {/* Extension Requests */}
                                                        <td className="px-5 py-4 text-center">
                                                            {reqsForPurchase.length > 0 ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (pendingReqs.length > 0) {
                                                                            setSelectedRequest(pendingReqs[0]);
                                                                            setIsApproveModalOpen(true);
                                                                        } else {
                                                                            setExpandedRow(isExpanded ? null : purchase.purchased_id);
                                                                        }
                                                                    }}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${pendingReqs.length > 0
                                                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                                                        : 'bg-dark-400/50 text-gray-400 border-primary-500/10'
                                                                        }`}
                                                                >
                                                                    {pendingReqs.length > 0 && <AlertCircle className="h-3.5 w-3.5" />}
                                                                    {reqsForPurchase.length} request{reqsForPurchase.length !== 1 ? 's' : ''}
                                                                    {pendingReqs.length > 0 && ` (${pendingReqs.length} pending)`}
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-600 text-xs">—</span>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Expanded: Extension Requests for this purchase */}
                                                    {isExpanded && reqsForPurchase.length > 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="bg-dark-300/20 px-5 py-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                                                        Extension Requests for this Purchase
                                                                    </p>
                                                                    {reqsForPurchase.map((req) => (
                                                                        <div
                                                                            key={req.request_id}
                                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-200/60 rounded-xl p-4 border border-primary-500/10"
                                                                        >
                                                                            <div className="flex flex-wrap gap-4 text-sm">
                                                                                <span className="text-gray-400">
                                                                                    <Calendar className="h-3.5 w-3.5 inline mr-1 text-primary-400" />
                                                                                    +{req.additional_days} days
                                                                                </span>
                                                                                <span className="text-gray-400">
                                                                                    <Users className="h-3.5 w-3.5 inline mr-1 text-secondary-400" />
                                                                                    +{req.additional_users} users
                                                                                </span>
                                                                                <span className="text-gray-500 text-xs">
                                                                                    {formatDate(req.requested_at)}
                                                                                </span>
                                                                                {req.reason && (
                                                                                    <span className="text-gray-500 text-xs italic">
                                                                                        "{req.reason}"
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <RequestStatusBadge status={req.status} />
                                                                                {req.status === 'pending' && (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setSelectedRequest(req);
                                                                                            setIsApproveModalOpen(true);
                                                                                        }}
                                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30
                                                       text-primary-300 rounded-lg text-xs font-medium border border-primary-500/30 transition-all"
                                                                                    >
                                                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                                                        Review
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-primary-500/10">
                                {filteredPurchases.map((purchase) => {
                                    const reqsForPurchase = extensionRequests.filter(
                                        (r) => r.purchased_id === purchase.purchased_id || (r.lab_id === purchase.lab_id && r.org_id === purchase.org_id)
                                    );
                                    const pendingReqs = reqsForPurchase.filter((r) => r.status === 'pending');
                                    const isExpanded = expandedRow === purchase.purchased_id;

                                    return (
                                        <div key={purchase.purchased_id} className="p-4">
                                            <div
                                                className="flex items-start justify-between cursor-pointer"
                                                onClick={() => setExpandedRow(isExpanded ? null : purchase.purchased_id)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                        <p className="text-sm font-semibold text-gray-200 truncate">{purchase.org_name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <BookOpen className="h-3.5 w-3.5 text-primary-400 flex-shrink-0" />
                                                        <p className="text-xs text-gray-400 truncate">{purchase.lab_title}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="inline-flex items-center gap-1 bg-primary-500/10 text-primary-300 px-2 py-0.5 rounded-full text-xs font-medium border border-primary-500/20">
                                                            <Calendar className="h-3 w-3" />
                                                            {purchase.number_of_days} days
                                                        </span>
                                                        {(() => {
                                                            const total = purchase.number_of_users;
                                                            const used = purchase.assigned_users ?? 0;
                                                            const remaining = total - used;
                                                            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                                                            const barColor = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400';
                                                            return (
                                                                <div className="w-full mt-1">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-xs text-gray-400">
                                                                            <Users className="h-3 w-3 inline mr-1 text-secondary-400" />
                                                                            <span className="font-semibold text-secondary-300">{remaining}</span>
                                                                            <span className="text-gray-600"> / {total} seats left</span>
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-600">{pct}% used</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        <StatusBadge status={purchase.status} />
                                                    </div>
                                                </div>
                                                <div className="ml-3 mt-1">
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-3 pt-3 border-t border-primary-500/10 space-y-2 text-xs text-gray-400">
                                                    <p>
                                                        <Clock className="h-3.5 w-3.5 inline mr-1 text-gray-500" />
                                                        Purchased: {formatDate(purchase.purchase_date)}
                                                    </p>
                                                    {purchase.expiry_date && (
                                                        <p>Expires: {formatDate(purchase.expiry_date)}</p>
                                                    )}

                                                    {reqsForPurchase.length > 0 && (
                                                        <div className="space-y-2 mt-2">
                                                            <p className="text-gray-500 font-medium">Extension Requests:</p>
                                                            {reqsForPurchase.map((req) => (
                                                                <div key={req.request_id} className="bg-dark-300/40 rounded-lg p-3 flex items-center justify-between gap-2">
                                                                    <div>
                                                                        <p>+{req.additional_days} days, +{req.additional_users} users</p>
                                                                        {req.reason && <p className="text-gray-600 italic mt-0.5">"{req.reason}"</p>}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <RequestStatusBadge status={req.status} />
                                                                        {req.status === 'pending' && (
                                                                            <button
                                                                                onClick={() => { setSelectedRequest(req); setIsApproveModalOpen(true); }}
                                                                                className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-xs border border-primary-500/30"
                                                                            >
                                                                                Review
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {pendingReqs.length > 0 && (
                                                        <button
                                                            onClick={() => { setSelectedRequest(pendingReqs[0]); setIsApproveModalOpen(true); }}
                                                            className="w-full mt-2 py-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 text-xs font-medium flex items-center justify-center gap-2"
                                                        >
                                                            <Bell className="h-3.5 w-3.5" />
                                                            Review Pending Request
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-primary-500/10 text-xs text-gray-500">
                                Showing {filteredPurchases.length} of {purchases.length} purchases
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── EXTENSION REQUESTS TAB ── */}
            {activeTab === 'requests' && (
                <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/15 rounded-2xl overflow-hidden">
                    {isLoadingRequests ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader className="h-8 w-8 text-amber-400 animate-spin" />
                        </div>
                    ) : extensionRequests.length === 0 ? (
                        <div className="text-center py-20">
                            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No extension requests</p>
                            <p className="text-gray-600 text-sm mt-1">Organizations haven't submitted any requests yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-primary-500/10">
                            {/* Header */}
                            <div className="px-5 py-4 flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                    <span className="font-medium text-white">{extensionRequests.length}</span> total &nbsp;·&nbsp;
                                    <span className="text-amber-300 font-medium">{pendingCount}</span> pending
                                </p>
                            </div>

                            {extensionRequests.map((req) => (
                                <div key={req.request_id} className="px-4 sm:px-6 py-4 hover:bg-dark-300/20 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-200">{req.org_name}</span>
                                                <span className="text-gray-600">·</span>
                                                <span className="text-sm text-gray-400 truncate">{req.lab_title}</span>
                                                <RequestStatusBadge status={req.status} />
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-primary-400" />
                                                    +{req.additional_days} days (was {req.current_days})
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-secondary-400" />
                                                    +{req.additional_users} users (was {req.current_users})
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDate(req.requested_at)}
                                                </span>
                                            </div>
                                            {req.reason && (
                                                <p className="text-xs text-gray-500 italic">Reason: "{req.reason}"</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {req.status === 'pending' ? (
                                            <button
                                                onClick={() => { setSelectedRequest(req); setIsApproveModalOpen(true); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500/30 to-secondary-500/20
                                   hover:from-primary-500/40 hover:to-secondary-500/30
                                   text-primary-300 rounded-xl border border-primary-500/30 transition-all text-sm font-medium whitespace-nowrap"
                                            >
                                                <ArrowUpRight className="h-4 w-4" />
                                                Review & Approve
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedRequest(req); setIsApproveModalOpen(true); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-dark-300/50
                                   text-gray-400 rounded-xl border border-primary-500/10 transition-all text-sm"
                                            >
                                                View Details
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Approve/Reject Extension Modal */}
            <ApproveExtensionModal
                isOpen={isApproveModalOpen}
                onClose={() => { setIsApproveModalOpen(false); setSelectedRequest(null); }}
                request={selectedRequest}
                onSuccess={() => { fetchPurchases(); fetchExtensionRequests(); }}
            />
        </div>
    );
};
