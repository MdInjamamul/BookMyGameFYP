const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const {
    validateIdParam,
    validateVenueRejection,
    validateUserUpdate
} = require('../validators/admin.validator');

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

// GET /api/admin/analytics - Get analytics data
router.get('/analytics', adminController.getAdminAnalytics);

// ============================================
// VENUE MANAGEMENT
// ============================================

// GET /api/admin/venues/pending - Get pending venues for approval
router.get('/venues/pending', adminController.getPendingVenues);

// GET /api/admin/venues - Get all venues with filters
router.get('/venues', adminController.getAllVenues);

// GET /api/admin/venues/:id - Get venue details for review
router.get('/venues/:id', validateIdParam, adminController.getVenueForReview);

// PUT /api/admin/venues/:id/approve - Approve venue
router.put('/venues/:id/approve', validateIdParam, adminController.approveVenue);

// PUT /api/admin/venues/:id/reject - Reject venue
router.put('/venues/:id/reject', validateVenueRejection, adminController.rejectVenue);

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users - Get all users
router.get('/users', adminController.getAllUsers);

// PUT /api/admin/users/:id - Update user (role, verification status)
router.put('/users/:id', validateUserUpdate, adminController.updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', validateIdParam, adminController.deleteUser);

// ============================================
// SELLER REQUEST MANAGEMENT
// ============================================

// GET /api/admin/seller-requests - Get pending seller requests
router.get('/seller-requests', adminController.getSellerRequests);

// PUT /api/admin/seller-requests/:id/approve - Approve seller request
router.put('/seller-requests/:id/approve', validateIdParam, adminController.approveSellerRequest);

// PUT /api/admin/seller-requests/:id/reject - Reject seller request
router.put('/seller-requests/:id/reject', validateIdParam, adminController.rejectSellerRequest);

// ============================================
// VIDEO UPLOADER REQUEST MANAGEMENT
// ============================================

// GET /api/admin/video-uploader-requests - Get pending video uploader requests
router.get('/video-uploader-requests', adminController.getVideoUploaderRequests);

// PUT /api/admin/video-uploader-requests/:id/approve - Approve video uploader request
router.put('/video-uploader-requests/:id/approve', validateIdParam, adminController.approveVideoUploaderRequest);

// PUT /api/admin/video-uploader-requests/:id/reject - Reject video uploader request
router.put('/video-uploader-requests/:id/reject', validateIdParam, adminController.rejectVideoUploaderRequest);

module.exports = router;
