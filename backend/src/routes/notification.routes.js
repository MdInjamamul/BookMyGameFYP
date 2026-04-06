const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { auth } = require('../middleware/auth');
const { validateNotificationId } = require('../validators/notification.validator');

/**
 * Notification Routes — all require authentication
 *
 * - GET    /api/notifications           - Get user's notifications (recent 20)
 * - GET    /api/notifications/unread-count - Lightweight count for polling
 * - PUT    /api/notifications/mark-all-read - Mark all as read
 * - PUT    /api/notifications/:id/read  - Mark single notification as read
 * - DELETE /api/notifications/:id       - Delete a notification
 */

// Get notifications list
router.get('/', auth, notificationController.getMyNotifications);

// Get only the unread count (lightweight endpoint for polling)
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Mark ALL as read
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Mark single notification as read
router.put('/:id/read', auth, validateNotificationId, notificationController.markAsRead);

// Delete single notification
router.delete('/:id', auth, validateNotificationId, notificationController.deleteNotification);

module.exports = router;
