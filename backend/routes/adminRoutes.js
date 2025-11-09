// backend/routes/adminRoutes.js - SIMPLE FIXED VERSION
const express = require('express');
const router = express.Router();

// ✅ USE SIMPLE AUTH MIDDLEWARE
const { verifyToken, requireAdmin } = require('../middleware/simpleAuth');
const { 
  getUsers, 
  approveUser, 
  suspendUser, 
  getSystemStats,
  getPendingInstitutes,
  approveInstitute,
  getPendingCompanies,
  approveCompany
} = require('../controllers/adminController');

// ✅ APPLY SIMPLE JWT MIDDLEWARE
router.use(verifyToken);
router.use(requireAdmin);

// ========== USER MANAGEMENT ROUTES ==========
router.get('/users', getUsers);
router.patch('/users/:userId/approve', approveUser);
router.patch('/users/:userId/suspend', suspendUser);

// ========== INSTITUTE MANAGEMENT ROUTES ==========
router.get('/institutes/pending', getPendingInstitutes);
router.put('/institutes/:instituteId/approve', approveInstitute);

// ========== COMPANY MANAGEMENT ROUTES ==========
router.get('/companies/pending', getPendingCompanies);
router.put('/companies/:companyId/approve', approveCompany);

// ========== SYSTEM STATISTICS ROUTES ==========
router.get('/stats', getSystemStats);

module.exports = router;