const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

/**
 * Admin Routes
 * All routes require admin authentication
 */

// Apply auth and isAdmin middleware to all routes
router.use(auth, isAdmin);

// ============================================
// DASHBOARD
// ============================================

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', adminController.getAdminDashboard);

// ============================================
// VENUE MANAGEMENT
// ============================================

// GET /api/admin/venues/pending - Get pending venues for approval
router.get('/venues/pending', adminController.getPendingVenues);

// GET /api/admin/venues - Get all venues with filters
router.get('/venues', adminController.getAllVenues);

// GET /api/admin/venues/:id - Get venue details for review
router.get('/venues/:id', adminController.getVenueForReview);

// PUT /api/admin/venues/:id/approve - Approve venue
router.put('/venues/:id/approve', adminController.approveVenue);

// PUT /api/admin/venues/:id/reject - Reject venue
router.put('/venues/:id/reject', adminController.rejectVenue);

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users - Get all users
router.get('/users', adminController.getAllUsers);

// PUT /api/admin/users/:id - Update user (role, verification status)
router.put('/users/:id', adminController.updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
