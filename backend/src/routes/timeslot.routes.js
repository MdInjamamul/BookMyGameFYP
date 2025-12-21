const express = require('express');
const router = express.Router();
const timeslotController = require('../controllers/timeslot.controller');
const auth = require('../middleware/auth');
const { isOperator } = require('../middleware/roleCheck');

/**
 * TimeSlot Routes
 * Public and operator endpoints for time slot management
 */

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/timeslots/venue/:venueId - Get available time slots for a venue
router.get('/venue/:venueId', timeslotController.getVenueTimeSlots);

// ============================================
// OPERATOR ROUTES (Protected)
// ============================================

// POST /api/timeslots/operator/venue/:venueId - Create time slots
router.post('/operator/venue/:venueId', auth, isOperator, timeslotController.createTimeSlots);

// POST /api/timeslots/operator/venue/:venueId/generate - Auto-generate time slots
router.post('/operator/venue/:venueId/generate', auth, isOperator, timeslotController.generateTimeSlots);

// PUT /api/timeslots/operator/:id - Update time slot
router.put('/operator/:id', auth, isOperator, timeslotController.updateTimeSlot);

// DELETE /api/timeslots/operator/:id - Delete time slot
router.delete('/operator/:id', auth, isOperator, timeslotController.deleteTimeSlot);

// DELETE /api/timeslots/operator/venue/:venueId/bulk - Bulk delete time slots
router.delete('/operator/venue/:venueId/bulk', auth, isOperator, timeslotController.bulkDeleteTimeSlots);

module.exports = router;
