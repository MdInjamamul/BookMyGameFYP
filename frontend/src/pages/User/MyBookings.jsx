import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bookingService from '../../services/bookingService'
import paymentService from '../../services/paymentService'
import { formatTime } from '../../utils/timeUtils'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

const EXPIRY_MINUTES = 5 // must match backend pendingPaymentCleaner.js

/**
 * Live countdown for a pending-payment booking.
 * Shows minutes:seconds remaining. Calls onExpired() when it hits zero.
 */
function PendingCountdown({ createdAt, onExpired }) {
  const expiryMs = new Date(createdAt).getTime() + EXPIRY_MINUTES * 60 * 1000
  const calcRemaining = () => Math.max(0, expiryMs - Date.now())
  const [remaining, setRemaining] = useState(calcRemaining)

  useEffect(() => {
    if (remaining === 0) {
      onExpired()
      return
    }
    const timer = setInterval(() => {
      const r = calcRemaining()
      setRemaining(r)
      if (r === 0) {
        clearInterval(timer)
        onExpired()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  const isUrgent = remaining < 60000

  return (
    <span className={`font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)
  const [retryingId, setRetryingId] = useState(null)
  const [cancelModal, setCancelModal] = useState({ open: false, booking: null, refundMsg: '' })

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getUserBookings()
      if (data.success) {
        setBookings(data.data)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  /** Check if a booking has an unresolved pending payment */
  const hasPendingPayment = (booking) =>
    booking.status === 'pending' &&
    booking.payments?.some((p) => p.status === 'pending')

  /** Retry payment for a pending booking */
  const handleRetryPayment = async (booking) => {
    setRetryingId(booking.id)
    try {
      const data = await paymentService.retryBookingPayment({
        bookingIds: [booking.id],
        amount: parseFloat(booking.totalPrice),
        returnUrl: `${window.location.origin}/payment/callback`,
      })
      if (data.success && data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl
      } else {
        toast.error('Failed to initiate payment. Please try again.')
        setRetryingId(null)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initiate payment'
      toast.error(msg)
      if (err.response?.status === 400) fetchBookings()
      setRetryingId(null)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    setCancelModal({ open: false, booking: null, refundMsg: '' })
    setCancellingId(bookingId)
    try {
      const data = await bookingService.cancelBooking(bookingId)
      if (data.success) {
        setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
        toast.success(data.data?.refundInfo?.message || 'Booking cancelled successfully')
      }
    } catch (err) {
      console.error('Error cancelling booking:', err)
      toast.error(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  const openCancelModal = (booking) => {
    const now = new Date()
    const slotDate = new Date(booking.slot?.date || booking.bookingDate)
    const slotStart = new Date(booking.slot?.startTime)
    const startDateTime = new Date(
      Date.UTC(
        slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(),
        slotStart.getUTCHours(), slotStart.getUTCMinutes(), 0,
      ),
    )
    const hoursUntilStart = (startDateTime - now) / (1000 * 60 * 60)
    let refundMsg = 'Refund: 0% — less than 6 hours remaining until the game.'
    if (hoursUntilStart > 24) refundMsg = `Refund: 100% — Rs. ${booking.totalPrice} will be refunded.`
    else if (hoursUntilStart > 6) refundMsg = `Refund: 50% — Rs. ${booking.totalPrice / 2} will be refunded.`
    setCancelModal({ open: true, booking, refundMsg })
  }

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getBookingStartDateTime = (booking) => {
    const slot = booking.slot || booking.timeSlot
    const dateStr = booking.bookingDate || slot?.date
    const timeStr = slot?.startTime || booking.startTime
    if (!dateStr || !timeStr) return null
    const slotDate = new Date(dateStr)
    const slotStart = new Date(timeStr)
    return new Date(Date.UTC(
      slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(),
      slotStart.getUTCHours(), slotStart.getUTCMinutes(), 0,
    ))
  }

  const canCancelBooking = (booking) => {
    if (hasPendingPayment(booking)) return false // hide cancel — only retry shown
    if (!['pending', 'confirmed'].includes(booking.status)) return false
    const bookingStart = getBookingStartDateTime(booking)
    if (!bookingStart) return false
    return bookingStart > new Date()
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />
      <ConfirmModal
        isOpen={cancelModal.open}
        title='Cancel Booking?'
        message={`Are you sure you want to cancel this booking?\n\n${cancelModal.refundMsg}`}
        confirmText='Cancel Booking'
        confirmVariant='danger'
        onConfirm={() => cancelModal.booking && handleCancelBooking(cancelModal.booking.id)}
        onCancel={() => setCancelModal({ open: false, booking: null, refundMsg: '' })}
      />

      <main className='container-custom py-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <div>
            <h1 className='text-2xl lg:text-3xl font-bold text-gray-900'>My Bookings</h1>
            <p className='text-gray-600 mt-1'>View and manage your venue bookings</p>
          </div>
          <Link to='/venues' className='btn-primary'>Book New Venue</Link>
        </div>

        {/* Filter Tabs */}
        <div className='bg-white rounded-xl p-2 shadow-soft mb-6 flex flex-wrap gap-2'>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label} ({statusCounts[key]})
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className='bg-white rounded-xl p-12 shadow-soft text-center'>
            <div className='animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto'></div>
            <p className='text-gray-500 mt-4'>Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className='bg-white rounded-xl p-12 shadow-soft text-center'>
            <p className='text-red-600'>{error}</p>
            <button onClick={fetchBookings} className='btn-primary mt-4'>Retry</button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className='bg-white rounded-xl p-12 shadow-soft text-center'>
            <svg className='w-16 h-16 mx-auto text-gray-300 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
            </svg>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>No bookings found</h3>
            <p className='text-gray-500 mb-6'>
              {filter === 'all' ? "You haven't made any bookings yet." : `No ${filter} bookings.`}
            </p>
            <Link to='/venues' className='btn-primary'>Browse Venues</Link>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredBookings.map((booking) => {
              const slot = booking.slot || booking.timeSlot
              const venue = booking.venue || slot?.venue
              const isPendingPayment = hasPendingPayment(booking)

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-xl shadow-soft overflow-hidden ${
                    isPendingPayment ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  {/* ── Pending payment warning banner ── */}
                  {isPendingPayment && (
                    <div className='bg-amber-50 border-b border-amber-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                      <div className='flex items-start gap-3'>
                        <svg className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <div>
                          <p className='text-sm font-semibold text-amber-800'>
                            Payment not completed — slot held for{' '}
                            <PendingCountdown createdAt={booking.createdAt} onExpired={fetchBookings} />
                          </p>
                          <p className='text-xs text-amber-700 mt-0.5'>
                            Amount was not transferred. Complete payment before the timer expires or your slot will be automatically released.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRetryPayment(booking)}
                        disabled={retryingId === booking.id}
                        className='flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap'
                      >
                        {retryingId === booking.id ? 'Redirecting...' : '💳 Complete Payment'}
                      </button>
                    </div>
                  )}

                  <div className='p-6'>
                    <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
                      {/* Venue Image */}
                      <Link to={venue?.id ? `/venues/${venue.id}` : '#'} className='flex-shrink-0'>
                        <img
                          src={venue?.images?.[0]?.imageUrl || 'https://via.placeholder.com/100'}
                          alt={venue?.name}
                          className='w-24 h-24 rounded-lg object-cover'
                        />
                      </Link>

                      {/* Details */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <Link
                              to={venue?.id ? `/venues/${venue.id}` : '#'}
                              className='text-lg font-bold text-gray-900 hover:text-primary-600'
                            >
                              {venue?.name || 'Venue'}
                            </Link>
                            <p className='text-gray-500 text-sm'>{venue?.sport?.name}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>

                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4'>
                          <div>
                            <p className='text-xs text-gray-500'>Date</p>
                            <p className='font-medium text-gray-900'>
                              {booking.bookingDate ? formatDate(booking.bookingDate) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-gray-500'>Time</p>
                            <p className='font-medium text-gray-900'>
                              {slot ? `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-gray-500'>Amount</p>
                            <p className='font-bold text-primary-600'>Rs. {booking.totalPrice?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className='text-xs text-gray-500'>Booking ID</p>
                            <p className='font-mono text-sm text-gray-900'>{booking.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex flex-col gap-2 flex-shrink-0'>
                        <Link
                          to={`/my-bookings/${booking.id}`}
                          className='px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg font-medium transition-colors text-center border border-primary-100'
                        >
                          View Details
                        </Link>

                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => openCancelModal(booking)}
                            disabled={cancellingId === booking.id}
                            className='px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50 border border-transparent hover:border-red-100'
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default MyBookings
