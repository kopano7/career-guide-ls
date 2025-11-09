const { db } = require('../config/firebase');

// Check if user has specific role(s)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Convert single role to array for uniform handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}, Your role: ${userRole}`
      });
    }
    
    next();
  };
};

// Check if user is active (not suspended)
const requireActiveUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (userData.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact administrator.'
      });
    }

    if ((userData.role === 'institute' || userData.role === 'company') && 
        userData.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        message: 'Your account is pending admin approval. You cannot perform this action.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if user owns the resource (for institutes/companies)
const requireResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const resourceId = req.params.id || req.params.courseId || req.params.jobId;
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }

      const resourceDoc = await db.collection(resourceType).doc(resourceId).get();
      
      if (!resourceDoc.exists) {
        return res.status(404).json({ error: `${resourceType} not found` });
      }

      const resource = resourceDoc.data();
      
      // Check ownership
      if (resource.instituteId !== req.user.uid && resource.companyId !== req.user.uid) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not own this resource'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// Check if student can apply (not already admitted elsewhere)
const checkStudentAdmissionStatus = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return next(); // Only apply to students
    }

    // Check if student is already admitted to any institution
    const admittedApplications = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .where('status', '==', 'admitted')
      .get();

    if (!admittedApplications.empty) {
      return res.status(400).json({ 
        error: 'Already admitted',
        message: 'You have already been admitted to an institution and cannot apply for more courses.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check application limits per institution
const checkApplicationLimit = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return next();
    }

    const { courseId } = req.body;
    
    if (!courseId) {
      return next();
    }

    // Get course to find institute
    const courseDoc = await db.collection('courses').doc(courseId).get();
    
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseDoc.data();
    const instituteId = course.instituteId;

    // Count existing applications to this institute
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .where('instituteId', '==', instituteId)
      .get();

    if (existingApplications.size >= 2) {
      return res.status(400).json({ 
        error: 'Application limit reached',
        message: 'You can only apply to a maximum of 2 courses per institution.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin-only middleware with additional checks
const requireAdmin = [
  requireRole('admin'),
  requireActiveUser
];

// Institute-only middleware
const requireInstitute = [
  requireRole('institute'),
  requireActiveUser
];

// Company-only middleware
const requireCompany = [
  requireRole('company'),
  requireActiveUser
];

// Student-only middleware
const requireStudent = [
  requireRole('student'),
  requireActiveUser
];

module.exports = {
  requireRole,
  requireActiveUser,
  requireResourceOwnership,
  checkStudentAdmissionStatus,
  checkApplicationLimit,
  requireAdmin,
  requireInstitute,
  requireCompany,
  requireStudent
};