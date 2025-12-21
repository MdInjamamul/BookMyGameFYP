import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function VenueDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [venue, setVenue] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchVenue();
    }, [id]);

    const fetchVenue = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/venues/operator/my-venues/${id}`);
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

    const getStatusBadge = () => {
        if (!venue?.isActive) {
            return { label: 'Inactive', class: 'bg-gray-100 text-gray-800' };
        }
        switch (venue?.approvalStatus) {
            case 'approved':
                return { label: 'Active', class: 'bg-green-100 text-green-800' };
            case 'pending':
                return { label: 'Pending Approval', class: 'bg-yellow-100 text-yellow-800' };
            case 'rejected':
                return { label: 'Rejected', class: 'bg-red-100 text-red-800' };
            default:
                return { label: venue?.approvalStatus, class: 'bg-gray-100 text-gray-800' };
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleGenerateSlots = async () => {
        const startDate = prompt('Enter start date (YYYY-MM-DD):');
        const endDate = prompt('Enter end date (YYYY-MM-DD):');

        if (!startDate || !endDate) return;

        try {
            const response = await api.post(`/timeslots/operator/venue/${id}/generate`, {
                startDate,
                endDate,
                slotDurationMinutes: 60,
            });
            alert(`Successfully generated ${response.data.created} time slots!`);
        } catch (err) {
            console.error('Error generating slots:', err);
            alert(err.response?.data?.message || 'Failed to generate time slots');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
                <button onClick={() => navigate('/operator/venues')} className="ml-4 underline hover:no-underline">
                    Go Back
                </button>
            </div>
        );
    }

    const status = getStatusBadge();
    const primaryImage = venue?.images?.find((img) => img.isPrimary) || venue?.images?.[0];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/operator/venues')}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{venue?.name}</h1>
                        <div className="flex items-center space-x-3 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.class}`}>
                                {status.label}
                            </span>
                            <span className="text-gray-500">{venue?.city}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleGenerateSlots}
                        className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                        Generate Time Slots
                    </button>
                    <Link
                        to={`/operator/venues/${id}/edit`}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Edit Venue
                    </Link>
                </div>
            </div>

            {/* Hero Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                    {primaryImage ? (
                        <img
                            src={primaryImage.imageUrl}
                            alt={venue?.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>No images uploaded</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Gallery */}
                {venue?.images?.length > 1 && (
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex gap-2 overflow-x-auto">
                            {venue.images.map((image, index) => (
                                <img
                                    key={image.id || index}
                                    src={image.imageUrl}
                                    alt={`${venue.name} ${index + 1}`}
                                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="border-b border-gray-100">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { key: 'overview', label: 'Overview' },
                            { key: 'schedule', label: 'Schedule' },
                            { key: 'bookings', label: 'Recent Bookings' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Price/Hour</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        Rs. {parseFloat(venue?.pricePerHour || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Rating</p>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-xl font-bold text-gray-900">
                                            {venue?.rating ? parseFloat(venue.rating).toFixed(1) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Total Bookings</p>
                                    <p className="text-xl font-bold text-gray-900">{venue?._count?.bookings || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Reviews</p>
                                    <p className="text-xl font-bold text-gray-900">{venue?._count?.reviews || 0}</p>
                                </div>
                            </div>

                            {/* Description */}
                            {venue?.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                                    <p className="text-gray-700">{venue.description}</p>
                                </div>
                            )}

                            {/* Location */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
                                <div className="flex items-start space-x-2 mb-4">
                                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-gray-700">{venue?.address}</p>
                                        <p className="text-sm text-gray-500">
                                            {[venue?.city, venue?.state, venue?.postalCode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                                {/* Map Link */}
                                {venue?.latitude && venue?.longitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span>View on Google Maps</span>
                                    </a>
                                )}
                            </div>

                            {/* Contact */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {venue?.contactPhone && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                                        <p className="text-gray-700">{venue.contactPhone}</p>
                                    </div>
                                )}
                                {venue?.contactEmail && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                                        <p className="text-gray-700">{venue.contactEmail}</p>
                                    </div>
                                )}
                            </div>

                            {/* Sports */}
                            {venue?.sports?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Sports Offered</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {venue.sports.map((s) => (
                                            <span
                                                key={s.sportId}
                                                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                                            >
                                                {s.sport?.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Amenities */}
                            {venue?.amenities?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Amenities</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {venue.amenities.map((amenity, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                            >
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Operating Hours</h3>
                            <div className="space-y-2">
                                {venue?.operatingHours?.map((hour) => (
                                    <div
                                        key={hour.dayOfWeek}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <span className="font-medium text-gray-700">
                                            {dayNames[hour.dayOfWeek]}
                                        </span>
                                        {hour.isClosed ? (
                                            <span className="text-gray-500">Closed</span>
                                        ) : (
                                            <span className="text-gray-700">
                                                {formatTime(hour.openingTime)} - {formatTime(hour.closingTime)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bookings Tab */}
                    {activeTab === 'bookings' && (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500">No recent bookings for this venue.</p>
                            <Link
                                to="/operator/bookings"
                                className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
                            >
                                View All Bookings →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VenueDetails;
