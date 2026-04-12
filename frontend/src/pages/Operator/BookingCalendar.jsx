import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import VenueSlotCalendar from '../../components/common/VenueSlotCalendar';

/**
 * BookingCalendar - Operator's dedicated calendar page at /operator/calendar
 * Uses the shared VenueSlotCalendar with a venue selector dropdown.
 * Operators can view slots, generate new ones, and block slots for walk-in guests.
 */
function BookingCalendar() {
    const [venues, setVenues] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [venueLoading, setVenueLoading] = useState(false);

    // Key to force re-mount of VenueSlotCalendar after generate/booking
    const [calendarKey, setCalendarKey] = useState(0);

    // --- Walk-in booking modal state ---
    const [walkInModal, setWalkInModal] = useState({ open: false, slot: null, dateStr: '' });
    const [guestName, setGuestName] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // --- Success toast state ---
    const [toast, setToast] = useState(null); // { message }
    const toastTimer = useRef(null);
    const inputRef = useRef(null);

    // Fetch operator's venues list on mount
    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const response = await api.get('/venues/operator/my-venues');
                if (response.data.success) {
                    const data = response.data.data;
                    setVenues(data);
                    if (data.length > 0) {
                        setSelectedVenueId(data[0].id);
                    }
                }
            } catch (err) {
                console.error('Error fetching venues:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVenues();
    }, []);

    // When a venue is selected, fetch its FULL details (includes operatingHours, pricePerHour)
    useEffect(() => {
        if (!selectedVenueId) {
            setSelectedVenue(null);
            return;
        }

        const fetchFullVenue = async () => {
            try {
                setVenueLoading(true);
                const response = await api.get(`/venues/operator/my-venues/${selectedVenueId}`);
                if (response.data.success) {
                    setSelectedVenue(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching venue details:', err);
                setSelectedVenue(null);
            } finally {
                setVenueLoading(false);
            }
        };
        fetchFullVenue();
    }, [selectedVenueId, calendarKey]);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (walkInModal.open) {
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [walkInModal.open]);

    // Show a success toast for 4 seconds
    const showToast = (message) => {
        setToast({ message });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    };

    // Operator: click an available slot → open in-app modal
    const handleOperatorSlotClick = (slot, dateStr) => {
        setGuestName('');
        setBookingError('');
        setWalkInModal({ open: true, slot, dateStr });
    };

    // Submit walk-in booking from modal
    const handleWalkInSubmit = async () => {
        if (!guestName.trim()) {
            setBookingError('Please enter a guest name.');
            return;
        }

        const { slot, dateStr } = walkInModal;
        setBookingLoading(true);
        setBookingError('');

        try {
            await api.post('/bookings/operator/walk-in', {
                venueId: selectedVenueId,
                date: dateStr,
                startTime: slot.startTime,
                endTime: slot.endTime,
                price: slot.price,
                guestName: guestName.trim(),
            });

            setWalkInModal({ open: false, slot: null, dateStr: '' });
            showToast(`Slot ${slot.startTime} – ${slot.endTime} on ${dateStr} booked for "${guestName.trim()}".`);
            setCalendarKey((prev) => prev + 1);
        } catch (err) {
            console.error('Error creating booking:', err);
            setBookingError(err.response?.data?.message || 'Failed to create walk-in booking. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    // Handle Enter key in guest name input
    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') handleWalkInSubmit();
        if (e.key === 'Escape') setWalkInModal({ open: false, slot: null, dateStr: '' });
    };

    // Custom operator slot label
    const operatorSlotLabel = (slot, { booked, blockedByEvent, past }) => {
        if (blockedByEvent) return <span className="text-orange-500">🏆 Event</span>;
        if (booked) return <span className="text-red-500">Booked</span>;
        if (past) return <span className="text-gray-400">Past</span>;
        return <span className="text-green-600">Available</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Success Toast ─────────────────────────────────────── */}
            {toast && (
                <div
                    className="fixed top-6 right-6 z-50 flex items-start gap-3 bg-green-600 text-white
                               px-5 py-4 rounded-xl shadow-2xl max-w-sm animate-toast-in"
                    style={{ animation: 'toastIn 0.3s ease-out' }}
                >
                    {/* Check icon */}
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                        <p className="font-semibold text-sm leading-snug">Walk-in Booking Confirmed</p>
                        <p className="text-xs mt-0.5 text-green-100">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-2 text-green-200 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <style>{`
                        @keyframes toastIn {
                            from { opacity: 0; transform: translateX(40px); }
                            to   { opacity: 1; transform: translateX(0); }
                        }
                    `}</style>
                </div>
            )}

            {/* ── Walk-in Booking Modal ─────────────────────────────── */}
            {walkInModal.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby="walkin-modal-title"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => !bookingLoading && setWalkInModal({ open: false, slot: null, dateStr: '' })}
                    />

                    {/* Panel */}
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto"
                        style={{ animation: 'modalIn 0.2s ease-out' }}
                    >
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h2 id="walkin-modal-title" className="text-lg font-bold text-gray-900 leading-tight">
                                        Add Walk-in Booking
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Slot: <span className="font-medium text-gray-700">
                                            {walkInModal.slot?.startTime} – {walkInModal.slot?.endTime}
                                        </span>
                                        {' · '}
                                        <span className="font-medium text-gray-700">{walkInModal.dateStr}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => !bookingLoading && setWalkInModal({ open: false, slot: null, dateStr: '' })}
                                    className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Guest Name Input */}
                            <div className="mb-4">
                                <label htmlFor="walkin-guest-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Guest / Walk-in Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="walkin-guest-name"
                                    ref={inputRef}
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => { setGuestName(e.target.value); setBookingError(''); }}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="e.g. John Doe / Walk-in Guest"
                                    disabled={bookingLoading}
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors
                                        focus:outline-none focus:ring-2 focus:ring-primary-500
                                        ${bookingError ? 'border-red-400 bg-red-50' : 'border-gray-300'}
                                        disabled:opacity-60 disabled:cursor-not-allowed`}
                                />
                                {bookingError && (
                                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {bookingError}
                                    </p>
                                )}
                            </div>

                            {/* Price info */}
                            {walkInModal.slot?.price != null && (
                                <p className="text-xs text-gray-500 mb-5">
                                    Booking price: <span className="font-semibold text-gray-700">Rs. {walkInModal.slot.price}</span>
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setWalkInModal({ open: false, slot: null, dateStr: '' })}
                                    disabled={bookingLoading}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300
                                               rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300
                                               transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleWalkInSubmit}
                                    disabled={bookingLoading}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600
                                               hover:bg-primary-700 rounded-xl focus:outline-none focus:ring-2
                                               focus:ring-primary-500 focus:ring-offset-2 transition-colors
                                               disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {bookingLoading && (
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                    {bookingLoading ? 'Booking…' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @keyframes modalIn {
                            from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                            to   { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>
                </div>
            )}

            {/* ── Page Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
                    <p className="text-gray-600 mt-1">
                        View all bookings and availability at a glance. Click any available slot to add a walk-in booking.
                    </p>
                </div>
                <Link to="/operator/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    ← Back to Bookings List
                </Link>
            </div>

            {/* ── Venue Selector ────────────────────────────────────── */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Venue</label>
                <select
                    value={selectedVenueId}
                    onChange={(e) => setSelectedVenueId(e.target.value)}
                    className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    {venues.length === 0 && <option value="">No venues found</option>}
                    {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                            {venue.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* ── Calendar + Slot Grid ──────────────────────────────── */}
            {venueLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
            ) : selectedVenue ? (
                <VenueSlotCalendar
                    key={calendarKey}
                    venue={selectedVenue}
                    onSlotClick={handleOperatorSlotClick}
                    selectedSlots={[]}
                    hideCartDots={true}
                    slotLabel={operatorSlotLabel}
                    toolbarExtra={
                        <p className="text-sm text-gray-500 italic">
                            Slots are auto-generated from this venue's operating hours. Click any{' '}
                            <span className="font-semibold text-green-600 not-italic">Available</span>{' '}
                            slot to add a walk-in booking.
                        </p>
                    }
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No venue selected</h3>
                    <p className="text-gray-500">Please add a venue first to use the booking calendar.</p>
                    <Link
                        to="/operator/venues"
                        className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Go to Venues →
                    </Link>
                </div>
            )}
        </div>
    );
}

export default BookingCalendar;
