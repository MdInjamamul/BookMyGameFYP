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
                where: { status: 'confirmed' },
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
