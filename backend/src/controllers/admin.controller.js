const prisma = require('../config/prisma');
const { getIo } = require('../socket');

/**
 * Admin Controller
 * Handles all admin-related operations including venue approval workflow
 */

// ============================================
// DASHBOARD
// ============================================

/**
 * Get admin dashboard statistics
 * GET /api/admin/dashboard
 */
const getAdminDashboard = async (req, res) => {
    try {
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

        res.json({
            success: true,
            data: {
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
            },
        });
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
        });
    }
};

// ============================================
// VENUE MANAGEMENT
// ============================================

/**
 * Get pending venues for approval
 * GET /api/admin/venues/pending
 */
const getPendingVenues = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [venues, total] = await Promise.all([
            prisma.venue.findMany({
                where: { approvalStatus: 'pending' },
                include: {
                    operator: { select: { id: true, fullName: true, email: true, phone: true } },
                    sport: true,
                    images: { orderBy: { displayOrder: 'asc' } },
                    _count: { select: { operatingHours: true } },
                },
                orderBy: { createdAt: 'asc' }, // Oldest first
                skip,
                take: parseInt(limit),
            }),
            prisma.venue.count({ where: { approvalStatus: 'pending' } }),
        ]);

        res.json({
            success: true,
            data: venues,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching pending venues:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending venues',
        });
    }
};

/**
 * Get all venues with filters
 * GET /api/admin/venues
 */
const getAllVenues = async (req, res) => {
    try {
        const { approvalStatus, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

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
                take: parseInt(limit),
            }),
            prisma.venue.count({ where }),
        ]);

        res.json({
            success: true,
            data: venues,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch venues',
        });
    }
};

/**
 * Get venue details for review
 * GET /api/admin/venues/:id
 */
const getVenueForReview = async (req, res) => {
    try {
        const { id } = req.params;

        const venue = await prisma.venue.findUnique({
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

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found',
            });
        }

        res.json({
            success: true,
            data: venue,
        });
    } catch (error) {
        console.error('Error fetching venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch venue',
        });
    }
};

/**
 * Approve venue
 * PUT /api/admin/venues/:id/approve
 */
const approveVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const venue = await prisma.venue.findUnique({ where: { id } });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found',
            });
        }

        if (venue.approvalStatus === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Venue is already approved',
            });
        }

        const updatedVenue = await prisma.venue.update({
            where: { id },
            data: {
                approvalStatus: 'approved',
                approvedBy: adminId,
                approvedAt: new Date(),
                rejectionReason: null, // Clear any previous rejection reason
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
                relatedEntityId: venue.id
            }
        });

        // Emit real-time notification
        try {
            getIo().to(venue.operatorId).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting venue_approved:', socketErr);
        }

        res.json({
            success: true,
            message: 'Venue approved successfully',
            data: updatedVenue,
        });
    } catch (error) {
        console.error('Error approving venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve venue',
        });
    }
};

/**
 * Reject venue
 * PUT /api/admin/venues/:id/reject
 */
const rejectVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
            });
        }

        const venue = await prisma.venue.findUnique({ where: { id } });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found',
            });
        }

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
                relatedEntityId: venue.id
            }
        });

        try {
            getIo().to(venue.operatorId).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting venue_rejected:', socketErr);
        }

        res.json({
            success: true,
            message: 'Venue rejected',
            data: updatedVenue,
        });
    } catch (error) {
        console.error('Error rejecting venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject venue',
        });
    }
};

// ============================================
// USER MANAGEMENT (Optional - for later)
// ============================================

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

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
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    isVerified: true,
                    canSellProducts: true,
                    sellerRequestStatus: true,
                    createdAt: true,
                    _count: { select: { ownedVenues: true, bookings: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
        });
    }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isVerified } = req.body;
        const adminId = req.user.id;

        // Prevent admin from modifying their own role
        if (id === adminId && role) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role',
            });
        }

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const updateData = {};
        if (role !== undefined && ['user', 'operator', 'admin'].includes(role)) {
            updateData.role = role;
        }
        if (isVerified !== undefined) {
            updateData.isVerified = isVerified;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
        });
    }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Prevent admin from deleting themselves
        if (id === adminId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account',
            });
        }

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Don't allow deleting other admins
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin users',
            });
        }

        // Delete the user (cascade will handle related data based on schema)
        await prisma.user.delete({ where: { id } });

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
        });
    }
};

// ============================================
// SELLER REQUEST MANAGEMENT
// ============================================

/**
 * Get pending seller requests
 * GET /api/admin/seller-requests
 */
const getSellerRequests = async (req, res) => {
    try {
        const requests = await prisma.user.findMany({
            where: {
                role: 'operator',
                sellerRequestStatus: 'pending',
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                createdAt: true,
                _count: { select: { ownedVenues: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Error fetching seller requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller requests',
        });
    }
};

/**
 * Approve seller request
 * PUT /api/admin/seller-requests/:id/approve
 */
const approveSellerRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') {
            return res.status(404).json({
                success: false,
                message: 'Operator not found',
            });
        }

        await prisma.user.update({
            where: { id },
            data: {
                canSellProducts: true,
                sellerRequestStatus: 'approved',
            },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: id,
                type: 'seller_approved',
                title: 'Seller Request Approved',
                message: 'You are now approved to sell products on BookMyGame!',
            }
        });

        try {
            getIo().to(id).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting seller_approved:', socketErr);
        }

        res.json({
            success: true,
            message: `${user.fullName} has been approved as a seller`,
        });
    } catch (error) {
        console.error('Error approving seller request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve seller request',
        });
    }
};

/**
 * Reject seller request
 * PUT /api/admin/seller-requests/:id/reject
 */
const rejectSellerRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') {
            return res.status(404).json({
                success: false,
                message: 'Operator not found',
            });
        }

        await prisma.user.update({
            where: { id },
            data: {
                canSellProducts: false,
                sellerRequestStatus: 'rejected',
            },
        });

        await prisma.notification.create({
            data: {
                userId: id,
                type: 'seller_rejected',
                title: 'Seller Request Rejected',
                message: 'Your request to sell products has been rejected.',
            }
        });

        res.json({
            success: true,
            message: `Seller request from ${user.fullName} has been rejected`,
        });
    } catch (error) {
        console.error('Error rejecting seller request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject seller request',
        });
    }
};

// ============================================
// VIDEO UPLOADER REQUEST MANAGEMENT
// ============================================

/**
 * Get pending video uploader requests
 * GET /api/admin/video-uploader-requests
 */
const getVideoUploaderRequests = async (req, res) => {
    try {
        const requests = await prisma.user.findMany({
            where: {
                role: 'operator',
                videoUploaderRequestStatus: 'pending',
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                createdAt: true,
                canUploadVideos: true,
                videoUploaderRequestStatus: true,
                _count: { select: { ownedVenues: true, uploadedVideos: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching video uploader requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video uploader requests',
        });
    }
};

/**
 * Approve video uploader request
 * PUT /api/admin/video-uploader-requests/:id/approve
 */
const approveVideoUploaderRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') {
            return res.status(404).json({
                success: false,
                message: 'Operator not found',
            });
        }

        await prisma.user.update({
            where: { id },
            data: {
                canUploadVideos: true,
                videoUploaderRequestStatus: 'approved',
            },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: id,
                type: 'video_uploader_approved',
                title: 'Video Upload Access Granted',
                message: 'You are now approved to upload training videos on BookMyGame!',
            },
        });

        try {
            getIo().to(id).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting video_uploader_approved:', socketErr);
        }

        res.json({
            success: true,
            message: `${user.fullName} has been approved to upload training videos`,
        });
    } catch (error) {
        console.error('Error approving video uploader request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve video uploader request',
        });
    }
};

/**
 * Reject video uploader request
 * PUT /api/admin/video-uploader-requests/:id/reject
 */
const rejectVideoUploaderRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'operator') {
            return res.status(404).json({
                success: false,
                message: 'Operator not found',
            });
        }

        await prisma.user.update({
            where: { id },
            data: {
                canUploadVideos: false,
                videoUploaderRequestStatus: 'rejected',
            },
        });

        const notification = await prisma.notification.create({
            data: {
                userId: id,
                type: 'video_uploader_rejected',
                title: 'Video Upload Request Rejected',
                message: 'Your request to upload training videos has been rejected. Please contact support for more information.',
            },
        });

        try {
            getIo().to(id).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting video_uploader_rejected:', socketErr);
        }

        res.json({
            success: true,
            message: `Video uploader request from ${user.fullName} has been rejected`,
        });
    } catch (error) {
        console.error('Error rejecting video uploader request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject video uploader request',
        });
    }
};

module.exports = {
    getAdminDashboard,
    getPendingVenues,
    getAllVenues,
    getVenueForReview,
    approveVenue,
    rejectVenue,
    getAllUsers,
    updateUser,
    deleteUser,
    getSellerRequests,
    approveSellerRequest,
    rejectSellerRequest,
    getVideoUploaderRequests,
    approveVideoUploaderRequest,
    rejectVideoUploaderRequest,
};
