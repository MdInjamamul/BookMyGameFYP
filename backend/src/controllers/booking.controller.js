const prisma = require('../config/prisma');

/**
 * Booking Controller
 * Handles all booking-related operations for operators and users
 */

// ============================================
// OPERATOR ENDPOINTS
// ============================================

/**
 * Get all bookings for operator's venues
 * GET /api/bookings/operator
 */
const getOperatorBookings = async (req, res) => {
    try {
        const operatorId = req.user.id;
        const { venueId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get venue IDs for this operator
        const operatorVenues = await prisma.venue.findMany({
            where: { operatorId },
            select: { id: true },
        });
        const venueIds = operatorVenues.map(v => v.id);

        if (venueIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 },
            });
        }

        const where = {
            slot: {
                venueId: venueId ? venueId : { in: venueIds },
                ...(startDate && { date: { gte: new Date(startDate) } }),
                ...(endDate && { date: { lte: new Date(endDate) } }),
            },
            ...(status && { status }),
        };

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, phone: true },
                    },
                    slot: {
                        include: {
                            venue: { select: { id: true, name: true } },
                        },
                    },
                    payments: {
                        select: { id: true, amount: true, status: true, paymentMethod: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.booking.count({ where }),
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching operator bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
        });
    }
};

/**
 * Get booking details by ID (operator)
 * GET /api/bookings/operator/:id
 */
const getOperatorBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, phone: true, profileImage: true },
                },
                slot: {
                    include: {
                        venue: {
                            select: { id: true, name: true, address: true, operatorId: true },
                        },
                    },
                },
                payments: true,
                review: true,
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check if operator owns this venue
        if (booking.slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
        });
    }
};

/**
 * Confirm booking
 * PUT /api/bookings/operator/:id/confirm
 */
const confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        // Get booking with venue info
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                slot: {
                    include: { venue: { select: { operatorId: true } } },
                },
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check ownership
        if (booking.slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm booking with status: ${booking.status}`,
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'confirmed' },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                slot: { include: { venue: { select: { name: true } } } },
            },
        });

        // TODO: Send confirmation notification to user

        res.json({
            success: true,
            message: 'Booking confirmed successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm booking',
        });
    }
};

/**
 * Cancel booking
 * PUT /api/bookings/operator/:id/cancel
 */
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;
        const { reason } = req.body;

        // Get booking with venue info
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                slot: {
                    include: { venue: { select: { operatorId: true } } },
                },
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check ownership
        if (booking.slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled',
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: 'cancelled',
                notes: reason ? `Cancelled by operator: ${reason}` : 'Cancelled by operator',
            },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                slot: { include: { venue: { select: { name: true } } } },
            },
        });

        // TODO: Send cancellation notification to user
        // TODO: Handle refund if payment was made

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
        });
    }
};

/**
 * Get booking calendar for a venue
 * GET /api/bookings/operator/calendar/:venueId
 */
const getBookingCalendar = async (req, res) => {
    try {
        const { venueId } = req.params;
        const operatorId = req.user.id;
        const { startDate, endDate } = req.query;

        // Check venue ownership
        const venue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        // Default to current month if dates not provided
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1, 0));

        const timeSlots = await prisma.timeSlot.findMany({
            where: {
                venueId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                bookings: {
                    include: {
                        user: { select: { id: true, fullName: true } },
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });

        res.json({
            success: true,
            data: timeSlots,
            venue: { id: venue.id, name: venue.name },
            dateRange: { start, end },
        });
    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar',
        });
    }
};

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * Get user's own bookings
 * GET /api/bookings/my-bookings
 */
const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            userId,
            ...(status && { status }),
        };

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    slot: {
                        include: {
                            venue: {
                                select: { id: true, name: true, address: true, city: true },
                                include: { images: { where: { isPrimary: true }, take: 1 } },
                            },
                        },
                    },
                    payments: {
                        select: { status: true, amount: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.booking.count({ where }),
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
        });
    }
};

/**
 * Create new booking
 * POST /api/bookings
 */
const createBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { slotId, notes } = req.body;

        if (!slotId) {
            return res.status(400).json({
                success: false,
                message: 'Slot ID is required',
            });
        }

        // Get slot details
        const slot = await prisma.timeSlot.findUnique({
            where: { id: slotId },
            include: {
                venue: { select: { id: true, name: true, approvalStatus: true, isActive: true } },
                bookings: { where: { status: { not: 'cancelled' } } },
            },
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Time slot not found',
            });
        }

        // Check if venue is available
        if (!slot.venue.isActive || slot.venue.approvalStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Venue is not available for booking',
            });
        }

        // Check if slot is already booked
        if (slot.bookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked',
            });
        }

        const booking = await prisma.booking.create({
            data: {
                userId,
                slotId,
                totalPrice: slot.price,
                status: 'pending',
                notes,
            },
            include: {
                slot: {
                    include: { venue: { select: { id: true, name: true } } },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
        });
    }
};

/**
 * Cancel user's own booking
 * PUT /api/bookings/:id/cancel
 */
const cancelUserBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await prisma.booking.findFirst({
            where: { id, userId },
            include: { slot: true },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled',
            });
        }

        // Check if booking is in the past
        const bookingDate = new Date(booking.slot.date);
        if (bookingDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel past bookings',
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: 'cancelled',
                notes: booking.notes ? `${booking.notes} | Cancelled by user` : 'Cancelled by user',
            },
        });

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
        });
    }
};

module.exports = {
    // Operator
    getOperatorBookings,
    getOperatorBookingById,
    confirmBooking,
    cancelBooking,
    getBookingCalendar,
    // User
    getUserBookings,
    createBooking,
    cancelUserBooking,
};
