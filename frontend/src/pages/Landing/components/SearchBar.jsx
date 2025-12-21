import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBar() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useState({
        location: '',
        sport: '',
        date: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        // Navigate to venues page with search parameters
        const queryParams = new URLSearchParams(searchParams).toString();
        navigate(`/venues?${queryParams}`);
    };

    return (
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Location Input */}
                <div className="md:col-span-1">
                    <label htmlFor="location" className="block text-left text-sm font-medium text-gray-700 mb-2">
                        Location
                    </label>
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                            type="text"
                            id="location"
                            placeholder="Enter city or area"
                            value={searchParams.location}
                            onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                        />
                    </div>
                </div>

                {/* Sport Select */}
                <div className="md:col-span-1">
                    <label htmlFor="sport" className="block text-left text-sm font-medium text-gray-700 mb-2">
                        Sport
                    </label>
                    <select
                        id="sport"
                        value={searchParams.sport}
                        onChange={(e) => setSearchParams({ ...searchParams, sport: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                    >
                        <option value="">All Sports</option>
                        <option value="football">Football</option>
                        <option value="basketball">Basketball</option>
                        <option value="cricket">Cricket</option>
                    </select>
                </div>

                {/* Date Input */}
                <div className="md:col-span-1">
                    <label htmlFor="date" className="block text-left text-sm font-medium text-gray-700 mb-2">
                        Date
                    </label>
                    <input
                        type="date"
                        id="date"
                        value={searchParams.date}
                        onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                    />
                </div>

                {/* Search Button */}
                <div className="md:col-span-1 flex items-end">
                    <button
                        type="submit"
                        className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search</span>
                    </button>
                </div>
            </div>
        </form>
    );
}

export default SearchBar;
