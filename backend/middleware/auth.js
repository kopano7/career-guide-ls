// [file name]: auth.js - UPDATED WITH JWT SUPPORT
const { auth, db } = require('../config/firebase');
const jwt = require('jsonwebtoken'); // Add JWT support
const { body, validationResult, param } = require('express-validator');

// Enhanced token verification that handles JWT, Firebase, and mock tokens
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔐 Token verification debug:');
    console.log('   Token type:', token.startsWith('eyJ') ? 'JWT' : token.startsWith('mock-token-') ? 'Mock' : 'Firebase');
    console.log('   Token preview:', token.substring(0, 20) + '...');

    // Handle JWT tokens (from your authController)
    if (token.startsWith('eyJ') && token.split('.').length === 3) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
        console.log('✅ JWT token verified for user:', decoded.userId);
        
        // Get user data from correct collection
        let user = null;
        let collection = decoded.collection || 'users';
        
        if (collection === 'admins') {
          const adminDoc = await db.collection('admins').doc(decoded.userId).get();
          if (adminDoc.exists) {
            user = { id: adminDoc.id, ...adminDoc.data() };
          }
        } else {
          const userDoc = await db.collection('users').doc(decoded.userId).get();
          if (userDoc.exists) {
            user = { id: userDoc.id, ...userDoc.data() };
          }
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        req.user = { 
          uid: decoded.userId,
          collection: collection,
          role: user.role,
          ...user
        };
        
        return next();
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError.message);
        return res.status(401).json({ error: 'Invalid JWT token' });
      }
    }
    
    // Handle mock tokens (your current system)
    else if (token.startsWith('mock-token-')) {
      const parts = token.split('-');
      const userId = parts[2];
      
      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      let user = null;
      let collection = 'users';

      // First check admins collection
      const adminDoc = await db.collection('admins').doc(userId).get();
      if (adminDoc.exists) {
        user = { id: adminDoc.id, ...adminDoc.data() };
        collection = 'admins';
      } else {
        // Check users collection
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found' });
        }
        user = { id: userDoc.id, ...userDoc.data() };
      }
      
      req.user = { 
        uid: userId,
        collection: collection,
        role: user.role,
        ...user
      };
      return next();
    } 
    
    // Handle Firebase tokens
    else {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        req.user = { 
          uid: decodedToken.uid, 
          collection: 'users',
          role: userData.role,
          ...userData 
        };
        return next();
      } catch (firebaseError) {
        console.error('❌ Firebase token verification failed:', firebaseError.message);
        return res.status(401).json({ error: 'Invalid Firebase token' });
      }
    }

  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Token verification failed' });
  }
};

// Enhanced Firebase token verification (backward compatibility)
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // For mock tokens (your current system)
    if (token.startsWith('mock-token-')) {
      const parts = token.split('-');
      const userId = parts[2];
      
      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      let user = null;
      let collection = 'users';

      // First check admins collection
      const adminDoc = await db.collection('admins').doc(userId).get();
      if (adminDoc.exists) {
        user = { id: adminDoc.id, ...adminDoc.data() };
        collection = 'admins';
      } else {
        // Check users collection
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found' });
        }
        user = { id: userDoc.id, ...userDoc.data() };
      }
      
      req.user = { 
        uid: userId,
        collection: collection,
        role: user.role
      };
      req.userData = user;
      return next();
    } else {
      // For real Firebase tokens
      try {
        const decodedToken = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found' });
        }

        req.user = { uid: decodedToken.uid, ...userDoc.data() };
        return next();
      } catch (firebaseError) {
        return res.status(401).json({ error: 'Invalid Firebase token' });
      }
    }
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Enhanced role requirement with better error handling
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Allow multiple roles as array or single role as string
    const allowedRoles = Array.isArray(role) ? role : [role];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}, Your role: ${userRole}`
      });
    }
    
    next();
  };
};

// Enhanced active user check that handles both collections
const requireActiveUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let userDoc;
    
    // Check the correct collection based on user data
    if (req.user.collection === 'admins') {
      userDoc = await db.collection('admins').doc(req.user.uid).get();
    } else {
      userDoc = await db.collection('users').doc(req.user.uid).get();
    }
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Update req.user with latest data
    req.user = { ...req.user, ...userData };
    
    if (userData.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact administrator.'
      });
    }

    // Check if institute/company is approved (only for regular users)
    if (req.user.collection === 'users' && 
        (userData.role === 'institute' || userData.role === 'company') && 
        userData.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        message: 'Your account is pending admin approval. You cannot perform this action.'
      });
    }

    next();
  } catch (error) {
    console.error('Active user check error:', error);
    res.status(500).json({ error: 'Failed to verify user status' });
  }
};

// Enhanced resource ownership with better debugging
const requireResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const resourceId = req.params.id || req.params.courseId || req.params.jobId || req.params.applicationId;
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }

      console.log(`🔍 Checking ownership for ${resourceType}: ${resourceId}, User: ${req.user.uid}`);

      const resourceDoc = await db.collection(resourceType).doc(resourceId).get();
      
      if (!resourceDoc.exists) {
        return res.status(404).json({ error: `${resourceType} not found` });
      }

      const resource = resourceDoc.data();
      
      // Check ownership based on resource type
      let isOwner = false;
      switch (resourceType) {
        case 'courses':
        case 'applications':
          isOwner = resource.instituteId === req.user.uid;
          break;
        case 'jobs':
          isOwner = resource.companyId === req.user.uid;
          break;
        case 'users':
          isOwner = resource.uid === req.user.uid || resource.id === req.user.uid;
          break;
        default:
          isOwner = resource.userId === req.user.uid || resource.instituteId === req.user.uid || resource.companyId === req.user.uid;
      }

      // Admins can access everything
      if (req.user.role === 'admin' || req.user.collection === 'admins') {
        console.log('✅ Admin access granted');
        return next();
      }

      if (!isOwner) {
        console.log('❌ Ownership check failed:', {
          resourceType,
          resourceId,
          userId: req.user.uid,
          resourceOwner: resource.instituteId || resource.companyId || resource.userId
        });
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have permission to access this resource'
        });
      }

      console.log('✅ Ownership verified');
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({ error: 'Failed to verify resource ownership' });
    }
  };
};

// Enhanced validation middleware with consistent error format
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Enhanced validation rules with better field mapping
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['student', 'institute', 'company'])
    .withMessage('Role must be student, institute, or company'),
  
  body('name')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Name is required for students')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('institutionName')
    .if(body('role').equals('institute'))
    .notEmpty()
    .withMessage('Institution name is required for institutes')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Institution name must be between 2 and 100 characters'),
  
  body('companyName')
    .if(body('role').equals('company'))
    .notEmpty()
    .withMessage('Company name is required for companies')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

const validateCourse = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('duration')
    .isInt({ min: 1, max: 60 })
    .withMessage('Duration must be between 1 and 60 months'),
  
  body('faculty')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Faculty must be between 2 and 50 characters'),
  
  body('seats')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Seats must be between 1 and 1000'),
  
  handleValidationErrors
];

const validateJob = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateId = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID parameter is required'),
  
  handleValidationErrors
];

// Enhanced transcript validation
const validateTranscript = [
  body('fileUrl')
    .optional()
    .isURL()
    .withMessage('File URL must be a valid URL'),
  
  body('grades')
    .optional()
    .isObject()
    .withMessage('Grades must be an object'),
  
  handleValidationErrors
];

// Enhanced business logic middleware
const checkStudentAdmissionStatus = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return next();
    }

    // Check if student is already admitted
    const admittedApplications = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .where('status', '==', 'admitted')
      .get();

    if (!admittedApplications.empty) {
      return res.status(400).json({ 
        success: false,
        error: 'Already admitted',
        message: 'You have already been admitted to an institution.'
      });
    }

    next();
  } catch (error) {
    console.error('Admission status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check admission status' 
    });
  }
};

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
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
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
        success: false,
        error: 'Application limit reached',
        message: 'You can only apply to a maximum of 2 courses per institution.'
      });
    }

    next();
  } catch (error) {
    console.error('Application limit check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check application limit' 
    });
  }
};

// Updated combined middleware using the enhanced verifyToken
const requireAdmin = [
  verifyToken, // Use enhanced verifyToken instead of verifyFirebaseToken
  requireRole('admin'),
  requireActiveUser
];

const requireInstitute = [
  verifyToken, // Use enhanced verifyToken instead of verifyFirebaseToken
  requireRole('institute'),
  requireActiveUser
];

const requireCompany = [
  verifyToken, // Use enhanced verifyToken instead of verifyFirebaseToken
  requireRole('company'),
  requireActiveUser
];

const requireStudent = [
  verifyToken, // Use enhanced verifyToken instead of verifyFirebaseToken
  requireRole('student'),
  requireActiveUser
];

// Debug middleware for development
const debugMiddleware = (req, res, next) => {
  console.log('🔍 Request Debug:', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.authorization,
    user: req.user ? {
      uid: req.user.uid,
      role: req.user.role,
      collection: req.user.collection
    } : 'No user'
  });
  next();
};

module.exports = {
  // Core authentication
  verifyToken,
  verifyFirebaseToken, // Keep for backward compatibility
  requireRole,
  
  // Enhanced security
  requireActiveUser,
  requireResourceOwnership,
  
  // Validation
  validateRegistration,
  validateCourse,
  validateJob,
  validateId,
  validateTranscript,
  handleValidationErrors,
  
  // Business logic
  checkStudentAdmissionStatus,
  checkApplicationLimit,
  
  // Combined middleware
  requireAdmin,
  requireInstitute,
  requireCompany,
  requireStudent,
  
  // Debug
  debugMiddleware
};