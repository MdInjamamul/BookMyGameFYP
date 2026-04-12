const prisma = require('../config/prisma');
const { getIo } = require('../socket');

class AdminService {
    // ============================================
    // DASHBOARD
    // ============================================
    async getDashboardStats() {
        const [
            totalUsers,
            totalOperators,
            totalVenues,
            pendingVenues,
            approvedVenues,
            rejectedVenues,
            totalBookings,
            totalRevenue,
            recentVenues,
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'user' } }),
            prisma.user.count({ where: { role: 'operator' } }),
            prisma.venue.count(),
            prisma.venue.count({ where: { approvalStatus: 'pending' } }),
            prisma.venue.count({ where: { approvalStatus: 'approved' } }),
            prisma.venue.count({ where: { approvalStatus: 'rejected' } }),
            prisma.booking.count(),
            prisma.booking.aggregate({
                where: { status: 'confirmed', isWalkIn: false },
                _sum: { totalPrice: true },
            }),
            prisma.venue.findMany({
                where: { approvalStatus: 'pending' },
                include: {
                    operator: { select: { id: true, fullName: true, email: true } },
                    sport: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        return {
            stats: {
                totalUsers,
                totalOperators,
                totalVenues,
                pendingVenues,
                approvedVenues,
                rejectedVenues,
                totalBookings,
                totalRevenue: totalRevenue._sum.totalPrice || 0,
            },
            recentPendingVenues: recentVenues,
        };
    }

    async getAnalytics(period = 30) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0); // start of today
        startDate.setDate(startDate.getDate() - parseInt(period) + 1); // e.g. for last 7 days including today

        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - parseInt(period));

        // Fetch data for both periods and other stats
        const [
            currentBookings,
            previousBookings,
            currentUsers,
            previousUsers,
            statusGroup,
            venuesBySportRaw,
            topOperatorsRaw,
            sports
        ] = await Promise.all([
            prisma.booking.findMany({
                where: { createdAt: { gte: startDate } },
                select: { createdAt: true, status: true, totalPrice: true, isWalkIn: true }
            }),
            prisma.booking.findMany({
                where: { createdAt: { gte: previousStartDate, lt: startDate } },
                select: { status: true, totalPrice: true, isWalkIn: true }
            }),
            prisma.user.findMany({
                where: { createdAt: { gte: startDate }, role: 'user' },
                select: { createdAt: true }
            }),
            prisma.user.count({
                where: { createdAt: { gte: previousStartDate, lt: startDate }, role: 'user' }
            }),
            prisma.booking.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.venue.groupBy({
                by: ['sportId'],
                where: { approvalStatus: 'approved' },
                _count: true
            }),
            prisma.booking.findMany({
                where: { status: 'confirmed', isWalkIn: false },
                select: {
                    totalPrice: true,
                    slot: {
                        select: {
                            venue: {
                                select: {
                                    operator: { select: { id: true, fullName: true, email: true } }
                                }
                            }
                        }
                    }
                }
            }),
            prisma.sport.findMany()
        ]);

        // Process daily data with zero-fill
        const dateMap = {};
        for(let i = 0; i < parseInt(period); i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dateMap[dateStr] = { revenue: 0, users: 0 };
        }

        let currentRevenue = 0;
        let currentConfirmedBookings = 0;
        
        currentBookings.forEach(b => {
             const dStr = new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
             if(dateMap[dStr] && b.status === 'confirmed') {
                 currentConfirmedBookings += 1;
                 // Only count non-walk-in bookings as platform revenue
                 if (!b.isWalkIn) {
                     const price = parseFloat(b.totalPrice) || 0;
                     dateMap[dStr].revenue += price;
                     currentRevenue += price;
                 }
             }
        });

        currentUsers.forEach(u => {
             const dStr = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
             if(dateMap[dStr]) {
                 dateMap[dStr].users += 1;
             }
        });

        const revenueByDay = Object.keys(dateMap).map(date => ({ date, revenue: dateMap[date].revenue }));
        const usersByDay = Object.keys(dateMap).map(date => ({ date, count: dateMap[date].users }));

        // Process previous period for KPIs
        let previousRevenue = 0;
        let previousConfirmedBookings = 0;
        previousBookings.forEach(b => {
             if(b.status === 'confirmed') {
                 previousConfirmedBookings += 1;
                 // Only count non-walk-in bookings as platform revenue
                 if (!b.isWalkIn) {
                     previousRevenue += parseFloat(b.totalPrice) || 0;
                 }
             }
        });

        // Booking status distribution
        const bookingsByStatus = statusGroup.map(sg => ({
            status: sg.status,
            count: sg._count
        }));

        // Venues by sport
        const sportMap = {};
        sports.forEach(s => sportMap[s.id] = s.name);
        
        const venuesBySport = venuesBySportRaw.map(vs => ({
            sport: sportMap[vs.sportId] || 'Unknown',
            count: vs._count
        })).sort((a, b) => b.count - a.count);

        // Top Operators
        const opsMap = {};
        topOperatorsRaw.forEach(b => {
            const op = b.slot?.venue?.operator;
            if(op) {
                if(!opsMap[op.id]) {
                    opsMap[op.id] = { ...op, totalRevenue: 0, bookingCount: 0, venueCount: 0 };
                }
                opsMap[op.id].totalRevenue += parseFloat(b.totalPrice) || 0;
                opsMap[op.id].bookingCount += 1;
            }
        });
        
        // Count venues per operator for top operators table
        const operatorIds = Object.keys(opsMap);
        if(operatorIds.length > 0) {
             const venuesPerOp = await prisma.venue.groupBy({
                 by: ['operatorId'],
                 where: { operatorId: { in: operatorIds }, approvalStatus: 'approved' },
                 _count: true
             });
             venuesPerOp.forEach(vo => {
                 if(opsMap[vo.operatorId]) {
                     opsMap[vo.operatorId].venueCount = vo._count;
                 }
             });
        }

        const topOperators = Object.values(opsMap)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        return {
            revenueByDay,
            usersByDay,
            bookingsByStatus,
            venuesBySport,
            topOperators,
            kpiComparison: {
                currentRevenue, previousRevenue,
                currentBookings: currentConfirmedBookings, previousBookings: previousConfirmedBookings,
                currentUsers: currentUsers.length, previousUsers
            }
        };
    }

    // ============================================
    // VENUE MANAGEMENT
    // ============================================
    async getPendingVenues({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const [venues, total] = await Promise.all([
            prisma.venue.findMany({
                where: { approvalStatus: 'pending' },
                include: {
                    operator: { select: { id: true, fullName: true, email: true, phone: true } },
                    sport: true,
                    images: { orderBy: { displayOrder: 'asc' } },
                    _count: { select: { operatingHours: true } },
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            prisma.venue.count({ where: { approvalStatus: 'pending' } }),
        ]);

        return { venues, total };
    }

    async getAllVenues({ approvalStatus, search, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const where = {
            ...(approvalStatus && { approvalStatus }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [venues, total] = await Promise.all([
            prisma.venue.findMany({
                where,
                include: {
                    operator: { select: { id: true, fullName: true, email: true } },
                    sport: true,
                    images: { where: { isPrimary: true }, take: 1 },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.venue.count({ where }),
        ]);

        return { venues, total };
    }

    async getVenueForReview(id) {
        return await prisma.venue.findUnique({
            where: { id },
            include: {
                operator: {
                    select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
                },
                sport: true,
                images: { orderBy: { displayOrder: 'asc' } },
                operatingHours: { orderBy: { dayOfWeek: 'asc' } },
                _count: { select: { reviews: true, timeSlots: true } },
            },
        });
    }

    async approveVenue(id, adminId) {
        const venue = await prisma.venue.findUnique({ where: { id } });
        if (!venue) throw new Error('Venue not found');
        if (venue.approvalStatus === 'approved') throw new Error('Venue is already approved');

        const updatedVenue = await prisma.venue.update({
            where: { id },
            data: {
                approvalStatus: 'approved',
                approvedBy: adminId,
                approvedAt: new Date(),
                rejectionReason: null,
            },
            include: {
                operator: { select: { id: true, fullName: true, email: true } },
                sport: true,
            },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: venue.operatorId,
                type: 'venue_approved',
                title: 'Venue Approved',
                message: `Your venue "${venue.name}" has been approved and is now live!`,
                relatedEntityType: 'venue',
                relatedEntityId: venue.id,
                link: '/operator/venues',
            }
        });

        this._emitNotification(venue.operatorId, notification);
        return updatedVenue;
    }

    async rejectVenue(id, adminId, reason) {
        const venue = await prisma.venue.findUnique({ where: { id } });
        if (!venue) throw new Error('Venue not found');
        if (venue.approvalStatus === 'rejected') throw new Error('Venue is already rejected');

        const updatedVenue = await prisma.venue.update({
            where: { id },
            data: {
                approvalStatus: 'rejected',
                approvedBy: adminId,
                approvedAt: new Date(),
                rejectionReason: reason,
            },
            include: {
                operator: { select: { id: true, fullName: true, email: true } },
                sport: true,
            },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: venue.operatorId,
                type: 'venue_rejected',
                title: 'Venue Rejected',
                message: `Your venue "${venue.name}" was rejected. Reason: ${reason}`,
                relatedEntityType: 'venue',
                relatedEntityId: venue.id,
                link: '/operator/venues',
            }
        });

        this._emitNotification(venue.operatorId, notification);
        return updatedVenue;
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================
    async getAllUsers({ role, search, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const where = {
            ...(role && { role }),
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true, email: true, fullName: true, phone: true,
                    role: true, isVerified: true, canSellProducts: true,
                    sellerRequestStatus: true, createdAt: true,
                    _count: { select: { ownedVenues: true, bookings: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    async updateUser(id, adminId, updateData) {
        if (id === adminId && updateData.role) throw new Error('You cannot change your own role');

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('User not found');

        return await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true, email: true, fullName: true, phone: true,
                role: true, isVerified: true, createdAt: true,
            },
        });
    }

    async deleteUser(id, adminId) {
        if (id === adminId) throw new Error('You cannot delete your own account');
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('User not found');
        if (user.role === 'admin') throw new Error('Cannot delete admin users');

        await prisma.user.delete({ where: { id } });
    }

    // ============================================
    // SELLER REQUEST MANAGEMENT
    // ============================================
    async getSellerRequests() {
        return await prisma.user.findMany({
            where: { role: 'operator', sellerRequestStatus: 'pending' },
            select: {
                id: true, fullName: true, email: true, phone: true, createdAt: true,
                _count: { select: { ownedVenues: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async approveSellerRequest(id) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') throw new Error('Operator not found');

        await prisma.user.update({
            where: { id },
            data: { canSellProducts: true, sellerRequestStatus: 'approved' },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: id, type: 'seller_approved', title: 'Seller Request Approved',
                message: 'You are now approved to sell products on BookMyGame!', link: '/operator/products',
            }
        });

        this._emitNotification(id, notification);
        return user;
    }

    async rejectSellerRequest(id) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') throw new Error('Operator not found');

        await prisma.user.update({
            where: { id },
            data: { canSellProducts: false, sellerRequestStatus: 'rejected' },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: id, type: 'seller_rejected', title: 'Seller Request Rejected',
                message: 'Your request to sell products has been rejected.',
            }
        });

        this._emitNotification(id, notification);
        return user;
    }

    // ============================================
    // VIDEO UPLOADER REQUEST MANAGEMENT
    // ============================================
    async getVideoUploaderRequests() {
        return await prisma.user.findMany({
            where: { role: 'operator', videoUploaderRequestStatus: 'pending' },
            select: {
                id: true, fullName: true, email: true, phone: true, createdAt: true,
                canUploadVideos: true, videoUploaderRequestStatus: true,
                _count: { select: { ownedVenues: true, uploadedVideos: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async approveVideoUploaderRequest(id) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') throw new Error('Operator not found');

        await prisma.user.update({
            where: { id },
            data: { canUploadVideos: true, videoUploaderRequestStatus: 'approved' },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: id, type: 'video_uploader_approved', title: 'Video Upload Access Granted',
                message: 'You are now approved to upload training videos on BookMyGame!', link: '/operator/training',
            },
        });

        this._emitNotification(id, notification);
        return user;
    }

    async rejectVideoUploaderRequest(id) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') throw new Error('Operator not found');

        await prisma.user.update({
            where: { id },
            data: { canUploadVideos: false, videoUploaderRequestStatus: 'rejected' },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: id, type: 'video_uploader_rejected', title: 'Video Upload Request Rejected',
                message: 'Your request to upload training videos has been rejected. Please contact support for more information.',
            },
        });

        this._emitNotification(id, notification);
        return user;
    }

    // Helper to safely emit notifications without breaking transactional flows
    _emitNotification(userId, notification) {
        try {
            getIo().to(userId).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting notification:', socketErr);
        }
    }
}

module.exports = new AdminService();
