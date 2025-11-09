// [file name]: rulesController.js
const { db } = require('../config/firebase');
const { successResponse, errorResponse } = require('../utils/helpers');

// Set platform rules and regulations
const setPlatformRules = async (req, res) => {
  try {
    const { uid } = req.user;
    const { rules } = req.body;

    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json(errorResponse('Rules must be provided as an array'));
    }

    const rulesData = {
      rules: rules,
      setBy: uid,
      setAt: new Date(),
      isActive: true
    };

    await db.collection('platform_rules').doc('current').set(rulesData);

    res.json(successResponse(null, 'Platform rules updated successfully'));
  } catch (error) {
    console.error('Set rules error:', error);
    res.status(500).json(errorResponse('Failed to set platform rules', error.message));
  }
};

// Get platform rules
const getPlatformRules = async (req, res) => {
  try {
    const rulesDoc = await db.collection('platform_rules').doc('current').get();
    
    if (!rulesDoc.exists) {
      return res.json(successResponse({ rules: [] }, 'No rules set yet'));
    }

    res.json(successResponse({ rules: rulesDoc.data() }, 'Rules retrieved successfully'));
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json(errorResponse('Failed to get platform rules', error.message));
  }
};

// Warn user for rule violation
const warnUser = async (req, res) => {
  try {
    const { uid: adminId } = req.user;
    const { userId } = req.params;
    const { reason, ruleViolated } = req.body;

    if (!reason || !ruleViolated) {
      return res.status(400).json(errorResponse('Reason and rule violated are required'));
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const user = userDoc.data();
    const currentWarnings = user.warnings || [];

    const warning = {
      id: Date.now().toString(),
      reason,
      ruleViolated,
      warnedBy: adminId,
      warnedAt: new Date(),
      severity: 'warning'
    };

    currentWarnings.push(warning);

    // Update user with new warning
    await db.collection('users').doc(userId).update({
      warnings: currentWarnings,
      warningCount: currentWarnings.length,
      updatedAt: new Date()
    });

    // Create notification for user
    const { createNotification } = require('../utils/notifications');
    await createNotification(
      userId,
      'rule_violation',
      '⚠️ Rule Violation Warning',
      `You have received a warning for violating platform rules: ${reason}. This is warning ${currentWarnings.length} of 3.`,
      { warning, ruleViolated }
    );

    // Auto-suspend on 3rd warning
    if (currentWarnings.length >= 3) {
      await db.collection('users').doc(userId).update({
        status: 'suspended',
        suspendedAt: new Date(),
        suspensionReason: 'Multiple rule violations'
      });

      await createNotification(
        userId,
        'account_suspended',
        '🚫 Account Suspended',
        'Your account has been suspended due to multiple rule violations.',
        { reason: 'Multiple rule violations' }
      );
    }

    res.json(successResponse(
      { warning, totalWarnings: currentWarnings.length },
      `User warned successfully. This is warning ${currentWarnings.length} of 3.`
    ));

  } catch (error) {
    console.error('Warn user error:', error);
    res.status(500).json(errorResponse('Failed to warn user', error.message));
  }
};

// Delete user immediately
const deleteUser = async (req, res) => {
  try {
    const { uid: adminId } = req.user;
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json(errorResponse('Deletion reason is required'));
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const user = userDoc.data();

    // Record deletion
    await db.collection('deleted_users').doc(userId).set({
      ...user,
      deletedBy: adminId,
      deletedAt: new Date(),
      deletionReason: reason,
      originalData: user
    });

    // Delete user
    await db.collection('users').doc(userId).delete();

    // Delete role-specific data
    if (user.role === 'institute') {
      await db.collection('institutions').doc(userId).delete();
      // Also delete all courses and applications for this institute
      const coursesSnapshot = await db.collection('courses').where('instituteId', '==', userId).get();
      const batch = db.batch();
      coursesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } else if (user.role === 'company') {
      await db.collection('companies').doc(userId).delete();
      // Delete company jobs
      const jobsSnapshot = await db.collection('jobs').where('companyId', '==', userId).get();
      const batch = db.batch();
      jobsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    res.json(successResponse(null, 'User deleted successfully'));

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(errorResponse('Failed to delete user', error.message));
  }
};

// Get user warnings
const getUserWarnings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const user = userDoc.data();
    
    res.json(successResponse(
      { 
        warnings: user.warnings || [],
        warningCount: user.warningCount || 0,
        userStatus: user.status
      },
      'User warnings retrieved successfully'
    ));

  } catch (error) {
    console.error('Get user warnings error:', error);
    res.status(500).json(errorResponse('Failed to get user warnings', error.message));
  }
};

module.exports = {
  setPlatformRules,
  getPlatformRules,
  warnUser,
  deleteUser,
  getUserWarnings
};