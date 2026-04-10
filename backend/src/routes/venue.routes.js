const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venue.controller');
const { auth } = require('../middleware/auth');
const { isOperator } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createVenueRules, updateVenueRules } = require('../validators/venue.validator');

/**
 * Venue Routes
 * Public and operator-protected endpoints for venue management
 * 
 * IMPORTANT: Operator routes MUST come BEFORE generic /:id routes
 * to prevent Express from matching the wrong route
 */

// ============================================
// OPERATOR ROUTES (Protected) - MUST BE FIRST
// ============================================

// GET /api/venues/operator/dashboard - Get operator dashboard stats
router.get('/operator/dashboard', auth, isOperator, venueController.getOperatorDashboard);

// GET /api/venues/operator/analytics - Get operator analytics
router.get('/operator/analytics', auth, isOperator, venueController.getOperatorAnalytics);

// GET /api/venues/operator/my-venues - Get operator's own venues
router.get('/operator/my-venues', auth, isOperator, venueController.getOperatorVenues);

// POST /api/venues/operator/my-venues - Create new venue
router.post('/operator/my-venues', auth, isOperator, createVenueRules, validate, venueController.createVenue);

// GET /api/venues/operator/my-venues/:id - Get operator's venue by ID
router.get('/operator/my-venues/:id', auth, isOperator, venueController.getOperatorVenueById);

// PUT /api/venues/operator/my-venues/:id - Update venue
router.put('/operator/my-venues/:id', auth, isOperator, updateVenueRules, validate, venueController.updateVenue);

// DELETE /api/venues/operator/my-venues/:id - Deactivate venue (soft delete)
router.delete('/operator/my-venues/:id', auth, isOperator, venueController.deleteVenue);

// DELETE /api/venues/operator/my-venues/:id/permanent - Permanently delete venue (hard delete)
router.delete('/operator/my-venues/:id/permanent', auth, isOperator, venueController.permanentDeleteVenue);

// POST /api/venues/operator/my-venues/:id/images - Upload images to venue (with multer)
router.post('/operator/my-venues/:id/images', auth, isOperator, upload.array('images', 10), venueController.addVenueImages);

// DELETE /api/venues/operator/my-venues/:venueId/images/:imageId - Delete venue image
router.delete('/operator/my-venues/:venueId/images/:imageId', auth, isOperator, venueController.deleteVenueImage);

// PUT /api/venues/operator/my-venues/:id/hours - Update operating hours
router.put('/operator/my-venues/:id/hours', auth, isOperator, venueController.updateOperatingHours);

// ============================================
// PUBLIC ROUTES - Must come AFTER operator routes
// ============================================

// GET /api/venues/public-stats - Get platform stats for landing page (no auth)
router.get('/public-stats', venueController.getPublicStats);

// GET /api/venues/cities - Get distinct city list for search dropdown (no auth)
router.get('/cities', venueController.getCities);

// GET /api/venues - Get all approved venues with filters
router.get('/', venueController.getVenues);

// GET /api/venues/:id - Get venue details by ID (LAST to avoid catching /operator/*)
router.get('/:id', venueController.getVenueById);

module.exports = router;
