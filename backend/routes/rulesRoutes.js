// [file name]: rulesRoutes.js
const express = require('express');
const { 
  setPlatformRules, 
  getPlatformRules, 
  warnUser, 
  deleteUser, 
  getUserWarnings 
} = require('../controllers/rulesController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin only routes
router.use(verifyFirebaseToken);
router.use(requireRole('admin'));

router.post('/rules', setPlatformRules);
router.get('/rules', getPlatformRules);
router.post('/users/:userId/warn', warnUser);
router.delete('/users/:userId', deleteUser);
router.get('/users/:userId/warnings', getUserWarnings);

module.exports = router;