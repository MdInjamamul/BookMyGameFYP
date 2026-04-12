const prisma = require('../config/prisma');
const { getIo } = require('../socket');
const { computeRefundAmount, initiateKhaltiRefund, getRefundMessage } = require('./refund.service');
const emailService = require('./email.service');

class BookingService {
    // ============================================
    // OPERATOR ENDPOINTS
    // ============================================

    async getOperatorBookings(operatorId, { venueId, status, startDate, endDate, page = 1, limit = 20 }) {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get venue IDs for this operator
        const operatorVenues = await prisma.venue.findMany({
            where: { operatorId },
            select: { id: true },
        });
        const venueIds = operatorVenues.map(v => v.id);

        if (venueIds.length === 0) {
            return {
                bookings: [],
                total: 0,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: 0
            };
        }

        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
            dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
        }

        const where = {
            slot: {
                venueId: venueId ? venueId : { in: venueIds },
                ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
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

        return {
            bookings,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        };
    }

    async getOperatorBookingById(id, operatorId) {
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

        if (!booking) throw new Error('Booking not found');

        if (booking.slot.venue.operatorId !== operatorId) {
            throw new Error('Access denied');
        }

        return booking;
    }

    async confirmBooking(id, operatorId) {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                slot: {
                    include: { venue: { select: { operatorId: true } } },
                },
            },
        });

        if (!booking) throw new Error('Booking not found');

        if (booking.slot.venue.operatorId !== operatorId) {
            throw new Error('Access denied');
        }

        if (booking.status !== 'pending') {
            throw new Error(`Cannot confirm booking with status: ${booking.status}`);
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'confirmed' },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                slot: { include: { venue: { select: { name: true } } } },
            },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: booking.userId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: `Your booking at ${updatedBooking.slot.venue.name} has been confirmed.`,
                relatedEntityType: 'booking',
                relatedEntityId: booking.id,
                link: `/my-bookings/${booking.id}`,
            }
        });

        this._emitNotification(booking.userId, notification);

        return updatedBooking;
    }

    async cancelBooking(id, operatorId, reason) {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                slot: {
                    include: { venue: { select: { operatorId: true } } },
                },
            },
        });

        if (!booking) throw new Error('Booking not found');

        if (booking.slot.venue.operatorId !== operatorId) {
            throw new Error('Access denied');
        }

        if (booking.status === 'cancelled') {
            throw new Error('Booking is already cancelled');
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

        const notification = await prisma.notification.create({
            data: {
                userId: booking.userId,
                type: 'booking_cancelled',
                title: 'Booking Cancelled',
                message: `Your booking at ${updatedBooking.slot.venue.name} was cancelled by the operator.`,
                relatedEntityType: 'booking',
                relatedEntityId: booking.id,
                link: `/my-bookings/${booking.id}`,
            }
        });

        this._emitNotification(booking.userId, notification);
        return updatedBooking;
    }

    async getBookingCalendar(venueId, operatorId, { startDate, endDate }) {
        const venue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
        });

        if (!venue) throw new Error('Venue not found or access denied');

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

        return { timeSlots, venue, dateRange: { start, end } };
    }

    // ============================================
    // USER ENDPOINTS
    // ============================================

    async getUserBookings(userId, { status, page = 1, limit = 10 }) {
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
                                include: {
                                    images: { where: { isPrimary: true }, take: 1 }
                                },
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

        return {
            bookings,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        };
    }

    async getUserBookingById(id, userId) {
        const booking = await prisma.booking.findFirst({
            where: { id, userId },
            include: {
                slot: {
                    include: {
                        venue: {
                            include: {
                                operator: { select: { fullName: true, email: true, phone: true } },
                                images: { where: { isPrimary: true }, take: 1 },
                                sport: true,
                            },
                        },
                    },
                },
                payments: true,
                review: true,
            },
        });

        if (!booking) throw new Error('Booking not found');

        return booking;
    }

    async createBooking(userId, bookingData) {
        const { slotId, venueId, date, startTime, endTime, totalPrice, notes } = bookingData;
        let slot;

        if (slotId) {
            slot = await prisma.timeSlot.findUnique({
                where: { id: slotId },
                include: {
                    venue: { select: { id: true, name: true, approvalStatus: true, isActive: true } },
                    bookings: { where: { status: { not: 'cancelled' } } },
                },
            });

            if (!slot) throw new Error('Time slot not found');
            if (slot.bookings.length > 0) throw new Error('This time slot is already booked');
        } else if (venueId && date && startTime && endTime) {
            const venue = await prisma.venue.findUnique({
                where: { id: venueId },
                select: { id: true, name: true, approvalStatus: true, isActive: true, pricePerHour: true },
            });

            if (!venue) throw new Error('Venue not found');
            if (!venue.isActive || venue.approvalStatus !== 'approved') {
                throw new Error('Venue is not available for booking');
            }

            const parseTimeToDate = (timeValue) => {
                if (!timeValue) return null;
                const isoDate = new Date(timeValue);
                if (!isNaN(isoDate.getTime())) return isoDate;
                return new Date(`1970-01-01T${timeValue}:00.000Z`);
            };

            const parsedStartTime = parseTimeToDate(startTime);
            const parsedEndTime = parseTimeToDate(endTime);

            const existingSlot = await prisma.timeSlot.findFirst({
                where: {
                    venueId,
                    date: new Date(date),
                    startTime: parsedStartTime,
                    endTime: parsedEndTime,
                },
                include: {
                    bookings: { where: { status: { not: 'cancelled' } } },
                },
            });

            if (existingSlot) {
                if (existingSlot.bookings.length > 0) {
                    throw new Error('This time slot is already booked');
                }
                slot = existingSlot;
            } else {
                slot = await prisma.timeSlot.create({
                    data: {
                        venueId,
                        date: new Date(date),
                        startTime: parsedStartTime,
                        endTime: parsedEndTime,
                        price: totalPrice || venue.pricePerHour,
                    },
                    include: {
                        venue: { select: { id: true, name: true } },
                    },
                });
            }
        } else {
            throw new Error('Either slotId or (venueId, date, startTime, endTime) is required');
        }

        if (slot.venue && (!slot.venue.isActive || slot.venue.approvalStatus !== 'approved')) {
            throw new Error('Venue is not available for booking');
        }

        const booking = await prisma.booking.create({
            data: {
                userId,
                slotId: slot.id,
                bookingDate: slot.date,
                totalPrice: totalPrice || slot.price,
                status: 'pending',
                notes,
            },
            include: {
                slot: {
                    include: { venue: { select: { id: true, name: true } } },
                },
            },
        });

        return booking;
    }

    async cancelUserBooking(id, userId) {
        const booking = await prisma.booking.findFirst({
            where: { id, userId },
            include: {
                slot: {
                    include: {
                        venue: { select: { id: true, name: true, address: true, operatorId: true } },
                    },
                },
                payments: {
                    where: { status: 'completed' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                user: { select: { id: true, fullName: true, email: true } },
            },
        });

        if (!booking) throw new Error('Booking not found');
        if (booking.status === 'cancelled') throw new Error('Booking is already cancelled');

        const slotDate = new Date(booking.slot.date);
        const slotStart = new Date(booking.slot.startTime);
        const bookingStartDateTime = new Date(
            Date.UTC(
                slotDate.getUTCFullYear(),
                slotDate.getUTCMonth(),
                slotDate.getUTCDate(),
                slotStart.getUTCHours(),
                slotStart.getUTCMinutes(),
                0
            )
        );

        if (bookingStartDateTime < new Date()) {
            throw new Error('Cannot cancel a booking that has already started or passed');
        }

        const paidPayment = booking.payments[0] || null;
        const paidAmount = paidPayment ? parseFloat(paidPayment.amount) : 0;
        const { refundPercent, refundAmount, tier } = computeRefundAmount(bookingStartDateTime, paidAmount);

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: 'cancelled',
                notes: booking.notes ? `${booking.notes} | Cancelled by user` : 'Cancelled by user',
            },
        });

        if (paidPayment && refundAmount > 0) {
            const pidx = paidPayment.gatewayResponse?.pidx || paidPayment.transactionId;
            if (pidx) {
                const refundResult = await initiateKhaltiRefund(pidx, refundAmount);
                await prisma.payment.update({
                    where: { id: paidPayment.id },
                    data: {
                        refundAmount,
                        refundedAt: new Date(),
                        refundStatus: refundResult.success ? 'initiated' : 'failed',
                        refundPidx: refundResult.refundPidx || null,
                    },
                });
            }
        }

        const refundMsg = getRefundMessage(tier, refundAmount);

        const userNotification = await prisma.notification.create({
            data: {
                userId,
                type: 'booking_cancelled',
                title: 'Booking Cancelled',
                message: `Your booking at ${booking.slot.venue.name} on ${slotDate.toDateString()} has been cancelled. ${refundMsg}`,
                relatedEntityType: 'booking',
                relatedEntityId: id,
                link: `/my-bookings/${id}`,
            },
        });
        this._emitNotification(userId, userNotification);

        const opNotification = await prisma.notification.create({
            data: {
                userId: booking.slot.venue.operatorId,
                type: 'booking_cancelled_by_user',
                title: 'Booking Cancelled by User',
                message: `${booking.user.fullName} has cancelled their booking at ${booking.slot.venue.name} on ${slotDate.toDateString()}.`,
                relatedEntityType: 'booking',
                relatedEntityId: id,
                link: `/operator/bookings/${id}`,
            },
        });
        this._emitNotification(booking.slot.venue.operatorId, opNotification);

        try {
            await emailService.sendCancellationEmail(booking.user.email, {
                userName: booking.user.fullName,
                venueName: booking.slot.venue.name,
                bookingDate: slotDate,
                refundAmount,
                refundPercent,
                bookingId: id,
            });
        } catch (emailErr) {
            console.error('Cancellation email error:', emailErr);
        }

        return { ...updatedBooking, refundInfo: { refundPercent, refundAmount, tier, message: refundMsg } };
    }

    async createOperatorBooking(operatorId, bookingData) {
        const { venueId, date, startTime, endTime, guestName, price } = bookingData;

        if (!venueId || !date || !startTime || !endTime) {
            throw new Error('venueId, date, startTime, and endTime are required');
        }

        const venue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
        });

        if (!venue) {
            throw new Error('Venue not found or access denied');
        }

        const parseTime = (t) => {
            if (t.includes('T')) return new Date(t);
            return new Date(`1970-01-01T${t}:00.000Z`);
        };

        const parsedDate = new Date(date);
        const parsedStart = parseTime(startTime);
        const parsedEnd = parseTime(endTime);

        let slot = await prisma.timeSlot.findFirst({
            where: {
                venueId,
                date: parsedDate,
                startTime: parsedStart,
                endTime: parsedEnd,
            },
            include: {
                bookings: { where: { status: { not: 'cancelled' } } },
            },
        });

        if (slot && slot.bookings.length > 0) {
            throw new Error('This time slot is already booked');
        }

        if (!slot) {
            slot = await prisma.timeSlot.create({
                data: {
                    venueId,
                    date: parsedDate,
                    startTime: parsedStart,
                    endTime: parsedEnd,
                    price: price || venue.pricePerHour,
                },
            });
        }

        const booking = await prisma.booking.create({
            data: {
                userId: operatorId,
                slotId: slot.id,
                bookingDate: parsedDate,
                totalPrice: price || slot.price || venue.pricePerHour,
                status: 'confirmed',
                isWalkIn: true,
                notes: `Walk-in booking by operator for: ${guestName || 'Walk-in Guest'}`,
            },
            include: {
                slot: {
                    include: { venue: { select: { id: true, name: true } } },
                },
            },
        });

        return booking;
    }

    _emitNotification(userId, notification) {
        try {
            getIo().to(userId).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting notification:', socketErr);
        }
    }
}

module.exports = new BookingService();
