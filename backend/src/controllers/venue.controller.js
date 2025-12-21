const prisma = require('../config/prisma');

/**
 * Venue Controller
 * Handles all venue-related operations for both public and operator access
 */

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * Get all approved venues with filters (public)
 * GET /api/venues
 */
const getVenues = async (req, res) => {
    try {
        const { city, sport, search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            isActive: true,
            approvalStatus: 'approved',
            ...(city && { city: { contains: city, mode: 'insensitive' } }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(minPrice && { pricePerHour: { gte: parseFloat(minPrice) } }),
            ...(maxPrice && { pricePerHour: { lte: parseFloat(maxPrice) } }),
            ...(sport && {
                sports: {
                    some: {
                        sport: {
                            name: { equals: sport, mode: 'insensitive' },
                        },
                    },
                },
            }),
        };

        const [venues, total] = await Promise.all([
            prisma.venue.findMany({
                where,
                include: {
                    sports: {
                        include: { sport: true },
                    },
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                    operator: {
                        select: { id: true, fullName: true },
                    },
                    _count: {
                        select: { reviews: true },
                    },
                },
                orderBy: { rating: 'desc' },
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
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Get venue details by ID (public)
 * GET /api/venues/:id
 */
const getVenueById = async (req, res) => {
    try {
        const { id } = req.params;

        const venue = await prisma.venue.findUnique({
            where: { id },
            include: {
                sport: true,
                images: {
                    orderBy: { displayOrder: 'asc' },
                },
                operatingHours: {
                    orderBy: { dayOfWeek: 'asc' },
                },
                operator: {
                    select: { id: true, fullName: true, phone: true },
                },
                reviews: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, profileImage: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: { reviews: true },
                },
            },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found',
            });
        }

        // Only show approved venues to public
        if (venue.approvalStatus !== 'approved' && (!req.user || req.user.id !== venue.operatorId)) {
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

// ============================================
// OPERATOR ENDPOINTS
// ============================================

/**
 * Get operator's own venues
 * GET /api/operator/venues
 */
const getOperatorVenues = async (req, res) => {
    try {
        const operatorId = req.user.id;
        const { status, approvalStatus } = req.query;

        const where = {
            operatorId,
            ...(status === 'active' && { isActive: true }),
            ...(status === 'inactive' && { isActive: false }),
            ...(approvalStatus && { approvalStatus }),
        };

        const venues = await prisma.venue.findMany({
            where,
            include: {
                sport: true,
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
                _count: {
                    select: { reviews: true, timeSlots: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: venues,
            count: venues.length,
        });
    } catch (error) {
        console.error('Error fetching operator venues:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch venues',
        });
    }
};

/**
 * Get operator's venue by ID
 * GET /api/operator/venues/:id
 */
const getOperatorVenueById = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        const venue = await prisma.venue.findFirst({
            where: { id, operatorId },
            include: {
                sport: true,
                images: {
                    orderBy: { displayOrder: 'asc' },
                },
                operatingHours: {
                    orderBy: { dayOfWeek: 'asc' },
                },
                _count: {
                    select: { reviews: true, timeSlots: true },
                },
            },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
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
 * Create new venue
 * POST /api/operator/venues
 */
const createVenue = async (req, res) => {
    try {
        const operatorId = req.user.id;
        const {
            name,
            description,
            address,
            city,
            state,
            postalCode,
            latitude,
            longitude,
            pricePerHour,
            contactPhone,
            contactEmail,
            amenities,
            sportId, // Single sport ID (one venue = one sport)
            operatingHours, // Array of { dayOfWeek, isClosed, openingTime, closingTime }
            images, // Array of { imageUrl, isPrimary, displayOrder }
        } = req.body;

        // Validation
        if (!name || !address || !pricePerHour || !sportId) {
            return res.status(400).json({
                success: false,
                message: 'Name, address, price per hour, and sport are required',
            });
        }

        // Validate sport exists
        const sport = await prisma.sport.findUnique({ where: { id: sportId } });
        if (!sport) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sport selected',
            });
        }

        const venue = await prisma.venue.create({
            data: {
                operatorId,
                sportId, // Direct sport reference
                name,
                description,
                address,
                city,
                state,
                postalCode,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                pricePerHour: parseFloat(pricePerHour),
                contactPhone,
                contactEmail,
                amenities: amenities || [],
                approvalStatus: 'pending', // New venues need admin approval
                // Create operating hours
                ...(operatingHours && operatingHours.length > 0 && {
                    operatingHours: {
                        create: operatingHours.map(hour => ({
                            dayOfWeek: hour.dayOfWeek,
                            isClosed: hour.isClosed || false,
                            openingTime: hour.openingTime ? new Date(`1970-01-01T${hour.openingTime}`) : null,
                            closingTime: hour.closingTime ? new Date(`1970-01-01T${hour.closingTime}`) : null,
                        })),
                    },
                }),
                // Create images
                ...(images && images.length > 0 && {
                    images: {
                        create: images.map((img, index) => ({
                            imageUrl: img.imageUrl,
                            isPrimary: img.isPrimary || index === 0,
                            displayOrder: img.displayOrder || index,
                        })),
                    },
                }),
            },
            include: {
                sport: true, // Include single sport
                images: true,
                operatingHours: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Venue created successfully. Pending admin approval.',
            data: venue,
        });
    } catch (error) {
        console.error('Error creating venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create venue',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Update venue
 * PUT /api/operator/venues/:id
 */
const updateVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;
        const {
            name,
            description,
            address,
            city,
            state,
            postalCode,
            latitude,
            longitude,
            pricePerHour,
            contactPhone,
            contactEmail,
            amenities,
            sportId, // Single sport ID
            isActive,
        } = req.body;

        // Check ownership
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        // If sportId is provided, validate it exists
        if (sportId) {
            const sport = await prisma.sport.findUnique({ where: { id: sportId } });
            if (!sport) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid sport selected',
                });
            }
        }

        const venue = await prisma.venue.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(address && { address }),
                ...(city !== undefined && { city }),
                ...(state !== undefined && { state }),
                ...(postalCode !== undefined && { postalCode }),
                ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
                ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
                ...(pricePerHour && { pricePerHour: parseFloat(pricePerHour) }),
                ...(contactPhone !== undefined && { contactPhone }),
                ...(contactEmail !== undefined && { contactEmail }),
                ...(amenities !== undefined && { amenities }),
                ...(sportId && { sportId }), // Update sport if provided
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                sport: true,
                images: true,
                operatingHours: true,
            },
        });

        res.json({
            success: true,
            message: 'Venue updated successfully',
            data: venue,
        });
    } catch (error) {
        console.error('Error updating venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update venue',
        });
    }
};

/**
 * Delete (deactivate) venue
 * DELETE /api/operator/venues/:id
 */
const deleteVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        // Check ownership
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        // Soft delete - just deactivate
        await prisma.venue.update({
            where: { id },
            data: { isActive: false },
        });

        res.json({
            success: true,
            message: 'Venue deactivated successfully',
        });
    } catch (error) {
        console.error('Error deleting venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete venue',
        });
    }
};

/**
 * Add images to venue (with file upload support)
 * POST /api/operator/venues/:id/images
 * Expects multipart/form-data with 'images' field
 */
const addVenueImages = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;
        const files = req.files; // Multer attaches uploaded files here
        const { primaryIndex } = req.body;

        // Check ownership
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image file is required',
            });
        }

        // If a primary index is specified, unset other primary images
        const primaryIdx = parseInt(primaryIndex) || 0;
        if (primaryIdx >= 0 && primaryIdx < files.length) {
            await prisma.venueImage.updateMany({
                where: { venueId: id },
                data: { isPrimary: false },
            });
        }

        // Get current max display order
        const maxOrderResult = await prisma.venueImage.aggregate({
            where: { venueId: id },
            _max: { displayOrder: true },
        });
        const startOrder = (maxOrderResult._max.displayOrder || 0) + 1;

        // Create VenueImage records for each uploaded file
        const createdImages = await prisma.venueImage.createMany({
            data: files.map((file, index) => ({
                venueId: id,
                imageUrl: file.path || `/uploads/venues/${file.filename}`,
                isPrimary: index === primaryIdx,
                displayOrder: startOrder + index,
            })),
        });

        res.status(201).json({
            success: true,
            message: `${createdImages.count} image(s) uploaded successfully`,
            data: {
                count: createdImages.count,
                images: files.map((file, index) => ({
                    filename: file.filename || file.originalname,
                    url: file.path || `/uploads/venues/${file.filename}`,
                    isPrimary: index === primaryIdx,
                })),
            },
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Delete venue image
 * DELETE /api/operator/venues/:venueId/images/:imageId
 */
const deleteVenueImage = async (req, res) => {
    try {
        const { venueId, imageId } = req.params;
        const operatorId = req.user.id;

        // Check ownership
        const existingVenue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
        });

        if (!existingVenue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        await prisma.venueImage.delete({
            where: { id: imageId },
        });

        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete image',
        });
    }
};

/**
 * Update operating hours
 * PUT /api/operator/venues/:id/hours
 */
const updateOperatingHours = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;
        const { operatingHours } = req.body;

        // Check ownership
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        // Delete existing and recreate
        await prisma.venueOperatingHour.deleteMany({
            where: { venueId: id },
        });

        if (operatingHours && operatingHours.length > 0) {
            await prisma.venueOperatingHour.createMany({
                data: operatingHours.map(hour => ({
                    venueId: id,
                    dayOfWeek: hour.dayOfWeek,
                    isClosed: hour.isClosed || false,
                    openingTime: hour.openingTime ? new Date(`1970-01-01T${hour.openingTime}`) : null,
                    closingTime: hour.closingTime ? new Date(`1970-01-01T${hour.closingTime}`) : null,
                })),
            });
        }

        const updatedVenue = await prisma.venue.findUnique({
            where: { id },
            include: { operatingHours: { orderBy: { dayOfWeek: 'asc' } } },
        });

        res.json({
            success: true,
            message: 'Operating hours updated successfully',
            data: updatedVenue.operatingHours,
        });
    } catch (error) {
        console.error('Error updating operating hours:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update operating hours',
        });
    }
};

/**
 * Get operator dashboard stats
 * GET /api/operator/dashboard
 */
const getOperatorDashboard = async (req, res) => {
    try {
        const operatorId = req.user.id;

        // Get venue IDs for this operator
        const venues = await prisma.venue.findMany({
            where: { operatorId },
            select: { id: true },
        });
        const venueIds = venues.map(v => v.id);

        // Get stats
        const [
            totalVenues,
            activeVenues,
            pendingApproval,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            totalRevenue,
            recentBookings,
        ] = await Promise.all([
            prisma.venue.count({ where: { operatorId } }),
            prisma.venue.count({ where: { operatorId, isActive: true, approvalStatus: 'approved' } }),
            prisma.venue.count({ where: { operatorId, approvalStatus: 'pending' } }),
            prisma.booking.count({
                where: { slot: { venueId: { in: venueIds } } },
            }),
            prisma.booking.count({
                where: { slot: { venueId: { in: venueIds } }, status: 'pending' },
            }),
            prisma.booking.count({
                where: { slot: { venueId: { in: venueIds } }, status: 'confirmed' },
            }),
            prisma.booking.aggregate({
                where: { slot: { venueId: { in: venueIds } }, status: 'confirmed' },
                _sum: { totalPrice: true },
            }),
            prisma.booking.findMany({
                where: { slot: { venueId: { in: venueIds } } },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    slot: {
                        include: {
                            venue: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalVenues,
                    activeVenues,
                    pendingApproval,
                    totalBookings,
                    pendingBookings,
                    confirmedBookings,
                    totalRevenue: totalRevenue._sum.totalPrice || 0,
                },
                recentBookings,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
        });
    }
};

/**
 * Permanently delete venue (hard delete)
 * DELETE /api/operator/venues/:id/permanent
 * WARNING: This action cannot be undone!
 */
const permanentDeleteVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        // Check ownership
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
            include: {
                _count: {
                    select: {
                        timeSlots: true,
                        reviews: true,
                    }
                }
            }
        });

        if (!existingVenue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        // Check for active bookings
        const activeBookings = await prisma.booking.count({
            where: {
                slot: { venueId: id },
                status: { in: ['pending', 'confirmed'] },
            },
        });

        if (activeBookings > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete venue with ${activeBookings} active booking(s). Please cancel or complete all bookings first.`,
            });
        }

        // Delete all related records in order (due to foreign key constraints)
        await prisma.$transaction(async (tx) => {
            // Delete bookings first
            await tx.booking.deleteMany({
                where: { slot: { venueId: id } },
            });

            // Delete time slots
            await tx.timeSlot.deleteMany({
                where: { venueId: id },
            });

            // Delete reviews
            await tx.review.deleteMany({
                where: { venueId: id },
            });

            // Delete venue images
            await tx.venueImage.deleteMany({
                where: { venueId: id },
            });

            // Delete operating hours
            await tx.venueOperatingHour.deleteMany({
                where: { venueId: id },
            });

            // Delete venue sports
            await tx.venueSport.deleteMany({
                where: { venueId: id },
            });

            // Finally delete the venue itself
            await tx.venue.delete({
                where: { id },
            });
        });

        res.json({
            success: true,
            message: 'Venue permanently deleted. This action cannot be undone.',
        });
    } catch (error) {
        console.error('Error permanently deleting venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to permanently delete venue',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

module.exports = {
    // Public
    getVenues,
    getVenueById,
    // Operator
    getOperatorVenues,
    getOperatorVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
    permanentDeleteVenue,
    addVenueImages,
    deleteVenueImage,
    updateOperatingHours,
    getOperatorDashboard,
};
