const { auth, db } = require('../config/firebase');

// Generate random ID
const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date to readable string
const formatDate = (date, includeTime = true) => {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('en-US', options);
};

// Calculate time ago
const timeAgo = (date) => {
  if (!date) return 'Unknown';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - dateObj) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Generate random color for avatars
const generateRandomColor = () => {
  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if user has permission for action
const checkPermission = (user, requiredRole, resourceOwnerId = null) => {
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check role match
  if (user.role !== requiredRole) return false;
  
  // Check resource ownership if provided
  if (resourceOwnerId && user.uid !== resourceOwnerId) return false;
  
  return true;
};

// Calculate GPA from grades
const calculateGPA = (grades) => {
  if (!grades || typeof grades !== 'object') return null;
  
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  
  let totalPoints = 0;
  let totalSubjects = 0;
  
  for (const [subject, grade] of Object.entries(grades)) {
    const points = gradePoints[grade.toUpperCase()];
    if (points !== undefined) {
      totalPoints += points;
      totalSubjects++;
    }
  }
  
  return totalSubjects > 0 ? parseFloat((totalPoints / totalSubjects).toFixed(2)) : null;
};

// Generate pagination metadata
const generatePagination = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    totalCount,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null,
  };
};

// Error response formatter
const errorResponse = (message, details = null, statusCode = 400) => {
  return {
    success: false,
    error: {
      message,
      details,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };
};

// Success response formatter
const successResponse = (data, message = 'Success', pagination = null) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Rate limiting helper (simple in-memory version)
const createRateLimiter = (maxRequests, windowMs) => {
  const requests = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false; // Rate limited
    }
    
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    return true; // Allowed
  };
};

module.exports = {
  generateId,
  formatDate,
  timeAgo,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  generateRandomColor,
  formatFileSize,
  checkPermission,
  calculateGPA,
  generatePagination,
  errorResponse,
  successResponse,
  asyncHandler,
  createRateLimiter,
};