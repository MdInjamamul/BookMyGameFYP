import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getVenues, getSports } from '../../services/venueService'
import { useDebounce } from '../../hooks/useDebounce'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import logo from '../../assets/logo.png'
import VenueMapView, { haversineKm } from './components/VenueMapView'

// ─── VenueCard (list view) ────────────────────────────────────────────────────
function VenueCard({ venue }) {
  const primaryImage =
    venue.images?.find((img) => img.isPrimary)?.imageUrl ||
    venue.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500'

  const sportName = venue.sport?.name || 'Sports'

  return (
    <Link
      to={`/venues/${venue.id}`}
      className='card group hover:-translate-y-1 p-0 overflow-hidden flex flex-col sm:flex-row'
    >
      <div className='relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0'>
        <img
          src={primaryImage}
          alt={venue.name}
          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
        />
        {venue.isActive ? (
          <div className='absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold'>
            Available
          </div>
        ) : (
          <div className='absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold'>
            Unavailable
          </div>
        )}
        <div className='absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-sm font-semibold text-gray-900 flex items-center gap-1'>
          <svg className='w-4 h-4 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
          </svg>
          {venue.rating ? Number(venue.rating).toFixed(1) : 'New'}
        </div>
      </div>

      <div className='p-5 flex-1 flex flex-col'>
        <div className='flex-1'>
          <h3 className='font-heading font-bold text-lg text-gray-900 mb-1 group-hover:text-primary-600 transition-colors'>
            {venue.name}
          </h3>
          <div className='flex items-center text-gray-500 text-sm mb-3'>
            <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
            <span>
              {venue.address}
              {venue.city ? `, ${venue.city}` : ''}
            </span>
          </div>
          <div className='flex flex-wrap gap-2 mb-3'>
            <span className='px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full'>
              {sportName}
            </span>
          </div>
          {venue.amenities && venue.amenities.length > 0 && (
            <div className='flex flex-wrap gap-2 mb-3'>
              {venue.amenities.slice(0, 3).map((amenity) => (
                <span key={amenity} className='text-xs text-gray-600 flex items-center gap-1'>
                  <svg className='w-3 h-3 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
          <div>
            <span className='text-xl font-bold text-gray-900'>
              Rs. {venue.pricePerHour?.toLocaleString()}
            </span>
            <span className='text-gray-500 text-sm'>/hour</span>
          </div>
          <div className='text-sm text-gray-500'>
            {venue._count?.reviews || 0} reviews
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── FilterSidebar ────────────────────────────────────────────────────────────
function FilterSidebar({
  filters,
  setFilters,
  onClear,
  sports,
  cities,
  viewMode,
  userLocation,
  onLocateMe,
  locating,
}) {
  const amenities = [
    'Parking',
    'Showers',
    'Lighting',
    'Cafe',
    'Equipment Rental',
    'Changing Rooms',
  ]

  const rangeOptions = [2, 5, 10, 15, 25, 50]

  return (
    <div className='bg-white rounded-xl shadow-soft p-5 sticky top-24'>
      <div className='flex items-center justify-between mb-5'>
        <h3 className='font-heading font-bold text-lg text-gray-900'>Filters</h3>
        <button
          onClick={onClear}
          className='text-sm text-primary-600 hover:text-primary-700 font-medium'
        >
          Clear All
        </button>
      </div>

      {/* City / Location */}
      <div className='mb-6'>
        <h4 className='font-medium text-gray-900 mb-3'>Location</h4>
        <select
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none'
        >
          <option value=''>All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Sport Type */}
      <div className='mb-6'>
        <h4 className='font-medium text-gray-900 mb-3'>Sport Type</h4>
        <div className='space-y-2'>
          {sports.map((sport) => (
            <label key={sport.id} className='flex items-center gap-3 cursor-pointer group'>
              <input
                type='checkbox'
                checked={filters.sport === sport.name}
                onChange={(e) => {
                  setFilters({ ...filters, sport: e.target.checked ? sport.name : '' })
                }}
                className='w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500'
              />
              <span className='text-gray-700 group-hover:text-gray-900'>{sport.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Max Price */}
      <div className='mb-6'>
        <h4 className='font-medium text-gray-900 mb-3'>Max Price</h4>
        <div className='px-1'>
          <input
            type='range'
            min='500'
            max='10000'
            step='500'
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
            className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600'
          />
          <div className='flex justify-between text-sm text-gray-600 mt-2'>
            <span>Rs. 500</span>
            <span className='font-medium text-primary-600'>
              Rs. {filters.maxPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter by Range (map mode only) ──────────────────────── */}
      {viewMode === 'map' && (
        <div className='mb-6 border border-primary-100 bg-primary-50/40 rounded-xl p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <svg className='w-4 h-4 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
            <h4 className='font-medium text-gray-900'>Filter by Range</h4>
          </div>

          {/* Locate me button */}
          {!userLocation?.lat ? (
            <button
              onClick={onLocateMe}
              disabled={locating}
              className='w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors'
            >
              {locating ? (
                <>
                  <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                  </svg>
                  Detecting location…
                </>
              ) : (
                <>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                  </svg>
                  Use My Location
                </>
              )}
            </button>
          ) : (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-green-700 font-medium flex items-center gap-1'>
                  <svg className='w-3.5 h-3.5' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  Location detected
                </span>
                <button
                  onClick={() => setFilters({ ...filters, rangeKm: 0 })}
                  className='text-xs text-gray-400 hover:text-red-500 transition-colors'
                  title='Clear location filter'
                >
                  ✕ Clear
                </button>
              </div>

              {/* Range slider */}
              <div className='px-1'>
                <input
                  type='range'
                  min='2'
                  max='50'
                  step='1'
                  value={filters.rangeKm || 10}
                  onChange={(e) =>
                    setFilters({ ...filters, rangeKm: parseInt(e.target.value) })
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600'
                />
                <div className='flex justify-between text-xs text-gray-500 mt-1.5'>
                  <span>2 km</span>
                  <span className='font-semibold text-primary-600'>
                    {filters.rangeKm || 10} km
                  </span>
                  <span>50 km</span>
                </div>
              </div>

              {/* Quick-select pills */}
              <div className='flex flex-wrap gap-1.5'>
                {rangeOptions.map((km) => (
                  <button
                    key={km}
                    onClick={() => setFilters({ ...filters, rangeKm: km })}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      (filters.rangeKm || 10) === km
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Amenities */}
      <div className='mb-6'>
        <h4 className='font-medium text-gray-900 mb-3'>Amenities</h4>
        <div className='space-y-2'>
          {amenities.map((amenity) => (
            <label key={amenity} className='flex items-center gap-3 cursor-pointer group'>
              <input
                type='checkbox'
                checked={filters.amenities.includes(amenity)}
                onChange={(e) => {
                  setFilters({
                    ...filters,
                    amenities: e.target.checked
                      ? [...filters.amenities, amenity]
                      : filters.amenities.filter((a) => a !== amenity),
                  })
                }}
                className='w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500'
              />
              <span className='text-gray-700 group-hover:text-gray-900'>{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div className='mb-6'>
        <h4 className='font-medium text-gray-900 mb-3'>Minimum Rating</h4>
        <div className='flex gap-2'>
          {[0, 3, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilters({ ...filters, minRating: rating })}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.minRating === rating
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {rating === 0 ? (
                'Any'
              ) : (
                <>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                  </svg>
                  {rating}+
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────
function VenueSearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('list')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchQuery.trim(), 800)
  const [currentPage, setCurrentPage] = useState(1)
  const [retryCount, setRetryCount] = useState(0)
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'relevance')

  const [venues, setVenues] = useState([])
  const [sports, setSports] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const [filters, setFilters] = useState({
    sport:    searchParams.get('sport') || '',
    city:     searchParams.get('city')  || '',   // ← read city from URL on mount
    maxPrice: parseInt(searchParams.get('maxPrice')) || 10000,
    amenities: [],
    minRating: 0,
    rangeKm: 0, // 0 = no range filter
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Geolocation state
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null, rangeKm: null })
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)

  // ── Fetch sports + cities once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [sRes, cRes] = await Promise.allSettled([
          getSports(),
          import('../../services/venueService').then((m) => m.getCities()),
        ])
        if (sRes.status === 'fulfilled' && sRes.value.success) setSports(sRes.value.data)
        if (cRes.status === 'fulfilled') {
          const cData = cRes.value
          setCities(Array.isArray(cData) ? cData : (cData?.data ?? []))
        }
      } catch (err) {
        console.error('Failed to fetch sports/cities:', err)
      }
    }
    fetchMeta()
  }, [])

  // ── Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    debouncedSearch,
    filters.sport,
    filters.city,
    filters.maxPrice,
    filters.minRating,
    filters.amenities.length,
    sortBy,
  ])

  // ── Main data fetch
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = {
          search:   debouncedSearch || undefined,
          sport:    filters.sport   || undefined,
          city:     filters.city    || undefined,   // ← pass city to API
          maxPrice: filters.maxPrice < 10000 ? filters.maxPrice : undefined,
          sortBy,
          page: currentPage,
          limit: 10,
        }

        const response = await getVenues(params)
        if (response.success) {
          let filtered = response.data

          // Client-side: min rating
          if (filters.minRating > 0) {
            filtered = filtered.filter((v) => (v.rating || 0) >= filters.minRating)
          }

          // Client-side: amenities
          if (filters.amenities.length > 0) {
            filtered = filtered.filter((v) =>
              filters.amenities.every((a) => v.amenities?.includes(a))
            )
          }

          setVenues(filtered)
          setPagination(response.pagination)
        }
      } catch (err) {
        console.error('Failed to fetch venues:', err)
        setError('Failed to load venues. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchVenues()
  }, [
    debouncedSearch,
    currentPage,
    filters.sport,
    filters.city,
    filters.maxPrice,
    filters.minRating,
    filters.amenities.length,
    sortBy,
    retryCount,
  ])

  // ── Sync URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch)    params.set('search', debouncedSearch)
    if (filters.sport)      params.set('sport',  filters.sport)
    if (filters.city)       params.set('city',   filters.city)  // ← keep city in URL
    if (sortBy !== 'relevance') params.set('sortBy', sortBy)
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, filters.sport, filters.city, sortBy, setSearchParams])

  // ── Keep userLocation.rangeKm in sync with filters.rangeKm
  useEffect(() => {
    if (userLocation.lat) {
      setUserLocation((prev) => ({ ...prev, rangeKm: filters.rangeKm || 10 }))
    }
  }, [filters.rangeKm, userLocation.lat])

  // ── Geolocation handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser')
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          rangeKm: filters.rangeKm || 10,
        })
        setFilters((prev) => ({ ...prev, rangeKm: prev.rangeKm || 10 }))
        setLocating(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLocationError('Unable to get your location. Please allow location access.')
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }, [filters.rangeKm])

  // ── Apply distance filter (client-side, only when userLocation + rangeKm set)
  const displayedVenues = (() => {
    if (
      viewMode === 'map' &&
      userLocation.lat &&
      filters.rangeKm > 0
    ) {
      return venues.filter((v) => {
        if (!v.latitude || !v.longitude) return true // always show venues without coords
        const dist = haversineKm(
          userLocation.lat,
          userLocation.lng,
          Number(v.latitude),
          Number(v.longitude)
        )
        return dist <= filters.rangeKm
      })
    }
    return venues
  })()

  const clearFilters = () => {
    setFilters({ sport: '', city: '', maxPrice: 10000, amenities: [], minRating: 0, rangeKm: 0 })
    setUserLocation({ lat: null, lng: null, rangeKm: null })
    setSearchQuery('')
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* ── Sticky Header ── */}
      <header className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='container-custom py-4'>
          <div className='flex items-center gap-4'>
            <Link to='/' className='flex items-center flex-shrink-0'>
              <img src={logo} alt='BookMyGame' className='h-14 w-auto' />
            </Link>

            <div className='flex-1 max-w-2xl'>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search venues...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none'
                />
                <svg
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
              </div>
            </div>

            {/* View toggle — visible on all screen sizes */}
            <div className='flex items-center bg-gray-100 rounded-lg p-1'>
              <button
                id='view-list-btn'
                onClick={() => setViewMode('list')}
                title='List View'
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 10h16M4 14h16M4 18h16' />
                </svg>
              </button>
              <button
                id='view-map-btn'
                onClick={() => setViewMode('map')}
                title='Map View'
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
                </svg>
              </button>
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className='md:hidden p-2 text-gray-600 hover:text-gray-900'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className='container-custom py-6'>
        {/* Title + sort row */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='font-heading font-bold text-2xl text-gray-900'>Sports Venues</h1>
            <p className='text-gray-600'>
              {loading
                ? 'Loading…'
                : viewMode === 'map' && userLocation.lat && filters.rangeKm > 0
                ? `${displayedVenues.length} venues within ${filters.rangeKm} km`
                : `${venues.length} venue${venues.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='hidden md:block px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none'
          >
            <option value='relevance'>Sort by: Relevance</option>
            <option value='newest'>Newly Added</option>
            <option value='rating_desc'>Rating: High to Low</option>
            <option value='price_asc'>Price: Low to High</option>
            <option value='price_desc'>Price: High to Low</option>
          </select>
        </div>

        {/* Active filter chips */}
        {(filters.city || filters.sport || debouncedSearch) && (
          <div className='flex flex-wrap gap-2 mb-4'>
            {filters.city && (
              <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-800 rounded-full text-sm font-medium'>
                📍 {filters.city}
                <button
                  onClick={() => setFilters((f) => ({ ...f, city: '' }))}
                  className='ml-0.5 hover:text-red-600 transition-colors font-bold'
                  aria-label='Remove city filter'
                >
                  ✕
                </button>
              </span>
            )}
            {filters.sport && (
              <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-800 rounded-full text-sm font-medium'>
                🏅 {filters.sport}
                <button
                  onClick={() => setFilters((f) => ({ ...f, sport: '' }))}
                  className='ml-0.5 hover:text-red-600 transition-colors font-bold'
                  aria-label='Remove sport filter'
                >
                  ✕
                </button>
              </span>
            )}
            {debouncedSearch && (
              <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium'>
                🔍 "{debouncedSearch}"
                <button
                  onClick={() => setSearchQuery('')}
                  className='ml-0.5 hover:text-red-600 transition-colors font-bold'
                  aria-label='Clear search'
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}

        {/* Location error banner */}
        {locationError && (
          <div className='mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3'>
            <svg className='w-4 h-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
            </svg>
            {locationError}
            <button onClick={() => setLocationError(null)} className='ml-auto text-red-400 hover:text-red-600'>✕</button>
          </div>
        )}

        <div className='flex gap-6'>
          {/* Sidebar */}
          <aside className='hidden md:block w-72 flex-shrink-0'>
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              onClear={clearFilters}
              sports={sports}
              cities={cities}
              viewMode={viewMode}
              userLocation={userLocation}
              onLocateMe={handleLocateMe}
              locating={locating}
            />
          </aside>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className='fixed inset-0 z-50 md:hidden'>
              <div
                className='absolute inset-0 bg-black/50'
                onClick={() => setShowMobileFilters(false)}
              />
              <div className='absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto'>
                <div className='p-4 border-b flex items-center justify-between'>
                  <h3 className='font-bold text-lg'>Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
                <div className='p-4'>
                  <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    onClear={clearFilters}
                    sports={sports}
                    cities={cities}
                    viewMode={viewMode}
                    userLocation={userLocation}
                    onLocateMe={handleLocateMe}
                    locating={locating}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className='flex-1 min-w-0'>
            {error ? (
              <div className='text-center py-16'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4'>
                  <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <h3 className='font-heading font-bold text-xl text-gray-900 mb-2'>Error Loading Venues</h3>
                <p className='text-gray-600 mb-4'>{error}</p>
                <button onClick={() => setRetryCount((r) => r + 1)} className='btn-primary'>
                  Try Again
                </button>
              </div>
            ) : (
              <div className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {viewMode === 'list' ? (
                  <div className='space-y-4'>
                    {venues.length > 0 ? (
                      venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)
                    ) : (
                      <EmptyState
                        icon='venue'
                        title='No venues found'
                        message='Try adjusting your filters to see more results'
                        actionLabel='Clear All Filters'
                        onAction={clearFilters}
                      />
                    )}
                  </div>
                ) : (
                  <VenueMapView
                    venues={displayedVenues}
                    userLocation={userLocation}
                  />
                )}

                {/* Pagination — only in list mode */}
                {viewMode === 'list' && !loading && pagination.pages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(newPage) => setCurrentPage(newPage)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default VenueSearchResults
