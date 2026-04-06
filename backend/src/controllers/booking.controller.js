const bookingService = require('../services/booking.service');

/**
 * Booking Controller
 * Handles all booking-related operations for operators and users
 * Delegates business logic to booking.service.js
 */

// ============================================
// OPERATOR ENDPOINTS
// ============================================

const getOperatorBookings = async (req, res) => {
    try {
        const result = await bookingService.getOperatorBookings(req.user.id, req.query);
        res.json({
            success: true,
            data: result.bookings,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                pages: result.pages,
            },
        });
    } catch (error) {
        console.error('Error fetching operator bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};

const getOperatorBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getOperatorBookingById(req.params.id, req.user.id);
        res.json({ success: true, data: booking });
    } catch (error) {
        console.error('Error fetching booking:', error);
        const status = error.message === 'Booking not found' ? 404 : (error.message === 'Access denied' ? 403 : 500);
        res.status(status).json({ success: false, message: error.message || 'Failed to fetch booking' });
    }
};

const confirmBooking = async (req, res) => {
    try {
        const updatedBooking = await bookingService.confirmBooking(req.params.id, req.user.id);
        res.json({ success: true, message: 'Booking confirmed successfully', data: updatedBooking });
    } catch (error) {
        console.error('Error confirming booking:', error);
        const status = error.message === 'Booking not found' ? 404 : (error.message === 'Access denied' ? 403 : (error.message.startsWith('Cannot confirm') ? 400 : 500));
        res.status(status).json({ success: false, message: error.message || 'Failed to confirm booking' });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const updatedBooking = await bookingService.cancelBooking(req.params.id, req.user.id, req.body.reason);
        res.json({ success: true, message: 'Booking cancelled successfully', data: updatedBooking });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        let status = 500;
        if (error.message === 'Booking not found') status = 404;
        else if (error.message === 'Access denied') status = 403;
        else if (error.message === 'Booking is already cancelled') status = 400;
        
        res.status(status).json({ success: false, message: error.message || 'Failed to cancel booking' });
    }
};

const getBookingCalendar = async (req, res) => {
    try {
        const result = await bookingService.getBookingCalendar(req.params.venueId, req.user.id, req.query);
        res.json({
            success: true,
            data: result.timeSlots,
            venue: { id: result.venue.id, name: result.venue.name },
            dateRange: result.dateRange,
        });
    } catch (error) {
        console.error('Error fetching calendar:', error);
        const status = error.message.includes('not found') ? 404 : 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to fetch calendar' });
    }
};

const createOperatorBooking = async (req, res) => {
    try {
        const booking = await bookingService.createOperatorBooking(req.user.id, req.body);
        res.status(201).json({
            success: true,
            message: `Walk-in booking created for ${req.body.guestName || 'Walk-in Guest'}`,
            data: booking,
        });
    } catch (error) {
        console.error('Error creating operator booking:', error);
        let status = 500;
        if (error.message.includes('required') || error.message.includes('already booked')) status = 400;
        else if (error.message.includes('not found')) status = 404;

        res.status(status).json({ success: false, message: error.message || 'Failed to create walk-in booking' });
    }
};

// ============================================
// USER ENDPOINTS
// ============================================

const getUserBookings = async (req, res) => {
    try {
        const result = await bookingService.getUserBookings(req.user.id, req.query);
        res.json({
            success: true,
            data: result.bookings,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                pages: result.pages,
            },
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};

const getUserBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getUserBookingById(req.params.id, req.user.id);
        res.json({ success: true, data: booking });
    } catch (error) {
        console.error('Error fetching booking details:', error);
        const status = error.message === 'Booking not found' ? 404 : 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to fetch booking details' });
    }
};

const createBooking = async (req, res) => {
    try {
        // We use req.dto exactly as we did in the validator middleware logic
        const bookingData = req.dto || req.body;
        const booking = await bookingService.createBooking(req.user.id, bookingData);
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        let status = 500;
        if (error.message.includes('not found')) status = 404;
        else if (error.message.includes('already booked') || error.message.includes('not available') || error.message.includes('Either')) status = 400;

        res.status(status).json({ success: false, message: error.message || 'Failed to create booking' });
    }
};

const cancelUserBooking = async (req, res) => {
    try {
        const result = await bookingService.cancelUserBooking(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        let status = 500;
        if (error.message === 'Booking not found') status = 404;
        else if (error.message === 'Booking is already cancelled' || error.message.includes('started or passed')) status = 400;

        res.status(status).json({ success: false, message: error.message || 'Failed to cancel booking' });
    }
};

module.exports = {
    // Operator
    getOperatorBookings,
    getOperatorBookingById,
    confirmBooking,
    cancelBooking,
    getBookingCalendar,
    createOperatorBooking,
    // User
    getUserBookings,
    getUserBookingById,
    createBooking,
    cancelUserBooking,
};
