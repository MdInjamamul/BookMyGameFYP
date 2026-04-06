import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import eventService from '../../services/eventService'
import paymentService from '../../services/paymentService'
import { formatTime, formatDateLong } from '../../utils/timeUtils'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import ConfirmModal from '../../components/common/ConfirmModal'

function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState(null)
  const [cancelModal, setCancelModal] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const data = await eventService.getEventById(id)
      if (data.success) {
        setEvent(data.data)
      }
    } catch (err) {
      console.error('Error fetching event:', err)
      setError(err.response?.data?.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } })
      return
    }

    try {
      setRegistering(true)
      setRegisterError(null)

      // Step 1: Create the registration
      const regData = await eventService.registerForEvent(id)
      if (!regData.success) {
        setRegisterError(regData.message || 'Failed to register')
        return
      }

      const registration = regData.data
      const fee = parseFloat(event.registrationFee)

      // Step 2: If paid event, initiate Khalti payment
      if (fee > 0) {
        const payData = await paymentService.initiateEventPayment({
          registrationId: registration.id,
          amount: fee,
          returnUrl: `${window.location.origin}/payment/callback?type=event`,
        })

        if (payData.success && payData.data.paymentUrl) {
          // Redirect user to Khalti payment page
          window.location.href = payData.data.paymentUrl
          return
        } else {
          setRegisterError('Failed to initiate payment. Please try again.')
        }
      } else {
        // Free event – just refresh
        fetchEvent()
      }
    } catch (err) {
      console.error('Error registering:', err)
      setRegisterError(err.response?.data?.message || 'Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  const handleCancelRegistration = async () => {
    setCancelModal(false)
    try {
      setRegistering(true)
      await eventService.cancelRegistration(id)
      fetchEvent()
    } catch (err) {
      console.error('Error cancelling:', err)
      setRegisterError(
        err.response?.data?.message || 'Failed to cancel registration',
      )
    } finally {
      setRegistering(false)
    }
  }

  const getEventTypeBadge = (type) => {
    const badges = {
      tournament: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        label: 'Tournament',
      },
      league: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'League' },
      training: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Training',
      },
    }
    return (
      badges[type] || { bg: 'bg-gray-100', text: 'text-gray-800', label: type }
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <div className='flex items-center justify-center h-96'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <div className='max-w-4xl mx-auto px-4 py-16 text-center'>
          <div className='bg-red-50 text-red-600 p-6 rounded-lg'>
            <h2 className='text-xl font-semibold mb-2'>Error</h2>
            <p>{error || 'Event not found'}</p>
            <Link
              to='/events'
              className='mt-4 inline-block text-primary-600 hover:underline'
            >
              ← Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const typeBadge = getEventTypeBadge(event.eventType)
  const isPast = new Date(event.endDate) < new Date()
  const isFull =
    event.maxParticipants && event.registrationCount >= event.maxParticipants
  const canRegister = !isPast && !isFull && !event.isRegistered
  const isPaidEvent = parseFloat(event.registrationFee) > 0

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />
      <ConfirmModal
        isOpen={cancelModal}
        title='Cancel Event Registration?'
        message='Are you sure you want to cancel your registration? This action cannot be undone.'
        confirmText='Cancel Registration'
        confirmVariant='danger'
        onConfirm={handleCancelRegistration}
        onCancel={() => setCancelModal(false)}
      />

      {/* Hero Section */}
      <div className='relative h-64 md:h-80 lg:h-96 bg-gray-900'>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className='w-full h-full object-cover'
          />
        ) : event.venue?.images?.[0]?.imageUrl ? (
          <img
            src={event.venue.images[0].imageUrl}
            alt={event.venue.name}
            className='w-full h-full object-cover'
          />
        ) : null}
        {/* Dark overlay for text readability */}
        <div className='absolute inset-0 bg-black bg-opacity-40'></div>
        <div className='absolute inset-0 flex items-end'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full'>
            <div className='flex items-center gap-3 mb-3'>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${typeBadge.bg} ${typeBadge.text}`}
              >
                {typeBadge.label}
              </span>
              {event.isFeatured && (
                <span className='px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
                  ⭐ Featured
                </span>
              )}
              {isPast && (
                <span className='px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
                  Past Event
                </span>
              )}
            </div>
            <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2'>
              {event.title}
            </h1>
            <p className='text-lg text-white/90'>
              {event.venue?.sport?.name} • {event.venue?.name}
            </p>
          </div>
        </div>
      </div>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Event Details Card */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                About This Event
              </h2>
              <p className='text-gray-600 whitespace-pre-line'>
                {event.description || 'No description provided.'}
              </p>
            </div>

            {/* Date & Time Card */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Date & Time
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-start space-x-3'>
                  <div className='p-2 bg-primary-50 rounded-lg'>
                    <svg
                      className='w-6 h-6 text-primary-600'
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
                  <div>
                    <p className='text-sm text-gray-500'>Start Date</p>
                    <p className='font-medium text-gray-900'>
                      {formatDate(event.startDate)}
                    </p>
                    {event.startTime && (
                      <p className='text-sm text-primary-600 font-medium mt-1'>
                        🕐 {formatTime(event.startTime)}
                      </p>
                    )}
                  </div>
                </div>
                <div className='flex items-start space-x-3'>
                  <div className='p-2 bg-primary-50 rounded-lg'>
                    <svg
                      className='w-6 h-6 text-primary-600'
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
                  <div>
                    <p className='text-sm text-gray-500'>End Date</p>
                    <p className='font-medium text-gray-900'>
                      {formatDate(event.endDate)}
                    </p>
                    {event.endTime && (
                      <p className='text-sm text-primary-600 font-medium mt-1'>
                        🕐 {formatTime(event.endTime)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {event.registrationDeadline && (
                <div className='mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2'>
                  <svg
                    className='w-5 h-5 text-amber-600 flex-shrink-0'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <div>
                    <p className='text-sm font-semibold text-amber-800'>
                      Registration Deadline
                    </p>
                    <p className='text-sm text-amber-700'>
                      {new Date(event.registrationDeadline) < new Date()
                        ? '⚠️ Registration is now closed'
                        : `Register by ${formatDate(event.registrationDeadline)} at ${formatTime(event.registrationDeadline)}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Venue Card */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Venue
              </h2>
              <div className='flex items-start space-x-4'>
                {event.venue?.images?.[0]?.imageUrl && (
                  <img
                    src={event.venue.images[0].imageUrl}
                    alt={event.venue.name}
                    className='w-24 h-24 rounded-lg object-cover'
                  />
                )}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {event.venue?.name}
                  </h3>
                  <p className='text-gray-600'>{event.venue?.address}</p>
                  {event.venue?.city && (
                    <p className='text-gray-500'>
                      {event.venue.city}, {event.venue.state}
                    </p>
                  )}
                  <Link
                    to={`/venues/${event.venue?.id}`}
                    className='inline-flex items-center text-primary-600 hover:text-primary-700 mt-2'
                  >
                    View Venue Details
                    <svg
                      className='w-4 h-4 ml-1'
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
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Registration Card */}
            <div className='bg-white rounded-xl shadow-sm p-6 sticky top-4'>
              <div className='text-center mb-6'>
                {isPaidEvent ? (
                  <>
                    <p className='text-sm text-gray-500'>Registration Fee</p>
                    <p className='text-3xl font-bold text-gray-900'>
                      Rs. {parseFloat(event.registrationFee).toLocaleString()}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>Pay via Khalti</p>
                  </>
                ) : (
                  <p className='text-2xl font-bold text-green-600'>
                    Free Event
                  </p>
                )}
              </div>

              {/* Participants Info */}
              <div className='mb-6'>
                <div className='flex justify-between text-sm mb-2'>
                  <span className='text-gray-500'>Registered</span>
                  <span className='font-medium text-gray-900'>
                    {event.registrationCount}
                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                  </span>
                </div>
                {event.maxParticipants && (
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-primary-600'}`}
                      style={{
                        width: `${Math.min((event.registrationCount / event.maxParticipants) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
                {event.spotsRemaining !== null && event.spotsRemaining > 0 && (
                  <p className='text-sm text-gray-500 mt-2'>
                    {event.spotsRemaining} spots remaining
                  </p>
                )}
              </div>

              {/* Action Button */}
              {registerError && (
                <div className='mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm'>
                  {registerError}
                </div>
              )}

              {isPast ? (
                <div className='text-center py-3 px-4 bg-gray-100 rounded-lg text-gray-600'>
                  This event has ended
                </div>
              ) : event.isRegistered && event.paymentStatus !== 'pending' ? (
                <div className='space-y-3'>
                  <div className='text-center py-3 px-4 bg-green-50 rounded-lg'>
                    <p className='text-green-700 font-medium'>✓ You're registered!</p>
                    {isPaidEvent && (
                      <p className='text-xs text-green-600 mt-1'>Payment confirmed</p>
                    )}
                  </div>
                  <button
                    onClick={() => setCancelModal(true)}
                    disabled={registering}
                    className='w-full py-3 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50'
                  >
                    {registering ? 'Processing...' : 'Cancel Registration'}
                  </button>
                </div>
              ) : event.isRegistered && event.paymentStatus === 'pending' ? (
                <div className='space-y-3'>
                  <div className='text-center py-3 px-4 bg-yellow-50 rounded-lg text-yellow-700'>
                    <p className='font-medium'>Payment Required</p>
                    <p className='text-xs mt-1'>Please pay to confirm your spot</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        setRegistering(true);
                        const payData = await paymentService.initiateEventPayment({
                          registrationId: event.registrationId,
                          amount: parseFloat(event.registrationFee),
                          returnUrl: `${window.location.origin}/payment/callback?type=event`,
                        });
                        if (payData.success && payData.data.paymentUrl) {
                          window.location.href = payData.data.paymentUrl;
                        } else {
                          setRegisterError('Failed to initiate payment.');
                          setRegistering(false);
                        }
                      } catch (err) {
                        setRegisterError(err.response?.data?.message || 'Failed to initiate payment');
                        setRegistering(false);
                      }
                    }}
                    disabled={registering}
                    className='w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium'
                  >
                    {registering ? 'Redirecting to payment...' : 'Pay with Khalti'}
                  </button>
                  <button
                    onClick={() => setCancelModal(true)}
                    disabled={registering}
                    className='w-full py-3 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50'
                  >
                    Cancel Registration
                  </button>
                </div>
              ) : isFull ? (
                <div className='text-center py-3 px-4 bg-yellow-50 rounded-lg text-yellow-700'>
                  Event is full
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className='w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium'
                >
                  {registering
                    ? isPaidEvent ? 'Redirecting to payment...' : 'Registering...'
                    : isAuthenticated
                      ? isPaidEvent
                        ? `Pay Rs. ${parseFloat(event.registrationFee).toLocaleString()} & Register`
                        : 'Register Now'
                      : 'Login to Register'}
                </button>
              )}

              {/* Khalti badge for paid events */}
              {isPaidEvent && !event.isRegistered && !isPast && (
                <p className='text-center text-xs text-gray-400 mt-3'>
                  🔒 Secure payment via Khalti
                </p>
              )}
            </div>

            {/* Contact Card */}
            {(event.venue?.contactPhone || event.venue?.contactEmail) && (
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h3 className='font-semibold text-gray-900 mb-4'>Contact</h3>
                <div className='space-y-3'>
                  {event.venue.contactPhone && (
                    <div className='flex items-center space-x-3'>
                      <svg
                        className='w-5 h-5 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                        />
                      </svg>
                      <span className='text-gray-600'>
                        {event.venue.contactPhone}
                      </span>
                    </div>
                  )}
                  {event.venue.contactEmail && (
                    <div className='flex items-center space-x-3'>
                      <svg
                        className='w-5 h-5 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                        />
                      </svg>
                      <span className='text-gray-600'>
                        {event.venue.contactEmail}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className='mt-8'>
          <Link
            to='/events'
            className='inline-flex items-center text-gray-600 hover:text-gray-900'
          >
            <svg
              className='w-5 h-5 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
              />
            </svg>
            Back to Events
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default EventDetail
