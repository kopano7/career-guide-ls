// [file name]: notificationRoutes.js (Simplified Version)
const express = require('express');
const { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} = require('../utils/notifications');
const { verifyFirebaseToken } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

// Get user notifications
router.get('/notifications', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { limit = 20, unreadOnly = false } = req.query;

    const notifications = await getUserNotifications(uid, parseInt(limit), unreadOnly === 'true');
    
    res.json(successResponse(
      { notifications },
      'Notifications retrieved successfully'
    ));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json(errorResponse('Failed to get notifications', error.message));
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    await markAsRead(id);
    
    res.json(successResponse(null, 'Notification marked as read'));
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json(errorResponse('Failed to mark notification as read', error.message));
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    await markAllAsRead(uid);
    
    res.json(successResponse(null, 'All notifications marked as read'));
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json(errorResponse('Failed to mark all notifications as read', error.message));
  }
});

// Get unread count
router.get('/notifications/unread-count', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const count = await getUnreadCount(uid);
    
    res.json(successResponse({ count }, 'Unread count retrieved'));
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json(errorResponse('Failed to get unread count', error.message));
  }
});

module.exports = router;