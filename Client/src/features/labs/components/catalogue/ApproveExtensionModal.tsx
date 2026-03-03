import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
    X,
    Calendar,
    Users,
    Check,
    AlertCircle,
    Loader,
    Shield,
    MessageSquare,
    CalendarCheck,
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

export interface ExtensionRequest {
    request_id: string;
    purchased_id?: string;
    lab_id: string;
    lab_title: string;
    org_id: string;
    org_name: string;
    admin_id: string;
    admin_name?: string;
    current_days: number;
    current_users: number;
    additional_days: number;
    additional_users: number;
    reason?: string;
    requested_at: string;
    status: 'pending' | 'approved' | 'rejected';
    type:string
}

interface ApproveExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ExtensionRequest | null;
    purchase: ExtensionRequest | null;
    onSuccess?: () => void;
}

export const ApproveExtensionModal: React.FC<ApproveExtensionModalProps> = ({
    isOpen,
    onClose,
    request,
    purchase,
    onSuccess,
}) => {
    const [approvedDays, setApprovedDays] = useState<number>(0);
    const [approvedUsers, setApprovedUsers] = useState<number>(0);
    const [adminNote, setAdminNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [purchased,setIspurchased] = useState<[]>();
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    React.useEffect(() => {
        if (request) {
            setApprovedDays(request.additional_days);
            setApprovedUsers(request.additional_users);
            setIspurchased(purchase.find((data:any)=>data.purchased_id === request?.purchased_id))
        }
    }, [request]);

    const handleApprove = async () => {
        setIsLoading(true);
        setNotification(null);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/approveCatalogueExtension`,
                {
                    request_id: request?.request_id,
                    purchased_id: request?.purchased_id,
                    lab_id: request?.lab_id,
                    org_id: request?.org_id,
                    admin_id: request?.admin_id,
                    approved_days: approvedDays,
                    approved_users: approvedUsers,
                    admin_note: adminNote,
                    status: 'approved',
                    type:purchased?.type
                }
            );

            if (response.data.success) {
                setNotification({ type: 'success', message: 'Extension approved successfully!' });
                setTimeout(() => {
                    onSuccess?.();
                    handleClose();
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Failed to approve extension');
            }
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: err.response?.data?.message || 'Failed to approve extension.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        setNotification(null);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/approveCatalogueExtension`,
                {
                    request_id: request?.request_id,
                    purchase_id: request?.purchased_id,
                    lab_id: request?.lab_id,
                    org_id: request?.org_id,
                    admin_id: request?.admin_id,
                    approved_days: 0,
                    approved_users: 0,
                    admin_note: adminNote,
                    status: 'rejected',
                    type:request?.type
                }
            );

            if (response.data.success) {
                setNotification({ type: 'success', message: 'Extension request rejected.' });
                setTimeout(() => {
                    onSuccess?.();
                    handleClose();
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Failed to reject extension');
            }
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: err.response?.data?.message || 'Failed to reject extension.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setApprovedDays(0);
        setApprovedUsers(0);
        setAdminNote('');
        setNotification(null);
        onClose();
    };

    if (!isOpen || !request) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-dark-200 rounded-2xl w-full max-w-2xl shadow-2xl shadow-primary-500/10 border border-primary-500/20 overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary-500/20 to-secondary-500/20 px-6 py-5 border-b border-primary-500/20">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="h-5 w-5 text-primary-400" />
                                <h2 className="text-xl font-bold">
                                    <GradientText>Review Extension Request</GradientText>
                                </h2>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-1">{request.lab_title}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-dark-300 rounded-xl transition-colors ml-4 flex-shrink-0"
                        >
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Request Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-dark-300/40 rounded-xl p-4 border border-primary-500/10">
                            <p className="text-xs text-gray-500 mb-1">Organization</p>
                            <p className="text-white font-semibold">{request.org_name}</p>
                        </div>
                        <div className="bg-dark-300/40 rounded-xl p-4 border border-primary-500/10">
                            <p className="text-xs text-gray-500 mb-1">Requested By</p>
                            <p className="text-white font-semibold">{request.admin_name || 'Org Admin'}</p>
                        </div>
                        <div className="bg-dark-300/40 rounded-xl p-4 border border-primary-500/10">
                            <p className="text-xs text-gray-500 mb-1">Requested On</p>
                            <p className="text-white font-semibold">
                                {new Date(request.requested_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        <div className="bg-dark-300/40 rounded-xl p-4 border border-primary-500/10">
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${request.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : request.status === 'approved'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-red-500/20 text-red-300'
                                }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                        </div>
                    </div>

                    {/* Current vs Requested */}
                    <div className="bg-dark-300/30 rounded-xl p-4 border border-primary-500/10">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4 text-primary-400" />
                            Request Details
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Current Days</p>
                                <p className="text-xl font-bold text-white">{request.current_days}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Requested +days</p>
                                <p className="text-xl font-bold text-primary-400">+{request.additional_days}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Current Users</p>
                                <p className="text-xl font-bold text-white">{request.current_users}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Requested +users</p>
                                <p className="text-xl font-bold text-secondary-400">+{request.additional_users}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    {request.reason && (
                        <div className="bg-dark-300/30 rounded-xl p-4 border border-primary-500/10">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-gray-400" />
                                <p className="text-sm font-medium text-gray-300">Reason Provided</p>
                            </div>
                            <p className="text-sm text-gray-400">{request.reason}</p>
                        </div>
                    )}

                    {/* Approve / Modify Fields */}
                    {request.status === 'pending' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-300">
                                Adjust Approved Amount
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-gray-400 mb-1.5">
                                        <Calendar className="h-4 w-4 text-primary-400" />
                                        Days to Approve
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={approvedDays}
                                        onChange={(e) => setApprovedDays(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full px-4 py-2.5 bg-dark-400/50 border border-primary-500/20 rounded-xl
                               text-gray-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/30 transition-all"
                                    />
                                    {approvedDays > 0 && (
                                        <p className="text-xs text-primary-400 mt-1">
                                            New total: {request.current_days + approvedDays} days
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-gray-400 mb-1.5">
                                        <Users className="h-4 w-4 text-secondary-400" />
                                        Users to Approve
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={approvedUsers}
                                        onChange={(e) => setApprovedUsers(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full px-4 py-2.5 bg-dark-400/50 border border-primary-500/20 rounded-xl
                               text-gray-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/30 transition-all"
                                    />
                                    {approvedUsers > 0 && (
                                        <p className="text-xs text-secondary-400 mt-1">
                                            New total: {request.current_users + approvedUsers} users
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">
                                    Admin Note <span className="text-gray-600 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    rows={2}
                                    placeholder="Add a note to the organization admin..."
                                    className="w-full px-4 py-2.5 bg-dark-400/50 border border-primary-500/20 rounded-xl
                             text-gray-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/30 transition-all resize-none placeholder-gray-600"
                                />
                            </div>
                        </div>
                    )}

                    {/* Notification */}
                    {notification && (
                        <div
                            className={`p-4 rounded-xl flex items-center gap-3 ${notification.type === 'success'
                                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                                }`}
                        >
                            {notification.type === 'success' ? (
                                <Check className="h-5 w-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            )}
                            <span className="text-sm">{notification.message}</span>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {request.status === 'pending' && (
                    <div className="px-6 py-4 border-t border-primary-500/10 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-dark-300/50 hover:bg-dark-300 text-gray-300
                         rounded-xl border border-primary-500/20 transition-all font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-3 flex-1 sm:justify-end">
                            <button
                                onClick={handleReject}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300
                           rounded-xl border border-red-500/30 transition-all font-medium text-sm
                           flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isLoading || (approvedDays <= 0 && approvedUsers <= 0)}
                                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500
                           hover:from-primary-400 hover:to-secondary-400
                           text-white rounded-xl transition-all font-medium text-sm
                           shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Approve
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};
