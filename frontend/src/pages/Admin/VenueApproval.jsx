import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function VenueApproval() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [venue, setVenue] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        const fetchVenue = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/admin/venues/${id}`);
                if (response.data.success) {
                    setVenue(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching venue:', err);
                setError('Failed to load venue details');
            } finally {
                setIsLoading(false);
            }
        };
        fetchVenue();
    }, [id]);

    const handleApprove = async () => {
        try {
            setProcessing(true);
            const response = await api.put(`/admin/venues/${id}/approve`);
            if (response.data.success) {
                navigate('/admin/venues/pending', {
                    state: { message: 'Venue approved successfully!' }
                });
            }
        } catch (err) {
            console.error('Error approving venue:', err);
            alert('Failed to approve venue');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setProcessing(true);
            const response = await api.put(`/admin/venues/${id}/reject`, {
                reason: rejectReason,
            });
            if (response.data.success) {
                navigate('/admin/venues/pending', {
                    state: { message: 'Venue rejected' }
                });
            }
        } catch (err) {
            console.error('Error rejecting venue:', err);
            alert('Failed to reject venue');
        } finally {
            setProcessing(false);
        }
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (error || !venue) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error || 'Venue not found'}</p>
                <button onClick={() => navigate(-1)} className="mt-4 btn-primary">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Pending Venues
                    </button>
                    <h1 className="font-heading font-bold text-3xl text-gray-900">{venue.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            {venue.approvalStatus}
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                            {venue.sport?.name}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                {venue.approvalStatus === 'pending' && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={processing}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={processing}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {processing ? 'Processing...' : 'Approve Venue'}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Images & Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Images */}
                    <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                        <div className="aspect-video bg-gray-100">
                            {venue.images?.length > 0 ? (
                                <img
                                    src={venue.images[selectedImage]?.imageUrl}
                                    alt={venue.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {venue.images?.length > 1 && (
                            <div className="p-4 flex gap-2 overflow-x-auto">
                                {venue.images.map((img, index) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-red-600' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-xl shadow-soft p-6">
                        <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Description</h2>
                        <p className="text-gray-600 whitespace-pre-line">
                            {venue.description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Amenities */}
                    <div className="bg-white rounded-xl shadow-soft p-6">
                        <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Amenities</h2>
                        {venue.amenities && venue.amenities.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {venue.amenities.map((amenity, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                    >
                                        ✓ {amenity}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No amenities listed.</p>
                        )}
                    </div>

                    {/* Operating Hours */}
                    <div className="bg-white rounded-xl shadow-soft p-6">
                        <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Operating Hours</h2>
                        {venue.operatingHours?.length > 0 ? (
                            <div className="space-y-2">
                                {venue.operatingHours.map((hour) => (
                                    <div key={hour.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="font-medium text-gray-900">
                                            {dayNames[hour.dayOfWeek]}
                                        </span>
                                        <span className={hour.isClosed ? 'text-red-500' : 'text-gray-600'}>
                                            {hour.isClosed ? 'Closed' : `${formatTime(hour.openingTime)} - ${formatTime(hour.closingTime)}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No operating hours set.</p>
                        )}
                    </div>
                </div>

                {/* Right Column - Info Cards */}
                <div className="space-y-6">
                    {/* Venue Info */}
                    <div className="bg-white rounded-xl shadow-soft p-6">
                        <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Venue Info</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-500 text-sm">Price per Hour</p>
                                <p className="font-bold text-2xl text-gray-900">
                                    Rs. {parseFloat(venue.pricePerHour).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Address</p>
                                <p className="text-gray-900">{venue.address}</p>
                                {venue.city && <p className="text-gray-600">{venue.city}, {venue.state}</p>}
                            </div>
                            {venue.contactPhone && (
                                <div>
                                    <p className="text-gray-500 text-sm">Contact Phone</p>
                                    <p className="text-gray-900">{venue.contactPhone}</p>
                                </div>
                            )}
                            {venue.contactEmail && (
                                <div>
                                    <p className="text-gray-500 text-sm">Contact Email</p>
                                    <p className="text-gray-900">{venue.contactEmail}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operator Info */}
                    <div className="bg-white rounded-xl shadow-soft p-6">
                        <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Operator Info</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-500 text-sm">Name</p>
                                <p className="font-medium text-gray-900">{venue.operator?.fullName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Email</p>
                                <p className="text-gray-900">{venue.operator?.email}</p>
                            </div>
                            {venue.operator?.phone && (
                                <div>
                                    <p className="text-gray-500 text-sm">Phone</p>
                                    <p className="text-gray-900">{venue.operator?.phone}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-500 text-sm">Member Since</p>
                                <p className="text-gray-900">
                                    {new Date(venue.operator?.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submission Info */}
                    <div className="bg-white rounded-xl shadow-soft p-6">
                        <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Submission</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-500 text-sm">Submitted At</p>
                                <p className="text-gray-900">
                                    {new Date(venue.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Status</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${venue.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                        venue.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                    }`}>
                                    {venue.approvalStatus.charAt(0).toUpperCase() + venue.approvalStatus.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
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
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {processing ? 'Rejecting...' : 'Reject Venue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VenueApproval;
