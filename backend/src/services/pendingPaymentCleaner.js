const cron = require('node-cron');
const prisma = require('../config/prisma');
const { getIo } = require('../socket');

const EXPIRY_MINUTES = 5;

/**
 * Pending Payment Cleaner
 * Runs every minute. Finds bookings/event registrations that have been
 * in "pending" status for more than EXPIRY_MINUTES without a completed payment,
 * deletes them, and notifies the affected users.
 */
const cleanupPendingPayments = async () => {
    const cutoffTime = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);

    try {
        // ── 1. Venue Bookings ──────────────────────────────────────────────
        const expiredBookings = await prisma.booking.findMany({
            where: {
                status: 'pending',
                createdAt: { lt: cutoffTime },
                // Only bookings that do NOT have a completed payment
                NOT: {
                    payments: {
                        some: { status: 'completed' },
                    },
                },
            },
            include: {
                user: { select: { id: true, fullName: true } },
                slot: {
                    include: {
                        venue: { select: { id: true, name: true } },
                    },
                },
                payments: { select: { id: true, status: true } },
            },
        });

        if (expiredBookings.length > 0) {
            console.log(`[PaymentCleaner] Expiring ${expiredBookings.length} pending booking(s)...`);

            for (const booking of expiredBookings) {
                try {
                    // Mark any lingering pending payment as failed
                    const pendingPaymentIds = booking.payments
                        .filter(p => p.status === 'pending')
                        .map(p => p.id);

                    if (pendingPaymentIds.length > 0) {
                        await prisma.payment.updateMany({
                            where: { id: { in: pendingPaymentIds } },
                            data: {
                                status: 'failed',
                                gatewayResponse: {
                                    failedAt: new Date().toISOString(),
                                    reason: 'Payment not completed within 5 minutes',
                                },
                            },
                        });
                    }

                    // Soft-mark the booking as slot_released (preserve the record)
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: 'slot_released',
                            notes: `Slot auto-released — payment not completed within ${EXPIRY_MINUTES} minutes`,
                        },
                    });

                    // Notify the user
                    const notification = await prisma.notification.create({
                        data: {
                            userId: booking.userId,
                            type: 'booking_expired',
                            title: 'Booking Slot Released',
                            message: `Your held slot at ${booking.slot.venue.name} on ${new Date(booking.slot.date).toDateString()} was released because payment was not completed within ${EXPIRY_MINUTES} minutes. The slot is now available for others to book.`,
                            relatedEntityType: 'venue',
                            relatedEntityId: booking.slot.venue.id,
                            link: '/my-bookings?filter=slot_released',
                        },
                    });

                    try {
                        getIo().to(booking.userId).emit('new_notification', notification);
                    } catch (_) { /* ignore socket errors */ }

                    console.log(`[PaymentCleaner] Released booking ${booking.id} for user ${booking.userId}`);
                } catch (bookingErr) {
                    console.error(`[PaymentCleaner] Error cleaning booking ${booking.id}:`, bookingErr.message);
                }
            }
        }

        // ── 2. Event Registrations ─────────────────────────────────────────
        const expiredRegistrations = await prisma.eventRegistration.findMany({
            where: {
                paymentStatus: 'pending',
                registeredAt: { lt: cutoffTime },
                // Only registrations for PAID events (free events auto-complete)
                event: {
                    registrationFee: { gt: 0 },
                },
                // Not already paid
                NOT: {
                    payments: {
                        some: { status: 'completed' },
                    },
                },
            },
            include: {
                user: { select: { id: true, fullName: true } },
                event: { select: { id: true, title: true, registrationFee: true } },
                payments: { select: { id: true, status: true } },
            },
        });

        if (expiredRegistrations.length > 0) {
            console.log(`[PaymentCleaner] Expiring ${expiredRegistrations.length} pending event registration(s)...`);

            for (const reg of expiredRegistrations) {
                try {
                    // Mark any pending payment as failed
                    const pendingPaymentIds = reg.payments
                        .filter(p => p.status === 'pending')
                        .map(p => p.id);

                    if (pendingPaymentIds.length > 0) {
                        await prisma.payment.updateMany({
                            where: { id: { in: pendingPaymentIds } },
                            data: {
                                status: 'failed',
                                gatewayResponse: {
                                    failedAt: new Date().toISOString(),
                                    reason: 'Payment not completed within 5 minutes',
                                },
                            },
                        });
                    }

                    // Delete the expired registration
                    await prisma.eventRegistration.delete({ where: { id: reg.id } });

                    // Notify the user
                    const notification = await prisma.notification.create({
                        data: {
                            userId: reg.userId,
                            type: 'booking_expired',
                            title: 'Event Registration Cancelled',
                            message: `Your registration for "${reg.event.title}" was cancelled because payment of Rs. ${parseFloat(reg.event.registrationFee).toLocaleString()} was not completed within ${EXPIRY_MINUTES} minutes. You can register again anytime.`,
                            relatedEntityType: 'event',
                            relatedEntityId: reg.event.id,
                            link: '/my-events',
                        },
                    });

                    try {
                        getIo().to(reg.userId).emit('new_notification', notification);
                    } catch (_) { /* ignore socket errors */ }

                    console.log(`[PaymentCleaner] Released event registration ${reg.id} for user ${reg.userId}`);
                } catch (regErr) {
                    console.error(`[PaymentCleaner] Error cleaning registration ${reg.id}:`, regErr.message);
                }
            }
        }
    } catch (err) {
        console.error('[PaymentCleaner] Unexpected error during cleanup:', err.message);
    }
};

/**
 * Start the cron job — runs every minute
 */
const startPendingPaymentCleaner = () => {
    console.log(`[PaymentCleaner] Started — pending bookings/registrations expire after ${EXPIRY_MINUTES} minutes`);

    cron.schedule('* * * * *', cleanupPendingPayments, {
        scheduled: true,
        timezone: 'Asia/Kathmandu',
    });
};

module.exports = { startPendingPaymentCleaner, cleanupPendingPayments, EXPIRY_MINUTES };
