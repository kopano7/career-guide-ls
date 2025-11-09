const { body, validationResult, param } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
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

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['student', 'institute', 'company', 'admin'])
    .withMessage('Role must be student, institute, company, or admin'),
  
  body('name')
    .optional()
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
  
  handleValidationErrors
];

// Course creation validation
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
  
  body('requirements')
    .optional()
    .isObject()
    .withMessage('Requirements must be an object'),
  
  handleValidationErrors
];

// Job posting validation
const validateJob = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('requirements')
    .isArray({ min: 1 })
    .withMessage('Requirements must be an array with at least one item'),
  
  body('qualifications')
    .isArray({ min: 1 })
    .withMessage('Qualifications must be an array with at least one item'),
  
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

// Application status validation
const validateApplicationStatus = [
  body('status')
    .isIn(['pending', 'admitted', 'rejected', 'waiting_list'])
    .withMessage('Status must be pending, admitted, rejected, or waiting_list'),
  
  handleValidationErrors
];

// User status validation
const validateUserStatus = [
  body('status')
    .isIn(['pending', 'approved', 'suspended', 'active'])
    .withMessage('Status must be pending, approved, suspended, or active'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID parameter is required'),
  
  handleValidationErrors
];

// Transcript upload validation
const validateTranscript = [
  body('fileUrl')
    .isURL()
    .withMessage('File URL must be a valid URL'),
  
  handleValidationErrors
];

// Course application validation
const validateCourseApplication = [
  body('courseId')
    .isLength({ min: 1 })
    .withMessage('Course ID is required'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateCourse,
  validateJob,
  validateApplicationStatus,
  validateUserStatus,
  validateId,
  validateTranscript,
  validateCourseApplication,
  handleValidationErrors
};