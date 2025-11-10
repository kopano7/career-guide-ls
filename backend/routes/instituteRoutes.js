const express = require('express');
const { db } = require('../config/firebase');
const { requireInstitute } = require('../middleware/auth');
const { 
  addCourse, 
  getCourses, 
  updateCourse, 
  deleteCourse, 
  getApplications, 
  updateApplicationStatus,
  getApplicationStats,
  getInstituteDashboard,
  addFaculty,
  getFaculties,
  getCourseRequirementsAnalysis,
  checkStudentQualification,
  submitApplication,
  waitlistApplication,
  exportApplications
} = require('../controllers/instituteController');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

// Apply institute middleware to all routes
router.use(requireInstitute);

// Course management
router.post('/courses', addCourse);
router.get('/courses', getCourses);
router.patch('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Course requirements and qualification
router.get('/courses/:courseId/requirements-analysis', getCourseRequirementsAnalysis);
router.get('/courses/:courseId/check-qualification/:studentId', async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const qualificationResult = await checkStudentQualification(studentId, courseId);
    
    res.json(successResponse(
      { qualification: qualificationResult },
      'Qualification check completed'
    ));
  } catch (error) {
    console.error('Qualification check error:', error);
    res.status(500).json(errorResponse('Failed to check qualification', error.message));
  }
});

// Application management
router.get('/applications', getApplications);
router.patch('/applications/:applicationId', updateApplicationStatus);
router.patch('/applications/:applicationId/waitlist', waitlistApplication);
router.post('/applications/export', exportApplications);

// Application submission with qualification check
router.post('/applications/submit', submitApplication);

// Statistics and dashboard
router.get('/stats/applications', getApplicationStats);
router.get('/dashboard', getInstituteDashboard);

// Faculty management
router.post('/faculties', addFaculty);
router.get('/faculties', getFaculties);

// Institute profile management - NEW ROUTES
// Get current institute profile (uses the authenticated user's ID)
router.get('/profile', async (req, res) => {
  try {
    const { uid } = req.user;

    console.log('📋 Fetching institute profile for:', uid);

    // Get institute data from users collection
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('Institute not found'));
    }

    const userData = userDoc.data();

    // Get additional institute data from institutions collection
    const instituteDoc = await db.collection('institutions').doc(uid).get();
    const instituteData = instituteDoc.exists ? instituteDoc.data() : {};

    // Combine data
    const profile = {
      id: uid,
      name: userData.name || userData.institutionName || 'Your Institute',
      email: userData.email,
      phone: userData.phone || userData.phoneNumber || '',
      website: userData.website || '',
      address: userData.address || '',
      description: userData.description || '',
      institutionType: userData.institutionType || '',
      establishedYear: userData.establishedYear || '',
      accreditation: userData.accreditation || '',
      logo: userData.logo || userData.profileImage || '',
      status: userData.status,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      ...instituteData
    };

    console.log('✅ Institute profile retrieved successfully');

    res.json(successResponse(
      { profile },
      'Institute profile retrieved successfully'
    ));
  } catch (error) {
    console.error('💥 Get institute profile error:', error);
    res.status(500).json(errorResponse('Failed to get institute profile', error.message));
  }
});

// Update current institute profile
router.put('/profile', async (req, res) => {
  try {
    const { uid } = req.user;
    const updateData = req.body;

    console.log('✏️ Updating institute profile for:', uid);
    console.log('📝 Update data:', updateData);

    // Fields that can be updated
    const allowedFields = [
      'name', 'phone', 'phoneNumber', 'website', 'address', 'description', 
      'institutionType', 'establishedYear', 'accreditation', 'logo', 'profileImage'
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // Update in users collection
    await db.collection('users').doc(uid).update({
      ...filteredData,
      updatedAt: new Date()
    });

    // Also update in institutions collection
    const instituteDoc = await db.collection('institutions').doc(uid).get();
    if (instituteDoc.exists) {
      await db.collection('institutions').doc(uid).update({
        ...filteredData,
        updatedAt: new Date()
      });
    } else {
      // Create institution document if it doesn't exist
      await db.collection('institutions').doc(uid).set({
        uid: uid,
        ...filteredData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Get updated profile
    const updatedUserDoc = await db.collection('users').doc(uid).get();
    const updatedInstituteDoc = await db.collection('institutions').doc(uid).get();
    
    const updatedProfile = {
      id: uid,
      ...updatedUserDoc.data(),
      ...(updatedInstituteDoc.exists ? updatedInstituteDoc.data() : {})
    };

    console.log('✅ Institute profile updated successfully');

    res.json(successResponse(
      { profile: updatedProfile },
      'Profile updated successfully'
    ));
  } catch (error) {
    console.error('💥 Update institute profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile', error.message));
  }
});

// Upload institute logo
router.post('/upload-logo', async (req, res) => {
  try {
    const { uid } = req.user;
    const { logoUrl } = req.body;

    if (!logoUrl) {
      return res.status(400).json(errorResponse('Logo URL is required'));
    }

    // Update logo in users collection
    await db.collection('users').doc(uid).update({
      logo: logoUrl,
      profileImage: logoUrl,
      updatedAt: new Date()
    });

    // Update logo in institutions collection
    const instituteDoc = await db.collection('institutions').doc(uid).get();
    if (instituteDoc.exists) {
      await db.collection('institutions').doc(uid).update({
        logo: logoUrl,
        updatedAt: new Date()
      });
    }

    res.json(successResponse(
      { logoUrl },
      'Logo uploaded successfully'
    ));
  } catch (error) {
    console.error('💥 Upload logo error:', error);
    res.status(500).json(errorResponse('Failed to upload logo', error.message));
  }
});

// Existing profile routes (keep these for backward compatibility)
router.post('/create-profile', async (req, res) => {
  try {
    const instituteData = req.body;
    await db.collection('institutions').doc(instituteData.uid).set({
      ...instituteData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.json(successResponse(null, 'Institute profile created successfully'));
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json(errorResponse('Failed to create institute profile', error.message));
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const doc = await db.collection('institutions').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json(errorResponse('Institute profile not found'));
    }
    res.json(successResponse(
      { profile: { id: doc.id, ...doc.data() } },
      'Institute profile retrieved successfully'
    ));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(errorResponse('Failed to get institute profile', error.message));
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    await db.collection('institutions').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date()
    });
    res.json(successResponse(null, 'Institute profile updated successfully'));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(errorResponse('Failed to update institute profile', error.message));
  }
});

module.exports = router;