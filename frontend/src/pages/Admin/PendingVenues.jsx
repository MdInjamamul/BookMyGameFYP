import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';

function PendingVenues() {
    const [venues, setVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const hasFetched = useRef(false);

    const fetchPendingVenues = async () => {
        // Prevent duplicate API calls
        if (hasFetched.current) return;
        hasFetched.current = true;
        try {
            setIsLoading(true);
            const data = await adminService.getPendingVenues();
            if (data.success) {
                setVenues(data.data);
            }
        } catch (err) {
            console.error('Error fetching pending venues:', err);
            setError('Failed to load pending venues');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingVenues();
    }, []);

    const handleApprove = async (venueId) => {
        try {
            setProcessingId(venueId);
            const response = await adminService.approveVenue(venueId);
            if (response.success) {
                setVenues(venues.filter(v => v.id !== venueId));
            }
        } catch (err) {
            console.error('Error approving venue:', err);
            alert('Failed to approve venue');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (venueId) => {
        if (!rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setProcessingId(venueId);
            const response = await adminService.rejectVenue(venueId, rejectReason);
            if (response.success) {
                setVenues(venues.filter(v => v.id !== venueId));
                setShowRejectModal(null);
                setRejectReason('');
            }
        } catch (err) {
            console.error('Error rejecting venue:', err);
            alert('Failed to reject venue');
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchPendingVenues} className="mt-4 btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-heading font-bold text-3xl text-gray-900">Pending Venues</h1>
                <p className="text-gray-600 mt-1">
                    Review and approve venue applications from operators
                </p>
            </div>

            {venues.length > 0 ? (
                <div className="space-y-4">
                    {venues.map((venue) => (
                        <div
                            key={venue.id}
                            className="bg-white rounded-xl shadow-soft overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Image */}
                                <div className="w-full md:w-48 h-48 md:h-auto bg-gray-100 flex-shrink-0">
                                    {venue.images?.[0] ? (
                                        <img
                                            src={venue.images[0].imageUrl}
                                            alt={venue.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-heading font-bold text-xl text-gray-900">
                                                    {venue.name}
                                                </h3>
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                    Pending
                                                </span>
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p className="flex items-center gap-2">
                                                    <span className="font-medium">Sport:</span>
                                                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                                                        {venue.sport?.name}
                                                    </span>
                                                </p>
                                                <p>
                                                    <span className="font-medium">Address:</span> {venue.address}
                                                    {venue.city && `, ${venue.city}`}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Price:</span> Rs. {parseFloat(venue.pricePerHour).toLocaleString()}/hour
                                                </p>
                                                <p>
                                                    <span className="font-medium">Operator:</span> {venue.operator?.fullName} ({venue.operator?.email})
                                                </p>
                                                <p>
                                                    <span className="font-medium">Submitted:</span> {new Date(venue.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-row md:flex-col gap-2">
                                            <Link
                                                to={`/admin/venues/${venue.id}`}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                                            >
                                                View Details
                                            </Link>
                                            <button
                                                onClick={() => handleApprove(venue.id)}
                                                disabled={processingId === venue.id}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                {processingId === venue.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(venue.id)}
                                                disabled={processingId === venue.id}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-soft p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                        No pending venues
                    </h3>
                    <p className="text-gray-500">
                        All venue applications have been reviewed.
                    </p>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(null)} />
                    <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="font-heading font-bold text-xl text-gray-900 mb-4">
                            Reject Venue
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Please provide a reason for rejection. This will be shared with the operator.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                            rows={4}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReject(showRejectModal)}
                                disabled={processingId === showRejectModal}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {processingId === showRejectModal ? 'Rejecting...' : 'Reject Venue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PendingVenues;
