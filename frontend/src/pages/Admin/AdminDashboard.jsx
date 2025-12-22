import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recentVenues, setRecentVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/admin/dashboard');
                if (response.data.success) {
                    setStats(response.data.data.stats);
                    setRecentVenues(response.data.data.recentPendingVenues);
                }
            } catch (err) {
                console.error('Error fetching dashboard:', err);
                setError('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

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
                <button onClick={() => window.location.reload()} className="mt-4 btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Pending Venues',
            value: stats?.pendingVenues || 0,
            color: 'amber',
            icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            link: '/admin/venues/pending'
        },
        {
            label: 'Approved Venues',
            value: stats?.approvedVenues || 0,
            color: 'green',
            icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            color: 'blue',
            icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        },
        {
            label: 'Total Operators',
            value: stats?.totalOperators || 0,
            color: 'purple',
            icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        },
        {
            label: 'Total Bookings',
            value: stats?.totalBookings || 0,
            color: 'indigo',
            icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        },
        {
            label: 'Total Revenue',
            value: `Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`,
            color: 'emerald',
            icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-heading font-bold text-3xl text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage venues, users, and system settings</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className={`bg-white rounded-xl shadow-soft p-6 border-l-4 ${stat.color === 'amber' ? 'border-amber-500' :
                            stat.color === 'green' ? 'border-green-500' :
                                stat.color === 'blue' ? 'border-blue-500' :
                                    stat.color === 'purple' ? 'border-purple-500' :
                                        stat.color === 'indigo' ? 'border-indigo-500' :
                                            'border-emerald-500'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">{stat.label}</p>
                                <p className="font-heading font-bold text-2xl text-gray-900 mt-1">
                                    {stat.value}
                                </p>
                            </div>
                            <div className="text-gray-400">{stat.icon}</div>
                        </div>
                        {stat.link && (
                            <Link
                                to={stat.link}
                                className="inline-block mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                View all →
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* Pending Venues Section */}
            <div className="bg-white rounded-xl shadow-soft">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-heading font-bold text-xl text-gray-900">
                            Pending Venue Approvals
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {recentVenues.length} venue(s) awaiting your review
                        </p>
                    </div>
                    <Link
                        to="/admin/venues/pending"
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                        View All
                    </Link>
                </div>

                {recentVenues.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {recentVenues.map((venue) => (
                            <div key={venue.id} className="p-6 flex items-center gap-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                                    <p className="text-gray-500 text-sm">
                                        {venue.sport?.name} • {venue.address}
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        By: {venue.operator?.fullName} ({venue.operator?.email})
                                    </p>
                                </div>
                                <Link
                                    to={`/admin/venues/${venue.id}`}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                    Review
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                            All caught up!
                        </h3>
                        <p className="text-gray-500">
                            No pending venues to review at the moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
