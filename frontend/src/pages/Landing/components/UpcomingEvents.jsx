import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Mock events data - will be replaced with API call
const mockEvents = [
    {
        id: 1,
        title: 'Weekend Football Tournament',
        venue: 'Prime Sports Arena',
        date: '2024-01-20',
        time: '09:00 AM',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500',
        isFeatured: true,
    },
    {
        id: 2,
        title: 'Basketball Championship 2024',
        venue: 'Elite Basketball Court',
        date: '2024-01-25',
        time: '02:00 PM',
        image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=500',
        isFeatured: true,
    },
    {
        id: 3,
        title: 'Cricket Practice Session',
        venue: 'Champions Cricket Ground',
        date: '2024-01-15',
        time: '06:00 PM',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
        isFeatured: false,
    },
];

function UpcomingEvents() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // TODO: Replace with actual API call
        setEvents(mockEvents.filter(e => e.isFeatured));
    }, []);

    if (events.length === 0) return null;

    return (
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
            <div className="container-custom">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-2">
                            Upcoming Events
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Don't miss out on exciting sports events happening near you
                        </p>
                    </div>
                    <Link to="/events" className="hidden md:block btn-outline">
                        View All Events
                    </Link>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            to={`/events/${event.id}`}
                            className="card group hover:-translate-y-2 p-0 overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Image */}
                            <div className="relative w-full md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-primary-600">
                                    Featured
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1">
                                <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">
                                    {event.title}
                                </h3>

                                {/* Venue */}
                                <div className="flex items-center text-gray-600 mb-2">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{event.venue}</span>
                                </div>

                                {/* Date & Time */}
                                <div className="flex items-center text-gray-600 mb-4">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                                </div>

                                {/* CTA */}
                                <div className="flex items-center text-primary-600 font-medium group-hover:translate-x-2 transition-transform">
                                    <span>View Details</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Mobile View All Button */}
                <div className="mt-8 text-center md:hidden">
                    <Link to="/events" className="btn-outline">
                        View All Events
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default UpcomingEvents;
