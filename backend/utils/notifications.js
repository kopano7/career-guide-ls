// [file name]: notifications.js (Updated - Remove the problematic router function)
const { db } = require('../config/firebase');
const { successResponse, errorResponse } = require('./helpers');

// Notification types
const NOTIFICATION_TYPES = {
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  JOB_POSTED: 'job_posted',
  JOB_MATCH: 'job_match',
  ACCOUNT_APPROVED: 'account_approved',
  ACCOUNT_SUSPENDED: 'account_suspended',
  NEW_COURSE: 'new_course',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  ADMISSION_OFFER: 'admission_offer',
  TRANSCRIPT_VERIFIED: 'transcript_verified',
  RULE_VIOLATION: 'rule_violation'
};

// Create a notification
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = {
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    };

    const notificationRef = await db.collection('notifications').add(notification);
    
    console.log(`Notification created for user ${userId}: ${type}`);
    return { id: notificationRef.id, ...notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get user notifications
const getUserNotifications = async (userId, limit = 20, unreadOnly = false) => {
  try {
    let query = db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  try {
    await db.collection('notifications').doc(notificationId).update({
      read: true,
      readAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all user notifications as read
const markAllAsRead = async (userId) => {
  try {
    const unreadNotifications = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    unreadNotifications.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date(),
      });
    });

    await batch.commit();
    console.log(`Marked all notifications as read for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread notification count
const getUnreadCount = async (userId) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

// Specific notification creators
const notificationCreators = {
  // Application submitted
  applicationSubmitted: async (studentId, applicationId, courseName, instituteName) => {
    return await createNotification(
      studentId,
      NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
      'Application Submitted',
      `Your application for ${courseName} at ${instituteName} has been submitted successfully.`,
      { applicationId, courseName, instituteName, actionUrl: `/applications` }
    );
  },

  // Application status changed
  applicationStatusChanged: async (studentId, applicationId, courseName, newStatus, notes = '') => {
    const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    const emoji = newStatus === 'admitted' ? '' : newStatus === 'rejected' ? '' : '';
    
    return await createNotification(
      studentId,
      NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGED,
      `Application ${statusText} ${emoji}`,
      `Your application for ${courseName} has been ${newStatus}.${notes ? ` Notes: ${notes}` : ''}`,
      { 
        applicationId, 
        courseName, 
        status: newStatus, 
        notes,
        actionUrl: `/applications`
      }
    );
  },

  // Admission offer (special case for admitted status)
  admissionOffer: async (studentId, applicationId, courseName, instituteName, deadline) => {
    return await createNotification(
      studentId,
      NOTIFICATION_TYPES.ADMISSION_OFFER,
      'Admission Offer!',
      `Congratulations! You've been admitted to ${courseName} at ${instituteName}. You have until ${deadline} to accept.`,
      { 
        applicationId, 
        courseName, 
        instituteName,
        deadline,
        actionUrl: `/admissions` 
      }
    );
  },

  // Job match notification
  jobMatch: async (studentId, jobId, jobTitle, companyName) => {
    return await createNotification(
      studentId,
      NOTIFICATION_TYPES.JOB_MATCH,
      'New Job Match!',
      `A new job "${jobTitle}" at ${companyName} matches your profile.`,
      { jobId, jobTitle, companyName, actionUrl: `/jobs/${jobId}` }
    );
  },

  // Account approved
  accountApproved: async (userId, userRole, userName) => {
    return await createNotification(
      userId,
      NOTIFICATION_TYPES.ACCOUNT_APPROVED,
      'Account Approved!',
      `Your ${userRole} account has been approved. You can now access all features.`,
      { userRole, userName, actionUrl: `/dashboard` }
    );
  },

  // New course available
  newCourseAvailable: async (studentId, courseId, courseName, instituteName) => {
    return await createNotification(
      studentId,
      NOTIFICATION_TYPES.NEW_COURSE,
      'New Course Available',
      `A new course "${courseName}" is available at ${instituteName}.`,
      { courseId, courseName, instituteName, actionUrl: `/courses` }
    );
  },

  // Transcript verified
  transcriptVerified: async (studentId, transcriptId) => {
    return await createNotification(
      studentId,
      NOTIFICATION_TYPES.TRANSCRIPT_VERIFIED,
      'Transcript Verified',
      'Your academic transcript has been verified and is now available for job applications.',
      { transcriptId, actionUrl: `/profile` }
    );
  },

  // System announcement
  systemAnnouncement: async (userId, title, message) => {
    return await createNotification(
      userId,
      NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
      title,
      message,
      { isSystem: true }
    );
  },

  // Rule violation warning
  ruleViolation: async (userId, reason, warningCount) => {
    return await createNotification(
      userId,
      NOTIFICATION_TYPES.RULE_VIOLATION,
      'Rule Violation Warning',
      `You have received a warning for violating platform rules: ${reason}. This is warning ${warningCount} of 3.`,
      { reason, warningCount, actionUrl: `/profile` }
    );
  },

  // Account suspended
  accountSuspended: async (userId, reason) => {
    return await createNotification(
      userId,
      NOTIFICATION_TYPES.ACCOUNT_SUSPENDED,
      'Account Suspended',
      `Your account has been suspended. Reason: ${reason}`,
      { reason, actionUrl: `/support` }
    );
  }
};

// Clean up old notifications (older than 30 days)
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldNotifications = await db.collection('notifications')
      .where('createdAt', '<', cutoffDate)
      .get();

    const batch = db.batch();
    oldNotifications.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldNotifications.size} old notifications`);
    return oldNotifications.size;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

// Remove the problematic notificationRoutes function entirely
// We'll handle notification routes separately

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  cleanupOldNotifications,
  NOTIFICATION_TYPES,
  ...notificationCreators,
};