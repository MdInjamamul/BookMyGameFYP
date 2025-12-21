import { useState } from 'react';
import { Link } from 'react-router-dom';

// Mock venue data
const mockVenues = [
    {
        id: 1,
        name: 'Prime Sports Arena',
        location: 'Kathmandu, Nepal',
        address: 'Thamel, Kathmandu',
        image: 'https://images.unsplash.com/photo-1519865885283-6d3a0f8c0c3e?w=500',
        rating: 4.8,
        reviewCount: 124,
        sports: ['Football', 'Basketball'],
        price: 1500,
        distance: 2.5,
        amenities: ['Parking', 'Showers', 'Lighting'],
        isOpen: true,
    },
    {
        id: 2,
        name: 'Champions Cricket Ground',
        location: 'Lalitpur, Nepal',
        address: 'Pulchowk, Lalitpur',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500',
        rating: 4.6,
        reviewCount: 89,
        sports: ['Cricket'],
        price: 2000,
        distance: 4.2,
        amenities: ['Parking', 'Cafe'],
        isOpen: true,
    },
    {
        id: 3,
        name: 'Elite Basketball Court',
        location: 'Pokhara, Nepal',
        address: 'Lakeside, Pokhara',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
        rating: 4.9,
        reviewCount: 156,
        sports: ['Basketball'],
        price: 1200,
        distance: 1.8,
        amenities: ['Parking', 'Showers', 'Equipment Rental'],
        isOpen: true,
    },
    {
        id: 4,
        name: 'Valley Futsal Hub',
        location: 'Bhaktapur, Nepal',
        address: 'Suryabinayak, Bhaktapur',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500',
        rating: 4.5,
        reviewCount: 78,
        sports: ['Football'],
        price: 1800,
        distance: 6.5,
        amenities: ['Lighting', 'Cafe'],
        isOpen: false,
    },
    {
        id: 5,
        name: 'Sports Village Complex',
        location: 'Kirtipur, Nepal',
        address: 'Naya Bazar, Kirtipur',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500',
        rating: 4.7,
        reviewCount: 203,
        sports: ['Football', 'Basketball', 'Cricket'],
        price: 2500,
        distance: 3.2,
        amenities: ['Parking', 'Showers', 'Lighting', 'Cafe'],
        isOpen: true,
    },
    {
        id: 6,
        name: 'Metro Cricket Academy',
        location: 'Balaju, Nepal',
        address: 'Balaju, Kathmandu',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
        rating: 4.4,
        reviewCount: 67,
        sports: ['Cricket'],
        price: 1600,
        distance: 5.1,
        amenities: ['Parking', 'Equipment Rental'],
        isOpen: true,
    },
];

function VenueCard({ venue }) {
    return (
        <Link
            to={`/venues/${venue.id}`}
            className="card group hover:-translate-y-1 p-0 overflow-hidden flex flex-col sm:flex-row"
        >
            {/* Image */}
            <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {venue.isOpen ? (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        Open Now
                    </div>
                ) : (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        Closed
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {venue.rating}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {venue.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{venue.address}</span>
                        <span className="mx-2">•</span>
                        <span>{venue.distance} km away</span>
                    </div>

                    {/* Sports Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {venue.sports.map((sport) => (
                            <span
                                key={sport}
                                className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                            >
                                {sport}
                            </span>
                        ))}
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {venue.amenities.slice(0, 3).map((amenity) => (
                            <span
                                key={amenity}
                                className="text-xs text-gray-600 flex items-center gap-1"
                            >
                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {amenity}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <span className="text-xl font-bold text-gray-900">Rs. {venue.price.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/hour</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {venue.reviewCount} reviews
                    </div>
                </div>
            </div>
        </Link>
    );
}

function FilterSidebar({ filters, setFilters, onClear }) {
    const sports = ['Football', 'Basketball', 'Cricket'];
    const amenities = ['Parking', 'Showers', 'Lighting', 'Cafe', 'Equipment Rental'];

    return (
        <div className="bg-white rounded-xl shadow-soft p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-lg text-gray-900">Filters</h3>
                <button
                    onClick={onClear}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Clear All
                </button>
            </div>

            {/* Sport Type */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Sport Type</h4>
                <div className="space-y-2">
                    {sports.map((sport) => (
                        <label key={sport} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.sports.includes(sport)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFilters({ ...filters, sports: [...filters.sports, sport] });
                                    } else {
                                        setFilters({ ...filters, sports: filters.sports.filter(s => s !== sport) });
                                    }
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900">{sport}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="px-1">
                    <input
                        type="range"
                        min="500"
                        max="5000"
                        step="100"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>Rs. 500</span>
                        <span className="font-medium text-primary-600">Rs. {filters.maxPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Distance */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Distance</h4>
                <div className="px-1">
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={filters.maxDistance}
                        onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>1 km</span>
                        <span className="font-medium text-primary-600">{filters.maxDistance} km</span>
                    </div>
                </div>
            </div>

            {/* Amenities */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
                <div className="space-y-2">
                    {amenities.map((amenity) => (
                        <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.amenities.includes(amenity)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFilters({ ...filters, amenities: [...filters.amenities, amenity] });
                                    } else {
                                        setFilters({ ...filters, amenities: filters.amenities.filter(a => a !== amenity) });
                                    }
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900">{amenity}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Rating */}
            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
                <div className="flex gap-2">
                    {[4, 4.5, 4.8].map((rating) => (
                        <button
                            key={rating}
                            onClick={() => setFilters({ ...filters, minRating: rating })}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.minRating === rating
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {rating}+
                        </button>
                    ))}
                </div>
            </div>

            {/* Open Now Toggle */}
            <div>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-gray-900">Open Now Only</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={filters.openNow}
                            onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })}
                            className="sr-only"
                        />
                        <div className={`block w-12 h-7 rounded-full transition-colors ${filters.openNow ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${filters.openNow ? 'translate-x-5' : ''}`}></div>
                    </div>
                </label>
            </div>
        </div>
    );
}

function MapView({ venues }) {
    return (
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {/* Mock Map Background */}
            <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#667eea" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Mock Venue Markers */}
            <div className="absolute inset-0">
                {venues.slice(0, 5).map((venue, index) => (
                    <div
                        key={venue.id}
                        className="absolute animate-bounce"
                        style={{
                            left: `${20 + (index * 15)}%`,
                            top: `${30 + (index % 3) * 20}%`,
                            animationDelay: `${index * 0.2}s`
                        }}
                    >
                        <div className="bg-primary-600 text-white p-2 rounded-full shadow-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* Center Content */}
            <div className="relative z-10 text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                    Interactive Map View
                </h3>
                <p className="text-gray-600 text-sm max-w-xs mx-auto">
                    {venues.length} venues found in your area. Full map integration coming soon!
                </p>
            </div>
        </div>
    );
}

function VenueSearchResults() {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        sports: [],
        maxPrice: 5000,
        maxDistance: 20,
        amenities: [],
        minRating: 0,
        openNow: false,
    });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filter venues based on current filters
    const filteredVenues = mockVenues.filter((venue) => {
        // Sport filter
        if (filters.sports.length > 0 && !filters.sports.some(s => venue.sports.includes(s))) {
            return false;
        }
        // Price filter
        if (venue.price > filters.maxPrice) return false;
        // Distance filter
        if (venue.distance > filters.maxDistance) return false;
        // Amenities filter
        if (filters.amenities.length > 0 && !filters.amenities.every(a => venue.amenities.includes(a))) {
            return false;
        }
        // Rating filter
        if (venue.rating < filters.minRating) return false;
        // Open now filter
        if (filters.openNow && !venue.isOpen) return false;
        // Search query
        if (searchQuery && !venue.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    const clearFilters = () => {
        setFilters({
            sports: [],
            maxPrice: 5000,
            maxDistance: 20,
            amenities: [],
            minRating: 0,
            openNow: false,
        });
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
                        <div className="flex-1 max-w-2xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search venues..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-6">
                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-heading font-bold text-2xl text-gray-900">
                            Sports Venues
                        </h1>
                        <p className="text-gray-600">
                            {filteredVenues.length} venues found
                        </p>
                    </div>

                    {/* Sort Dropdown */}
                    <select className="hidden md:block px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                        <option>Sort by: Relevance</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Rating: High to Low</option>
                        <option>Distance: Nearest</option>
                    </select>
                </div>

                <div className="flex gap-6">
                    {/* Filter Sidebar - Desktop */}
                    <aside className="hidden md:block w-72 flex-shrink-0">
                        <FilterSidebar
                            filters={filters}
                            setFilters={setFilters}
                            onClear={clearFilters}
                        />
                    </aside>

                    {/* Mobile Filters Overlay */}
                    {showMobileFilters && (
                        <div className="fixed inset-0 z-50 md:hidden">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
                            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Filters</h3>
                                    <button onClick={() => setShowMobileFilters(false)}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <FilterSidebar
                                        filters={filters}
                                        setFilters={setFilters}
                                        onClear={clearFilters}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Area */}
                    <div className="flex-1">
                        {viewMode === 'list' ? (
                            <div className="space-y-4">
                                {filteredVenues.length > 0 ? (
                                    filteredVenues.map((venue) => (
                                        <VenueCard key={venue.id} venue={venue} />
                                    ))
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                                            No venues found
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Try adjusting your filters to see more results
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
                        ) : (
                            <MapView venues={filteredVenues} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default VenueSearchResults;
