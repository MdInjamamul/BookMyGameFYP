import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatTime } from '../../utils/timeUtils';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

function UserBookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelInfo, setCancelInfo] = useState({ refundMsg: '' });

    useEffect(() => {
        fetchBooking();
    }, [id]);

    const fetchBooking = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/bookings/my-bookings/${id}`);
            if (response.data.success) {
                setBooking(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching booking:', err);
            setError(err.response?.data?.message || 'Failed to load booking details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        setShowCancelModal(false);
        try {
            setActionLoading(true);
            const response = await api.put(`/bookings/${id}/cancel`);
            if (response.data.success) {
                setBooking(prev => ({ ...prev, status: 'cancelled' }));
                const msg = response.data.data?.refundInfo?.message || 'Booking cancelled successfully';
                toast.success(msg);
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            toast.error(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setActionLoading(false);
        }
    };

    const openCancelModal = () => {
        const slotDate = new Date(booking.slot?.date || booking.bookingDate);
        const slotStart = new Date(booking.slot?.startTime);
        const startDateTime = new Date(
            Date.UTC(
                slotDate.getUTCFullYear(),
                slotDate.getUTCMonth(),
                slotDate.getUTCDate(),
                slotStart.getUTCHours(),
                slotStart.getUTCMinutes(),
                0
            )
        );
        const now = new Date();
        const hoursUntilStart = (startDateTime - now) / (1000 * 60 * 60);
        let refundMsg = 'Refund: 0% — less than 6 hours remaining until the game.';
        if (hoursUntilStart > 24) {
            refundMsg = `Refund: 100% — Rs. ${booking.totalPrice} will be refunded.`;
        } else if (hoursUntilStart > 6) {
            refundMsg = `Refund: 50% — Rs. ${booking.totalPrice / 2} will be refunded.`;
        }
        setCancelInfo({ refundMsg });
        setShowCancelModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            confirmed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            completed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
            slot_released: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> },
        };
        return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getBookingStartDateTime = () => {
        if (!booking) return null;
        const slotDate = new Date(booking.slot?.date || booking.bookingDate);
        const slotStart = new Date(booking.slot?.startTime);
        return new Date(
            Date.UTC(
                slotDate.getUTCFullYear(),
                slotDate.getUTCMonth(),
                slotDate.getUTCDate(),
                slotStart.getUTCHours(),
                slotStart.getUTCMinutes(),
                0
            )
        );
    };

    const canCancelBooking = () => {
        if (!booking || !['pending', 'confirmed'].includes(booking.status)) return false;
        const bookingStart = getBookingStartDateTime();
        if (!bookingStart) return false;
        return bookingStart > new Date();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
                        <p className="text-gray-500 mb-6">{error || "The booking you're looking for doesn't exist."}</p>
                        <Link to="/my-bookings" className="btn-primary w-full inline-block">
                            Back to My Bookings
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const statusStyle = getStatusBadge(booking.status);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <ConfirmModal
                isOpen={showCancelModal}
                title='Cancel Booking?'
                message={`Are you sure you want to cancel this booking?\n\n${cancelInfo.refundMsg}`}
                confirmText='Cancel Booking'
                confirmVariant='danger'
                onConfirm={handleCancelBooking}
                onCancel={() => setShowCancelModal(false)}
            />

            <main className="flex-1 container-custom py-8">
                {/* Back Button & Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/my-bookings')}
                        className="inline-flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to My Bookings
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Booking Details</h1>
                            <p className="text-gray-500 text-sm mt-1">ID: <span className="font-mono">{booking.id}</span></p>
                        </div>
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                            <span className="mr-2">{statusStyle.icon}</span>
                            {booking.status === 'pending'
                                ? 'Pending Payment'
                                : booking.status === 'slot_released'
                                ? '🔓 Slot Released'
                                : booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Venue Detail Card */}
                        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                            <div className="h-48 overflow-hidden bg-gray-100 relative">
                                {booking.slot?.venue?.images?.[0]?.imageUrl ? (
                                    <img 
                                        src={booking.slot.venue.images[0].imageUrl} 
                                        alt={booking.slot.venue.name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800 shadow-sm">
                                    {booking.slot?.venue?.sport?.name || 'Sport'}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{booking.slot?.venue?.name}</h2>
                                        <p className="text-gray-500 flex items-start mt-1">
                                            <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {booking.slot?.venue?.address}
                                        </p>
                                    </div>
                                    <Link to={`/venues/${booking.slot?.venue?.id}`} className="btn-outline text-sm py-1.5 px-3">
                                        View Venue
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Operator</p>
                                        <p className="font-medium text-gray-900">{booking.slot?.venue?.operator?.fullName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                                        <p className="font-medium text-gray-900">{booking.slot?.venue?.operator?.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Booking Schedule Card */}
                        <div className="bg-white rounded-xl shadow-soft p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Schedule Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Date</p>
                                    <p className="font-semibold text-gray-900">{formatDate(booking.slot?.date || booking.bookingDate)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Time Slot</p>
                                    <p className="font-semibold text-gray-900">
                                        {formatTime(booking.slot?.startTime)} - {formatTime(booking.slot?.endTime)}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                                    <p className="text-sm text-gray-500 mb-1">Booked On</p>
                                    <p className="font-medium text-gray-900">{formatDateTime(booking.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Card */}
                        <div className="bg-white rounded-xl shadow-soft p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Payment Information
                            </h2>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="mb-3 sm:mb-0">
                                    <p className="text-sm text-gray-500 mb-1">Total Amount Paid</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        Rs. {parseFloat(booking.totalPrice).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-left sm:text-right">
                                    {booking.status === 'pending' ? (
                                        <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</div>
                                    ) : booking.payments && booking.payments.length > 0 ? (
                                        <div>
                                            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-1">Paid Successfully</div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">via {booking.payments[0].paymentMethod || 'Khalti'}</p>
                                        </div>
                                    ) : booking.status === 'cancelled' ? (
                                        <div className="inline-block px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">Cancelled</div>
                                    ) : (
                                        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Confirmed</div>
                                    )}
                                </div>
                            </div>
                            
                            {booking.status === 'cancelled' && booking.notes && booking.notes.includes('Refund') && (
                                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                                    <p className="font-semibold mb-1">Refund Status Update</p>
                                    <p>Your payment has been requested for a refund. It will reflect in your Khalti wallet depending on processing times.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Tracking */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-soft">
                            <h3 className="font-semibold mb-4 text-gray-100">Booking Status</h3>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${booking.createdAt ? 'bg-primary-500' : 'bg-gray-700 text-gray-500'}`}>
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div className="ml-3 mt-1">
                                        <p className="text-sm font-medium">Booking Created</p>
                                    </div>
                                </div>
                                <div className="w-0.5 h-4 bg-gray-700 ml-4 -my-2"></div>
                                <div className="flex items-start">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${booking.status !== 'pending' ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                                        {booking.status !== 'pending' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                                    </div>
                                    <div className="ml-3 mt-1">
                                        <p className="text-sm font-medium">Payment Confirmed</p>
                                    </div>
                                </div>
                                {booking.status === 'cancelled' && (
                                    <>
                                        <div className="w-0.5 h-4 bg-gray-700 ml-4 -my-2"></div>
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </div>
                                            <div className="ml-3 mt-1">
                                                <p className="text-sm font-medium text-red-400">Cancelled</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {booking.status === 'slot_released' && (
                                    <>
                                        <div className="w-0.5 h-4 bg-gray-700 ml-4 -my-2"></div>
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div className="ml-3 mt-1">
                                                <p className="text-sm font-medium text-orange-400">Slot Released</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Payment timeout</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {canCancelBooking() && (
                            <div className="bg-white rounded-xl shadow-soft p-6 border border-red-50">
                                <h3 className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-2">Actions</h3>
                                <p className="text-sm text-gray-500 mb-4">You can cancel this booking. Refund amounts depend on cancellation time before the slot schedule.</p>
                                <button
                                    onClick={openCancelModal}
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                                </button>
                            </div>
                        )}

                        {booking.status === 'completed' && !booking.review && (
                            <div className="bg-white rounded-xl shadow-soft p-6 text-center border border-primary-50">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">How was your game?</h3>
                                <p className="text-sm text-gray-500 mb-4">Leave a review for this venue to help others.</p>
                                <Link to={`/venues/${booking.slot?.venue?.id}#reviews`} className="w-full inline-block text-center btn-primary py-2.5">
                                    Write a Review
                                </Link>
                            </div>
                        )}
                        
                        {booking.notes && !booking.notes.includes('Cancelled by user') && (
                            <div className="bg-blue-50 text-blue-800 rounded-xl p-6">
                                <h3 className="font-semibold mb-2">Notes</h3>
                                <p className="text-sm">{booking.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default UserBookingDetail;
