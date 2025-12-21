const prisma = require('../config/prisma');

/**
 * TimeSlot Controller
 * Handles time slot management for venues
 */

/**
 * Get available time slots for a venue
 * GET /api/timeslots/venue/:venueId
 */
const getVenueTimeSlots = async (req, res) => {
    try {
        const { venueId } = req.params;
        const { date, startDate, endDate } = req.query;

        // Build date filter
        let dateFilter = {};
        if (date) {
            dateFilter = { date: new Date(date) };
        } else if (startDate && endDate) {
            dateFilter = {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            };
        } else {
            // Default to next 7 days
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            dateFilter = {
                date: {
                    gte: today,
                    lte: nextWeek,
                },
            };
        }

        const timeSlots = await prisma.timeSlot.findMany({
            where: {
                venueId,
                ...dateFilter,
            },
            include: {
                bookings: {
                    where: { status: { not: 'cancelled' } },
                    select: { id: true, status: true },
                },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });

        // Add availability status
        const slotsWithAvailability = timeSlots.map(slot => ({
            ...slot,
            isAvailable: slot.bookings.length === 0,
        }));

        res.json({
            success: true,
            data: slotsWithAvailability,
        });
    } catch (error) {
        console.error('Error fetching time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch time slots',
        });
    }
};

/**
 * Create time slots for a venue (operator)
 * POST /api/timeslots/operator/venue/:venueId
 */
const createTimeSlots = async (req, res) => {
    try {
        const { venueId } = req.params;
        const operatorId = req.user.id;
        const { slots } = req.body; // Array of { date, startTime, endTime, price }

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

        if (!slots || slots.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one slot is required',
            });
        }

        // Create slots
        const createdSlots = await prisma.timeSlot.createMany({
            data: slots.map(slot => ({
                venueId,
                date: new Date(slot.date),
                startTime: new Date(`1970-01-01T${slot.startTime}`),
                endTime: new Date(`1970-01-01T${slot.endTime}`),
                price: slot.price || venue.pricePerHour,
            })),
            skipDuplicates: true,
        });

        res.status(201).json({
            success: true,
            message: `${createdSlots.count} time slot(s) created successfully`,
        });
    } catch (error) {
        console.error('Error creating time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create time slots',
        });
    }
};

/**
 * Generate time slots automatically for a date range
 * POST /api/timeslots/operator/venue/:venueId/generate
 */
const generateTimeSlots = async (req, res) => {
    try {
        const { venueId } = req.params;
        const operatorId = req.user.id;
        const { startDate, endDate, slotDurationMinutes = 60 } = req.body;

        // Check venue ownership and get operating hours
        const venue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
            include: { operatingHours: true },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        if (!venue.operatingHours || venue.operatingHours.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please set operating hours before generating slots',
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const slotsToCreate = [];

        // Iterate through each day
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay(); // 0 = Sunday
            const operatingHour = venue.operatingHours.find(h => h.dayOfWeek === dayOfWeek);

            if (!operatingHour || operatingHour.isClosed) continue;

            // Generate slots for this day
            const openTime = new Date(operatingHour.openingTime);
            const closeTime = new Date(operatingHour.closingTime);

            let currentTime = new Date(`1970-01-01T${openTime.toTimeString().slice(0, 5)}`);
            const endTime = new Date(`1970-01-01T${closeTime.toTimeString().slice(0, 5)}`);

            while (currentTime < endTime) {
                const slotEnd = new Date(currentTime.getTime() + slotDurationMinutes * 60000);
                if (slotEnd > endTime) break;

                slotsToCreate.push({
                    venueId,
                    date: new Date(d),
                    startTime: new Date(currentTime),
                    endTime: new Date(slotEnd),
                    price: venue.pricePerHour,
                });

                currentTime = slotEnd;
            }
        }

        if (slotsToCreate.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No slots could be generated. Check operating hours.',
            });
        }

        const createdSlots = await prisma.timeSlot.createMany({
            data: slotsToCreate,
            skipDuplicates: true,
        });

        res.status(201).json({
            success: true,
            message: `${createdSlots.count} time slot(s) generated successfully`,
            generated: slotsToCreate.length,
            created: createdSlots.count,
        });
    } catch (error) {
        console.error('Error generating time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate time slots',
        });
    }
};

/**
 * Update time slot (operator)
 * PUT /api/timeslots/operator/:id
 */
const updateTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;
        const { price, date, startTime, endTime } = req.body;

        // Get slot with venue info
        const slot = await prisma.timeSlot.findUnique({
            where: { id },
            include: { venue: { select: { operatorId: true } } },
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Time slot not found',
            });
        }

        if (slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        const updatedSlot = await prisma.timeSlot.update({
            where: { id },
            data: {
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(date && { date: new Date(date) }),
                ...(startTime && { startTime: new Date(`1970-01-01T${startTime}`) }),
                ...(endTime && { endTime: new Date(`1970-01-01T${endTime}`) }),
            },
        });

        res.json({
            success: true,
            message: 'Time slot updated successfully',
            data: updatedSlot,
        });
    } catch (error) {
        console.error('Error updating time slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update time slot',
        });
    }
};

/**
 * Delete time slot (operator)
 * DELETE /api/timeslots/operator/:id
 */
const deleteTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        // Get slot with venue info and bookings
        const slot = await prisma.timeSlot.findUnique({
            where: { id },
            include: {
                venue: { select: { operatorId: true } },
                bookings: { where: { status: { not: 'cancelled' } } },
            },
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Time slot not found',
            });
        }

        if (slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        if (slot.bookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete slot with active bookings',
            });
        }

        await prisma.timeSlot.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Time slot deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting time slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete time slot',
        });
    }
};

/**
 * Bulk delete time slots (operator)
 * DELETE /api/timeslots/operator/venue/:venueId/bulk
 */
const bulkDeleteTimeSlots = async (req, res) => {
    try {
        const { venueId } = req.params;
        const operatorId = req.user.id;
        const { slotIds, startDate, endDate } = req.body;

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

        let deleteWhere = { venueId };

        if (slotIds && slotIds.length > 0) {
            deleteWhere.id = { in: slotIds };
        } else if (startDate && endDate) {
            deleteWhere.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else {
            return res.status(400).json({
                success: false,
                message: 'Provide either slotIds or date range',
            });
        }

        // Only delete slots without active bookings
        deleteWhere.bookings = { none: { status: { not: 'cancelled' } } };

        const deleted = await prisma.timeSlot.deleteMany({ where: deleteWhere });

        res.json({
            success: true,
            message: `${deleted.count} time slot(s) deleted successfully`,
        });
    } catch (error) {
        console.error('Error bulk deleting time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete time slots',
        });
    }
};

module.exports = {
    getVenueTimeSlots,
    createTimeSlots,
    generateTimeSlots,
    updateTimeSlot,
    deleteTimeSlot,
    bulkDeleteTimeSlots,
};
