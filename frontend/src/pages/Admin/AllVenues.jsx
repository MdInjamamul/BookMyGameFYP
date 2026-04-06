import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';

function AllVenues() {
    const [venues, setVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const fetchVenues = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('approvalStatus', filter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('limit', '50');

            const data = await adminService.getAllVenues(params.toString());
            if (data.success) {
                setVenues(data.data);
            }
        } catch (err) {
            console.error('Error fetching venues:', err);
            setError('Failed to load venues');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVenues();
    }, [filter, debouncedSearch]);



    if (isLoading && venues.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-heading font-bold text-3xl text-gray-900">All Venues</h1>
                <p className="text-gray-600 mt-1">View and manage all venue listings</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search venues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            {error ? (
                <div className="text-center py-12">
                    <p className="text-red-500">{error}</p>
                    <button onClick={fetchVenues} className="mt-4 btn-primary">Retry</button>
                </div>
            ) : venues.length > 0 ? (
                <div className="bg-white rounded-xl shadow-soft overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sport</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Operator</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {venues.map((venue) => (
                                <tr key={venue.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {venue.images?.[0] ? (
                                                    <img
                                                        src={venue.images[0].imageUrl}
                                                        alt={venue.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{venue.name}</p>
                                                <p className="text-sm text-gray-500">{venue.address}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                            {venue.sport?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-900">{venue.operator?.fullName}</p>
                                        <p className="text-sm text-gray-500">{venue.operator?.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={venue.approvalStatus} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/admin/venues/${venue.id}`}
                                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon="venue"
                    title="No venues found"
                    message={filter !== 'all' ? `No ${filter} venues at the moment.` : 'No venues have been submitted yet.'}
                />
            )}
        </div>
    );
}

export default AllVenues;
