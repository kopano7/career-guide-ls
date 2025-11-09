const express = require('express');
const { 
  startRegistration,
  completeRegistration,
  loginUser, 
  getUserProfile, 
  updateProfile,
  requestPasswordReset,
  resetPassword,
  getUserStats,
  verifyEmail,
  setPassword,
  resendVerificationCode
} = require('../controllers/authController');

// ✅ IMPORT FROM MIDDLEWARE - NOT FROM AUTH CONTROLLER
const { verifyToken, debugMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register/start', startRegistration);
router.post('/register/complete', completeRegistration);
router.post('/register/resend-code', resendVerificationCode);
router.post('/login', loginUser);
router.post('/password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/set-password', setPassword);

// ✅ PROTECTED ROUTES - USE JWT-COMPATIBLE MIDDLEWARE
router.get('/profile', debugMiddleware, verifyToken, getUserProfile);
router.put('/profile', debugMiddleware, verifyToken, updateProfile);
router.get('/stats', debugMiddleware, verifyToken, getUserStats);

// ✅ ADD DEBUG ROUTE
router.get('/debug-token', debugMiddleware, verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'JWT token working in auth routes!',
    user: req.user
  });
});

module.exports = router;