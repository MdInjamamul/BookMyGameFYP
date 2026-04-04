const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/training.controller');
const { auth } = require('../middleware/auth');
const { isAdmin, isOperator } = require('../middleware/roleCheck');
const { videoUpload, upload, trainingMediaUpload } = require('../middleware/upload');

// Combined media upload for training: allows one video and one thumbnail
const trainingMediaUploadFields = trainingMediaUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]);

/**
 * Training Video Routes
 *
 * Public:
 *   GET  /api/training              - List all active videos (filterable)
 *   GET  /api/training/featured     - Top-viewed videos (landing page)
 *   GET  /api/training/:id          - Single video (increments view count)
 *
 * Auth (any logged-in operator):
 *   POST /api/training/request-upload       - Request video upload permission
 *   GET  /api/training/my-uploader-status   - Get current user's upload status
 *
 * Operator (canUploadVideos required):
 *   GET    /api/training/operator/my-videos  - List own videos
 *   POST   /api/training/operator            - Upload a new video (file or URL)
 *   PUT    /api/training/operator/:id        - Update own video
 *   DELETE /api/training/operator/:id        - Delete own video
 *
 * Admin:
 *   GET    /api/training/admin/all   - All videos incl. inactive
 *   POST   /api/training/admin       - Create a new video (file or URL)
 *   PUT    /api/training/admin/:id   - Update any video
 *   DELETE /api/training/admin/:id   - Delete any video
 */

// ============================================
// MIDDLEWARE: gate for operators with upload permission
// ============================================
const requireUploadPermission = (req, res, next) => {
    if (!req.user.canUploadVideos) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to upload videos. Please request access first.'
        });
    }
    next();
};

// ============================================
// PUBLIC ROUTES
// ============================================

router.get('/', trainingController.getAllVideos);
router.get('/featured', trainingController.getFeaturedVideos);

// ============================================
// AUTH ROUTES (operator: request access)
// ============================================

router.post('/request-upload', auth, isOperator, trainingController.requestVideoUploaderAccess);
router.get('/my-uploader-status', auth, trainingController.getMyUploaderStatus);

// ============================================
// OPERATOR ROUTES (upload permission required)
// ============================================

router.get('/operator/my-videos', auth, isOperator, requireUploadPermission, trainingController.operatorGetMyVideos);
router.post('/operator', auth, isOperator, requireUploadPermission, trainingMediaUploadFields, trainingController.operatorCreateVideo);
router.put('/operator/:id', auth, isOperator, requireUploadPermission, trainingMediaUploadFields, trainingController.operatorUpdateVideo);
router.delete('/operator/:id', auth, isOperator, requireUploadPermission, trainingController.operatorDeleteVideo);

// ============================================
// ADMIN ROUTES
// ============================================

router.get('/admin/all', auth, isAdmin, trainingController.adminGetAllVideos);
router.post('/admin', auth, isAdmin, trainingMediaUploadFields, trainingController.createVideo);
router.put('/admin/:id', auth, isAdmin, trainingMediaUploadFields, trainingController.updateVideo);
router.delete('/admin/:id', auth, isAdmin, trainingController.deleteVideo);

// ============================================
// SINGLE VIDEO (must come after named routes)
// ============================================

router.get('/:id', trainingController.getVideoById);

module.exports = router;
