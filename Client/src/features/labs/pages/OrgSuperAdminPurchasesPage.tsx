import React, { useState, useEffect, useCallback } from 'react';
import {
    BookOpen,
    Calendar,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Search,
    Loader,
    ShoppingBag,
    ArrowUpRight,
    Bell,
    AlertCircle,
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { ExtensionRequestModal } from '../components/catalogue/ExtensionRequestModal';
import { useAuthStore } from '../../../store/authStore';
import { initSocket,getSocket } from '../../../store/socketService';
import axios from 'axios';

interface PurchasedLab {
    purchased_id: string;
    lab_id: string;
    lab_title: string;
    org_id: string;
    org_name?: string;
    number_of_days: number;
    number_of_users: number;
    assigned_users?: number;
    purchase_date: string;
    expiry_date?: string;
    status: 'active' | 'expired' | 'pending';
}

/* ── Demo data shown when backend is unavailable ── */
// const DEMO_PURCHASES: PurchasedLab[] = [
//     {
//         purchased_id: 'purch-001',
//         lab_id: 'lab-aws-01',
//         lab_title: 'AWS Cloud Fundamentals',
//         org_id: 'org-demo',
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
//         org_id: 'org-demo',
//         number_of_days: 60,
//         number_of_users: 30,
//         assigned_users: 28,
//         purchase_date: '2025-12-01T11:00:00Z',
//         expiry_date: '2026-03-05T11:00:00Z',
//         status: 'active',
//     },
// ];

const DEMO_REQUESTS: OwnExtensionRequest[] = [
    {
        request_id: 'req-001',
        lab_id: 'lab-aws-01',
        lab_title: 'AWS Cloud Fundamentals',
        additional_days: 30,
        additional_users: 10,
        reason: 'New batch of trainees joining next month.',
        requested_at: '2026-02-20T10:15:00Z',
        status: 'pending',
    },
];

interface OwnExtensionRequest {
    request_id: string;
    lab_id: string;
    lab_title?: string;
    additional_days: number;
    additional_users: number;
    reason?: string;
    requested_at: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_note?: string;
}

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

export const OrgSuperAdminPurchasesPage: React.FC = () => {
    const { user } = useAuthStore();
    const [purchases, setPurchases] = useState<PurchasedLab[]>([]);
    const [myRequests, setMyRequests] = useState<OwnExtensionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'purchases' | 'requests'>('purchases');

    // Extension request modal
    const [selectedPurchase, setSelectedPurchase] = useState<PurchasedLab | null>(null);
    const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

    //get the real time data
    useEffect(() => {
    if (!user?.id || !user?.org_id) return;

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
            if (!user?.org_id) {
                setPurchases(DEMO_PURCHASES);
                return;
            }
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllCataloguePurchases`,
                { role:user?.role , org_id: user.org_id }
            );
            if (response.data.success && response.data.data?.length > 0) {
                setPurchases(response.data.data);
            } else {
                setPurchases(DEMO_PURCHASES);
            }
        } catch {
            setPurchases(DEMO_PURCHASES);
        } finally {
            setIsLoading(false);
        }
    }, [user?.org_id]);

    const fetchMyRequests = useCallback(async () => {
        setIsLoadingRequests(true);
        try {
            if (!user?.org_id) {
                setMyRequests([]);
                return;
            }
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getExtensionRequest`,
                { orgId: user?.org_id }
            );
            if (response.data.success && response.data.data?.length > 0) {
                setMyRequests(response.data.data);
            } else {
                setMyRequests([]);
            }
        } catch {
            setMyRequests([]);
        } finally {
            setIsLoadingRequests(false);
        }
    }, [user?.org_id]);

    useEffect(() => {
        fetchPurchases();
        fetchMyRequests();
    }, [fetchPurchases, fetchMyRequests]);

    const filteredPurchases = purchases.filter(
        (p) =>
            !searchTerm ||
            p.lab_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingRequestsCount = myRequests.filter((r) => r.status === 'pending').length;

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    const daysRemaining = (expiryDate?: string) => {
        if (!expiryDate) return null;
        const diff = Math.ceil(
            (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return diff;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold">
                        <GradientText>My Purchases</GradientText>
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        View your organization's purchased lab catalogues and manage extension requests.
                    </p>
                </div>
                <button
                    onClick={() => { fetchPurchases(); fetchMyRequests(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30
                     border border-primary-500/30 text-primary-300 rounded-xl transition-all text-sm font-medium self-start sm:self-auto"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                    {
                        label: 'Total Purchased',
                        value: purchases.length,
                        icon: <ShoppingBag className="h-5 w-5" />,
                        gradient: 'from-primary-500/20 to-primary-600/10',
                        border: 'border-primary-500/20',
                        iconColor: 'text-primary-400',
                        valueColor: 'text-primary-300',
                    },
                    {
                        label: 'Active Labs',
                        value: purchases.filter((p) => p.status === 'active').length,
                        icon: <CheckCircle className="h-5 w-5" />,
                        gradient: 'from-emerald-500/20 to-emerald-600/10',
                        border: 'border-emerald-500/20',
                        iconColor: 'text-emerald-400',
                        valueColor: 'text-emerald-300',
                    },
                    {
                        label: 'Extension Requests',
                        value: myRequests.length,
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
                    Purchased Labs
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    <Bell className="h-4 w-4 inline mr-2" />
                    My Requests
                    {pendingRequestsCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {pendingRequestsCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── PURCHASED LABS ── */}
            {activeTab === 'purchases' && (
                <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/15 rounded-2xl overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 sm:p-5 border-b border-primary-500/10">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search lab name..."
                                className="w-full pl-9 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-xl
                           text-gray-300 text-sm focus:border-primary-400 focus:outline-none transition-all"
                            />
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
                                {searchTerm
                                    ? 'Try adjusting your search.'
                                    : 'Your organization has not purchased any lab catalogues yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs text-gray-500 border-b border-primary-500/10 bg-dark-300/20">
                                            <th className="px-5 py-3.5">Lab Name</th>
                                            <th className="px-5 py-3.5 text-center">Days</th>
                                            <th className="px-5 py-3.5">Remaining Qty</th>
                                            <th className="px-5 py-3.5">Purchase Date</th>
                                            <th className="px-5 py-3.5">Expiry</th>
                                            <th className="px-5 py-3.5 text-center">Status</th>
                                            <th className="px-5 py-3.5 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary-500/5">
                                        {filteredPurchases.map((purchase) => {
                                            const days = daysRemaining(purchase.expiry_date);
                                            const isExpiringSoon = days !== null && days > 0 && days <= 14;
                                            return (
                                                <tr key={purchase.purchased_id} className="hover:bg-dark-300/20 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500/30 to-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                                                                <BookOpen className="h-4 w-4 text-primary-300" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-200">{purchase.lab_title}</p>
                                                                <p className="text-xs text-gray-600 font-mono">{purchase.lab_id.slice(0, 12)}...</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-300 px-3 py-1 rounded-full text-sm font-semibold border border-primary-500/20">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {purchase.number_of_days}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {(() => {
                                                            const total = purchase.number_of_users;
                                                            const used = purchase.assigned_users ?? 0;
                                                            const remaining = total - used;
                                                            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                                                            const barColor = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400';
                                                            const textColor = pct >= 90 ? 'text-red-300' : pct >= 70 ? 'text-amber-300' : 'text-emerald-300';
                                                            return (
                                                                <div className="min-w-[120px]">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                            <Users className="h-3 w-3 text-secondary-400" />
                                                                            <span className={`font-bold ${textColor}`}>{remaining}</span>
                                                                            <span className="text-gray-600">/ {total}</span>
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-600">{pct}% used</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${barColor}`}
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-600 mt-0.5">{used} assigned · {remaining} remaining</p>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                            {formatDate(purchase.purchase_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {purchase.expiry_date ? (
                                                            <div>
                                                                <p className="text-sm text-gray-400">{formatDate(purchase.expiry_date)}</p>
                                                                {isExpiringSoon && (
                                                                    <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        {days} days left
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <StatusBadge status={purchase.status} />
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPurchase(purchase);
                                                                setIsExtensionModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20
                                         hover:bg-primary-500/30 text-primary-300 rounded-lg text-xs
                                         font-medium border border-primary-500/30 transition-all"
                                                        >
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                            Request Extension
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-primary-500/10">
                                {filteredPurchases.map((purchase) => {
                                    const days = daysRemaining(purchase.expiry_date);
                                    const isExpiringSoon = days !== null && days > 0 && days <= 14;
                                    return (
                                        <div key={purchase.purchased_id} className="p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500/30 to-primary-600/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                                                    <BookOpen className="h-4 w-4 text-primary-300" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-200 truncate">{purchase.lab_title}</p>
                                                    <p className="text-xs text-gray-600">Purchased {formatDate(purchase.purchase_date)}</p>
                                                </div>
                                                <StatusBadge status={purchase.status} />
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
                                                    const textColor = pct >= 90 ? 'text-red-300' : pct >= 70 ? 'text-amber-300' : 'text-emerald-300';
                                                    const bgBorder = pct >= 90
                                                        ? 'bg-red-500/10 border-red-500/20'
                                                        : pct >= 70
                                                            ? 'bg-amber-500/10 border-amber-500/20'
                                                            : 'bg-emerald-500/10 border-emerald-500/20';
                                                    return (
                                                        <div className={`w-full mt-1 rounded-lg border p-2 ${bgBorder}`}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Users className="h-3 w-3 text-secondary-400" />
                                                                    <span className={`font-bold ${textColor}`}>{remaining}</span>
                                                                    <span className="text-gray-600">/ {total} remaining</span>
                                                                </span>
                                                                <span className="text-[10px] text-gray-600">{pct}% used</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-dark-400/60 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">{used} assigned</p>
                                                        </div>
                                                    );
                                                })()}
                                                {purchase.expiry_date && (
                                                    <span className="inline-flex items-center gap-1 text-gray-500 px-2 py-0.5 text-xs">
                                                        Expires {formatDate(purchase.expiry_date)}
                                                    </span>
                                                )}
                                            </div>
                                            {isExpiringSoon && (
                                                <div className="flex items-center gap-1.5 text-amber-400 text-xs bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    Expiring in {days} days — request an extension soon!
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedPurchase(purchase);
                                                    setIsExtensionModalOpen(true);
                                                }}
                                                className="w-full py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300
                                   rounded-xl border border-primary-500/30 transition-all text-sm font-medium
                                   flex items-center justify-center gap-2"
                                            >
                                                <ArrowUpRight className="h-4 w-4" />
                                                Request Extension
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="px-5 py-3 border-t border-primary-500/10 text-xs text-gray-500">
                                {filteredPurchases.length} purchased lab{filteredPurchases.length !== 1 ? 's' : ''}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── MY EXTENSION REQUESTS ── */}
            {activeTab === 'requests' && (
                <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/15 rounded-2xl overflow-hidden">
                    {isLoadingRequests ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader className="h-8 w-8 text-amber-400 animate-spin" />
                        </div>
                    ) : myRequests.length === 0 ? (
                        <div className="text-center py-20">
                            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No extension requests yet</p>
                            <p className="text-gray-600 text-sm mt-1">
                                Go to the Purchased Labs tab and click "Request Extension" on any lab.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-primary-500/10">
                            <div className="px-5 py-4">
                                <p className="text-sm text-gray-400">
                                    <span className="font-medium text-white">{myRequests.length}</span> requests &nbsp;·&nbsp;
                                    <span className="text-amber-300 font-medium">{pendingRequestsCount}</span> pending
                                </p>
                            </div>
                            {myRequests.map((req) => (
                                <div key={req.request_id} className="px-4 sm:px-6 py-4 hover:bg-dark-300/20 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-200">
                                                    {req.lab_title || 'Lab'}
                                                </span>
                                                <RequestStatusBadge status={req.status} />
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-primary-400" />
                                                    +{req.additional_days} days requested
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-secondary-400" />
                                                    +{req.additional_users} users requested
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Submitted {formatDate(req.requested_at)}
                                                </span>
                                            </div>
                                            {req.reason && (
                                                <p className="text-xs text-gray-500 italic">Reason: "{req.reason}"</p>
                                            )}
                                            {req.status !== 'pending' && req.admin_note && (
                                                <div className={`text-xs px-3 py-2 rounded-lg border ${req.status === 'approved'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                    }`}>
                                                    Admin note: "{req.admin_note}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Extension Request Modal */}
            <ExtensionRequestModal
                isOpen={isExtensionModalOpen}
                onClose={() => { setIsExtensionModalOpen(false); setSelectedPurchase(null); }}
                purchasedLab={selectedPurchase}
                adminId={user?.id || ''}
                onSuccess={() => { fetchPurchases(); fetchMyRequests(); }}
            />
        </div>
    );
};
