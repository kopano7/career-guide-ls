const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { 
  addCourse, 
  getCourses, 
  updateCourse, 
  deleteCourse, 
  getApplications, 
  updateApplicationStatus,
  getApplicationStats,
  getInstituteDashboard
} = require('../controllers/instituteController');

const router = express.Router();

// ✅ FIXED: Use simple role-based middleware instead of requireInstitute
router.use(verifyToken);
router.use(requireRole('institute'));

// Course management
router.post('/courses', addCourse);
router.get('/courses', getCourses);
router.patch('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Application management
router.get('/applications', getApplications);
router.patch('/applications/:applicationId', updateApplicationStatus);

// Statistics and dashboard
router.get('/stats/applications', getApplicationStats);
router.get('/dashboard', getInstituteDashboard);

// Institute profile management
router.post('/create-profile', async (req, res) => {
  try {
    const instituteData = req.body;
    await db.collection('institutions').doc(instituteData.uid).set(instituteData);
    res.json({ success: true, message: 'Institute profile created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const doc = await db.collection('institutions').doc(req.params.id).get();
    res.json({ exists: doc.exists, data: doc.exists ? doc.data() : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    await db.collection('institutions').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: 'Institute profile updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;