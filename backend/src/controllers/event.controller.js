const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { getIo } = require('../socket')
const {
  computeRefundAmount,
  getRefundMessage,
} = require('../services/refund.service')
const emailService = require('../services/email.service')

/**
 * Event Controller
 * Handles CRUD operations for events and event registrations
 */

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * Get all events with filters
 * Public - anyone can view events
 */
const getAllEvents = async (req, res) => {
  try {
    const {
      eventType,
      sportId,
      city,
      startDate,
      endDate,
      featured,
      page = 1,
      limit = 12,
    } = req.query

    const where = {}

    // By default only show events that have not fully ended yet.
    // Pass ?showPast=true to also include ended events.
    const showPast = req.query.showPast === 'true'
    if (!showPast) {
      // Include events whose endDate is today or in the future
      where.endDate = { gte: new Date() }
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      where.eventType = eventType
    }

    // Filter by sport (through venue)
    if (sportId) {
      where.venue = { sportId }
    }

    // Filter by city (through venue)
    if (city) {
      where.venue = { ...where.venue, city }
    }

    // Filter by date range
    if (startDate) {
      where.startDate = { gte: new Date(startDate) }
    }
    if (endDate) {
      where.endDate = { ...where.endDate, lte: new Date(endDate) }
    }

    // Filter featured only
    if (featured === 'true') {
      where.isFeatured = true
    }

    // Only show events from approved venues
    where.venue = { ...where.venue, approvalStatus: 'approved', isActive: true }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              sport: {
                select: { id: true, name: true, iconUrl: true },
              },
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { imageUrl: true },
              },
            },
          },
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.event.count({ where }),
    ])

    // Format events with registration count
    const formattedEvents = events.map((event) => ({
      ...event,
      registrationCount: event._count.registrations,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - event._count.registrations
        : null,
      _count: undefined,
    }))

    res.json({
      success: true,
      data: formattedEvents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch events' })
  }
}

/**
 * Get featured events for landing page
 * Shows new posted events from top-rated venues
 */
const getFeaturedEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        venue: { approvalStatus: 'approved', isActive: true },
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
            sport: { select: { name: true, iconUrl: true } },
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { imageUrl: true },
            },
          },
        },
        _count: { select: { registrations: true } },
      },
      orderBy: [{ venue: { rating: 'desc' } }, { createdAt: 'desc' }],
      take: 6,
    })

    const formattedEvents = events.map((event) => ({
      ...event,
      registrationCount: event._count.registrations,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - event._count.registrations
        : null,
      _count: undefined,
    }))

    res.json({ success: true, data: formattedEvents })
  } catch (error) {
    console.error('Error fetching featured events:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch featured events' })
  }
}

/**
 * Get single event by ID
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            contactPhone: true,
            contactEmail: true,
            latitude: true,
            longitude: true,
            sport: { select: { id: true, name: true, iconUrl: true } },
            images: {
              orderBy: { displayOrder: 'asc' },
              select: { id: true, imageUrl: true, isPrimary: true },
            },
            operator: {
              select: { id: true, fullName: true },
            },
          },
        },
        _count: { select: { registrations: true } },
      },
    })

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    // Check if current user is registered (if authenticated)
    let isRegistered = false
    let paymentStatus = null
    let registrationId = null
    if (req.user) {
      const registration = await prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: { eventId: id, userId: req.user.id },
        },
      })
      isRegistered = !!registration
      if (registration) {
        paymentStatus = registration.paymentStatus
        registrationId = registration.id
      }
    }

    res.json({
      success: true,
      data: {
        ...event,
        registrationCount: event._count.registrations,
        spotsRemaining: event.maxParticipants
          ? event.maxParticipants - event._count.registrations
          : null,
        isRegistered,
        paymentStatus,
        registrationId,
        _count: undefined,
      },
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch event' })
  }
}

// ============================================
// USER ENDPOINTS (Authenticated)
// ============================================

/**
 * Register for an event
 */
const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    })

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    // Check if event has already started
    if (new Date(event.startDate) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot register for past events' })
    }

    // Check registration deadline
    if (
      event.registrationDeadline &&
      new Date() > new Date(event.registrationDeadline)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Registration deadline has passed' })
    }

    // Check if already registered
    const existingReg = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    })

    if (existingReg) {
      return res
        .status(400)
        .json({ success: false, message: 'Already registered for this event' })
    }

    // Check if event is full
    if (
      event.maxParticipants &&
      event._count.registrations >= event.maxParticipants
    ) {
      return res.status(400).json({ success: false, message: 'Event is full' })
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: id,
        userId,
        paymentStatus: event.registrationFee > 0 ? 'pending' : 'completed',
      },
      include: {
        event: { select: { title: true } },
      },
    })

    // Create notification for user only if payment is not required
    if (registration.paymentStatus === 'completed') {
      const fullEvent = await prisma.event.findUnique({
        where: { id },
        include: { venue: { select: { operatorId: true } } },
      })

      const userNotif = await prisma.notification.create({
        data: {
          userId,
          type: 'event_registration',
          title: 'Event Registration Confirmed',
          message: `You have successfully registered for "${event.title}". See you there!`,
          relatedEntityType: 'event',
          relatedEntityId: id,
          link: '/my-events',
        },
      })
      try { getIo().to(userId).emit('new_notification', userNotif) } catch (e) { /* ignore */ }

      // Notify operator
      if (fullEvent?.venue?.operatorId) {
        const opNotif = await prisma.notification.create({
          data: {
            userId: fullEvent.venue.operatorId,
            type: 'new_event_registration',
            title: 'New Event Registration',
            message: `A user registered for "${event.title}".`,
            relatedEntityType: 'event',
            relatedEntityId: id,
            link: `/operator/events/${id}`,
          },
        })
        try { getIo().to(fullEvent.venue.operatorId).emit('new_notification', opNotif) } catch (e) { /* ignore */ }
      }
    }

    res.status(201).json({
      success: true,
      message:
        registration.paymentStatus === 'completed'
          ? 'Successfully registered for event'
          : 'Registration pending payment',
      data: registration,
    })
  } catch (error) {
    console.error('Error registering for event:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to register for event' })
  }
}

/**
 * Cancel event registration
 */
const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Check if registration exists
    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
      include: {
        event: {
          include: {
            venue: { select: { id: true, name: true, operatorId: true } },
          },
        },
        user: { select: { id: true, fullName: true, email: true } },
      },
    })

    if (!registration) {
      return res
        .status(404)
        .json({ success: false, message: 'Registration not found' })
    }

    // Check if event hasn't started
    const eventStart = new Date(registration.event.startDate)
    if (registration.event.startTime) {
      const st = new Date(registration.event.startTime)
      eventStart.setUTCHours(st.getUTCHours(), st.getUTCMinutes(), 0, 0)
    }
    if (eventStart < new Date()) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot cancel registration for events that have already started',
      })
    }

    // Compute refund based on registration fee
    const fee = parseFloat(registration.event.registrationFee) || 0
    const { refundPercent, refundAmount, tier } = computeRefundAmount(
      eventStart,
      fee,
    )
    const refundMsg = getRefundMessage(tier, refundAmount)

    // Delete registration
    await prisma.eventRegistration.delete({
      where: { eventId_userId: { eventId: id, userId } },
    })

    // Notify user
    const userNotif = await prisma.notification.create({
      data: {
        userId,
        type: 'event_cancelled',
        title: 'Event Registration Cancelled',
        message: `Your registration for "${registration.event.title}" has been cancelled. ${refundMsg}`,
        relatedEntityType: 'event',
        relatedEntityId: id,
      },
    })
    try {
      getIo().to(userId).emit('new_notification', userNotif)
    } catch (e) {
      /* ignore */
    }

    // Notify operator
    const opNotif = await prisma.notification.create({
      data: {
        userId: registration.event.venue.operatorId,
        type: 'event_cancelled',
        title: 'Event Registration Cancelled',
        message: `${registration.user.fullName} has cancelled their registration for "${registration.event.title}".`,
        relatedEntityType: 'event',
        relatedEntityId: id,
      },
    })
    try {
      getIo()
        .to(registration.event.venue.operatorId)
        .emit('new_notification', opNotif)
    } catch (e) {
      /* ignore */
    }

    res.json({
      success: true,
      message: 'Registration cancelled successfully',
      data: {
        refundInfo: { refundPercent, refundAmount, tier, message: refundMsg },
      },
    })
  } catch (error) {
    console.error('Error cancelling registration:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to cancel registration' })
  }
}

/**
 * Get user's event registrations
 */
const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id
    const { status } = req.query // 'upcoming' or 'past'

    const where = { userId }

    if (status === 'upcoming') {
      where.event = { startDate: { gte: new Date() } }
    } else if (status === 'past') {
      where.event = { endDate: { lt: new Date() } }
    }

    const registrations = await prisma.eventRegistration.findMany({
      where,
      include: {
        event: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                city: true,
                sport: { select: { name: true } },
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { event: { startDate: 'asc' } },
    })

    res.json({ success: true, data: registrations })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch registrations' })
  }
}

// ============================================
// OPERATOR ENDPOINTS
// ============================================

/**
 * Get operator's events
 */
const getOperatorEvents = async (req, res) => {
  try {
    const operatorId = req.user.id
    const { venueId, status } = req.query

    // First get operator's venue IDs
    const venues = await prisma.venue.findMany({
      where: { operatorId },
      select: { id: true },
    })

    const venueIds = venues.map((v) => v.id)

    if (venueIds.length === 0) {
      return res.json({ success: true, data: [] })
    }

    const where = { venueId: { in: venueIds } }

    if (venueId) {
      where.venueId = venueId
    }

    if (status === 'upcoming') {
      where.startDate = { gte: new Date() }
    } else if (status === 'past') {
      where.endDate = { lt: new Date() }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        venue: {
          select: { id: true, name: true, sport: { select: { name: true } } },
        },
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: 'desc' },
    })

    const formattedEvents = events.map((event) => ({
      ...event,
      registrationCount: event._count.registrations,
      _count: undefined,
    }))

    res.json({ success: true, data: formattedEvents })
  } catch (error) {
    console.error('Error fetching operator events:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch events' })
  }
}

/**
 * Create a new event
 */
const createEvent = async (req, res) => {
  try {
    const operatorId = req.user.id
    // Validated fields from DTO
    const {
      venueId,
      title,
      eventType,
      startDate,
      endDate,
      registrationFee,
      maxParticipants,
      description,
    } = req.dto
    // Unvalidated fields from body
    const { startTime, endTime, imageUrl, isFeatured = false, slots } = req.body

    // Verify operator owns the venue
    const venue = await prisma.venue.findFirst({
      where: { id: venueId, operatorId },
    })

    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create events for this venue',
      })
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before or equal to end date',
      })
    }

    // Unvalidated optional fields
    const { registrationDeadline } = req.body

    // Validate registration deadline if provided
    if (registrationDeadline) {
      const deadline = new Date(registrationDeadline)

      // Create event start datetime
      let eventStartDateTime
      if (slots && Array.isArray(slots) && slots.length > 0) {
        const sortedSlots = [...slots].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return a.startTime.localeCompare(b.startTime)
        })
        eventStartDateTime = new Date(`${sortedSlots[0].date}T${sortedSlots[0].startTime}`)
      } else if (startTime) {
        // startTime is stored as "HH:mm" format if passed as string
        eventStartDateTime = new Date(`${startDate}T${startTime}`)
      } else {
        // If no specific time, use midnight of start date
        eventStartDateTime = new Date(`${startDate}T00:00:00`)
      }

      if (deadline < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline cannot be in the past',
        })
      }

      if (deadline >= eventStartDateTime) {
        return res.status(400).json({
          success: false,
          message:
            'Registration deadline must be before the event start date and time',
        })
      }
    }

    const event = await prisma.event.create({
      data: {
        venueId,
        title,
        description,
        eventType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: startTime
          ? new Date(`1970-01-01T${startTime}:00.000Z`)
          : null,
        endTime: endTime ? new Date(`1970-01-01T${endTime}:00.000Z`) : null,
        slots: slots ? slots : null,
        registrationFee: parseFloat(registrationFee) || 0,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        imageUrl,
        isFeatured,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline)
          : null,
      },
      include: {
        venue: { select: { name: true, sport: { select: { name: true } } } },
      },
    })

    res.status(201).json({ success: true, data: event })
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({ success: false, message: 'Failed to create event' })
  }
}

/**
 * Update an event
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params
    const operatorId = req.user.id
    // Validated fields from DTO (all optional for update)
    const {
      title,
      eventType,
      startDate,
      endDate,
      registrationFee,
      maxParticipants,
    } = req.dto
    // Unvalidated fields from body
    const {
      description,
      startTime,
      endTime,
      imageUrl,
      isFeatured,
      registrationDeadline,
      slots,
    } = req.body

    // Check if event exists and operator owns it
    const event = await prisma.event.findUnique({
      where: { id },
      include: { venue: { select: { operatorId: true } } },
    })

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    if (event.venue.operatorId !== operatorId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this event',
      })
    }

    // Validate registration deadline if provided
    if (registrationDeadline !== undefined && registrationDeadline) {
      const deadline = new Date(registrationDeadline)

      // Determine the event start datetime (use new values if provided, else use existing)
      const eventStartDate = startDate || event.startDate
      const eventStartTime =
        startTime !== undefined
          ? startTime
          : event.startTime
            ? `${String(event.startTime.getHours()).padStart(2, '0')}:${String(event.startTime.getMinutes()).padStart(2, '0')}`
            : '00:00'

      // Create event start datetime
      let eventStartDateTime
      const effectiveSlots = slots !== undefined ? slots : event.slots
      if (effectiveSlots && Array.isArray(effectiveSlots) && effectiveSlots.length > 0) {
        const sortedSlots = [...effectiveSlots].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return a.startTime.localeCompare(b.startTime)
        })
        eventStartDateTime = new Date(`${sortedSlots[0].date}T${sortedSlots[0].startTime}`)
      } else if (eventStartTime) {
        eventStartDateTime = new Date(`${eventStartDate}T${eventStartTime}`)
      } else {
        eventStartDateTime = new Date(`${eventStartDate}T00:00:00`)
      }

      if (deadline < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline cannot be in the past',
        })
      }

      if (deadline >= eventStartDateTime) {
        return res.status(400).json({
          success: false,
          message:
            'Registration deadline must be before the event start date and time',
        })
      }
    }

    const updateData = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (eventType) updateData.eventType = eventType
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (startTime !== undefined)
      updateData.startTime = startTime
        ? new Date(`1970-01-01T${startTime}:00.000Z`)
        : null
    if (endTime !== undefined)
      updateData.endTime = endTime
        ? new Date(`1970-01-01T${endTime}:00.000Z`)
        : null
    if (registrationFee !== undefined)
      updateData.registrationFee = parseFloat(registrationFee)
    if (maxParticipants !== undefined)
      updateData.maxParticipants = maxParticipants
        ? parseInt(maxParticipants)
        : null
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (registrationDeadline !== undefined)
      updateData.registrationDeadline = registrationDeadline
        ? new Date(registrationDeadline)
        : null
    if (slots !== undefined) updateData.slots = slots

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        venue: { select: { name: true, sport: { select: { name: true } } } },
      },
    })

    res.json({ success: true, data: updatedEvent })
  } catch (error) {
    console.error('Error updating event:', error)
    res.status(500).json({ success: false, message: 'Failed to update event' })
  }
}

/**
 * Delete an event
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params
    const operatorId = req.user.id

    // Check if event exists and operator owns it
    const event = await prisma.event.findUnique({
      where: { id },
      include: { venue: { select: { operatorId: true } } },
    })

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    if (event.venue.operatorId !== operatorId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this event',
      })
    }

    await prisma.event.delete({ where: { id } })

    res.json({ success: true, message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ success: false, message: 'Failed to delete event' })
  }
}

/**
 * Get registrations for an event (operator only)
 */
const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params
    const operatorId = req.user.id

    // Check if event exists and operator owns it
    const event = await prisma.event.findUnique({
      where: { id },
      include: { venue: { select: { operatorId: true, name: true } } },
    })

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    if (event.venue.operatorId !== operatorId) {
      return res.status(403).json({
        success: false,
        message:
          'You do not have permission to view registrations for this event',
      })
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    })

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          venue: event.venue.name,
          startDate: event.startDate,
          endDate: event.endDate,
          maxParticipants: event.maxParticipants,
        },
        registrations,
        totalRegistrations: registrations.length,
      },
    })
  } catch (error) {
    console.error('Error fetching event registrations:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch registrations' })
  }
}

module.exports = {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getOperatorEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
}
