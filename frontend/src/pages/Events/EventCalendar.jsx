import { useState } from 'react';
import { Link } from 'react-router-dom';

// Mock events data
const mockEvents = [
    {
        id: 1,
        title: 'Weekend Football Tournament',
        sport: 'Football',
        category: 'Tournament',
        venue: 'Prime Sports Arena',
        location: 'Kathmandu',
        date: '2024-12-28',
        time: '09:00 AM',
        endTime: '05:00 PM',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500',
        entryFee: 500,
        participants: 45,
        maxParticipants: 64,
        status: 'open', // open, closed, full
        organizer: 'Sports Nepal',
    },
    {
        id: 2,
        title: 'Basketball Championship 2024',
        sport: 'Basketball',
        category: 'Tournament',
        venue: 'Elite Basketball Court',
        location: 'Lalitpur',
        date: '2024-12-30',
        time: '02:00 PM',
        endTime: '08:00 PM',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
        entryFee: 800,
        participants: 32,
        maxParticipants: 32,
        status: 'full',
        organizer: 'Hoops Club',
    },
    {
        id: 3,
        title: 'Cricket Practice Session',
        sport: 'Cricket',
        category: 'Training',
        venue: 'Champions Cricket Ground',
        location: 'Bhaktapur',
        date: '2024-12-25',
        time: '06:00 AM',
        endTime: '09:00 AM',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
        entryFee: 0,
        participants: 18,
        maxParticipants: 30,
        status: 'open',
        organizer: 'Cricket Academy',
    },
    {
        id: 4,
        title: 'Valley Futsal League',
        sport: 'Football',
        category: 'League',
        venue: 'Valley Futsal Hub',
        location: 'Kathmandu',
        date: '2025-01-05',
        time: '04:00 PM',
        endTime: '09:00 PM',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500',
        entryFee: 2000,
        participants: 12,
        maxParticipants: 16,
        status: 'open',
        organizer: 'Futsal Federation',
    },
    {
        id: 5,
        title: 'Basketball Skills Workshop',
        sport: 'Basketball',
        category: 'Training',
        venue: 'Sports Village Complex',
        location: 'Kirtipur',
        date: '2024-12-27',
        time: '10:00 AM',
        endTime: '01:00 PM',
        image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=500',
        entryFee: 300,
        participants: 22,
        maxParticipants: 40,
        status: 'open',
        organizer: 'Pro Trainers',
    },
    {
        id: 6,
        title: 'Inter-College Cricket Cup',
        sport: 'Cricket',
        category: 'Tournament',
        venue: 'Metro Cricket Academy',
        location: 'Balaju',
        date: '2025-01-10',
        time: '08:00 AM',
        endTime: '06:00 PM',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500',
        entryFee: 1500,
        participants: 8,
        maxParticipants: 16,
        status: 'open',
        organizer: 'College Sports Board',
    },
];

const categories = ['All', 'Tournament', 'League', 'Training'];
const sports = ['All Sports', 'Football', 'Basketball', 'Cricket'];

function EventCard({ event }) {
    const getStatusBadge = () => {
        switch (event.status) {
            case 'open':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Registration Open</span>;
            case 'full':
                return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Full</span>;
            case 'closed':
                return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">Closed</span>;
            default:
                return null;
        }
    };

    const getSportIcon = () => {
        switch (event.sport) {
            case 'Football':
                return '⚽';
            case 'Basketball':
                return '🏀';
            case 'Cricket':
                return '🏏';
            default:
                return '🏆';
        }
    };

    return (
        <Link
            to={`/events/${event.id}`}
            className="card group hover:-translate-y-1 p-0 overflow-hidden"
        >
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {event.category}
                    </span>
                </div>
                <div className="absolute top-3 right-3">
                    {getStatusBadge()}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Sport & Title */}
                <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{getSportIcon()}</span>
                    <h3 className="font-heading font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {event.title}
                    </h3>
                </div>

                {/* Date & Time */}
                <div className="flex items-center text-gray-600 text-sm mb-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="mx-2">•</span>
                    <span>{event.time}</span>
                </div>

                {/* Venue */}
                <div className="flex items-center text-gray-600 text-sm mb-3">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.venue}, {event.location}</span>
                </div>

                {/* Participants & Fee */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{event.participants}/{event.maxParticipants}</span>
                    </div>
                    <div className="font-bold text-gray-900">
                        {event.entryFee === 0 ? (
                            <span className="text-green-600">Free</span>
                        ) : (
                            <span>Rs. {event.entryFee.toLocaleString()}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function Calendar({ selectedDate, onDateSelect, events }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Previous month days
        for (let i = 0; i < startingDay; i++) {
            const prevDate = new Date(year, month, -startingDay + i + 1);
            days.push({ date: prevDate, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    };

    const hasEvents = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.some(event => event.date === dateStr);
    };

    const isSelected = (date) => {
        if (!selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white rounded-xl shadow-soft p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                    <button
                        key={index}
                        onClick={() => onDateSelect(day.date)}
                        className={`
                            relative p-2 text-sm rounded-lg transition-colors
                            ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                            ${isSelected(day.date) ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}
                            ${isToday(day.date) && !isSelected(day.date) ? 'ring-2 ring-primary-600' : ''}
                        `}
                    >
                        {day.date.getDate()}
                        {hasEvents(day.date) && (
                            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected(day.date) ? 'bg-white' : 'bg-primary-600'}`} />
                        )}
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary-600 rounded-full" />
                    <span>Has Events</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-4 h-4 ring-2 ring-primary-600 rounded" />
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
}

function EventCalendar() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSport, setSelectedSport] = useState('All Sports');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');

    // Filter events
    const filteredEvents = mockEvents.filter(event => {
        // Category filter
        if (selectedCategory !== 'All' && event.category !== selectedCategory) return false;
        // Sport filter
        if (selectedSport !== 'All Sports' && event.sport !== selectedSport) return false;
        // Date filter
        if (selectedDate) {
            const eventDate = new Date(event.date).toDateString();
            if (eventDate !== selectedDate.toDateString()) return false;
        }
        // Search filter
        if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Sort events
    const sortedEvents = [...filteredEvents].sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(a.date) - new Date(b.date);
            case 'name':
                return a.title.localeCompare(b.title);
            case 'fee':
                return a.entryFee - b.entryFee;
            default:
                return 0;
        }
    });

    const clearFilters = () => {
        setSelectedDate(null);
        setSelectedCategory('All');
        setSelectedSport('All Sports');
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container-custom py-4">
                    <div className="flex items-center gap-4">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">B</span>
                            </div>
                            <span className="font-heading font-bold text-xl text-gray-900 hidden sm:block">BookMyGame</span>
                        </Link>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* My Events Dashboard Link */}
                        <Link
                            to="/my-events"
                            className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Events
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-6">
                {/* Page Title */}
                <div className="mb-6">
                    <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">
                        Event Calendar
                    </h1>
                    <p className="text-gray-600">
                        Discover upcoming sports events, tournaments, and training sessions
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - Calendar & Filters */}
                    <aside className="lg:w-80 flex-shrink-0 space-y-4">
                        {/* Calendar */}
                        <Calendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            events={mockEvents}
                        />

                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow-soft p-4">
                            <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">Filters</h3>

                            {/* Sport Filter */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                                <select
                                    value={selectedSport}
                                    onChange={(e) => setSelectedSport(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    {sports.map(sport => (
                                        <option key={sport} value={sport}>{sport}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    <option value="date">Date</option>
                                    <option value="name">Name</option>
                                    <option value="fee">Entry Fee</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <button
                                onClick={clearFilters}
                                className="w-full py-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </aside>

                    {/* Event Listings */}
                    <div className="flex-1">
                        {/* Results Info */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-600">
                                {sortedEvents.length} events found
                                {selectedDate && (
                                    <span className="ml-2">
                                        for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Events Grid */}
                        {sortedEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {sortedEvents.map(event => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-xl shadow-soft">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                                    No events found
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Try adjusting your filters or selecting a different date
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="btn-primary"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default EventCalendar;
