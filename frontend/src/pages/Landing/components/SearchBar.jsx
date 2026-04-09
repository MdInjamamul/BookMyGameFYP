import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSports } from '../../../services/venueService';
import { getCities } from '../../../services/venueService';

function SearchBar() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useState({
        city: '',
        sport: '',
        date: '',
    });

    const [sports, setSports] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchOptions = async () => {
            try {
                const [sportsRes, citiesRes] = await Promise.allSettled([
                    getSports(),
                    getCities(),
                ]);

                if (!mounted) return;

                if (sportsRes.status === 'fulfilled') {
                    const sData = sportsRes.value;
                    setSports(Array.isArray(sData) ? sData : (sData?.data ?? []));
                }
                if (citiesRes.status === 'fulfilled') {
                    const cData = citiesRes.value;
                    setCities(Array.isArray(cData) ? cData : (cData?.data ?? []));
                }
            } catch (_) {
                // Silent fallback — selects will just have no options besides defaults
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchOptions();
        return () => { mounted = false; };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const query = new URLSearchParams();
        if (searchParams.city)  query.set('city',  searchParams.city);
        if (searchParams.sport) query.set('sport', searchParams.sport);
        if (searchParams.date)  query.set('date',  searchParams.date);
        navigate(`/venues?${query.toString()}`);
    };

    const selectBase =
        'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-colors';

    return (
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* City / Location Dropdown */}
                <div className="md:col-span-1">
                    <label htmlFor="city" className="block text-left text-sm font-medium text-gray-700 mb-2">
                        Location
                    </label>
                    <div className="relative">
                        {/* Pin icon */}
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </span>
                        <select
                            id="city"
                            value={searchParams.city}
                            onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                            disabled={loading}
                            className={`${selectBase} pl-10`}
                        >
                            <option value="">
                                {loading ? 'Loading cities…' : 'All Cities'}
                            </option>
                            {cities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sport Dropdown */}
                <div className="md:col-span-1">
                    <label htmlFor="sport" className="block text-left text-sm font-medium text-gray-700 mb-2">
                        Sport
                    </label>
                    <div className="relative">
                        {/* Trophy icon */}
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </span>
                        <select
                            id="sport"
                            value={searchParams.sport}
                            onChange={(e) => setSearchParams({ ...searchParams, sport: e.target.value })}
                            disabled={loading}
                            className={`${selectBase} pl-10`}
                        >
                            <option value="">
                                {loading ? 'Loading sports…' : 'All Sports'}
                            </option>
                            {sports.map((s) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date Input */}
                <div className="md:col-span-1">
                    <label htmlFor="date" className="block text-left text-sm font-medium text-gray-700 mb-2">
                        Date
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </span>
                        <input
                            type="date"
                            id="date"
                            value={searchParams.date}
                            onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className={`${selectBase} pl-10`}
                        />
                    </div>
                </div>

                {/* Search Button */}
                <div className="md:col-span-1 flex items-end">
                    <button
                        type="submit"
                        className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search</span>
                    </button>
                </div>

            </div>
        </form>
    );
}

export default SearchBar;
