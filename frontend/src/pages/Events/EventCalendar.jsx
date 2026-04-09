import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

const categories = ['all', 'tournament', 'league', 'training']
const categoryLabels = {
  all: 'All',
  tournament: 'Tournament',
  league: 'League',
  training: 'Training',
}

function EventCard({ event }) {
  const getStatusBadge = () => {
    const isPast = new Date(event.endDate) < new Date()
    const isFull =
      event.maxParticipants && event.registrationCount >= event.maxParticipants

    if (isPast) {
      return (
        <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium'>
          Past
        </span>
      )
    }
    if (isFull) {
      return (
        <span className='bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium'>
          Full
        </span>
      )
    }
    return (
      <span className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium'>
        Open
      </span>
    )
  }

  const getSportIcon = () => {
    const sportName = event.venue?.sport?.name?.toLowerCase() || ''
    if (sportName.includes('football') || sportName.includes('futsal'))
      return '⚽'
    if (sportName.includes('basketball')) return '🏀'
    if (sportName.includes('cricket')) return '🏏'
    if (sportName.includes('tennis')) return '🎾'
    if (sportName.includes('badminton')) return '🏸'
    return '🏆'
  }

  const getEventTypeLabel = (type) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Event'
  }

  const getEventImage = () => {
    if (event.imageUrl) return event.imageUrl
    if (event.venue?.images?.[0]?.imageUrl)
      return event.venue.images[0].imageUrl
    return 'https://images.unsplash.com/photo-1461896836934- voices?w=500'
  }

  return (
    <Link
      to={`/events/${event.id}`}
      className='bg-white rounded-xl shadow-sm group hover:-translate-y-1 hover:shadow-md transition-all overflow-hidden'
    >
      {/* Image */}
      <div className='relative h-40 overflow-hidden'>
        <img
          src={getEventImage()}
          alt={event.title}
          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
          style={{ imageRendering: 'crisp-edges' }}
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500'
          }}
        />
        <div className='absolute top-3 left-3 flex gap-2'>
          <span className='bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-medium'>
            {getEventTypeLabel(event.eventType)}
          </span>
        </div>
        <div className='absolute top-3 right-3'>{getStatusBadge()}</div>
      </div>

      {/* Content */}
      <div className='p-4'>
        {/* Sport & Title */}
        <div className='flex items-start gap-2 mb-2'>
          <span className='text-xl'>{getSportIcon()}</span>
          <h3 className='font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2'>
            {event.title}
          </h3>
        </div>

        {/* Date */}
        <div className='flex items-center text-gray-600 text-sm mb-2'>
          <svg
            className='w-4 h-4 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <span>
            {new Date(event.startDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Venue */}
        <div className='flex items-center text-gray-600 text-sm mb-3'>
          <svg
            className='w-4 h-4 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
          <span className='truncate'>
            {event.venue?.name}, {event.venue?.city}
          </span>
        </div>

        {/* Participants & Fee */}
        <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
          <div className='flex items-center text-sm text-gray-600'>
            <svg
              className='w-4 h-4 mr-1'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
            <span>
              {event.registrationCount}
              {event.maxParticipants && `/${event.maxParticipants}`}
            </span>
          </div>
          <div className='font-bold text-gray-900'>
            {parseFloat(event.registrationFee) === 0 ? (
              <span className='text-green-600'>Free</span>
            ) : (
              <span>
                Rs. {parseFloat(event.registrationFee).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function Calendar({ selectedDate, onDateSelect, events }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []

    // Previous month days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const hasEvents = (date) => {
    // Convert to local date string without UTC conversion
    const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Only mark dates that have at least one active (non-ended) event
    return events
      .filter((e) => {
        const end = new Date(e.endDate)
        end.setHours(23, 59, 59, 999)
        return end >= today
      })
      .some((event) => {
        const eventStartDate = new Date(event.startDate)
        const eventEndDate = new Date(event.endDate)
        const eventStartStr = `${eventStartDate.getFullYear()}-${String(eventStartDate.getMonth() + 1).padStart(2, '0')}-${String(eventStartDate.getDate()).padStart(2, '0')}`
        const eventEndStr = `${eventEndDate.getFullYear()}-${String(eventEndDate.getMonth() + 1).padStart(2, '0')}-${String(eventEndDate.getDate()).padStart(2, '0')}`
        return localDateStr >= eventStartStr && localDateStr <= eventEndStr
      })
  }

  const isSelected = (date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    )
  }

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    )
  }

  const days = getDaysInMonth(currentMonth)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className='bg-white rounded-xl shadow-sm p-4'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <h3 className='font-bold text-lg text-gray-900'>
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <div className='flex gap-2'>
          <button
            onClick={prevMonth}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Week Days */}
      <div className='grid grid-cols-7 gap-1 mb-2'>
        {weekDays.map((day) => (
          <div
            key={day}
            className='text-center text-xs font-medium text-gray-500 py-2'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className='grid grid-cols-7 gap-1'>
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
              <span
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected(day.date) ? 'bg-white' : 'bg-primary-600'}`}
              />
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className='mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-600'>
        <div className='flex items-center gap-1'>
          <span className='w-2 h-2 bg-primary-600 rounded-full' />
          <span>Has Events</span>
        </div>
        <div className='flex items-center gap-1'>
          <span className='w-4 h-4 ring-2 ring-primary-600 rounded' />
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}

function EventCalendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sports, setSports] = useState([])

  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSport, setSelectedSport] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    fetchEvents()
    fetchSports()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/events')
      if (response.data.success) {
        setEvents(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const fetchSports = async () => {
    try {
      const response = await api.get('/sports')
      if (response.data.success) {
        setSports(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching sports:', err)
    }
  }

  // Filter events
  const filteredEvents = events.filter((event) => {
    // Safety net: hide events whose end date has fully passed
    const endOfDay = new Date(event.endDate)
    endOfDay.setHours(23, 59, 59, 999)
    if (endOfDay < new Date()) return false

    // Category filter
    if (selectedCategory !== 'all' && event.eventType !== selectedCategory)
      return false
    // Sport filter
    if (selectedSport && event.venue?.sport?.id !== selectedSport) return false
    // Date filter
    if (selectedDate) {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      const selected = new Date(selectedDate)
      selected.setHours(0, 0, 0, 0)
      eventStart.setHours(0, 0, 0, 0)
      eventEnd.setHours(0, 0, 0, 0)
      if (selected < eventStart || selected > eventEnd) return false
    }
    // Search filter
    if (
      searchQuery &&
      !event.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.startDate) - new Date(b.startDate)
      case 'name':
        return a.title.localeCompare(b.title)
      case 'fee':
        return parseFloat(a.registrationFee) - parseFloat(b.registrationFee)
      default:
        return 0
    }
  })

  const clearFilters = () => {
    setSelectedDate(null)
    setSelectedCategory('all')
    setSelectedSport('')
    setSearchQuery('')
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Page Title */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Event Calendar
          </h1>
          <p className='text-gray-600'>
            Discover upcoming sports events, tournaments, and training sessions
          </p>
        </div>

        {/* Search Bar */}
        <div className='mb-6'>
          <div className='relative max-w-xl'>
            <input
              type='text'
              placeholder='Search events...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
            />
            <svg
              className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
        </div>

        {/* Category Tabs */}
        <div className='flex flex-wrap gap-2 mb-6'>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Left Sidebar - Calendar & Filters */}
          <aside className='lg:w-80 flex-shrink-0 space-y-4'>
            {/* Calendar */}
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              events={events}
            />

            {/* Filters */}
            <div className='bg-white rounded-xl shadow-sm p-4'>
              <h3 className='font-bold text-lg text-gray-900 mb-4'>Filters</h3>

              {/* Sport Filter */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Sport
                </label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
                >
                  <option value=''>All Sports</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
                >
                  <option value='date'>Date</option>
                  <option value='name'>Name</option>
                  <option value='fee'>Entry Fee</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className='w-full py-2 text-primary-600 hover:text-primary-700 font-medium text-sm'
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Event Listings */}
          <div className='flex-1'>
            {/* Results Info */}
            <div className='flex items-center justify-between mb-4'>
              <p className='text-gray-600'>
                {sortedEvents.length} upcoming event{sortedEvents.length !== 1 ? 's' : ''} found
                {selectedDate && (
                  <span className='ml-2'>
                    for{' '}
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </p>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
              </div>
            ) : error ? (
              <div className='text-center py-16 bg-white rounded-xl shadow-sm'>
                <p className='text-red-600 mb-4'>{error}</p>
                <button
                  onClick={fetchEvents}
                  className='text-primary-600 hover:underline'
                >
                  Try again
                </button>
              </div>
            ) : sortedEvents.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                {sortedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className='text-center py-16 bg-white rounded-xl shadow-sm'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4'>
                  <svg
                    className='w-8 h-8 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <h3 className='font-bold text-xl text-gray-900 mb-2'>
                  No events found
                </h3>
                <p className='text-gray-600 mb-4'>
                  {events.length === 0
                    ? 'There are no events at the moment. Check back later!'
                    : 'Try adjusting your filters or selecting a different date'}
                </p>
                {events.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className='px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default EventCalendar
