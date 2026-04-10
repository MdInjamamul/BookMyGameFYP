import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatTime } from '../../utils/timeUtils';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area,
    PieChart, Pie, Cell, Legend
} from 'recharts';

function OperatorDashboard() {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [period, setPeriod] = useState(30);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchAnalytics(period);
    }, [period]);

    const fetchStats = async () => {
        try {
            setIsLoadingStats(true);
            const response = await api.get('/venues/operator/dashboard');
            if (response.data.success) {
                setStats(response.data.data.stats);
                setRecentBookings(response.data.data.recentBookings || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setIsLoadingStats(false);
        }
    };

    const fetchAnalytics = async (p) => {
        try {
            setIsLoadingAnalytics(true);
            const response = await api.get(`/venues/operator/analytics?period=${p}`);
            if (response.data.success) {
                setAnalytics(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            // Don't overwrite the main error if stats loaded fine
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    // --- RECHARTS COLORS & TOOLTIPS ---
    const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];
    
    const RevenueTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-100">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-emerald-600 font-bold">Rs. {payload[0].value.toLocaleString()}</p>
            </div>
        );
    };

    const CountTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-100">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-blue-600 font-bold">{payload[0].value} {payload[0].name}</p>
            </div>
        );
    };

    const statCards = [
        { label: 'Total Venues', value: stats?.totalVenues || 0, color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg> },
        { label: 'Active Venues', value: stats?.activeVenues || 0, color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: 'Pending Approval', value: stats?.pendingApproval || 0, color: 'bg-yellow-500', bgLight: 'bg-yellow-50', textColor: 'text-yellow-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: 'Total Bookings', value: stats?.totalBookings || 0, color: 'bg-purple-500', bgLight: 'bg-purple-50', textColor: 'text-purple-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        { label: 'Pending Bookings', value: stats?.pendingBookings || 0, color: 'bg-orange-500', bgLight: 'bg-orange-50', textColor: 'text-orange-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
        { label: 'Total Revenue', value: `Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: 'Total Events', value: stats?.totalEvents || 0, color: 'bg-violet-500', bgLight: 'bg-violet-50', textColor: 'text-violet-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
        { label: 'Event Registrations', value: stats?.totalEventRegistrations || 0, color: 'bg-pink-500', bgLight: 'bg-pink-50', textColor: 'text-pink-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg> },
        { label: 'Event Revenue', value: `Rs. ${(stats?.eventRevenue || 0).toLocaleString()}`, color: 'bg-teal-500', bgLight: 'bg-teal-50', textColor: 'text-teal-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    ];

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            confirmed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            completed: 'bg-blue-100 text-blue-800 border border-blue-200',
            cancelled: 'bg-red-100 text-red-800 border border-red-200',
            slot_released: 'bg-gray-100 text-gray-800 border border-gray-200',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoadingStats) {
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
                <button onClick={() => fetchStats()} className="ml-4 underline hover:no-underline">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Operator Dashboard</h1>
                    <p className="text-gray-600 mt-1">Real-time overview of your venues and bookings.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/operator/venues/new" className="btn-primary py-2 px-4 text-sm whitespace-nowrap">
                        + New Venue
                    </Link>
                    <Link to="/operator/calendar" className="btn-outline py-2 px-4 text-sm bg-white whitespace-nowrap">
                        📅 Calendar
                    </Link>
                </div>
            </div>

            {/* Section 1: KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${stat.bgLight} ${stat.textColor} text-2xl`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Period Toggle */}
            <div className="flex justify-center sm:justify-end border-b border-gray-200 pb-2">
                <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                    {[7, 30, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setPeriod(d)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${period === d ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Last {d} Days
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 2: Trends Layer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
                    </div>
                    {isLoadingAnalytics ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
                    ) : analytics?.revenueByDay?.some(d => d.revenue > 0) ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.revenueByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis width={80} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} tickFormatter={v => `NRs. ${v/1000}k`} />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No revenue collected in this period.</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Bookings Trend</h2>
                    </div>
                    {isLoadingAnalytics ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
                    ) : analytics?.bookingsByDay?.some(d => d.count > 0) ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.bookingsByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CountTooltip />} />
                                    <Area type="monotone" name="Bookings" dataKey="count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No bookings in this period.</div>
                    )}
                </div>
            </div>

            {/* Section 3: Distribution & Top Entities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Booking Status Breakdown</h2>
                    {isLoadingAnalytics ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
                    ) : analytics?.bookingsByStatus?.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={analytics.bookingsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="status">
                                        {analytics.bookingsByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]} />
                                    <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No status data available.</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Top Venues by Revenue</h2>
                    {isLoadingAnalytics ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
                    ) : analytics?.topVenues?.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.topVenues} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="venueName" tick={{fontSize: 12, fill: '#374151'}} axisLine={false} tickLine={false} width={100} />
                                    <Tooltip content={<RevenueTooltip />} cursor={{fill: '#F3F4F6'}} />
                                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={25}>
                                        {analytics.topVenues.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#8B5CF6' : '#A78BFA'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No revenue data available.</div>
                    )}
                </div>
            </div>

            {/* Section 4: Upcoming Bookings Preview */}
            {analytics?.upcomingBookings?.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                                {analytics.upcomingCount}
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Upcoming Bookings (Next 7 Days)</h2>
                        </div>
                        <Link to="/operator/calendar" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                            Go to Calendar →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.upcomingBookings.slice(0, 3).map(b => (
                            <div key={b.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <p className="text-xs text-blue-600 font-bold mb-1">{formatDate(b.slotDate)}</p>
                                <p className="font-semibold text-gray-900 truncate">{b.venueName}</p>
                                <p className="text-sm text-gray-500 mt-1">{formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <p className="text-xs font-medium text-gray-700">👤 {b.userName}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(b.status)} uppercase tracking-wider font-bold`}>
                                        {b.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 5: Recent Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Latest Bookings</h2>
                    <Link to="/operator/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-3 py-1 rounded-full">
                        View All
                    </Link>
                </div>
                {recentBookings.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No bookings recorded yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Venue</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{b.user?.fullName}</p>
                                            <p className="text-xs text-gray-500">{b.user?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{b.slot?.venue?.name}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{formatDate(b.slot?.date)}</p>
                                            <p className="text-xs text-gray-500">{formatTime(b.slot?.startTime)} - {formatTime(b.slot?.endTime)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(b.status)}`}>
                                                {b.status === 'pending' ? 'Pending' : b.status?.charAt(0).toUpperCase() + b.status?.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                            Rs. {parseFloat(b.totalPrice).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OperatorDashboard;
