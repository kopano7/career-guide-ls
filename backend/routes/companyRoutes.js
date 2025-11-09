const express = require('express');
const { db } = require('../config/firebase');
const { requireCompany } = require('../middleware/auth');
const { 
  postJob, 
  getJobs, 
  getQualifiedApplicants,
  updateJob,
  closeJob,
  getJobApplicationStats,
  getCompanyDashboard
} = require('../controllers/companyController');

const router = express.Router();

// Apply company middleware to all routes
router.use(requireCompany);

// Job management
router.post('/jobs', postJob);
router.get('/jobs', getJobs);
router.patch('/jobs/:jobId', updateJob);
router.patch('/jobs/:jobId/close', closeJob);

// Applicant management
router.get('/jobs/:jobId/applicants', getQualifiedApplicants);

// Statistics and dashboard
router.get('/stats/applications', getJobApplicationStats);
router.get('/dashboard', getCompanyDashboard);

// Company profile management
router.post('/create-profile', async (req, res) => {
  try {
    const companyData = req.body;
    await db.collection('companies').doc(companyData.uid).set(companyData);
    res.json({ success: true, message: 'Company profile created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const doc = await db.collection('companies').doc(req.params.id).get();
    res.json({ exists: doc.exists, data: doc.exists ? doc.data() : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    await db.collection('companies').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: 'Company profile updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;