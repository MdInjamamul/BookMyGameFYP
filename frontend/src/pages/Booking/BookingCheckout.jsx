import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import bookingService from '../../services/bookingService'
import paymentService from '../../services/paymentService'
import { formatTime } from '../../utils/timeUtils'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

function BookingCheckout() {
  const { venueId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [bookingData, setBookingData] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [paymentMethod] = useState('khalti') // Force khalti
  const [createdBookingIds, setCreatedBookingIds] = useState([]) // Track already created bookings

  // Load booking data from sessionStorage
  useEffect(() => {
    const savedData = sessionStorage.getItem('pendingBooking')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setBookingData(parsed)
    } else {
      // No booking data, redirect back
      navigate(`/venues/${venueId}`)
    }
  }, [venueId, navigate])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${venueId}/checkout` } })
    }
  }, [isAuthenticated, navigate, venueId])

  // Handle booking confirmation - supports both payment methods
  const handleConfirmBooking = async () => {
    if (!bookingData || !bookingData.items || bookingData.items.length === 0)
      return

    setLoading(true)
    setError(null)

    try {
      let bookingIds = createdBookingIds

      // Only create bookings if we haven't already created them
      if (bookingIds.length === 0) {
        // Create all bookings in a batch
        const bookingPromises = bookingData.items.map((item) => {
          const payload = {
            venueId: bookingData.venueId,
            date: item.date,
            startTime: item.slot.startTime,
            endTime: item.slot.endTime,
            totalPrice: item.slot.price,
          }

          // Only add notes if they exist
          if (notes && notes.trim()) {
            payload.notes = notes.trim()
          }

          return bookingService.createBooking(payload)
        })

        const results = await Promise.allSettled(bookingPromises)

        // Check for any failures
        const failures = results.filter(
          (r) => r.status === 'rejected' || !r.value?.success
        )
        const successes = results.filter(
          (r) => r.status === 'fulfilled' && r.value?.success
        )

        if (successes.length === 0) {
          setError('Failed to create any bookings. Please try again.')
          setLoading(false)
          return
        }

        if (failures.length > 0) {
          setError(
            `${successes.length} booking(s) created, but ${failures.length} failed.`
          )
        }

        // Get booking IDs and save them for potential payment method switch
        bookingIds = successes.map((r) => r.value.data.id)
        setCreatedBookingIds(bookingIds)
      }

      // If paying at venue, redirect to success page
      if (paymentMethod === 'venue') {
        sessionStorage.removeItem('pendingBooking')
        localStorage.removeItem('bookingCart')
        navigate(`/booking/success/${bookingIds[0]}?count=${bookingIds.length}`)
        return
      }

      // If paying with Khalti, initiate payment
      if (paymentMethod === 'khalti') {
        const paymentResponse = await paymentService.initiateBookingPayment({
          bookingIds,
          amount: bookingData.totalPrice,
          returnUrl: `${window.location.origin}/payment/callback`,
        })

        if (
          paymentResponse.success &&
          paymentResponse.data.paymentUrl
        ) {
          // Clear stored data before redirecting to Khalti
          sessionStorage.removeItem('pendingBooking')
          localStorage.removeItem('bookingCart')
          // Redirect to Khalti payment page
          window.location.href = paymentResponse.data.paymentUrl
        } else {
          throw new Error('Failed to initiate payment')
        }
      }
    } catch (err) {
      console.error('Booking/Payment error:', err)
      setError(
        err.response?.data?.message || 'Failed to process. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!bookingData) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <main className='container-custom py-16 text-center'>
          <div className='animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto'></div>
          <p className='text-gray-500 mt-4'>Loading booking details...</p>
        </main>
        <Footer />
      </div>
    )
  }

  // Group items by date for display
  const itemsByDate =
    bookingData.items?.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = {
          dateDisplay: item.dateDisplay,
          slots: [],
        }
      }
      acc[item.date].slots.push(item.slot)
      return acc
    }, {}) || {}

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />

      <main className='container-custom py-6'>
        {/* Breadcrumb */}
        <nav className='flex items-center gap-2 text-sm text-gray-500 mb-6'>
          <Link to='/' className='hover:text-primary-600'>
            Home
          </Link>
          <span>/</span>
          <Link to='/venues' className='hover:text-primary-600'>
            Venues
          </Link>
          <span>/</span>
          <Link to={`/venues/${venueId}`} className='hover:text-primary-600'>
            {bookingData.venueName}
          </Link>
          <span>/</span>
          <span className='text-gray-900'>Checkout</span>
        </nav>

        <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 mb-6'>
          Confirm Your Booking
        </h1>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Left Column - Booking Details */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Venue Details */}
            <div className='bg-white rounded-xl p-6 shadow-soft'>
              <h2 className='text-lg font-bold text-gray-900 mb-4'>
                Venue Details
              </h2>
              <div className='flex items-start gap-4'>
                <img
                  src={
                    bookingData.venueImage || 'https://via.placeholder.com/120'
                  }
                  alt={bookingData.venueName}
                  className='w-24 h-24 rounded-lg object-cover'
                />
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>
                    {bookingData.venueName}
                  </h3>
                  <p className='text-gray-500'>{bookingData.sportName}</p>
                </div>
              </div>
            </div>

            {/* Booking Details - Grouped by Date */}
            <div className='bg-white rounded-xl p-6 shadow-soft'>
              <h2 className='text-lg font-bold text-gray-900 mb-4'>
                Booking Details ({bookingData.items?.length || 0} slot
                {(bookingData.items?.length || 0) !== 1 ? 's' : ''})
              </h2>

              <div className='space-y-4'>
                {Object.entries(itemsByDate).map(
                  ([date, { dateDisplay, slots }]) => (
                    <div
                      key={date}
                      className='border border-gray-100 rounded-lg p-4'
                    >
                      <div className='flex items-center gap-2 mb-3'>
                        <svg
                          className='w-5 h-5 text-primary-600'
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
                        <span className='font-semibold text-gray-900'>
                          {dateDisplay}
                        </span>
                        <span className='text-sm text-gray-500'>
                          ({slots.length} slot{slots.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className='px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium'
                          >
                            {formatTime(slot.startTime)} -{' '}
                            {formatTime(slot.endTime)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Player Information */}
            <div className='bg-white rounded-xl p-6 shadow-soft'>
              <h2 className='text-lg font-bold text-gray-900 mb-4'>
                Player Information
              </h2>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Name</p>
                  <p className='font-semibold text-gray-900'>
                    {user?.fullName}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Email</p>
                  <p className='font-semibold text-gray-900'>{user?.email}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Phone</p>
                  <p className='font-semibold text-gray-900'>
                    {user?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className='bg-white rounded-xl p-6 shadow-soft'>
              <h2 className='text-lg font-bold text-gray-900 mb-4'>
                Additional Notes (Optional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Any special requests or notes for the venue operator...'
                rows={4}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none'
              />
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl p-6 shadow-soft sticky top-24'>
              <h2 className='text-lg font-bold text-gray-900 mb-4'>
                Payment Summary
              </h2>

              <div className='space-y-3 mb-6'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Number of Slots</span>
                  <span className='font-medium text-gray-900'>
                    {bookingData.items?.length || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Total Duration</span>
                  <span className='font-medium text-gray-900'>
                    {bookingData.totalDuration} min
                  </span>
                </div>
                {bookingData.items?.map((item, index) => (
                  <div
                    key={index}
                    className='flex justify-between text-sm text-gray-500'
                  >
                    <span>
                      {item.dateDisplay} - {formatTime(item.slot.startTime)}
                    </span>
                    <span>
                      Rs. {parseFloat(item.slot.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className='flex justify-between items-center py-4 border-y border-gray-100 mb-6'>
                <span className='text-lg font-bold text-gray-900'>Total</span>
                <span className='text-2xl font-bold text-primary-600'>
                  Rs. {bookingData.totalPrice?.toLocaleString()}
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              {/* Payment Method Selection */}
              <div className='mb-6'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                  Select Payment Method
                </h3>
                <div className='space-y-3'>
                  {/* Pay with Khalti Option (Only Option) */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all border-purple-500 bg-purple-50`}
                  >
                    <input
                      type='radio'
                      name='paymentMethod'
                      value='khalti'
                      checked={true}
                      readOnly
                      className='mt-1'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <svg
                          className='w-5 h-5 text-purple-600'
                          viewBox='0 0 24 24'
                          fill='currentColor'
                        >
                          <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' />
                        </svg>
                        <span className='font-medium text-gray-900'>
                          Pay with Khalti
                        </span>
                        <span className='text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full'>
                          Instant
                        </span>
                      </div>
                      <p className='text-sm text-gray-500 mt-1'>
                        Pay securely online. Your booking will be instantly confirmed.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className={`w-full py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  paymentMethod === 'khalti'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'btn-primary'
                }`}
              >
                {loading ? (
                  <>
                    <div className='animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full'></div>
                    {paymentMethod === 'khalti'
                      ? 'Redirecting to Khalti...'
                      : 'Creating Booking...'}
                  </>
                ) : paymentMethod === 'khalti' ? (
                  <>
                    <svg
                      className='w-5 h-5'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' />
                    </svg>
                    Pay Rs. {bookingData.totalPrice?.toLocaleString()} with
                    Khalti
                  </>
                ) : (
                  `Confirm ${bookingData.items?.length} Booking${
                    bookingData.items?.length !== 1 ? 's' : ''
                  }`
                )}
              </button>

              <Link
                to={`/booking/${venueId}`}
                className='block w-full mt-3 py-3 text-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                ← Back to Slot Selection
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default BookingCheckout
