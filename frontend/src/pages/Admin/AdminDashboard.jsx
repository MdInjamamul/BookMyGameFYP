import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recentVenues, setRecentVenues] = useState([]);
    const [period, setPeriod] = useState(30);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [error, setError] = useState(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!hasFetched.current) {
            fetchStats();
            hasFetched.current = true;
        }
    }, []);

    useEffect(() => {
        fetchAnalytics(period);
    }, [period]);

    const fetchStats = async () => {
        try {
            setIsLoadingStats(true);
            const data = await adminService.getDashboardStats();
            if (data.success) {
                setStats(data.data.stats);
                setRecentVenues(data.data.recentPendingVenues || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            setError('Failed to load dashboard data');
        } finally {
            setIsLoadingStats(false);
        }
    };

    const fetchAnalytics = async (p) => {
        try {
            setIsLoadingAnalytics(true);
            const data = await adminService.getAnalytics(p);
            if (data.success) {
                setAnalytics(data.data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    // --- RECHARTS COLORS & TOOLTIPS ---
    const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
        if (!active || !payload?.length) return null;
        const val = payload[0].value;
        return (
            <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-100">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-primary-600 font-bold">{prefix}{typeof val === 'number' && prefix === 'Rs. ' ? val.toLocaleString() : val}{suffix}</p>
            </div>
        );
    };

    // --- KPI CHANGE BADGE ---
    const renderGrowthBadge = (current, previous, isCurrency = false) => {
        if (!current || !previous) return null;
        const diff = current - previous;
        const pct = Math.round((diff / previous) * 100);
        if (pct === 0) return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">No change</span>;

        const isPos = pct > 0;
        return (
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${isPos ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isPos ? '↑' : '↓'} {Math.abs(pct)}%
            </div>
        );
    };

    const kpi = analytics?.kpiComparison;

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, color: 'bg-blue-50', textColor: 'text-blue-600', growth: kpi && renderGrowthBadge(kpi.currentUsers, kpi.previousUsers) },
        { label: 'Venue Operators', value: stats?.totalOperators || 0, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, color: 'bg-indigo-50', textColor: 'text-indigo-600', growth: null },
        { label: 'Total Venues', value: stats?.totalVenues || 0, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>, color: 'bg-purple-50', textColor: 'text-purple-600', growth: null },
        { label: 'Pending Venues', value: stats?.pendingVenues || 0, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'bg-yellow-50', textColor: 'text-yellow-600', growth: null },
        { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, color: 'bg-green-50', textColor: 'text-green-600', growth: kpi && renderGrowthBadge(kpi.currentBookings, kpi.previousBookings) },
        { label: 'Total Revenue', value: `Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'bg-emerald-50', textColor: 'text-emerald-600', growth: kpi && renderGrowthBadge(kpi.currentRevenue, kpi.previousRevenue, true) },
    ];

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
                <button onClick={() => { hasFetched.current = false; fetchStats(); }} className="ml-4 underline hover:no-underline">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Platform overview and performance metrics.</p>
            </div>

            {/* Section 1: KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all animate-slide-up flex flex-col justify-between" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${stat.color} ${stat.textColor}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                            {stat.growth && <div>{stat.growth}</div>}
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

            {/* Section 2: Platform Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Platform Revenue</h2>
                    {isLoadingAnalytics ? (<div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>) : analytics?.revenueByDay?.some(d => d.revenue > 0) ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.revenueByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis width={80} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `NRs. ${v / 1000}k`} />
                                    <Tooltip content={<CustomTooltip prefix="NRs. " />} cursor={{ fill: '#F3F4F6' }} />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (<div className="h-64 flex items-center justify-center text-gray-400 text-sm">No revenue in this period.</div>)}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">New User Registrations</h2>
                    {isLoadingAnalytics ? (<div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>) : analytics?.usersByDay?.some(d => d.count > 0) ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.usersByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip suffix=" users" />} />
                                    <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (<div className="h-64 flex items-center justify-center text-gray-400 text-sm">No new users in this period.</div>)}
                </div>
            </div>

            {/* Section 3: Distribution Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Venues by Sport</h2>
                    {isLoadingAnalytics ? (<div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>) : analytics?.venuesBySport?.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.venuesBySport} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="sport" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={80} />
                                    <Tooltip content={<CustomTooltip suffix=" venues" />} cursor={{ fill: '#F3F4F6' }} />
                                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={25}>
                                        {analytics.venuesBySport.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#93C5FD'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (<div className="h-64 flex items-center justify-center text-gray-400 text-sm">No venue data.</div>)}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Platform Booking Status</h2>
                    {isLoadingAnalytics ? (<div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>) : analytics?.bookingsByStatus?.length > 0 ? (
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
                    ) : (<div className="h-64 flex items-center justify-center text-gray-400 text-sm">No booking status data.</div>)}
                </div>
            </div>

            {/* Section 4: Tables Layer */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Top Operators Table (2/3 width) */}
                <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Top Operators</h2>
                    </div>
                    {isLoadingAnalytics ? (<div className="p-10 text-center text-gray-400">Loading operators...</div>) : analytics?.topOperators?.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No operator data available yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Operator</th>
                                        <th className="px-6 py-4 text-center">Venues</th>
                                        <th className="px-6 py-4 text-center">Bookings</th>
                                        <th className="px-6 py-4 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {analytics?.topOperators?.map((op, idx) => (
                                        <tr key={op.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-400 font-bold w-4">{idx + 1}.</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{op.fullName}</p>
                                                        <p className="text-xs text-gray-500">{op.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-gray-700">{op.venueCount || 0}</td>
                                            <td className="px-6 py-4 text-center font-medium text-gray-700">{op.bookingCount}</td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">Rs. {op.totalRevenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pending Venues (1/3 width) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col xl:col-span-1">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
                        {recentVenues.length > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{recentVenues.length}</span>
                        )}
                    </div>
                    <div className="flex-1 p-4">
                        {recentVenues.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <p>No pending venues.</p>
                                <p className="text-sm mt-1">All caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentVenues.map(venue => (
                                    <div key={venue.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                                        <div className="min-w-0 pr-3">
                                            <h3 className="font-semibold text-gray-900 text-sm truncate">{venue.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">By {venue.operator?.fullName}</p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full block mb-2 whitespace-nowrap text-center">
                                                {venue.sport?.name}
                                            </span>
                                            <Link to={`/admin/venues`} className="text-xs text-blue-600 font-bold hover:underline whitespace-nowrap">
                                                Review →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-100 p-4 bg-gray-50 text-center">
                        <Link to="/admin/venues" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            Manage All Venues
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminDashboard;
