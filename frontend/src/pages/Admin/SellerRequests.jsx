import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import ConfirmModal from '../../components/common/ConfirmModal';

function SellerRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: '' });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await adminService.getSellerRequests();
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch seller requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, name) => {
        setActionLoading(id);
        try {
            await adminService.approveSellerRequest(id);
            setMessage({ type: 'success', text: `${name} has been approved as a seller!` });
            fetchRequests();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleReject = (id, name) => {
        setConfirmModal({ open: true, id, name });
    };

    const confirmReject = async () => {
        const { id, name } = confirmModal;
        setConfirmModal({ open: false, id: null, name: '' });
        setActionLoading(id);
        try {
            await adminService.rejectSellerRequest(id);
            setMessage({ type: 'success', text: `${name}'s seller request has been rejected` });
            fetchRequests();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div>
            <ConfirmModal
                isOpen={confirmModal.open}
                title={`Reject ${confirmModal.name}'s Seller Request?`}
                message={`Are you sure you want to reject ${confirmModal.name}'s seller request? They will not be able to list products unless they reapply.`}
                confirmText='Reject Request'
                confirmVariant='danger'
                onConfirm={confirmReject}
                onCancel={() => setConfirmModal({ open: false, id: null, name: '' })}
            />
            <div className="mb-8">
                <h1 className="font-heading font-bold text-3xl text-gray-900">Seller Requests</h1>
                <p className="text-gray-600 mt-1">
                    Review and approve operator requests to sell products
                </p>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {message.type === 'success' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                    </svg>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                            All Clear!
                        </h3>
                        <p className="text-gray-500">No pending seller requests to review</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Operator Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-semibold text-lg">
                                            {req.fullName?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{req.fullName}</h4>
                                        <p className="text-sm text-gray-500">{req.email}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            {req.phone && <span>📞 {req.phone}</span>}
                                            <span>🏟️ {req._count?.ownedVenues || 0} venues</span>
                                            <span>📅 Joined {formatDate(req.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 sm:flex-shrink-0">
                                    <button
                                        onClick={() => handleApprove(req.id, req.fullName)}
                                        disabled={actionLoading === req.id}
                                        className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                                    >
                                        {actionLoading === req.id ? '...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id, req.fullName)}
                                        disabled={actionLoading === req.id}
                                        className="px-5 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SellerRequests;
