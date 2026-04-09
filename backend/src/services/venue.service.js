const prisma = require('../config/prisma');
const { getIo } = require('../socket');

class VenueService {
    // ============================================
    // PUBLIC ENDPOINTS
    // ============================================

    async getVenues({ city, sport, search, minPrice, maxPrice, sortBy, page = 1, limit = 10 }) {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let orderBy = { rating: 'desc' }; // default
        if (sortBy === 'price_asc') {
            orderBy = { pricePerHour: 'asc' };
        } else if (sortBy === 'price_desc') {
            orderBy = { pricePerHour: 'desc' };
        } else if (sortBy === 'rating_desc') {
            orderBy = { rating: 'desc' };
        } else if (sortBy === 'newest') {
            orderBy = { createdAt: 'desc' };
        } else if (sortBy === 'relevance') {
            orderBy = { rating: 'desc' };
        }

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
                sport: {
                    name: { equals: sport, mode: 'insensitive' },
                },
            }),
        };

        const [venues, total] = await Promise.all([
            prisma.venue.findMany({
                where,
                include: {
                    sport: true,
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
                orderBy,
                skip,
                take: parseInt(limit),
            }),
            prisma.venue.count({ where }),
        ]);

        return {
            venues,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
        };
    }

    async getVenueById(id, userId) {
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
            throw new Error('Venue not found');
        }

        if (venue.approvalStatus !== 'approved' && userId !== venue.operatorId) {
            throw new Error('Venue not found');
        }

        return venue;
    }

    // ============================================
    // OPERATOR ENDPOINTS
    // ============================================

    async getOperatorVenues(operatorId, { status, approvalStatus }) {
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

        return { venues, count: venues.length };
    }

    async getOperatorVenueById(id, operatorId) {
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
            throw new Error('Venue not found or access denied');
        }

        return venue;
    }

    async createVenue(operatorId, dto, body) {
        const { name, address, pricePerHour, sportId, city, state, postalCode, latitude, longitude, contactPhone, contactEmail } = dto;
        const { description, amenities, operatingHours, images } = body;

        const sport = await prisma.sport.findUnique({ where: { id: sportId } });
        if (!sport) {
            throw new Error('Invalid sport selected');
        }

        const venue = await prisma.venue.create({
            data: {
                operatorId,
                sportId,
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
                approvalStatus: 'pending',
                ...(operatingHours && operatingHours.length > 0 && {
                    operatingHours: {
                        create: operatingHours.map(hour => ({
                            dayOfWeek: hour.dayOfWeek,
                            isClosed: hour.isClosed || false,
                            openingTime: hour.openingTime ? new Date(`1970-01-01T${hour.openingTime}:00.000Z`) : null,
                            closingTime: hour.closingTime ? new Date(`1970-01-01T${hour.closingTime}:00.000Z`) : null,
                        })),
                    },
                }),
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
                sport: true,
                images: true,
                operatingHours: true,
            },
        });

        // Notify admins async
        setImmediate(async () => {
            try {
                const operator = await prisma.user.findUnique({
                    where: { id: operatorId },
                    select: { fullName: true },
                });
                const admins = await prisma.user.findMany({
                    where: { role: 'admin' },
                    select: { id: true },
                });
                for (const admin of admins) {
                    const notif = await prisma.notification.create({
                        data: {
                            userId: admin.id,
                            type: 'new_venue_pending',
                            title: 'New Venue Pending Review',
                            message: `"${venue.name}" submitted by ${operator?.fullName || 'an operator'} is awaiting your approval.`,
                            relatedEntityType: 'venue',
                            relatedEntityId: venue.id,
                            link: `/admin/venues/${venue.id}`,
                        },
                    });
                    try { getIo().to(admin.id).emit('new_notification', notif); } catch (e) { /* ignore */ }
                }
            } catch (notifErr) {
                console.error('Admin venue notification error:', notifErr);
            }
        });

        return venue;
    }

    async updateVenue(id, operatorId, dto, body) {
        const { name, pricePerHour, sportId, latitude, longitude, contactEmail } = dto;
        const { description, address, city, state, postalCode, contactPhone, amenities, isActive } = body;

        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            throw new Error('Venue not found or access denied');
        }

        if (sportId) {
            const sport = await prisma.sport.findUnique({ where: { id: sportId } });
            if (!sport) {
                throw new Error('Invalid sport selected');
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
                ...(sportId && { sportId }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                sport: true,
                images: true,
                operatingHours: true,
            },
        });

        return venue;
    }

    async deleteVenue(id, operatorId) {
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            throw new Error('Venue not found or access denied');
        }

        await prisma.venue.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async permanentDeleteVenue(id, operatorId) {
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
            throw new Error('Venue not found or access denied');
        }

        const activeBookings = await prisma.booking.count({
            where: {
                slot: { venueId: id },
                status: { in: ['pending', 'confirmed'] },
            },
        });

        if (activeBookings > 0) {
            throw new Error(`Cannot delete venue with ${activeBookings} active booking(s). Please cancel or complete all bookings first.`);
        }

        await prisma.$transaction(async (tx) => {
            await tx.booking.deleteMany({
                where: { slot: { venueId: id } },
            });
            await tx.timeSlot.deleteMany({
                where: { venueId: id },
            });
            await tx.review.deleteMany({
                where: { venueId: id },
            });
            await tx.venueImage.deleteMany({
                where: { venueId: id },
            });
            await tx.venueOperatingHour.deleteMany({
                where: { venueId: id },
            });
            await tx.notification.deleteMany({
                where: {
                    relatedEntityType: 'venue',
                    relatedEntityId: id
                },
            });
            await tx.venue.delete({
                where: { id },
            });
        });
    }

    async addVenueImages(id, operatorId, files, primaryIndex) {
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            throw new Error('Venue not found or access denied');
        }

        if (!files || files.length === 0) {
            throw new Error('At least one image file is required');
        }

        const primaryIdx = parseInt(primaryIndex) || 0;
        if (primaryIdx >= 0 && primaryIdx < files.length) {
            await prisma.venueImage.updateMany({
                where: { venueId: id },
                data: { isPrimary: false },
            });
        }

        const maxOrderResult = await prisma.venueImage.aggregate({
            where: { venueId: id },
            _max: { displayOrder: true },
        });
        const startOrder = (maxOrderResult._max.displayOrder || 0) + 1;

        const normalizePath = (p) => {
            if (!p) return null;
            if (p.includes('cloudinary.com')) return p;
            const normalized = p.replace(/\\/g, '/');
            return normalized.startsWith('/') ? normalized : '/' + normalized;
        };

        const createdImages = await prisma.venueImage.createMany({
            data: files.map((file, index) => ({
                venueId: id,
                imageUrl: normalizePath(file.path) || `/uploads/venues/${file.filename}`,
                isPrimary: index === primaryIdx,
                displayOrder: startOrder + index,
            })),
        });

        return {
            count: createdImages.count,
            images: files.map((file, index) => ({
                filename: file.filename || file.originalname,
                url: normalizePath(file.path) || `/uploads/venues/${file.filename}`,
                isPrimary: index === primaryIdx,
            })),
        };
    }

    async deleteVenueImage(venueId, imageId, operatorId) {
        const existingVenue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
        });

        if (!existingVenue) {
            throw new Error('Venue not found or access denied');
        }

        await prisma.venueImage.delete({
            where: { id: imageId },
        });
    }

    async updateOperatingHours(id, operatorId, operatingHours) {
        const existingVenue = await prisma.venue.findFirst({
            where: { id, operatorId },
        });

        if (!existingVenue) {
            throw new Error('Venue not found or access denied');
        }

        await prisma.venueOperatingHour.deleteMany({
            where: { venueId: id },
        });

        if (operatingHours && operatingHours.length > 0) {
            await prisma.venueOperatingHour.createMany({
                data: operatingHours.map(hour => ({
                    venueId: id,
                    dayOfWeek: hour.dayOfWeek,
                    isClosed: hour.isClosed || false,
                    openingTime: hour.openingTime ? new Date(`1970-01-01T${hour.openingTime}:00.000Z`) : null,
                    closingTime: hour.closingTime ? new Date(`1970-01-01T${hour.closingTime}:00.000Z`) : null,
                })),
            });
        }

        const updatedVenue = await prisma.venue.findUnique({
            where: { id },
            include: { operatingHours: { orderBy: { dayOfWeek: 'asc' } } },
        });

        return updatedVenue.operatingHours;
    }

    async getOperatorDashboard(operatorId) {
        const venues = await prisma.venue.findMany({
            where: { operatorId },
            select: { id: true },
        });
        const venueIds = venues.map(v => v.id);

        const [
            totalVenues,
            activeVenues,
            pendingApproval,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            totalRevenue,
            recentBookings,
            totalEvents,
            totalEventRegistrations,
            eventRevenueAgg,
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
            // Event stats
            prisma.event.count({ where: { venueId: { in: venueIds } } }),
            prisma.eventRegistration.count({
                where: { event: { venueId: { in: venueIds } }, paymentStatus: 'completed' },
            }),
            prisma.eventRegistration.findMany({
                where: { event: { venueId: { in: venueIds } }, paymentStatus: 'completed' },
                include: { event: { select: { registrationFee: true } } },
            }),
        ]);

        const eventRevenue = eventRevenueAgg.reduce(
            (sum, reg) => sum + parseFloat(reg.event.registrationFee || 0),
            0
        );

        return {
            stats: {
                totalVenues,
                activeVenues,
                pendingApproval,
                totalBookings,
                pendingBookings,
                confirmedBookings,
                totalRevenue: totalRevenue._sum.totalPrice || 0,
                totalEvents,
                totalEventRegistrations,
                eventRevenue,
            },
            recentBookings,
        };
    }

    // ============================================
    // PUBLIC STATS (Landing Page)
    // ============================================

    async getPublicStats() {
        const [totalVenues, totalBookings, cityGroups] = await Promise.all([
            prisma.venue.count({ where: { approvalStatus: 'approved', isActive: true } }),
            prisma.booking.count(),
            prisma.venue.groupBy({
                by: ['city'],
                where: { approvalStatus: 'approved', isActive: true, city: { not: null } },
            }),
        ]);

        const totalCities = cityGroups.filter(g => g.city && g.city.trim() !== '').length;

        return { totalVenues, totalBookings, totalCities };
    }

    async getCities() {
        const cityGroups = await prisma.venue.groupBy({
            by: ['city'],
            where: { approvalStatus: 'approved', isActive: true, city: { not: null } },
            orderBy: { city: 'asc' },
        });

        return cityGroups
            .map(g => g.city)
            .filter(c => c && c.trim() !== '');
    }
}

module.exports = new VenueService();
